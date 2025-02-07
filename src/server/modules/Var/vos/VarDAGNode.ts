import ParameterizedQueryWrapperField from '../../../../shared/modules/ContextFilter/vos/ParameterizedQueryWrapperField';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import EventsController from '../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import DAGNodeBase from '../../../../shared/modules/Var/graph/dagbase/DAGNodeBase';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ThrottledQueryServerController from '../../../modules/DAO/ThrottledQueryServerController';
import VarsServerCallBackSubsController from '../../../modules/Var/VarsServerCallBackSubsController';
import VarsServerController from '../../../modules/Var/VarsServerController';
import VarsClientsSubsCacheHolder from '../../../modules/Var/bgthreads/processes/VarsClientsSubsCacheHolder';
import ModuleTableServerController from '../../DAO/ModuleTableServerController';
import VarsComputationHole from '../bgthreads/processes/VarsComputationHole';
import VarsProcessBase from '../bgthreads/processes/VarsProcessBase';
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

    private static getInstance_semaphores: { [var_dag_uid: number]: { [var_data_index: number]: Promise<VarDAGNode> } } = {};

    /**
     * La date d'ajout dans l'arbre de ce noeud
     */
    public linked_at: number = null;

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
     * Permet de bloquer la mise à jour du current step, par exemple pour les noeuds en attente de connexion à d'autres noeuds (typiquement dans le deploy)
     * Par défaut un noeud est locked et restera donc dans l'arbre à vie, il faut le délocker quand il est correctement configuré
     */
    private _lock_current_step: number = 1;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public var_dag: VarDAG, public var_data: VarDataBaseVO) {
        super();
    }

    get lock_current_step(): boolean {
        return this._lock_current_step > 0;
    }

    /**
     * On peut supprimer un noeud à condition qu'il n'ait pas de dépendances entrantes, et qu'il ne soit pas marqué comme en attente de connexion à d'autres noeuds (typiquement dans le deploy)
     */
    get is_deletable(): boolean {
        return (!this.hasIncoming);
    }

    /**
     * On défini comme computable un noeud dont toutes les dépendances sortantes ont un tag courant >= VarDAGNode.TAG_4_COMPUTED
     */
    get is_computable(): boolean {

        // Si on a pas fini de déployer les deps, on peut pas encore savoir si on est computable
        if (this.current_step < VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_2_DEPLOYED]) {
            return false;
        }

        for (const i in this.outgoing_deps) {
            const outgoing_dep = this.outgoing_deps[i];

            if ((outgoing_dep.outgoing_node as VarDAGNode).current_step < VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_COMPUTED]) {
                return false;
            }
        }
        return true;
    }

    get is_notifiable(): boolean {
        return VarsServerController.has_valid_value(this.var_data);
    }

    public static unlock_nodes(nodes: VarDAGNode[]) {
        for (const i in nodes) {
            nodes[i].unlock();
        }
    }

    public static lock_nodes(nodes: VarDAGNode[]) {
        for (const i in nodes) {
            nodes[i].lock();
        }
    }

    /**
     * ATTENTION : On renvoie le noeud en mode locked, pour pas faire instantannément des updates du current state avant qu'il soit correctement lié à ses deps / aggregated datas / ... donc il faut unlock quand c'est bon sinon il restera planté dans l'arbre ad vitam
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     * @param already_tried_load_cache_complet par défaut false, il faut mettre true uniquement si on a déjà essayé de charger la var en base de données et qu'on a pas réussi
     * @returns {VarDAGNode}
     */
    public static async getInstance(
        var_dag: VarDAG,
        var_data: VarDataBaseVO,
        already_tried_load_cache_complet: boolean = false,

        // // On ajoute le parent en param qui a demandé ce noeud et qui veut se connecter à lui, par ce que sinon si on trouve en db, on a une valid value, et on delete le noeud juste après l'avoir inséré puisque personne n'en dépend...
        // parent_node: VarDAGNode = null,
        // parent_dep_id: string = null,

        // ignore_waiting_for_computation_holes: boolean = false, TODO FIXME: il y a une difficulté avec cette logique, il faudrait la revoir. On est sur un sémaphore de création, donc on n'aura qu'une valeur prise en compte pour ce param, mais si c'est false la première fois et true la deuxième, on est bloqués à vie... car le deuxième est une dep dont on a besoin pour résoudre l'arbre et le premier est peut-etre une ligne d'un export qui va bloquer en attendant le hole...
    ): Promise<VarDAGNode> {

        const existing_node = var_dag.nodes[var_data.index];
        if (existing_node) {

            // if (parent_dep_id && parent_node) {
            //     if (!parent_node.addOutgoingDep(parent_dep_id, existing_node)) {
            //         ConsoleHandler.error('VarDAGNode.getInstance:parent_node.addOutgoingDep:false:' + parent_node.var_data.index + ':' + parent_dep_id + ':' + existing_node.var_data.index);
            //     }
            // }

            // On lock le noeud pour limiter les traitements en parallèle sur un noeud donné
            existing_node.lock();

            return existing_node;
        }

        /**
         * On utilise une forme de sémaphore, qui utilise les promises pour éviter de créer plusieurs fois le même noeud
         */
        if (!VarDAGNode.getInstance_semaphores[var_dag.uid]) {
            VarDAGNode.getInstance_semaphores[var_dag.uid] = {};
        }

        if (!VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index]) {
            const promise = VarDAGNode.getInstance_semaphored(
                var_dag,
                var_data,
                already_tried_load_cache_complet,
                /*, ignore_waiting_for_computation_holes*/);
            VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index] = promise.finally(() => {
                delete VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index];
            });

            return promise;
        }

        // si on arrive ici, on est pas le créateur du noeud/promise, donc il faut lock encore pour nous
        const res: VarDAGNode = await VarDAGNode.getInstance_semaphores[var_dag.uid][var_data.index];
        res.lock();

        return res;
    }

    private static async load_from_db_if_exists(_type: string, index: string): Promise<VarDataBaseVO> {
        const table = ModuleTableController.module_tables_by_vo_type[_type];

        if (table.is_segmented) {
            throw new Error('VarDAGNode.load_from_db_if_exists :: table.is_segmented not implemented');
        }

        // FIXME : WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
        // let res = await ModuleDAOServer.instance.query('select * from ' + table.full_name + ' where _bdd_only_index = $1', [index]);

        // // Attention aux injections...
        // if (!/^[0-9a-zA-Z.,;!%*_@?:/#=+|]+$/.test(index)) {
        //     throw new Error('VarDAGNode.load_from_db_if_exists :: index not valid');
        // }

        const base_moduletable_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
        const parameterizedQueryWrapperFields: ParameterizedQueryWrapperField[] = [];

        let fields: string = 't.id';
        let parameterizedQueryWrapperField: ParameterizedQueryWrapperField = ParameterizedQueryWrapperField.get_id_field(_type);

        parameterizedQueryWrapperFields.push(parameterizedQueryWrapperField);

        // Add all fields by default
        for (const i in base_moduletable_fields) {
            const field = base_moduletable_fields[i];

            parameterizedQueryWrapperField = ParameterizedQueryWrapperField.FROM_ModuleTableFieldVO(field);
            parameterizedQueryWrapperFields.push(parameterizedQueryWrapperField);
            fields += ', t.' + field.field_name;
        }

        // FIXME : WARN select * does not garanty the order of the fields, we should use a select with the fields in the right order
        // let parameterized_query_wrapper: ParameterizedQueryWrapper = new ParameterizedQueryWrapper(
        //     'select * from ' + table.full_name + ' where _bdd_only_index = $1',
        //     [index],
        //     parameterizedQueryWrapperFields
        // );
        const res = await ThrottledQueryServerController.throttle_select_query(
            'select ' + fields + ' from ' + table.full_name + ' t where _bdd_only_index = $1',
            [index],
            parameterizedQueryWrapperFields);

        if ((!res) || (!res.length)) {
            return null;
        }

        const data = res[0];
        data._type = table.vo_type;
        return ModuleTableServerController.translate_vos_from_db(data);
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
    private static async getInstance_semaphored(
        var_dag: VarDAG,
        var_data: VarDataBaseVO,
        already_tried_load_cache_complet: boolean = false,
        // ignore_waiting_for_computation_holes: boolean = false, TODO FIXME: il y a une difficulté avec cette logique, il faudrait la revoir. On est sur un sémaphore de création, donc on n'aura qu'une valeur prise en compte pour ce param, mais si c'est false la première fois et true la deuxième, on est bloqués à vie... car le deuxième est une dep dont on a besoin pour résoudre l'arbre et le premier est peut-etre une ligne d'un export qui va bloquer en attendant le hole...
    ): Promise<VarDAGNode> {

        /**
         * On check qu'on essaie pas d'ajoute une var avec un maxrange quelque part qui casserait tout
         */
        if (!MatroidController.check_bases_not_max_ranges(var_data)) {
            ConsoleHandler.error('VarDAGNode.getInstance_semaphored:!check_bases_not_max_ranges:' + var_data.index);
            throw new Error('VarDAGNode.getInstance_semaphored:!check_bases_not_max_ranges:' + var_data.index);
        }

        if (var_dag.nodes[var_data.index]) {
            return var_dag.nodes[var_data.index];
        }

        return new Promise(async (resolve, reject) => {

            if (var_dag.nodes[var_data.index]) {
                resolve(var_dag.nodes[var_data.index]);
                return;
            }

            // ATTENTION FIXME TODO outre le pb remonté sur ce param, si on veut réactiver il faut aussi s'assurer que lors de l'invalidation, les var datas à remettre dans l'arbre sont bien ajoutés en ignore_waiting_for_computation_holes
            // if (!ignore_waiting_for_computation_holes) {
            //     while (VarsComputationHole.waiting_for_computation_hole || VarsComputationHole.currently_in_a_hole_semaphore) {
            //         await ThreadHandler.sleep(10, 'VarDAGNode.getInstance_semaphored:waiting_for_computation_hole');
            //     }
            // }

            const node = new VarDAGNode(var_dag, var_data);

            node.is_client_sub = !!VarsClientsSubsCacheHolder.clients_subs_indexes_cache[node.var_data.index];
            node.is_server_sub = !!VarsServerCallBackSubsController.cb_subs[node.var_data.index];

            // On tente de chercher le cache complet dès l'insertion du noeud, si on a pas explicitement défini que le test a déjà été fait
            /* istanbul ignore next: impossible to test - await query */
            if ((!already_tried_load_cache_complet) && (!ConfigurationService.IS_UNIT_TEST_MODE)) {
                const db_data: VarDataBaseVO = await VarDAGNode.load_from_db_if_exists(node.var_data._type, node.var_data.index); // Version optimisée de la ligne ci-dessous
                // let db_data: VarDataBaseVO = await query(node.var_data._type).filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, node.var_data.index).select_vo();
                if (db_data) {
                    node.var_data = db_data;
                    already_tried_load_cache_complet = true;
                }
            }

            if (ConfigurationService.node_configuration.debug_var_get_instance_semaphored_db_loaded_var_data) {
                ConsoleHandler.log('VarDAGNode.getInstance_semaphored:already_tried_load_cache_complet:' + already_tried_load_cache_complet + ':is_client_sub?' + node.is_client_sub + ':is_server_sub?' + node.is_server_sub + ':TAG_0_CREATED:' + JSON.stringify(node.var_data));
            }

            /**
             * Si on a une valid value, on passe directement à la notification de fin,
             * sinon on indique que le noeud est créé
             */
            /* istanbul ignore next: impossible to test - linked to above query */
            if (VarsServerController.has_valid_value(node.var_data)) {

                if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                    ConsoleHandler.log('VarDAGNode.getInstance_semaphored:has_valid_value:is_client_sub?' + node.is_client_sub +
                        ':is_server_sub?' + node.is_server_sub + ':TAG_4_COMPUTED & TAG_6_UPDATED_IN_DB:' + JSON.stringify(node.var_data));
                }

                node.add_tag(VarDAGNode.TAG_4_COMPUTED);
                // On ne doit pas update in DB du coup
                node.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
            } else {

                if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                    ConsoleHandler.log('VarDAGNode.getInstance_semaphored:!has_valid_value:is_client_sub?' + node.is_client_sub +
                        ':is_server_sub?' + node.is_server_sub + ':TAG_0_CREATED:' + JSON.stringify(node.var_data));
                }

                node.add_tag(VarDAGNode.TAG_0_CREATED);
            }

            return resolve(node.linkToDAG());
        });
    }

    // private static async try_load_cache_complet(node: VarDAGNode) {

    //     let DEBUG_VARS = ConfigurationService.node_configuration.debug_vars;

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

    public lock() {
        this._lock_current_step++;
    }

    public unlock() {
        this._lock_current_step--;
        if (this._lock_current_step < 0) {

            try {
                throw new Error('VarDAGNode.unlock:lock_current_step < 0:' + this.var_data.index + ':' + this._lock_current_step + ':' + this.current_step);
            } catch (e) {
                ConsoleHandler.error(e);
            }

            this._lock_current_step = 0;
        }

        if (this._lock_current_step == 0) {
            this.update_current_step_tag();
        }
    }

    /**
     * Pour l'ajout des tags, on veille toujours à vérifier qu'on a pas un tag TO_DELETE, et la possibilité de supprimer le noeud.
     *  Sinon on refuse l'ajout. On a pas non plus le droit de remettre un Tag déjà passé. On peut mettre des tags à venir, mais pas < au current_step
     * @param tag Le tag à ajouter
     */
    public add_tag(tag: string, force_update_even_when_inf_current_step: boolean = false): boolean {

        if (this.tags[tag]) {

            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':already in tags');
            }

            return true;
        }

        if ((!force_update_even_when_inf_current_step) && (VarDAGNode.STEP_TAGS_INDEXES[tag] < this.current_step)) {

            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
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

            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':already IS_COMPUTABLE');
            }

            return true;
        }

        if ((tag == VarDAGNode.TAG_6_UPDATED_IN_DB) && this.tags[VarDAGNode.TAG_7_IS_DELETABLE]) {

            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                ConsoleHandler.log(
                    'VarDAGNode.add_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':already IS_DELETABLE');
            }

            return true;
        }

        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
            ConsoleHandler.log(
                'VarDAGNode.add_tag:' + this.var_data.index +
                ':tag:' + tag);
        }

        this.tags[tag] = true;

        if (this.var_dag) {

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

            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                ConsoleHandler.log(
                    'VarDAGNode.remove_tag:' + this.var_data.index +
                    ':tag:' + tag +
                    ':not in tags');
            }

            return;
        }

        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
            ConsoleHandler.log(
                'VarDAGNode.remove_tag:' + this.var_data.index +
                ':tag:' + tag);
        }

        delete this.tags[tag];
        if (this.var_dag && this.var_dag.tags[tag]) {
            delete this.var_dag.tags[tag][this.var_data.index];
        }

        this.update_current_step_tag();
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep VarDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     * @returns {boolean} true si la dep a été ajoutée, false sinon
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarDAGNode): boolean {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return true;
        }

        /**
         * Si le noeud de dep est marqué comme IS_DELETABLE, on doit le ramener à du UPDATED_IN_DB
         */
        if (outgoing_node.tags[VarDAGNode.TAG_7_IS_DELETABLE]) {
            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                ConsoleHandler.log(
                    'VarDAGNode.addOutgoingDep:On doit unmark le noeud cible de la dep pour éviter sa suppression:' + this.var_data.index +
                    ':outgoing_dep:' + dep_name +
                    ':outgoing_node:' + (outgoing_node as VarDAGNode).var_data.index);
            }

            outgoing_node.remove_tag(VarDAGNode.TAG_7_IS_DELETABLE);
            outgoing_node.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB, true);
        }

        /**
         * Si le noeud de dep est en cours de suppression, on ne peut pas ajouter de dep
         */
        if (outgoing_node.tags[VarDAGNode.TAG_7_DELETING] || !outgoing_node.var_dag) {
            return false;
        }

        const dep: VarDAGNodeDep = new VarDAGNodeDep(dep_name, this, outgoing_node);

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }

        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }

        if (!dep.outgoing_node.incoming_deps[dep.dep_name]) {
            dep.outgoing_node.incoming_deps[dep.dep_name] = [];
        }

        dep.outgoing_node.incoming_deps[dep.dep_name].push(dep);

        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
            ConsoleHandler.log(
                'VarDAGNode.addOutgoingDep:' + this.var_data.index +
                ':outgoing_dep:' + dep.dep_name +
                ':outgoing_node:' + (dep.outgoing_node as VarDAGNode).var_data.index);
        }

        if (this.var_dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.var_dag.roots[dep.outgoing_node.var_data.index];
        }

        if (this.var_dag.leafs[this.var_data.index]) {
            delete this.var_dag.leafs[this.var_data.index];
        }

        // On ajoute la logique de is_client_sub_dep
        outgoing_node.is_client_sub_dep = outgoing_node.is_client_sub_dep || this.is_client_sub || this.is_client_sub_dep;
        outgoing_node.is_server_sub_dep = outgoing_node.is_server_sub_dep || this.is_server_sub || this.is_server_sub_dep;

        return true;
    }

    /**
     * Méthode appelée pour supprimer le noeud de l'arbre
     * @returns {boolean} true si le noeud a été supprimé, false sinon
     */
    public unlinkFromDAG(force_delete: boolean = false): boolean {

        if (!this.var_dag) {
            return true;
        }
        const dag = this.var_dag;

        // dernier check. On ne doit pas avoir d'incoming_deps depuis la prise de décision de supprimer
        if (this.hasIncoming && (!force_delete)) {
            this.remove_tag(VarDAGNode.TAG_7_IS_DELETABLE);
            this.remove_tag(VarDAGNode.TAG_7_DELETING);
            this.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB, true); // On force, bien que le current_state soit >= 14 à ce stade. On vient de supprimer les tags au dessus mais on est en lock current state.
            return false;
        }

        this.var_dag = null;

        if (!dag.nodes[this.var_data.index]) {
            ConsoleHandler.warn('VarDAGNode.unlinkFromDAG:' + this.var_data.index + ':not in dag.nodes !');
            return false;
        }

        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
            ConsoleHandler.log(
                'VarDAGNode.unlinkFromDAG:' + this.var_data.index +
                ':delete dag.nodes[this.var_data.index]');
        }

        delete dag.nodes[this.var_data.index];
        delete VarDAGNode.getInstance_semaphores[dag.uid][this.var_data.index];
        dag.nb_nodes--;
        if (this.current_step != null) {
            const current_step_tag_name: string = VarDAGNode.ORDERED_STEP_TAGS_NAMES[this.current_step];
            if (dag.current_step_tags[current_step_tag_name]) {
                delete dag.current_step_tags[current_step_tag_name][this.var_data.index];
            }
        }
        for (const i in dag.tags) {
            if (dag.tags[i][this.var_data.index]) {
                delete dag.tags[i][this.var_data.index];
            }
        }

        let keys = Object.keys(this.incoming_deps);
        for (const i in keys) {
            const deps = this.incoming_deps[keys[i]];

            for (const j in deps) {
                const incoming_dep = deps[j];

                if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                    ConsoleHandler.log(
                        'VarDAGNode.unlinkFromDAG:' + this.var_data.index +
                        ':incoming_dep:' + incoming_dep.dep_name +
                        ':incoming_node:' + (incoming_dep.incoming_node as VarDAGNode).var_data.index);
                }

                if (incoming_dep?.incoming_node?.outgoing_deps) {
                    delete incoming_dep.incoming_node.outgoing_deps[incoming_dep.dep_name];
                }

                if (!ObjectHandler.hasAtLeastOneAttribute(incoming_dep.incoming_node.outgoing_deps)) {
                    dag.leafs[(incoming_dep.incoming_node as VarDAGNode).var_data.index] = incoming_dep.incoming_node as VarDAGNode;
                }
            }
        }

        keys = Object.keys(this.outgoing_deps);
        for (const i in keys) {
            const outgoing_dep = this.outgoing_deps[keys[i]];

            const incoming_deps = outgoing_dep?.outgoing_node?.incoming_deps ? outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name] : null;
            for (const j in incoming_deps) {
                const incoming_dep = incoming_deps[j];

                if (incoming_dep == outgoing_dep) {

                    if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                        ConsoleHandler.log(
                            'VarDAGNode.unlinkFromDAG:' + this.var_data.index +
                            ':outgoing_dep:' + outgoing_dep.dep_name +
                            ':outgoing_node:' + (outgoing_dep.outgoing_node as VarDAGNode).var_data.index);
                    }

                    incoming_deps.splice(parseInt(j.toString()), 1);
                    break;
                }
            }

            if (!incoming_deps?.length) {
                delete outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];
            }

            if (!ObjectHandler.hasAtLeastOneAttribute(outgoing_dep.outgoing_node.incoming_deps)) {
                dag.roots[(outgoing_dep.outgoing_node as VarDAGNode).var_data.index] = outgoing_dep.outgoing_node as VarDAGNode;
            }
        }
        delete this.incoming_deps;
        delete this.outgoing_deps;

        if (dag.leafs[this.var_data.index]) {
            delete dag.leafs[this.var_data.index];
        }
        if (dag.roots[this.var_data.index]) {
            delete dag.roots[this.var_data.index];
        }

        // Gestion du perf report
        if (EventsController.current_perf_report && EventsController.activate_module_perf_var_dag_nodes) {
            if (!EventsController.current_perf_report.perf_datas[this.var_data.index]) {
                EventsController.current_perf_report.perf_datas[this.var_data.index] = {
                    event_name: "-",
                    listener_name: this.var_data.index,
                    calls: [],
                    cooldowns: [],
                    events: [],
                };
            }

            const end = Dates.now_ms();
            EventsController.current_perf_report.perf_datas[this.var_data.index].events.push({
                ts: end,
                description: "unlink",
            });
            EventsController.current_perf_report.perf_datas[this.var_data.index].calls.push({
                start: this.linked_at,
                end: end,
                description: "from link to unlink",
            });
        }

        this.linked_at = null;

        return true;
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    public linkToDAG(): VarDAGNode {

        if (this.var_dag.nodes[this.var_data.index]) {
            return this.var_dag.nodes[this.var_data.index];
        }

        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
            ConsoleHandler.log('VarDAGNode.linkToDAG:' + this.var_data.index);
        }

        this.var_dag.nodes[this.var_data.index] = this;
        this.var_dag.nb_nodes++;

        this.var_dag.leafs[this.var_data.index] = this;
        this.var_dag.roots[this.var_data.index] = this;

        if (!this.linked_at) {
            this.linked_at = Dates.now_ms();
        }

        // Gestion du perf report
        if (EventsController.current_perf_report && EventsController.activate_module_perf_var_dag_nodes) {
            if (!EventsController.current_perf_report.perf_datas[this.var_data.index]) {
                EventsController.current_perf_report.perf_datas[this.var_data.index] = {
                    event_name: "-",
                    listener_name: this.var_data.index,
                    calls: [],
                    cooldowns: [],
                    events: [],
                };
            }

            EventsController.current_perf_report.perf_datas[this.var_data.index].events.push({
                ts: this.linked_at,
                description: "link",
            });
        }

        return this;
    }

    public update_parent_is_computable_if_needed() {

        // On impacte le tag sur les parents si tous leurs enfants sont computed
        for (const i in this.incoming_deps) {
            const deps = this.incoming_deps[i];

            for (const k in deps) {
                const dep = deps[k];
                const node = dep.incoming_node as VarDAGNode;
                UpdateIsComputableVarDAGNode.throttle_update_is_computable_var_dag_node({ [node.var_data.index]: node });
            }
        }
    }

    private update_current_step_tag() {

        if (this._lock_current_step) {
            return;
        }

        let updated_current_step: number = null;
        let updated_current_step_tag_name: string = null;
        const current_step_tag_name: string = VarDAGNode.ORDERED_STEP_TAGS_NAMES[this.current_step];

        for (const i in VarDAGNode.ORDERED_STEP_TAGS_NAMES) {
            const step_tag_name = VarDAGNode.ORDERED_STEP_TAGS_NAMES[i];
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
                if (this.var_dag.current_step_tags[current_step_tag_name]) {
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

        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
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

        // Gestion du perf report
        if (EventsController.current_perf_report && EventsController.activate_module_perf_var_dag_nodes) {
            if (!EventsController.current_perf_report.perf_datas[this.var_data.index]) {
                EventsController.current_perf_report.perf_datas[this.var_data.index] = {
                    event_name: "-",
                    listener_name: this.var_data.index,
                    calls: [],
                    cooldowns: [],
                    events: [],
                };
            }

            const end = Dates.now_ms();
            EventsController.current_perf_report.perf_datas[this.var_data.index].events.push({
                ts: end,
                description: "change current step to " + VarDAGNode.ORDERED_STEP_TAGS_NAMES[this.current_step] + " (" + this.current_step + ")",
            });
        }

        if (this.current_step == null) {
            return;
        }

        if ((this.current_step == VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_3_DATA_LOADED]) && this.is_computable) {


            if (this.tags[VarDAGNode.TAG_4_COMPUTED]) {
                if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                    ConsoleHandler.log('VarDAGNode.onchange_current_step:current_step == VarDAGNode.TAG_3_DATA_LOADED && is_computable:' + this.var_data.index + ' && already TAG_4_COMPUTED: removing TAG_3_DATA_LOADED');
                }
            } else {
                if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                    ConsoleHandler.log('VarDAGNode.onchange_current_step:current_step == VarDAGNode.TAG_3_DATA_LOADED && is_computable:' + this.var_data.index + ':TAG_4_IS_COMPUTABLE');
                }
                this.add_tag(VarDAGNode.TAG_4_IS_COMPUTABLE);
            }

            if (this.tags[VarDAGNode.TAG_3_DATA_LOADED]) {
                this.remove_tag(VarDAGNode.TAG_3_DATA_LOADED);
            }
        }

        if ((this.current_step == VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_6_UPDATED_IN_DB]) && this.is_deletable) {

            if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                ConsoleHandler.log('VarDAGNode.onchange_current_step:current_step == VarDAGNode.TAG_6_UPDATED_IN_DB && is_deletable:' + this.var_data.index + ':TAG_7_IS_DELETABLE');
            }

            this.add_tag(VarDAGNode.TAG_7_IS_DELETABLE);
            this.remove_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
        }

        if (this.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_COMPUTED]) {
            // On impacte les parents sur un potentiel is_computable
            this.update_parent_is_computable_if_needed();
        }

        /**
         * On ajoute la logique de déclenchement des processes si on est sur un TAG_IN, et pas dans un hole
         */
        const current_step_name = VarDAGNode.ORDERED_STEP_TAGS_NAMES[this.current_step];
        if (VarsProcessBase.registered_processes_work_event_name_by_tag_in[current_step_name]) {
            if (!VarsComputationHole.currently_in_a_hole_semaphore) {
                EventsController.emit_event(EventifyEventInstanceVO.new_event(VarsProcessBase.registered_processes_work_event_name_by_tag_in[current_step_name]));
            } else {
                VarsComputationHole.events_to_emit_post_hole[VarsProcessBase.registered_processes_work_event_name_by_tag_in[current_step_name]] = true;
            }
        }
    }
}
