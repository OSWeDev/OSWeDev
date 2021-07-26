import * as moment from 'moment';
import { performance } from 'perf_hooks';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import VarsPerfsController from './perf/VarsPerfsController';
import VarsCacheController from './VarsCacheController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsImportsHandler from './VarsImportsHandler';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

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

    //TODO FIXME à packager propre
    private perf_uid: number = 0;

    protected constructor() {
    }

    /**
     * La fonction qui réalise les calculs sur un ensemble de var datas et qui met directement à jour la valeur et l'heure du calcul dans le var_data
     */
    public async compute(vars_datas: { [index: string]: VarDataBaseVO }): Promise<void> {

        // TODO PerfMonServerController monitor_async add infos
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__compute],
            async () => {

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

                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree", true);
                let dag: DAG<VarDAGNode> = await this.create_tree(vars_datas, ds_cache);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - create_tree OK...');

                /**
                 * On a l'arbre. On charge les données qui restent à charger
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.load_nodes_datas", true);
                await this.load_nodes_datas(dag, ds_cache);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.load_nodes_datas", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - load_nodes_datas OK...');

                /**
                 * Tous les noeuds dont le var_data !has_valid_value sont à calculer
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.visit_bottom_up_to_node", true);
                for (let i in vars_datas) {
                    let var_data = vars_datas[i];

                    let node = dag.nodes[var_data.index];
                    if (!VarsServerController.getInstance().has_valid_value(node.var_data)) {
                        await DAGController.getInstance().visit_bottom_up_to_node(
                            node,
                            async (visited_node: VarDAGNode) => await this.compute_node(visited_node, ds_cache),
                            (next_node: VarDAGNode) => !VarsServerController.getInstance().has_valid_value(next_node.var_data));
                    }
                }
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.visit_bottom_up_to_node", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - compute_node OK...');

                /**
                 * Mise en cache, suivant stratégie pour chaque param
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.cache_datas", true);
                await this.cache_datas(dag, vars_datas);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.cache_datas", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - cache_datas OK...');

                /**
                 * Mise à jour des indicateurs de performances
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.update_cards_in_perfs", true);
                this.update_cards_in_perfs(dag);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.update_cards_in_perfs", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - update_cards_in_perfs OK...');
            },
            this,
        );
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
    public async deploy_deps(
        node: VarDAGNode,
        deployed_vars_datas: { [index: string]: boolean },
        vars_datas: { [index: string]: VarDataBaseVO },
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__deploy_deps],
            async () => {

                if (deployed_vars_datas[node.var_data.index]) {
                    return;
                }
                deployed_vars_datas[node.var_data.index] = true;

                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", true);
                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

                /**
                 * Cache step B : cache complet - inutile si on est sur un noeud du vars_datas
                 */
                if ((!node.already_tried_load_cache_complet) && (!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                    (VarsCacheController.getInstance().B_use_cache(node))) {

                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
                    ], true);
                    await this.try_load_cache_complet(node);
                    node.has_try_load_cache_complet_perf = true;
                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
                    ], false);
                }

                /**
                 * Imports
                 */
                if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!controller.optimization__has_no_imports)) {

                    /**
                     * On doit essayer de récupérer des données parcellaires
                     *  si on a des données parcellaires par définition on doit quand même déployer les deps
                     */

                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
                    ], true);
                    await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node, vars_datas, ds_cache);
                    node.has_load_imports_and_split_nodes_perf = true;
                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
                    ], false);
                }

                /**
                 * Cache step C : cache partiel : uniquement si on a pas splitt sur import
                 */
                if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                    (!node.is_aggregator) &&
                    (VarsCacheController.getInstance().C_use_partial_cache(node))) {

                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
                    ], true);
                    await this.try_load_cache_partiel(node, vars_datas, ds_cache);
                    node.has_try_load_cache_partiel_perf = true;
                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
                    ], false);
                }

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.create_tree.ds_cache",
                    node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
                ], true);

                let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node, ds_cache);
                node.has_ds_cache_perf = true;

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.create_tree.ds_cache",
                    node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
                ], false);

                if (deps) {
                    await this.handle_deploy_deps(node, deps, deployed_vars_datas, vars_datas, ds_cache);
                }

                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    private update_cards_in_perfs(dag: DAG<VarDAGNode>) {
        for (let i in dag.nodes) {
            let node = dag.nodes[i];

            VarsPerfsController.addCard(node);
        }
    }

    /**
     * Tous les noeuds du vars_datas sont par définition en cache, donc on se pose la question que pour les autres
     * @param dag
     * @param vars_datas
     */
    private async cache_datas(dag: DAG<VarDAGNode>, vars_datas: { [index: string]: VarDataBaseVO }) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__cache_datas],
            async () => {

                // Si on a dans le buffer une version plus ancienne on doit mettre à jour
                await VarsDatasProxy.getInstance().update_existing_buffered_older_datas(Object.values(dag.nodes).map((n) => n.var_data));

                for (let i in dag.nodes) {
                    let node = dag.nodes[i];

                    if (vars_datas[node.var_data.index]) {
                        continue;
                    }

                    if (VarsCacheController.getInstance().A_do_cache_param(node)) {
                        await VarsDatasProxy.getInstance().prepend_var_datas([node.var_data], false);
                    }
                }
            },
            this
        );
    }

    private async load_nodes_datas(dag: DAG<VarDAGNode>, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__load_nodes_datas],
            async () => {

                let promises = [];
                for (let i in dag.nodes) {
                    let node = dag.nodes[i];

                    // Si le noeud a une valeur on se fout de load les datas
                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
                        continue;
                    }

                    let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

                    let dss: DataSourceControllerBase[] = controller.getDataSourcesDependencies();

                    // TODO FIXME promises.length
                    if (promises.length >= 50) {
                        await Promise.all(promises);
                        promises = [];
                    }

                    let perfmon = PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__DataSourcesController__load_node_datas];
                    // Si on est sur du perf monitoring on doit faire les appels séparément...
                    if (perfmon.is_active) {
                        await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);
                    } else {
                        promises.push((async () => {

                            VarsPerfsController.addPerfs(performance.now(), [
                                node.var_data.var_id + "__computing_bg_thread.compute.load_nodes_datas"
                            ], true);
                            await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);
                            node.has_load_nodes_datas_perf = true;
                            VarsPerfsController.addPerfs(performance.now(), [
                                node.var_data.var_id + "__computing_bg_thread.compute.load_nodes_datas"
                            ], false);
                        })());
                    }
                }

                if (promises && promises.length) {
                    await Promise.all(promises);
                }
            },
            this
        );
    }

    /**
     * Pour calculer un noeud, il faut les datasources, et faire appel à la fonction de calcul du noeud
     * @param node
     */
    private async compute_node(node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__compute_node],
            async () => {

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node",
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node",
                    node.var_data.var_id + "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node"
                ], true);

                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
                await controller.computeValue(node);

                VarsTabsSubsController.getInstance().notify_vardatas([node.var_data]);
                VarsServerCallBackSubsController.getInstance().notify_vardatas([node.var_data]);
                node.has_compute_node_perf = true;

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node",
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node",
                    node.var_data.var_id + "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node"
                ], false);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    /**
     * Première étape du calcul, on génère l'arbre en commençant par les params:
     *  - Si le noeud existe dans l'arbre, osef
     *  - Sinon :
     *      - Identifier les deps
     *      - Déployer effectivement les deps identifiées
     */
    private async create_tree(vars_datas: { [index: string]: VarDataBaseVO }, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<DAG<VarDAGNode>> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__create_tree],
            async () => {

                let var_dag: DAG<VarDAGNode> = new DAG();
                let deployed_vars_datas: { [index: string]: boolean } = {};

                let vars_datas_as_array: VarDataBaseVO[] = Object.values(vars_datas);
                let promises = [];
                let i = 0;

                let start_time = moment().utc(true).unix();
                let real_start_time = start_time;


                while (i < vars_datas_as_array.length) {

                    let actual_time = moment().utc(true).unix();

                    if (actual_time > (start_time + 60)) {
                        start_time = actual_time;
                        ConsoleHandler.getInstance().warn('VarsComputeController:create_tree:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                    }

                    /**
                     * On fait des packs de 5 promises...
                     */
                    if (i >= 5) {
                        await Promise.all(promises);
                        promises = [];
                    }

                    promises.push(this.deploy_deps(VarDAGNode.getInstance(var_dag, vars_datas_as_array[i]), deployed_vars_datas, vars_datas, ds_cache));
                    // await this.deploy_deps(VarDAGNode.getInstance(var_dag, vars_datas_as_array[i]), deployed_vars_datas, vars_datas, ds_cache);

                    i++;
                }
                await Promise.all(promises);

                return var_dag;
            },
            this
        );
    }

    private async handle_deploy_deps(
        node: VarDAGNode,
        deps: { [index: string]: VarDataBaseVO },
        deployed_vars_datas: { [index: string]: boolean },
        vars_datas: { [index: string]: VarDataBaseVO },
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__handle_deploy_deps],
            async () => {

                let deps_promises = [];
                let deps_as_array = Object.values(deps);
                let deps_ids_as_array = Object.keys(deps);
                let deps_i = 0;

                let start_time = moment().utc(true).unix();
                let real_start_time = start_time;

                while (deps_i < deps_as_array.length) {

                    let actual_time = moment().utc(true).unix();

                    if (actual_time > (start_time + 60)) {
                        start_time = actual_time;
                        ConsoleHandler.getInstance().warn('VarsComputeController:handle_deploy_deps:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                    }

                    /**
                     * On fait des packs de 10 promises...
                     */
                    if (deps_promises.length >= 50) {
                        await Promise.all(deps_promises);
                        deps_promises = [];
                    }
                    let dep = deps_as_array[deps_i];
                    let dep_id = deps_ids_as_array[deps_i];

                    if (node.dag.nodes[dep.index]) {
                        node.addOutgoingDep(dep_id, node.dag.nodes[dep.index]);
                        deps_i++;
                        continue;
                    }

                    let dep_node = VarDAGNode.getInstance(node.dag, dep);
                    node.addOutgoingDep(dep_id, dep_node);

                    if (dep_node.already_tried_loading_data_and_deploy) {
                        deps_i++;
                        continue;
                    }
                    dep_node.already_tried_loading_data_and_deploy = true;

                    /**
                     *  - Si le noeud n'a pas de valeur :
                     *      - on tente de charger une valeur depuis le varsdatas proxy, et si on en trouve on init dans le noeud et plan A
                     *      - sinon plan B
                     *  - sinon plan A
                     * Plan A : on propage pas
                     * Plan B : on propage le deploy_dep au nouveau noeud
                     */
                    if (!VarsServerController.getInstance().has_valid_value(dep_node.var_data)) {
                        // Premier essai, on tente de trouver des datas en base / cache en cours de mise à jour
                        let existing_var_data: VarDataBaseVO = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(dep_node.var_data);

                        // ça revient au même que le test de chargement du cache complet donc on indique qu'on a déjà testé
                        dep_node.already_tried_load_cache_complet = true;

                        // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
                        if (!!existing_var_data) {
                            dep_node.var_data.id = existing_var_data.id;
                            dep_node.var_data.value = existing_var_data.value;
                            dep_node.var_data.value_ts = existing_var_data.value_ts;
                            dep_node.var_data.value_type = existing_var_data.value_type;
                        }
                    }

                    /**
                     * Si la valeur a été invalidée on s'assure qu'elle est bien indiquée undefined à ce stade => Probablement important pour les
                     *  chargements issus de la bdd et qu'on veut pouvoir invalider.
                     */
                    if ((!VarsServerController.getInstance().has_valid_value(dep_node.var_data)) && (typeof dep_node.var_data.value !== 'undefined')) {
                        delete dep_node.var_data.value;
                    }

                    if (!VarsServerController.getInstance().has_valid_value(dep_node.var_data)) {

                        VarsTabsSubsController.getInstance().notify_vardatas([dep_node.var_data], true);
                        deps_promises.push(this.deploy_deps(dep_node, deployed_vars_datas, vars_datas, ds_cache));
                        // await this.deploy_deps(dep_node, deployed_vars_datas, vars_datas, ds_cache);
                    }

                    deps_i++;
                }

                if (deps_promises.length) {
                    await Promise.all(deps_promises);
                }
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    private async try_load_cache_complet(node: VarDAGNode) {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__try_load_cache_complet],
            async () => {

                node.already_tried_load_cache_complet = true;
                let cache_complet = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(node.var_data);

                if (!cache_complet) {
                    return;
                }

                // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
                node.var_data.id = cache_complet.id;
                node.var_data.value = cache_complet.value;
                node.var_data.value_ts = cache_complet.value_ts;
                node.var_data.value_type = cache_complet.value_type;
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    private async try_load_cache_partiel(
        node: VarDAGNode,
        vars_datas: { [index: string]: VarDataBaseVO },
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__try_load_cache_partiel],
            async () => {

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

            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    /**
     *  - Pour identifier les deps :
     *      - Chargement des ds predeps du noeud
     *      - Chargement des deps
     */
    private async get_node_deps(node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<{ [dep_id: string]: VarDataBaseVO }> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__get_node_deps],
            async () => {

                if (node.is_aggregator) {
                    let aggregated_deps: { [dep_id: string]: VarDataBaseVO } = {};
                    let index = 0;

                    for (let i in node.aggregated_datas) {
                        aggregated_deps['AGG_' + (index++)] = node.aggregated_datas[i];
                    }
                    return aggregated_deps;
                }

                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

                /**
                 * On charge toutes les datas predeps
                 */
                let predeps_dss: DataSourceControllerBase[] = controller.getDataSourcesPredepsDependencies();
                if (predeps_dss && predeps_dss.length) {
                    await DataSourcesController.getInstance().load_node_datas(predeps_dss, node, ds_cache);
                }

                /**
                 * On demande les deps
                 */
                return controller.getParamDependencies(node);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }
}