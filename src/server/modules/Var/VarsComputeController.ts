import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import VarsCacheController from './VarsCacheController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsImportsHandler from './VarsImportsHandler';

export default class VarsComputeController {

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsComputeController {
        if (!VarsComputeController.instance) {
            VarsComputeController.instance = new VarsComputeController();
        }
        return VarsComputeController.instance;
    }

    private static instance: VarsComputeController = null;

    protected constructor() {
    }



    /**
     * La fonction qui réalise les calculs sur un ensemble de var datas et qui met directement à jour la valeur et l'heure du calcul dans le var_data
     */
    public async compute(vars_datas: { [index: string]: VarDataBaseVO }): Promise<void> {

        /**
         * L'invalidation des vars est faite en amont. On a que des vars à calculer ici, et on a donc "juste" à optimiser les calculs et donc les chargements de datas principalement puisque
         *  c'est le point le plus lourd potentiellement. Donc l'objectif ça serait d'avoir un cache très malin dans le DataSource qu'on puisse s'assurer de vider entre chaque appel au compute
         *  donc à la limite un cache externalisé, géré directement par le compute ça peut sembler beaucoup plus intéressant qu'un cache dans le datasource...
         */

        /**
         * Le cache des datas issues des datasources. Permet juste de s'assurer qu'on recharge pas 15 fois le cache pour un même index de donnée.
         *  L'index de donnée est défini par le datasource pour indiquer une clé unique de classement des datas dans le cache, et donc si on veut une clé déjà connue, on a pas besoin de redemander au
         *  datasource, on la récupère directement pour le donner à la var.
         */
        let ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {};

        let dag: DAG<VarDAGNode> = await this.create_tree(vars_datas, ds_cache);

        /**
         * On a l'arbre. Tous les noeuds dont le var_data !has_valid_value sont à calculer
         */
        for (let i in vars_datas) {
            let var_data = vars_datas[i];

            let node = dag.nodes[var_data.index];
            if (!node.var_data.has_valid_value) {
                await DAGController.getInstance().visit_bottom_up_to_node(
                    node,
                    async (visited_node: VarDAGNode) => await this.compute_node(visited_node, ds_cache),
                    (next_node: VarDAGNode) => !next_node.var_data.has_valid_value);
            }
        }

        /**
         * Les vars sont calculées, plus rien à faire ici on libère
         */

        /**
         * MAJ : Ajout de la mise en cache, suivant stratégie pour chaque param
         */
        this.cache_datas(dag, vars_datas);
    }

    /**
     * Tous les noeuds du vars_datas sont par définition en cache, donc on se pose la question que pour les autres
     * @param dag
     * @param vars_datas
     */
    private cache_datas(dag: DAG<VarDAGNode>, vars_datas: { [index: string]: VarDataBaseVO }) {
        for (let i in vars_datas) {
            let var_data = vars_datas[i];

            let node = dag.nodes[var_data.index];
            if (VarsCacheController.getInstance().A_do_cache_param(node)) {
                VarsDatasProxy.getInstance().prepend_var_datas([var_data]);
            }
        }
    }

    /**
     * Pour calculer un noeud, il faut les datasources, et faire appel à la fonction de calcul du noeud
     * @param node
     */
    private async compute_node(node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        /**
         * On charge toutes les datas restantes
         */
        let dss: DataSourceControllerBase[] = node.var_controller.getDataSourcesDependencies();
        await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);

