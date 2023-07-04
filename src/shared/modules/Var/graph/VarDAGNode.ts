import e from 'express';
import ConfigurationService from '../../../../server/env/ConfigurationService';
import VarsDatasProxy from '../../../../server/modules/Var/VarsDatasProxy';
import VarsServerController from '../../../../server/modules/Var/VarsServerController';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import ObjectHandler from '../../../tools/ObjectHandler';
import MatroidController from '../../Matroid/MatroidController';
import VarDataBaseVO from '../vos/VarDataBaseVO';
import VarDAG from './VarDAG';
import VarDAGNodeDep from './VarDAGNodeDep';
import DAGNodeBase from './dagbase/DAGNodeBase';

export default class VarDAGNode extends DAGNodeBase {

    public static TAG_CLIENT: string = 'CLIENT';
    public static TAG_SERVER: string = 'SERVER';

    /**
     * Les tags pendant le traitement d'un noeud
     */
    // Pour la notification initiale au client
    public static TAG_1_NOTIFYING_START: string = 'NOTIFYING_START';
    // Pour le déploiement
    public static TAG_2_DEPLOYING: string = 'DEPLOYING';
    // Pour le chargement des données
    public static TAG_3_DATA_LOADING: string = 'DATA_LOADING';
    // Pour le calcul
    public static TAG_4_COMPUTING: string = 'COMPUTING';
    // Pour la notification
    public static TAG_5_NOTIFYING_END: string = 'NOTIFYING_END';
    // Pour la sauvegarde
    public static TAG_6_UPDATING_IN_DB: string = 'UPDATING_IN_DB';
    // Pour la suppression
    public static TAG_7_DELETING: string = 'TO_DELETING';

    /**
     * Les tags permanents pour indiquer un changement de statut du noeud
     *  Ces tags servent aussi de by_pass : on refuse de poser un tag dont le bypass est déjà posé
     */
    // Créé
    public static TAG_0_CREATED: string = 'CREATED';
    // Client notifié de la prise en compte
    public static TAG_1_NOTIFIED_START: string = 'NOTIFIED_START';
    // Déployé
    public static TAG_2_DEPLOYED: string = 'DEPLOYED';
    // Chargé
    public static TAG_3_DATA_LOADED: string = 'DATA_LOADED';
    // Calculé
    public static TAG_4_COMPUTED: string = 'COMPUTED';
    // Résultat notifié (client + serveur)
    public static TAG_5_NOTIFIED_END: string = 'NOTIFIED_END';
    // Sauvegardé
    public static TAG_6_UPDATED_IN_DB: string = 'UPDATED_IN_DB';

    /**
     * Cheminement des tags :
     * 0_CREATED
     *  -> 1_NOTIFYING_START -> 1_NOTIFIED_START
     *  -> 2_DEPLOYING -> 2_DEPLOYED
     *  -> 3_DATA_LOADING -> 3_DATA_LOADED
     *  -> 4_COMPUTING -> 4_COMPUTED
     *  -> 5_NOTIFYING_END -> 5_NOTIFIED_END
     *  -> 6_UPDATING_IN_DB -> 6_UPDATED_IN_DB
     *  -> 7_DELETING
     * TODO : à creuser : on peut paralléliser certains traitements, typiquement le data loading et le déploiement, ou la notification et la sauvegarde
     * A voir si c'est utile / intéressant. Pour le coup on gagne sur le temps de traitement d'une var isolée, mais pas forcément sur un ensemble de vars où chaque var peut-être traitée en parallèle
     */
    public static STEP_TAGS_INDEXES: { [step_tag: string]: number } = {
        [VarDAGNode.TAG_0_CREATED]: 0,
        [VarDAGNode.TAG_1_NOTIFYING_START]: 1,
        [VarDAGNode.TAG_1_NOTIFIED_START]: 2,
        [VarDAGNode.TAG_2_DEPLOYING]: 3,
        [VarDAGNode.TAG_2_DEPLOYED]: 4,
        [VarDAGNode.TAG_3_DATA_LOADING]: 5,
        [VarDAGNode.TAG_3_DATA_LOADED]: 6,
        [VarDAGNode.TAG_4_COMPUTING]: 7,
        [VarDAGNode.TAG_4_COMPUTED]: 8,
        [VarDAGNode.TAG_5_NOTIFYING_END]: 9,
        [VarDAGNode.TAG_5_NOTIFIED_END]: 10,
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: 11,
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: 12,
        [VarDAGNode.TAG_7_DELETING]: 13,
    };

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     * @param already_tried_load_cache_complet par défaut false, il faut mettre true uniquement si on a déjà essayé de charger la var en base de données et qu'on a pas réussi
     * @returns {VarDAGNode}
     */
    public static async getInstance(var_dag: VarDAG, var_data: VarDataBaseVO, already_tried_load_cache_complet: boolean = false): Promise<VarDAGNode> {

        /**
         * On utilise une forme de sémaphore, qui utilise les promises pour éviter de créer plusieurs fois le même noeud
         */
        if (!VarDAGNode.getInstance_semaphores[var_data.index]) {
            VarDAGNode.getInstance_semaphores[var_data.index] = (async () => {
                await VarDAGNode.getInstance_semaphored(var_dag, var_data, already_tried_load_cache_complet);

                // On supprime le sémaphore après un certain temps pour éviter de supprimer avant l'affectation de la promise dans la map ...
                setTimeout(() => delete VarDAGNode.getInstance_semaphores[var_data.index], 1000);
            })();
        }

        return await VarDAGNode.getInstance_semaphores[var_data.index];
    }

