import ConfigurationService from '../../../../server/env/ConfigurationService';
import ThrottledQueryServerController from '../../../../server/modules/DAO/ThrottledQueryServerController';
import VarsServerCallBackSubsController from '../../../../server/modules/Var/VarsServerCallBackSubsController';
import VarsServerController from '../../../../server/modules/Var/VarsServerController';
import VarsClientsSubsCacheHolder from '../../../../server/modules/Var/bgthreads/processes/VarsClientsSubsCacheHolder';
import ParameterizedQueryWrapperField from '../../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import DAGNodeBase from '../../../../shared/modules/Var/graph/dagbase/DAGNodeBase';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import UpdateIsComputableVarDAGNode from './UpdateIsComputableVarDAGNode';
import VarDAG from './VarDAG';
import VarDAGNodeDep from './VarDAGNodeDep';

export default class VarDAGNode extends DAGNodeBase {

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
    public static TAG_4_IS_COMPUTABLE: string = 'IS_COMPUTABLE';
    public static TAG_4_COMPUTING: string = 'COMPUTING';
    // Pour la notification
    public static TAG_5_NOTIFYING_END: string = 'NOTIFYING_END';
    // Pour la sauvegarde
    public static TAG_6_UPDATING_IN_DB: string = 'UPDATING_IN_DB';
    // Pour la suppression
    public static TAG_7_IS_DELETABLE: string = 'IS_DELETABLE';
    public static TAG_7_DELETING: string = 'DELETING';

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
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: 7,
        [VarDAGNode.TAG_4_COMPUTING]: 8,
        [VarDAGNode.TAG_4_COMPUTED]: 9,
        [VarDAGNode.TAG_5_NOTIFYING_END]: 10,
        [VarDAGNode.TAG_5_NOTIFIED_END]: 11,
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: 12,
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: 13,
        [VarDAGNode.TAG_7_IS_DELETABLE]: 14,
        [VarDAGNode.TAG_7_DELETING]: 15,
    };
    public static ORDERED_STEP_TAGS_NAMES: string[] = [
        VarDAGNode.TAG_0_CREATED,
        VarDAGNode.TAG_1_NOTIFYING_START,
        VarDAGNode.TAG_1_NOTIFIED_START,
        VarDAGNode.TAG_2_DEPLOYING,
        VarDAGNode.TAG_2_DEPLOYED,
        VarDAGNode.TAG_3_DATA_LOADING,
        VarDAGNode.TAG_3_DATA_LOADED,
        VarDAGNode.TAG_4_IS_COMPUTABLE,
        VarDAGNode.TAG_4_COMPUTING,
        VarDAGNode.TAG_4_COMPUTED,
        VarDAGNode.TAG_5_NOTIFYING_END,
        VarDAGNode.TAG_5_NOTIFIED_END,
        VarDAGNode.TAG_6_UPDATING_IN_DB,
        VarDAGNode.TAG_6_UPDATED_IN_DB,
        VarDAGNode.TAG_7_IS_DELETABLE,
        VarDAGNode.TAG_7_DELETING
    ];


    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     * @param already_tried_load_cache_complet par défaut false, il faut mettre true uniquement si on a déjà essayé de charger la var en base de données et qu'on a pas réussi
     * @returns {VarDAGNode}
     */
    public static async getInstance(var_dag: VarDAG, var_data: VarDataBaseVO, already_tried_load_cache_complet: boolean = false): Promise<VarDAGNode> {

        if (!!var_dag.nodes[var_data.index]) {
            return var_dag.nodes[var_data.index];
        }

        /**
         * On utilise une forme de sémaphore, qui utilise les promises pour éviter de créer plusieurs fois le même noeud
         */
        if (!VarDAGNode.getInstance_semaphores[var_dag.uid]) {
            VarDAGNode.getInstance_semaphores[var_dag.uid] = {};
        }

        if (!VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index]) {
            let promise = VarDAGNode.getInstance_semaphored(var_dag, var_data, already_tried_load_cache_complet);
            VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index] = promise.finally(() => {
                delete VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index];
            });

            return promise;
        }

        return VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index];
    }

    private static getInstance_semaphores: { [var_dag_uid: number]: { [var_data_index: number]: Promise<VarDAGNode> } } = {};

    private static async load_from_db_if_exists(_type: string, index: string): Promise<VarDataBaseVO> {
        let table = VOsTypesManager.moduleTables_by_voType[_type];

        if (table.is_segmented) {
            throw new Error('VarDAGNode.load_from_db_if_exists :: table.is_segmented not implemented');
        }

        // FIXME : WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
        // let res = await ModuleDAOServer.getInstance().query('select * from ' + table.full_name + ' where _bdd_only_index = $1', [index]);

        // // Attention aux injections...
        // if (!/^[0-9a-zA-Z.,;!%*_@?:/#=+|]+$/.test(index)) {
        //     throw new Error('VarDAGNode.load_from_db_if_exists :: index not valid');
        // }

        const base_moduletable_fields = table.get_fields();
        let parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[] = [];

        let fields: string = 't.id';
        let parameterizedQueryWrapperField: ParameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
            _type,
            'id',
            null,
            'id'
        );

        parameterizedQueryWrapperFields.push(parameterizedQueryWrapperField);

        // Add all fields by default
        for (const i in base_moduletable_fields) {
            const field = base_moduletable_fields[i];

            parameterizedQueryWrapperField = new ParameterizedQueryWrapperField(
                _type,
                field.field_name,
                null,
                field.field_name
            );
            parameterizedQueryWrapperFields.push(parameterizedQueryWrapperField);
            fields += ', t.' + field.field_name;
        }

        // FIXME : WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
        // let parameterized_query_wrapper: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(
        //     'select * from ' + table.full_name + ' where _bdd_only_index = $1',
        //     [index],
        //     parameterizedQueryWrapperFields
        // );
        let res = await ThrottledQueryServerController.throttle_select_query(
            'select ' + fields + ' from ' + table.full_name + ' t where _bdd_only_index = $1',
            [index],
            parameterizedQueryWrapperFields);

        if ((!res) || (!res.length)) {
            return null;
        }

        let data = res[0];
        data._type = table.vo_type;
        return table.forceNumeric(data);
    }

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

        /**
         * On check qu'on essaie pas d'ajoute une var avec un maxrange quelque part qui casserait tout
         */
        if (!MatroidController.check_bases_not_max_ranges(var_data)) {
            ConsoleHandler.error('VarDAGNode.getInstance_semaphored:!check_bases_not_max_ranges:' + var_data.index);
            throw new Error('VarDAGNode.getInstance_semaphored:!check_bases_not_max_ranges:' + var_data.index);
        }

        if (!!var_dag.nodes[var_data.index]) {
            return var_dag.nodes[var_data.index];
        }

        return new Promise(async (resolve, reject) => {

            if (!!var_dag.nodes[var_data.index]) {
                resolve(var_dag.nodes[var_data.index]);
                return;
            }

            let node = new VarDAGNode(var_dag, var_data);

            node.is_client_sub = !!VarsClientsSubsCacheHolder.clients_subs_indexes_cache[node.var_data.index];
            node.is_server_sub = !!VarsServerCallBackSubsController.cb_subs[node.var_data.index];

            // On tente de chercher le cache complet dès l'insertion du noeud, si on a pas explicitement défini que le test a déjà été fait
            /* istanbul ignore next: impossible to test - await query */
            if ((!already_tried_load_cache_complet) && (!ConfigurationService.IS_UNIT_TEST_MODE)) {
                let db_data: VarDataBaseVO = await VarDAGNode.load_from_db_if_exists(node.var_data._type, node.var_data.index); // Version optimisée de la ligne ci-dessous
                // let db_data: VarDataBaseVO = await query(node.var_data._type).filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, node.var_data.index).select_vo();
                if (!!db_data) {
                    node.var_data = db_data;
                    already_tried_load_cache_complet = true;
                }
            }

            if (ConfigurationService.node_configuration.DEBUG_var_get_instance_semaphored_db_loaded_var_data) {
                ConsoleHandler.log('VarDAGNode.getInstance_semaphored:already_tried_load_cache_complet:' + already_tried_load_cache_complet + ':is_client_sub?' + node.is_client_sub + ':is_server_sub?' + node.is_server_sub + ':TAG_0_CREATED:' + JSON.stringify(node.var_data));
            }

            /**
             * Si on a une valid value, on passe directement à la notification de fin,
             * sinon on indique que le noeud est créé
             */
            /* istanbul ignore next: impossible to test - linked to above query */
            if (VarsServerController.has_valid_value(node.var_data)) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                    ConsoleHandler.log('VarDAGNode.getInstance_semaphored:has_valid_value:is_client_sub?' + node.is_client_sub +
                        ':is_server_sub?' + node.is_server_sub + ':TAG_4_COMPUTED & TAG_6_UPDATED_IN_DB:' + JSON.stringify(node.var_data));
                }

                node.add_tag(VarDAGNode.TAG_4_COMPUTED);
                // On ne doit pas update in DB du coup
                node.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
            } else {

                if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                    ConsoleHandler.log('VarDAGNode.getInstance_semaphored:!has_valid_value:is_client_sub?' + node.is_client_sub +
                        ':is_server_sub?' + node.is_server_sub + ':TAG_0_CREATED:' + JSON.stringify(node.var_data));
                }

                node.add_tag(VarDAGNode.TAG_0_CREATED);
            }

            return resolve(node.linkToDAG());
        });
    }

    // private static async try_load_cache_complet(node: VarDAGNode) {

    //     let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

    //     let cache_complet = await VarsDatasProxy.get_exact_param_from_buffer_or_bdd(node.var_data, false, 'try_load_cache_complet');
    //     let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[node.var_data.index];

    //     if (!cache_complet) {
    //         if (DEBUG_VARS) {
    //             ConsoleHandler.log('try_load_cache_complet:' + node.var_data.index + ':aucun cache complet' +
    //                 ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
    //         }

    //         return;
    //     }

    //     // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
    //     node.var_data.id = cache_complet.id;
    //     node.var_data.value = cache_complet.value;
    //     node.var_data.value_ts = cache_complet.value_ts;
    //     node.var_data.value_type = cache_complet.value_type;
    //     if (DEBUG_VARS) {
    //         ConsoleHandler.log('try_load_cache_complet:' + node.var_data.index + ':OK:' + cache_complet.value + ':' + cache_complet.value_ts + ':' + cache_complet.id +
    //             ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
    //     }
    // }

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
    public current_step: number = null;

    /**
     * On se rajoute un tag pour les noeuds issus d'une demande client à la base, et qui en découlent
     *  Donc le noeud initial sera is_client_sub == true
     *  et ses deps is_client_sub_dep == true
     */
    public is_client_sub: boolean = false;
    public is_client_sub_dep: boolean = false;

    /**
     * On se met l'info d'une demande qui serait initiée par un server sub.
     *  Donc le noeud initial sera is_server_sub == true
     *  et ses deps is_server_sub_dep == true
     */
    public is_server_sub: boolean = false;
    public is_server_sub_dep: boolean = false;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public var_dag: VarDAG, public var_data: VarDataBaseVO) {
        super();
    }


    /**
     * Pour l'ajout des tags, on veille toujours à vérifier qu'on a pas un tag TO_DELETE, et la possibilité de supprimer le noeud.
     *  Sinon on refuse l'ajout. On a pas non plus le droit de remettre un Tag déjà passé. On peut mettre des tags à venir, mais pas < au current_step
     * @param tag Le tag à ajouter
     */
    public add_tag(tag: string): boolean {

        if (this.tags[tag]) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':already in tags');
            }

            return true;
        }

        if (VarDAGNode.STEP_TAGS_INDEXES[tag] < this.current_step) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':< current_step:' + this.current_step);
            }

            return false;
        }

        // Cas spécifique des tags DATA_LOADED qu'on ne doit pas mettre, mais sans indiquer d'erreur si on est déjà IS_COMPUTABLE,
        //  et idem pour UPDATED_IN_DB si on est déjà IS_DELETABLE
        if ((tag == VarDAGNode.TAG_3_DATA_LOADED) && this.tags[VarDAGNode.TAG_4_IS_COMPUTABLE]) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':already IS_COMPUTABLE');
            }

            return true;
        }

        if ((tag == VarDAGNode.TAG_6_UPDATED_IN_DB) && this.tags[VarDAGNode.TAG_7_IS_DELETABLE]) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':already IS_DELETABLE');
            }

            return true;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
            ConsoleHandler.log(
                'VarDAGNode.add_tag:' + this.var_data.index +
                ':tag:' + tag);
        }

        this.tags[tag] = true;

        if (!!this.var_dag) {

            if (!this.var_dag.tags[tag]) {
                this.var_dag.tags[tag] = {};
            }
            this.var_dag.tags[tag][this.var_data.index] = this;
        }

        this.update_current_step_tag();

        return true;
    }

    public remove_tag(tag: string) {

        if (!this.tags[tag]) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                ConsoleHandler.log(
                    'VarDAGNode.remove_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':not in tags');
            }

            return;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
            ConsoleHandler.log(
                'VarDAGNode.remove_tag:' + this.var_data.index +
                ':tag:' + tag);
        }

        delete this.tags[tag];

        this.update_current_step_tag();
        if (!this.var_dag) {
            return;
        }
        delete this.var_dag.tags[tag][this.var_data.index];
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

        let dep: VarDAGNodeDep = new VarDAGNodeDep(dep_name, this, outgoing_node);

        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps[dep.dep_name]) {
            dep.outgoing_node.incoming_deps[dep.dep_name] = [];
        }
        dep.outgoing_node.incoming_deps[dep.dep_name].push(dep);

        if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
            ConsoleHandler.log(
                'VarDAGNode.addOutgoingDep:' + this.var_data.index +
                ':outgoing_dep:' + dep.dep_name +
                ':outgoing_node:' + (dep.outgoing_node as VarDAGNode).var_data.index);
        }

        if (!!this.var_dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.var_dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.var_dag.leafs[this.var_data.index]) {
            delete this.var_dag.leafs[this.var_data.index];
        }

        // On ajoute la logique de is_client_sub_dep
        outgoing_node.is_client_sub_dep = outgoing_node.is_client_sub_dep || this.is_client_sub || this.is_client_sub_dep;
        outgoing_node.is_server_sub_dep = outgoing_node.is_server_sub_dep || this.is_server_sub || this.is_server_sub_dep;
    }

    /**
     * Méthode appelée pour supprimer le noeud de l'arbre
     * @returns {boolean} true si le noeud a été supprimé, false sinon
     */
    public unlinkFromDAG(force_delete: boolean = false): boolean {

        if (!this.var_dag) {
            return true;
        }
        let dag = this.var_dag;

        // dernier check. On ne doit pas avoir d'incoming_deps depuis la prise de décision de supprimer
        if (this.hasIncoming && (!force_delete)) {
            this.remove_tag(VarDAGNode.TAG_7_IS_DELETABLE);
            this.remove_tag(VarDAGNode.TAG_7_DELETING);
            this.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
            return false;
        }

        this.var_dag = null;

        if (!dag.nodes[this.var_data.index]) {
            ConsoleHandler.warn('VarDAGNode.unlinkFromDAG:' + this.var_data.index + ':not in dag.nodes !');
            return false;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
            ConsoleHandler.log(
                'VarDAGNode.unlinkFromDAG:' + this.var_data.index +
                ':delete dag.nodes[this.var_data.index]');
        }

        delete dag.nodes[this.var_data.index];
        delete VarDAGNode.getInstance_semaphores[dag.uid][this.var_data.index];
        dag.nb_nodes--;
        if (this.current_step != null) {
            let current_step_tag_name: string = VarDAGNode.ORDERED_STEP_TAGS_NAMES[this.current_step];
            if (!!dag.current_step_tags[current_step_tag_name]) {
                delete dag.current_step_tags[current_step_tag_name][this.var_data.index];
            }
        }
        for (let i in dag.tags) {
            if (!!dag.tags[i][this.var_data.index]) {
                delete dag.tags[i][this.var_data.index];
            }
        }

        let keys = Object.keys(this.incoming_deps);
        for (let i in keys) {
            let deps = this.incoming_deps[keys[i]];

            for (let j in deps) {
                let incoming_dep = deps[j];

                if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                    ConsoleHandler.log(
                        'VarDAGNode.unlinkFromDAG:' + this.var_data.index +
                        ':incoming_dep:' + incoming_dep.dep_name +
                        ':incoming_node:' + (incoming_dep.incoming_node as VarDAGNode).var_data.index);
                }
                delete incoming_dep.incoming_node.outgoing_deps[incoming_dep.dep_name];

                if (!ObjectHandler.hasAtLeastOneAttribute(incoming_dep.incoming_node.outgoing_deps)) {
                    dag.leafs[(incoming_dep.incoming_node as VarDAGNode).var_data.index] = incoming_dep.incoming_node as VarDAGNode;
                }
            }
        }

        keys = Object.keys(this.outgoing_deps);
        for (let i in keys) {
            let outgoing_dep = this.outgoing_deps[keys[i]];

            let incoming_deps = outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];
            for (let j in incoming_deps) {
                let incoming_dep = incoming_deps[j];

                if (incoming_dep == outgoing_dep) {

                    if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                        ConsoleHandler.log(
                            'VarDAGNode.unlinkFromDAG:' + this.var_data.index +
                            ':outgoing_dep:' + outgoing_dep.dep_name +
                            ':outgoing_node:' + (outgoing_dep.outgoing_node as VarDAGNode).var_data.index);
                    }

                    incoming_deps.splice(parseInt(j.toString()), 1);
                    break;
                }
            }

            if (!incoming_deps.length) {
                delete outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];
            }

            if (!ObjectHandler.hasAtLeastOneAttribute(outgoing_dep.outgoing_node.incoming_deps)) {
                dag.roots[(outgoing_dep.outgoing_node as VarDAGNode).var_data.index] = outgoing_dep.outgoing_node as VarDAGNode;
            }
        }
        delete this.incoming_deps;
        delete this.outgoing_deps;

        if (!!dag.leafs[this.var_data.index]) {
            delete dag.leafs[this.var_data.index];
        }
        if (!!dag.roots[this.var_data.index]) {
            delete dag.roots[this.var_data.index];
        }

        return true;
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    public linkToDAG(): VarDAGNode {

        if (!!this.var_dag.nodes[this.var_data.index]) {
            return this.var_dag.nodes[this.var_data.index];
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
            ConsoleHandler.log('VarDAGNode.linkToDAG:' + this.var_data.index);
        }

        this.var_dag.nodes[this.var_data.index] = this;
        this.var_dag.nb_nodes++;

        this.var_dag.leafs[this.var_data.index] = this;
        this.var_dag.roots[this.var_data.index] = this;

        return this;
    }

    public update_parent_is_computable_if_needed() {

        // On impacte le tag sur les parents si tous leurs enfants sont computed
        for (let i in this.incoming_deps) {
            let deps = this.incoming_deps[i];

            for (let k in deps) {
                let dep = deps[k];
                let node = dep.incoming_node as VarDAGNode;
                UpdateIsComputableVarDAGNode.throttle_update_is_computable_var_dag_node({ [node.var_data.index]: node });
            }
        }
    }

    /**
     * On peut supprimer un noeud à condition qu'il n'ait pas de dépendances entrantes
     */
    get is_deletable(): boolean {
        return !this.hasIncoming;
    }

    /**
     * On défini comme computable un noeud dont toutes les dépendances sortantes ont un tag courant >= VarDAGNode.TAG_4_COMPUTED
     */
    get is_computable(): boolean {

        // Si on a pas fini de déployer les deps, on peut pas encore savoir si on est computable
        if (this.current_step < VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_2_DEPLOYED]) {
            return false;
        }

        for (let i in this.outgoing_deps) {
            let outgoing_dep = this.outgoing_deps[i];

            if ((outgoing_dep.outgoing_node as VarDAGNode).current_step < VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_COMPUTED]) {
                return false;
            }
        }
        return true;
    }

    private update_current_step_tag() {
        let updated_current_step: number = null;
        let updated_current_step_tag_name: string = null;
        let current_step_tag_name: string = VarDAGNode.ORDERED_STEP_TAGS_NAMES[this.current_step];

        for (let i in VarDAGNode.ORDERED_STEP_TAGS_NAMES) {
            let step_tag_name = VarDAGNode.ORDERED_STEP_TAGS_NAMES[i];
            if (this.tags[step_tag_name]) {
                updated_current_step = VarDAGNode.STEP_TAGS_INDEXES[step_tag_name];
                updated_current_step_tag_name = step_tag_name;
                break;
            }
        }

        if (this.current_step === updated_current_step) {
            return;
        }

        if (this.var_dag) {

            if (this.current_step != null) {
                if (!!this.var_dag.current_step_tags[current_step_tag_name]) {
                    delete this.var_dag.current_step_tags[current_step_tag_name][this.var_data.index];
                }
            }

            if (updated_current_step != null) {
                if (!this.var_dag.current_step_tags[updated_current_step_tag_name]) {
                    this.var_dag.current_step_tags[updated_current_step_tag_name] = {};
                }
                this.var_dag.current_step_tags[updated_current_step_tag_name][this.var_data.index] = this;
            }
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
            ConsoleHandler.log('VarDAGNode.update_current_step_tag:' + this.var_data.index +
                ':current_step:' + this.current_step + ':updated_current_step:' + updated_current_step);
        }

        this.current_step = updated_current_step;
        this.onchange_current_step();
    }

    /**
     * Ici on check les évolutions autos:
     *  - du DATA_LOADED au is_computable, si is_computable
     *  - du UPDATED_IN_DB au is_deletable, si is_deletable
     */
    private onchange_current_step() {

        if (this.current_step == null) {
            return;
        }

        if ((this.current_step == VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_3_DATA_LOADED]) && this.is_computable) {


            if (this.tags[VarDAGNode.TAG_4_COMPUTED]) {
                if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                    ConsoleHandler.log('VarDAGNode.onchange_current_step:current_step == VarDAGNode.TAG_3_DATA_LOADED && is_computable:' + this.var_data.index + ' && already TAG_4_COMPUTED: removing TAG_3_DATA_LOADED');
                }
            } else {
                if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                    ConsoleHandler.log('VarDAGNode.onchange_current_step:current_step == VarDAGNode.TAG_3_DATA_LOADED && is_computable:' + this.var_data.index + ':TAG_4_IS_COMPUTABLE');
                }
                this.add_tag(VarDAGNode.TAG_4_IS_COMPUTABLE);
            }

            if (this.tags[VarDAGNode.TAG_3_DATA_LOADED]) {
                this.remove_tag(VarDAGNode.TAG_3_DATA_LOADED);
            }
        }

        if ((this.current_step == VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_6_UPDATED_IN_DB]) && this.is_deletable) {

            if (ConfigurationService.node_configuration.DEBUG_VARS_CURRENT_TREE) {
                ConsoleHandler.log('VarDAGNode.onchange_current_step:current_step == VarDAGNode.TAG_6_UPDATED_IN_DB && is_deletable:' + this.var_data.index + ':TAG_7_IS_DELETABLE');
            }

            this.add_tag(VarDAGNode.TAG_7_IS_DELETABLE);
            this.remove_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
        }

        if (this.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_COMPUTED]) {
            // On impacte les parents sur un potentiel is_computable
            this.update_parent_is_computable_if_needed();
        }
    }

    get is_notifiable(): boolean {
        return VarsServerController.has_valid_value(this.var_data);
    }
}