        node.var_controller.computeValue(node);
    }

    /**
     * Première étape du calcul, on génère l'arbre en commençant par les params:
     *  - Si le noeud existe dans l'arbre, osef
     *  - Sinon :
     *      - Identifier les deps
     *      - Déployer effectivement les deps identifiées
     */
    private async create_tree(vars_datas: { [index: string]: VarDataBaseVO }, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<DAG<VarDAGNode>> {
        let var_dag: DAG<VarDAGNode> = new DAG();

        for (let i in vars_datas) {
            let var_data: VarDataBaseVO = vars_datas[i];

            await this.deploy_deps(VarDAGNode.getInstance(var_dag, var_data), vars_datas, ds_cache);
        }

        return var_dag;
    }

    /**
     *  - On entame en vérifiant qu'on a testé le cas des imports parcellaires :
     *      - Si on a des imports, on split et on relance le déploiement sur les nouveaux noeuds restants à calculer
     *      - sinon, on continue en déployant normalement les deps de ce noeud
     *  - Pour chaque DEP :
     *      - Si la dep est déjà dans la liste des vars_datas, aucun impact, on continue normalement ce cas est géré au moment de créer les noeuds pour les params
     *      - Si le noeud existe dans l'arbre, on s'assure juste que la liaison existe vers le noeud qui a tenté de générer la dep et on fuit.
     *      - Si le noeud est nouveau on le crée, et on met le lien vers le noeud source de la dep :
     *          - si le var_data possède une data on valide directement le point suivant
     *          - si on a une data précompilée ou importée en cache ou en BDD, on récupère cette data et on la met dans le var_data actuel puis on arrête de propager
     *          - sinon
     *              - on essaie de charger une ou plusieurs donnée(s) intersectant ce param
     *              - si on en trouve, on sélectionne celles qu'on veut prioriser, et on découpe le noeud qu'on transforme en aggrégateur
     *              - sur chaque nouveau noeud sans valeur / y compris si on a pas trouvé d'intersecteurs on deploy_deps
     *                  (et donc pour lesquels on sait qu'on a de valeur ni en base ni en buffer ni dans l'arbre)
     * Pour les noeuds initiaux (les vars_datas en param), on sait qu'on ne peut pas vouloir donner un import complet en résultat, donc inutile de faire cette recherche
     *  par contre un import partiel oui
     */
    private async deploy_deps(node: VarDAGNode, vars_datas: { [index: string]: VarDataBaseVO }, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        /**
         * Cache step B : cache complet - inutile si on est sur un noeud du vars_datas
         */
        if ((typeof node.var_data.value === 'undefined') && (!vars_datas[node.var_data.index]) &&
            (VarsCacheController.getInstance().B_use_cache(node))) {
            await this.try_load_cache_complet(node);
        }

        /**
         * Imports
         */
        if ((typeof node.var_data.value === 'undefined') && (!node.var_controller.optimization__has_no_imports)) {

            /**
             * On doit essayer de récupérer des données parcellaires
             *  si on a des données parcellaires par définition on doit quand même déployer les deps
             */
            VarsImportsHandler.getInstance().load_imports_and_split_nodes(node, vars_datas, ds_cache);
        }

        /**
         * Cache step C : cache partiel : uniquement si on a pas splitt sur import
         */
        if ((typeof node.var_data.value === 'undefined') && (!vars_datas[node.var_data.index]) &&
            (!node.is_aggregator)) {
            await this.try_load_cache_partiel(node, vars_datas, ds_cache);
        }

        // Si on est sur un aggrégateur, on déploie les deps des noeuds restants à calculer
        if (node.is_aggregator) {
            for (let i in node.aggregated_nodes) {
                let aggregated_node = node.aggregated_nodes[i];

                if (typeof aggregated_node.var_data.value === 'undefined') {
                    await this.deploy_deps(aggregated_node, vars_datas, ds_cache);
                }
            }
            return;
        }

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node, ds_cache);

        for (let dep_id in deps) {
            let dep = deps[dep_id];

            if (node.dag.nodes[dep.index]) {
                node.addOutgoingDep(dep_id, node.dag.nodes[dep.index]);
                continue;
            }

            let dep_node = VarDAGNode.getInstance(node.dag, dep);
            node.addOutgoingDep(dep_id, dep_node);

            /**
             *  - Si le noeud n'a pas de valeur :
             *      - on tente de charger une valeur depuis le varsdatas proxy, et si on en trouve on init dans le noeud et plan A
             *      - sinon plan B
             *  - sinon plan A
             * Plan A : on propage pas
             * Plan B : on propage le deploy_dep au nouveau noeud
             */
            if (typeof dep_node.var_data.value === 'undefined') {
                // Premier essai, on tente de trouver des datas en base / cache en cours de mise à jour
                let existing_var_data: VarDataBaseVO = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(dep_node.var_data);

                if (!!existing_var_data) {
                    dep_node.var_data = existing_var_data;
                }
            }

            /**
             * Si la valeur a été invalidée on s'assure qu'elle est bien indiquée undefined à ce stade => Probablement important pour les
             *  chargements issus de la bdd et qu'on veut pouvoir invalider.
             */
            if ((!dep_node.var_data.has_valid_value) && (typeof dep_node.var_data.value !== 'undefined')) {
                delete dep_node.var_data.value;
            }

            if (typeof dep_node.var_data.value === 'undefined') {

                await this.deploy_deps(dep_node, vars_datas, ds_cache);
            }
        }
    }

    private async try_load_cache_complet(node: VarDAGNode) {
        let cache_complet = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(node.var_data);

        if (!cache_complet) {
            return;
        }

        node.var_data.value = cache_complet.value;
        node.var_data.value_ts = cache_complet.value_ts;
        node.var_data.value_type = cache_complet.value_type;
    }

    private async try_load_cache_partiel(
        node: VarDAGNode,
        vars_datas: { [index: string]: VarDataBaseVO },
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {
        let caches_partiels: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroids(node.var_data._type, [node.var_data], null);

        if ((!caches_partiels) || (!caches_partiels.length)) {
            return;
        }

        let validated_caches_partiels: VarDataBaseVO[] = [];

        for (let i in caches_partiels) {
            let cache_partiel = caches_partiels[i];

            if (!VarsCacheController.getInstance().C_use_partial_cache_element(node, cache_partiel)) {
                continue;
            }

            validated_caches_partiels.push(cache_partiel);
        }

        /**
         * On utilise la même méthode ensuite que pour les imports, sinon qu'on sait pas ce qui est en cache donc on peut pas optimiser en caches atomiques
         */
        await VarsImportsHandler.getInstance().split_nodes(node, vars_datas, ds_cache, validated_caches_partiels, false);

    }

    /**
     *  - Pour identifier les deps :
     *      - Chargement des ds predeps du noeud
     *      - Chargement des deps
     */
    private async get_node_deps(node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<{ [dep_id: string]: VarDataBaseVO }> {

        /**
         * On charge toutes les datas predeps
         */
        let predeps_dss: DataSourceControllerBase[] = node.var_controller.getDataSourcesPredepsDependencies();
        if (predeps_dss && predeps_dss.length) {
            await DataSourcesController.getInstance().load_node_datas(predeps_dss, node, ds_cache);
        }

        /**
         * On demande les deps
         */
        return node.var_controller.getParamDependencies(node);
    }
}