    private static getInstance_semaphores: { [var_data_index: number]: Promise<VarDAGNode> } = {};

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     * La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     * Le nom du noeud est l'index du var_data
     * Si on a pas encore essayé de charger la var en base de données, on le fait
     * @param already_tried_load_cache_complet par défaut false, true si var_data est un cache issu de la bdd ou si on a déjà essayé de charger la var en base de données et qu'on a pas réussi
     * @returns {VarDAGNode}
     * @private
     * @throws Error si on essaie d'ajouter une var avec un maxrange quelque part qui casserait tout
     */
    private static async getInstance_semaphored(var_dag: VarDAG, var_data: VarDataBaseVO, already_tried_load_cache_complet: boolean = false): Promise<VarDAGNode> {

        if (!!var_dag.nodes[var_data.index]) {
            return var_dag.nodes[var_data.index];
        }

        let self = this;
        return new Promise(async (resolve, reject) => {

            /**
             * On check qu'on essaie pas d'ajoute une var avec un maxrange quelque part qui casserait tout
             */
            if (!MatroidController.getInstance().check_bases_not_max_ranges(var_data)) {
                ConsoleHandler.error('VarDAGNode.getInstance:!check_bases_not_max_ranges:' + var_data.index);
                reject('VarDAGNode.getInstance:!check_bases_not_max_ranges:' + var_data.index);
            }

            let node = new VarDAGNode(var_dag, var_data);

            // On tente de chercher le cache complet dès l'insertion du noeud, si on a pas explicitement défini que le test a déjà été fait
            if (!already_tried_load_cache_complet) {
                await self.try_load_cache_complet(node);
            }

            /**
             * Si on a une valid value, on passe directement à la notification de fin,
             * sinon on indique que le noeud est créé
             */
            if (VarsServerController.has_valid_value(node.var_data)) {
                node.add_tag(VarDAGNode.TAG_4_COMPUTED);
                // On ne doit pas update in DB du coup
                node.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
            } else {
                node.add_tag(VarDAGNode.TAG_0_CREATED);
            }

            return resolve(node.linkToDAG());
        });
    }

    private static async try_load_cache_complet(node: VarDAGNode) {

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        let cache_complet = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(node.var_data, false, 'try_load_cache_complet');
        let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[node.var_data.index];

        if (!cache_complet) {
            if (DEBUG_VARS) {
                ConsoleHandler.log('try_load_cache_complet:' + node.var_data.index + ':aucun cache complet' +
                    ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
            }

            return;
        }

        // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
        node.var_data.id = cache_complet.id;
        node.var_data.value = cache_complet.value;
        node.var_data.value_ts = cache_complet.value_ts;
        node.var_data.value_type = cache_complet.value_type;
        if (DEBUG_VARS) {
            ConsoleHandler.log('try_load_cache_complet:' + node.var_data.index + ':OK:' + cache_complet.value + ':' + cache_complet.value_ts + ':' + cache_complet.id +
                ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
        }
    }

    /**
     * Tous les noeuds sont déclarés / initialisés comme des noeuds de calcul. C'est uniquement en cas de split (sur un import ou précalcul partiel)
     *  qu'on va switcher sur un mode aggégateur et configurer des aggregated_nodes
     */
    public is_aggregator: boolean = false;

    /**
     * CAS A : On a une noeud de calcul - qui utilise la fonction compute du VarController : Les dépendances descendantes :
     *  - undefined indique qu'on a pas chargé les deps ou que l'on est en cas B
     *  - toutes les deps doivent donc être chargées en même temps (c'est le cas dans le fonctionnement actuel des VarsControllers)
     */

    /**
     * CAS B : On a une noeud aggregateur - qui utilise la fonction aggregate du VarController : Les noeuds aggrégés
     */
    public aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

    /**
     * Toutes les données chargées pour ce noeud sont disponibles directement ici, classées par datasource
     */
    public datasources: { [ds_name: string]: any } = {};

    // public already_tried_loading_data_and_deploy: boolean = false;

    /**
     * L'étape actuelle du process de calcul du noeud (VarDAGNode.STEP_XXX)
     */
    private current_step: number = 0;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public var_dag: VarDAG, public var_data: VarDataBaseVO) {
        super();
    }


    /**
     * Pour l'ajout des tags, on veille toujours à vérifier qu'on a pas un tag TO_DELETE, et la possibilité de supprimer le noeud.
     *  Sinon on refuse l'ajout
     * @param tag Le tag à ajouter
     */
    public add_tag(tag: string): boolean {

        if (this.is_deletable) {
            return false;
        }
        this.tags[tag] = true;

        if (!this.var_dag) {
            return true;
        }

        this.var_dag.tags[tag][this.var_data.index] = this;
        this.update_current_step_tag();
        return true;
    }

    public remove_tag(tag: string) {

        delete this.tags[tag];

        if (!this.var_dag) {
            return;
        }
        delete this.var_dag.tags[tag][this.var_data.index];
        this.update_current_step_tag();
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep VarDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarDAGNode) {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return;
        }

        let dep: VarDAGNodeDep = new VarDAGNodeDep(dep_name, outgoing_node);

        dep.incoming_node = this;

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }
        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        dep.outgoing_node.incoming_deps[dep.dep_name] = dep;

        if (!!this.var_dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.var_dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.var_dag.leafs[this.var_data.index]) {
            delete this.var_dag.leafs[this.var_data.index];
        }
    }

    /**
     * Méthode appelée pour supprimer le noeud de l'arbre
     */
    public unlinkFromDAG(): VarDAGNode {

        if (!this.var_dag) {
            return;
        }
        let dag = this.var_dag;

        delete dag.nodes[this.var_data.index];
        dag.nb_nodes--;

        for (let i in this.incoming_deps) {
            let incoming_dep = this.incoming_deps[i];
            delete incoming_dep.incoming_node.outgoing_deps[incoming_dep.dep_name];

            if (!ObjectHandler.hasAtLeastOneAttribute(incoming_dep.incoming_node.outgoing_deps)) {
                dag.leafs[(incoming_dep.incoming_node as VarDAGNode).var_data.index] = incoming_dep.incoming_node as VarDAGNode;
            }
        }

        for (let i in this.outgoing_deps) {
            let outgoing_dep = this.outgoing_deps[i];
            delete outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];

            if (!ObjectHandler.hasAtLeastOneAttribute(outgoing_dep.outgoing_node.outgoing_deps)) {
                dag.roots[(outgoing_dep.outgoing_node as VarDAGNode).var_data.index] = outgoing_dep.outgoing_node as VarDAGNode;
            }
        }

        if (!!dag.leafs[this.var_data.index]) {
            delete dag.leafs[this.var_data.index];
        }
        if (!!dag.roots[this.var_data.index]) {
            delete dag.roots[this.var_data.index];
        }

        return this;
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    public linkToDAG(): VarDAGNode {

        this.var_dag.nodes[this.var_data.index] = this;
        this.var_dag.nb_nodes++;

        this.var_dag.leafs[this.var_data.index] = this;
        this.var_dag.roots[this.var_data.index] = this;

        return this;
    }

    get is_deletable(): boolean {
        return this.tags[VarDAGNode.TAG_6_UPDATED_IN_DB] && !this.hasIncoming;
    }

    get is_computable(): boolean {
        if (!this.tags[VarDAGNode.TAG_3_DATA_LOADED]) {
            return false;
        }

        for (let i in this.outgoing_deps) {
            let outgoing_dep = this.outgoing_deps[i];

            if (!outgoing_dep.outgoing_node.tags[VarDAGNode.TAG_4_COMPUTED]) {
                return false;
            }
        }

        return true;
    }

    private update_current_step_tag() {
        let updated_current_step = null;

        for (let step_tag_name in VarDAGNode.STEP_TAGS_INDEXES) {
            if (this.tags[step_tag_name]) {
                updated_current_step = VarDAGNode.STEP_TAGS_INDEXES[step_tag_name];
                break;
            }
        }

        if (this.current_step == updated_current_step) {
            return;
        }

        if (this.current_step != null) {
            delete this.var_dag.current_step_tags[this.current_step];
        }

        if (updated_current_step != null) {
            this.var_dag.current_step_tags[updated_current_step][this.var_data.index] = this;
        }

        this.current_step = updated_current_step;
    }
}
