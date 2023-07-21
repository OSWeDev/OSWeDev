import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../shared/modules/Stats/StatsController';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import DAOServerController from '../DAO/DAOServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';
import CurrentVarDAGHolder from './CurrentVarDAGHolder';
import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsClientsSubsCacheHolder from './bgthreads/processes/VarsClientsSubsCacheHolder';
import VarsClientsSubsCacheManager from './bgthreads/processes/VarsClientsSubsCacheManager';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';

/**
 * On gère le buffer des mises à jour de vos en lien avec des vars pour invalider au plus vite les vars en cache en cas de modification d'un VO
 *  tout en empilant quelques centaines d'updates à la fois, pour ne pas invalider 100 fois les mêmes params, cette étape est coûteuse
 *  on sépare en revanche les vos par type_id et par type de modification (si on modifie 3 fois un vo on veut toutes les modifications pour l'invalidation donc on ignore rien par contre)
 */
export default class VarsDatasVoUpdateHandler {

    public static VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.ordered_vos_cud';
    public static VarsDatasVoUpdateHandler_block_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.block_ordered_vos_cud';
    public static delete_instead_of_invalidating_unregistered_var_datas_PARAM_NAME = 'VarsDatasVoUpdateHandler.delete_instead_of_invalidating_unregistered_var_datas';

    public static TASK_NAME_has_vos_cud_or_intersectors: string = 'VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors';
    public static TASK_NAME_push_invalidators: string = 'VarsDatasVoUpdateHandler.push_invalidators';
    public static TASK_NAME_register_vo_cud = 'VarsDatasVoUpdateHandler.register_vo_cud';
    // public static TASK_NAME_filter_varsdatas_cache_by_matroids_intersection: string = 'VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_matroids_intersection';
    // public static TASK_NAME_filter_varsdatas_cache_by_exact_matroids: string = 'VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_exact_matroids';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller needs to be running in the var calculation bg thread
     */
    public static ordered_vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase> = [];
    public static last_call_handled_something: boolean = false;

    public static register_vo_cud = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(VarsDatasVoUpdateHandler.register_vo_cud_throttled.bind(this), 100, { leading: true, trailing: true });

    /**
     * La liste des invalidations en attente de traitement
     */
    public static invalidators: VarDataInvalidatorVO[] = [];

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, VarsDatasVoUpdateHandler.register_vo_cud.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsDatasVoUpdateHandler.TASK_NAME_has_vos_cud_or_intersectors, VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors.bind(this));
        // ForkedTasksController.register_task(VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_matroids_intersection, VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_matroids_intersection.bind(this));
        // ForkedTasksController.register_task(VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids, VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_exact_matroids.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsDatasVoUpdateHandler.TASK_NAME_push_invalidators, VarsDatasVoUpdateHandler.push_invalidators.bind(this));
    }

    // /**
    //  * Demander l'invalidation par intersecteurs (mais sans remonter l'arbre)
    //  * @param invalidate_intersectors
    //  * @returns
    //  */
    // public static async push_invalidate_intersectors(invalidate_intersectors: VarDataBaseVO[]): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             reject,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_intersectors,
    //             resolve,
    //             invalidate_intersectors)) {
    //             return;
    //         }

    //         VarsDatasVoUpdateHandler.throttle_push_invalidate_intersectors(invalidate_intersectors);
    //         resolve();
    //     });
    // }

    // /**
    //  * Demander l'invalidation de matroids exacts (mais sans remonter l'arbre)
    //  * @param invalidate_matroids
    //  * @returns
    //  */
    // public static async push_invalidate_matroids(invalidate_matroids: VarDataBaseVO[]): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             reject,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_matroids,
    //             resolve,
    //             invalidate_matroids)) {
    //             return;
    //         }

    //         VarsDatasVoUpdateHandler.throttle_push_invalidate_matroids(invalidate_matroids);
    //         resolve();
    //     });
    // }

    /**
     * Demander une ou des invalidations
     * @param invalidators
     * @returns
     */
    public static async push_invalidators(invalidators: VarDataInvalidatorVO[]): Promise<void> {

        if ((!invalidators) || (!invalidators.length)) {
            return;
        }

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsDatasVoUpdateHandler.TASK_NAME_push_invalidators,
                resolve,
                invalidators)) {
                return;
            }

            VarsDatasVoUpdateHandler.throttle_push_invalidators(invalidators);
            resolve();
        });
    }

    /**
     * Objectif on bloque le ModuleDAO en modification, et on informe via notif quand on a à la fois bloqué les updates et vidé le cache de ce module
     */
    public static async force_empty_vars_datas_vo_update_cache() {

        DAOServerController.GLOBAL_UPDATE_BLOCKER = true;
        let max_sleeps = 100;

        while (true) {

            if ((!VarsDatasVoUpdateHandler.ordered_vos_cud) ||
                (!VarsDatasVoUpdateHandler.ordered_vos_cud.length)) {

                let uid: number = StackContext.get('UID');
                let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
                if (uid) {
                    await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'force_empty_vars_datas_vo_update_cache.done', true);
                }
                ConsoleHandler.warn("Cache des modifications de VO vidé. Prêt pour le redémarrage");
                return;
            }
            await ThreadHandler.sleep(5000, 'VarsDatasVoUpdateHandler.force_empty_vars_datas_vo_update_cache');
            max_sleeps--;
            if (max_sleeps <= 0) {
                throw new Error('Unable to force_empty_vars_datas_vo_update_cache');
            }
        }
    }

    /**
     * On passe en param le nombre max de cud qu'on veut gérer, et on dépile en FIFO
     * @returns true si on a des invalidations trop récentes et qu'on veut donc éviter de calculer des vars
     */
    public static async handle_buffer(): Promise<boolean> {

        VarsDatasVoUpdateHandler.last_call_handled_something = false;

        if (!VarsDatasVoUpdateHandler.has_retrieved_vos_cud) {
            VarsDatasVoUpdateHandler.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValueAsString(
                VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

            VarsDatasVoUpdateHandler.has_retrieved_vos_cud = true;
        }

        if ((!VarsDatasVoUpdateHandler.ordered_vos_cud) || (!VarsDatasVoUpdateHandler.ordered_vos_cud.length)) {
            return false;
        }

        // if ((!VarsDatasVoUpdateHandler.ordered_vos_cud) || (!VarsDatasVoUpdateHandler.ordered_vos_cud.length)) {

        //     VarsDatasVoUpdateHandler.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValueAsString(
        //         VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

        //     return false; // je vois pas pourquoi .... VarsDatasVoUpdateHandler.last_registration && Dates.now() .add(-500, 'ms').isBefore(VarsDatasVoUpdateHandler.last_registration);
        // }

        VarsDatasVoUpdateHandler.last_call_handled_something = true;

        // On throttle en amont donc je pense que ce n'est plus utile et qu'on perd facilement une seconde pour rien ici
        // // Si on a des modifs en cours, on refuse de dépiler de suite pour éviter de faire des calculs en boucle
        // // Sauf si on a trop de demandes déjà en attente dans ce cas on commence à dépiler pour alléger la mémoire
        // if ((VarsDatasVoUpdateHandler.ordered_vos_cud.length < 1000) && VarsDatasVoUpdateHandler.last_registration && ((Dates.now() - 1) < VarsDatasVoUpdateHandler.last_registration)) {
        //     return true;
        // }

        // Si on met la limit à ordered_vos_cud.length c'est qu'elle sert à rien ...
        // let limit = VarsDatasVoUpdateHandler.ordered_vos_cud.length;

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

        VarsDatasVoUpdateHandler.prepare_updates(vos_update_buffer, vos_create_or_delete_buffer, vo_types);

        let intersectors_by_index: { [index: string]: VarDataBaseVO } = await VarsDatasVoUpdateHandler.init_leaf_intersectors(vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        let solved_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO } = {};

        if ((!intersectors_by_index) || (!ObjectHandler.hasAtLeastOneAttribute(intersectors_by_index))) {
            return false;
        }

        StatsController.register_stat_COMPTEUR('VarsDatasVoUpdateHandler', 'handle_buffer', 'invalidate_datas_and_parents');
        StatsController.register_stat_QUANTITE('VarsDatasVoUpdateHandler', 'handle_buffer', 'invalidate_datas_and_parents', Object.keys(intersectors_by_index).length);
        let time_in = Dates.now_ms();

        let max = ConfigurationService.node_configuration ? Math.max(ConfigurationService.node_configuration.MAX_POOL / 2, 1) : 10;
        let promise_pipeline = new PromisePipeline(max);
        for (let i in intersectors_by_index) {
            let intersector = intersectors_by_index[i];

            await promise_pipeline.push(async () => {
                await VarsDatasVoUpdateHandler.invalidate_datas_and_parents(
                    new VarDataInvalidatorVO(intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, true, false, false),
                    solved_invalidators_by_index);
            });
        }

        await promise_pipeline.end();

        let time_out = Dates.now_ms();
        StatsController.register_stat_DUREE('VarsDatasVoUpdateHandler', 'handle_buffer', 'invalidate_datas_and_parents', time_out - time_in);

        await VarsDatasVoUpdateHandler.push_invalidators(Object.values(solved_invalidators_by_index));

        // On met à jour le param en base pour refléter les modifs qui restent en attente de traitement
        VarsDatasVoUpdateHandler.throttled_update_param();

        // Si on continue d'invalider des Vos on attend sagement avant de relancer les calculs
        return (!!VarsDatasVoUpdateHandler.ordered_vos_cud) && (VarsDatasVoUpdateHandler.ordered_vos_cud.length > 0);
    }

    /**
     * Opti de suppression des vars, sans triggers !
     *  WARN ça signifie que les triggers sur suppression de vardata sont interdits à ce stade
     *  !! Ne peut être utilisé safe que par handle_invalidation
     */
    public static async delete_vars_pack_without_triggers(vars_to_delete: VarDataBaseVO[]) {

        // on regroupe par type de var
        let varindexes_by_api_type_id: { [api_type_id: string]: string[] } = {};

        for (let i in vars_to_delete) {
            let var_to_delete = vars_to_delete[i];

            if (!varindexes_by_api_type_id[var_to_delete._type]) {
                varindexes_by_api_type_id[var_to_delete._type] = [];
            }

            varindexes_by_api_type_id[var_to_delete._type].push(var_to_delete.index);
        }

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));
        let promise_pipeline = new PromisePipeline(max);

        for (let api_type_id in varindexes_by_api_type_id) {
            let indexes = varindexes_by_api_type_id[api_type_id];

            if ((!indexes) || (!indexes.length)) {
                continue;
            }

            await promise_pipeline.push(async () => {
                let moduleTable = VOsTypesManager.moduleTables_by_voType[api_type_id];
                let request = "DELETE FROM " + moduleTable.full_name + " WHERE _bdd_only_index in ('" + indexes.join("','") + "');";
                await ModuleDAOServer.getInstance().query(request);
            });
        }

        await promise_pipeline.end();
    }

    /**
     * Update : Changement de méthode. On arrête de vouloir résoudre par niveau dans l'arbre des deps,
     *  et on résoud simplement intersecteur par intersecteur. Donc on commence par identifier les intersecteurs (ensemble E)
     *  déduis des vos, puis pour chacun (e) :
     *      - On invalide les vars en appliquant e,
     *      - On ajoute e dans F ensemble des intersecteurs résolus
     *      - On charge les intersecteurs (E') déduis par dépendance à cet intersecteur. Pour chacun (e') :
     *          - si e' dans E, on ignore
     *          - si e' dans F, on ignore
     *          - sinon on ajoute e' à E
     *      - On supprime e de E et on continue de dépiler
     * @param intersectors_by_index Ensemble E des intersecteurs en début de process, à dépiler
     */
    public static async invalidate_datas_and_parents(
        invalidator: VarDataInvalidatorVO,
        solved_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO }
    ) {

        let intersectors_by_index: { [index: string]: VarDataBaseVO } = {
            [invalidator.var_data.index]: invalidator.var_data
        };

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));

        while (ObjectHandler.hasAtLeastOneAttribute(intersectors_by_index)) {
            let promise_pipeline = new PromisePipeline(max);

            for (let i in intersectors_by_index) {
                let intersector = intersectors_by_index[i];

                if (DEBUG_VARS) {
                    ConsoleHandler.log('invalidate_datas_and_parents:START SOLVING:' + intersector.index + ':');
                }
                let conf_id = VarsDatasVoUpdateHandler.get_validator_config_id(invalidator, true, intersector.index);
                if (solved_invalidators_by_index[conf_id]) {
                    delete intersectors_by_index[i];
                    continue;
                }
                solved_invalidators_by_index[conf_id] = new VarDataInvalidatorVO(
                    intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false,
                    invalidator.invalidate_denied, invalidator.invalidate_imports);

                await promise_pipeline.push(async () => {

                    try {

                        let deps_intersectors = await VarsDatasVoUpdateHandler.get_deps_intersectors(intersector);

                        for (let j in deps_intersectors) {
                            let dep_intersector = deps_intersectors[j];

                            if (intersectors_by_index[dep_intersector.index]) {
                                continue;
                            }
                            let dep_intersector_conf_id = VarsDatasVoUpdateHandler.get_validator_config_id(invalidator, true, dep_intersector.index);
                            if (solved_invalidators_by_index[dep_intersector_conf_id]) {
                                continue;
                            }

                            if (DEBUG_VARS) {
                                ConsoleHandler.log('invalidate_datas_and_parents:' + intersector.index + '=>' + dep_intersector.index + ':');
                            }

                            intersectors_by_index[dep_intersector.index] = dep_intersector;
                        }

                        if (DEBUG_VARS) {
                            ConsoleHandler.log('invalidate_datas_and_parents:END SOLVING:' + intersector.index + ':');
                        }
                    } catch (error) {
                        ConsoleHandler.error('invalidate_datas_and_parents:FAILED:' + intersector.index + ':' + error);
                    }

                    delete intersectors_by_index[intersector.index];
                });
            }

            await promise_pipeline.end();
        }
    }

    public static async has_vos_cud_or_intersectors(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsDatasVoUpdateHandler.TASK_NAME_has_vos_cud_or_intersectors, resolve)) {
                return;
            }

            resolve((VarsDatasVoUpdateHandler.ordered_vos_cud && (VarsDatasVoUpdateHandler.ordered_vos_cud.length > 0)) ||
                (VarsDatasVoUpdateHandler.invalidators && (VarsDatasVoUpdateHandler.invalidators.length > 0)));
        });
    }

    public static async update_param() {

        await ModuleParams.getInstance().setParamValue(
            VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME,
            VarsDatasVoUpdateHandler.getJSONFrom_ordered_vos_cud());
    }

    /**
     * On doit faire une union sur les intersecteurs, mais ni sur les inclusions ni sur les exacts
     * Pour le moment on implémente pas les inclusions, qui n'ont pas une utilité évidente (on a pas d'interface pour faire ça pour le moment a priori en plus)
     */
    public static async handle_invalidators() {
        if ((!VarsDatasVoUpdateHandler.invalidators) || !VarsDatasVoUpdateHandler.invalidators.length) {
            return;
        }

        ConsoleHandler.log('handle_invalidators:IN:' + VarsDatasVoUpdateHandler.invalidators.length);
        let invalidators = VarsDatasVoUpdateHandler.invalidators;
        VarsDatasVoUpdateHandler.invalidators = [];

        // On fait l'union
        invalidators = this.union_invalidators(invalidators);

        /**
         * En // invalider en DB et dans l'arbre
         * Puis réinsérer dans l'arbre : les registers (clients et serveurs) + les vars pixel never delete qui ont été invalidées en db
         */
        let invalidated_pixels_never_delete: VarDataBaseVO[] = [];
        let promise_pipeline: PromisePipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_Vars_invalidators);

        for (let i in invalidators) {
            let invalidator = invalidators[i];

            await promise_pipeline.push(async () => {
                let this_invalidated_pixels_never_delete = await this.apply_invalidator_in_db(invalidator);
                if (this_invalidated_pixels_never_delete && this_invalidated_pixels_never_delete.length) {
                    invalidated_pixels_never_delete.push(...this_invalidated_pixels_never_delete);
                }
            });

            // Attention on ne doit pas unlink en //, sinon il faut semaphore comme le getInstance()
            this.apply_invalidator_in_tree(invalidator);
        }

        await promise_pipeline.end();

        // On réinsère les vars pixel never delete qui ont été invalidées en db
        if (invalidated_pixels_never_delete && invalidated_pixels_never_delete.length) {
            for (let i in invalidated_pixels_never_delete) {
                let invalidated_pixel_never_delete = invalidated_pixels_never_delete[i];

                VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(invalidated_pixel_never_delete.index), true);
            }
        }

        // On réinsère les registers (clients et serveurs)
        await VarsClientsSubsCacheManager.update_clients_subs_indexes_cache(true);
        // Server
        let subs: string[] = Object.keys(VarsServerCallBackSubsController.cb_subs);
        // Clients
        subs.push(...Object.keys(VarsClientsSubsCacheHolder.clients_subs_indexes_cache));

        for (let j in subs) {

            let index = subs[j];

            // On peut pas réinsérer tous les éléments registered, il faut qu'on réinsère uniquement ceux qui sont concernés par l'invalidation
            let registered_var = VarDataBaseVO.from_index(index);

            if (!registered_var) {
                continue;
            }

            let invalidated = false;
            for (let i in invalidators) {
                let invalidator = invalidators[i];

                switch (invalidator.invalidator_type) {
                    case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:
                        if (!MatroidController.matroid_intersects_matroid(registered_var, invalidator.var_data)) {
                            continue;
                        }
                        break;
                    case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                        if (registered_var.index != invalidator.var_data.index) {
                            continue;
                        }
                        break;
                }

                invalidated = true;
            }

            if (!invalidated) {
                continue;
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.handle_invalidators:REINSERT:' + index);
            }
            VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(index), true);
        }
    }


    private static last_registration: number = null;

    /**
     * le JSON ne devrait être utilisé que au lancement de l'appli, mais systématiquement par contre au lancement, le reste du temps c'est l'appli qui fait référence pour les voscud
     */
    private static has_retrieved_vos_cud: boolean = false;


    private static throttled_update_param = ThrottleHelper.getInstance().declare_throttle_without_args(VarsDatasVoUpdateHandler.update_param.bind(this), 30000, { leading: false, trailing: true });
    private static throttle_push_invalidators = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(VarsDatasVoUpdateHandler.throttled_push_invalidators.bind(this), 1000, { leading: false, trailing: true });


    /**
     * Pour l'union des invalidators, on peut union à condition d'avoir :
     *  - un var_id identique
     *  - une conf de types de var_data à supprimer identiques (donc denied / imports identiques)
     *
     * !! à ce stade on considère que le propagate est commun à tous ces invalidators
     */
    private static union_invalidators(invalidators: VarDataInvalidatorVO[]): VarDataInvalidatorVO[] {
        let union_invalidators: VarDataInvalidatorVO[] = [];

        /**
         * On commence par regrouper par confs de types de var_data à supprimer
         */
        let invalidators_by_conf: { [conf_id: string]: VarDataInvalidatorVO[] } = {};

        for (let i in invalidators) {
            let invalidator = invalidators[i];

            let conf_id = VarsDatasVoUpdateHandler.get_validator_config_id(invalidator);
            if (!invalidators_by_conf[conf_id]) {
                invalidators_by_conf[conf_id] = [];
            }
            invalidators_by_conf[conf_id].push(invalidator);
        }

        for (let conf_id in invalidators_by_conf) {
            let this_conf_invalidators = invalidators_by_conf[conf_id];

            if (this_conf_invalidators.length == 1) {
                union_invalidators.push(this_conf_invalidators[0]);
                continue;
            }

            /**
             * L'union est faite en sélectionnant le premier invalidator, et en union les var_datas.
             *  Le reste de la conf est sensé être identique par définition donc ça devrait marcher.
             */
            let kept_invalidator = this_conf_invalidators[0];
            let union_var_datas = MatroidController.union(this_conf_invalidators.map((invalidator) => invalidator.var_data));

            for (let i in union_var_datas) {
                let union_var_data = union_var_datas[i];
                let union_invalidator = new VarDataInvalidatorVO(union_var_data, kept_invalidator.invalidator_type, kept_invalidator.propagate_to_parents, kept_invalidator.invalidate_denied, kept_invalidator.invalidate_imports);
                union_invalidators.push(union_invalidator);
            }
        }

        return union_invalidators;
    }

    private static get_validator_config_id(
        invalidator: VarDataInvalidatorVO,
        include_index: boolean = false,
        index: string = null): string {

        return (invalidator && !!invalidator.var_data) ?
            invalidator.var_data.var_id + '_' + (invalidator.invalidate_denied ? '1' : '0') + '_' + (invalidator.invalidate_imports ? '1' : '0')
            + (include_index ? '_' + (index ? index : invalidator.var_data.index) : '') :
            null;
    }

    private static throttled_push_invalidators(invalidators: VarDataInvalidatorVO[]) {
        if ((!invalidators) || (!invalidators.length)) {
            return;
        }

        VarsDatasVoUpdateHandler.invalidators.push(...invalidators);
    }

    // /**
    //  * Se lance sur le thread des vars
    //  */
    // private static filter_varsdatas_cache_by_matroids_intersection(
    //     api_type_id: string,
    //     matroids: IMatroid[],
    //     fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<VarDataBaseVO[]> {

    //     return new Promise(async (resolve, reject) => {

    //         let thrower = (error) => {
    //             //TODO fixme do something to inform user
    //             ConsoleHandler.error('failed filter_varsdatas_cache_by_matroids_intersection' + error);
    //             resolve([]);
    //         };

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             thrower,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_matroids_intersection,
    //             resolve,
    //             api_type_id,
    //             matroids,
    //             fields_ids_mapper)) {
    //             return;
    //         }

    //         let res: VarDataBaseVO[] = [];

    //         for (let i in matroids) {
    //             res = res.concat(VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_matroid_intersection(api_type_id, matroids[i], fields_ids_mapper));
    //         }

    //         resolve(res);
    //     });
    // }

    // /**
    //  * Doit être lancé depuis le thread des vars
    //  */
    // private static filter_varsdatas_cache_by_matroid_intersection(
    //     api_type_id: string,
    //     matroid: IMatroid,
    //     fields_ids_mapper: { [matroid_field_id: string]: string }): VarDataBaseVO[] {

    //     let res: VarDataBaseVO[] = [];

    //     let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];
    //     let matroid_fields = MatroidController.getMatroidFields(matroid._type);

    //     if (!moduleTable) {
    //         return null;
    //     }

    //     for (let i in VarsDatasProxy.vars_datas_buffer_wrapped_indexes) {
    //         let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[i];

    //         if (wrapper.var_data._type != api_type_id) {
    //             continue;
    //         }

    //         if (!!(matroid as VarDataBaseVO).var_id) {

    //             if (wrapper.var_data.var_id != (matroid as VarDataBaseVO).var_id) {
    //                 continue;
    //             }
    //         }

    //         let isok = true;
    //         for (let j in matroid_fields) {
    //             let matroid_field = matroid_fields[j];

    //             let ranges: IRange[] = matroid[matroid_field.field_id];
    //             let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

    //             if (!RangeHandler.any_range_intersects_any_range(
    //                 wrapper.var_data[field.field_id],
    //                 ranges)) {
    //                 isok = false;
    //                 break;
    //             }
    //         }
    //         if (!isok) {
    //             continue;
    //         }

    //         res.push(wrapper.var_data);
    //     }

    //     return res;
    // }

    /**
     * On supprime les noeuds qui correspondent à l'invalidator
     * @param invalidator
     * @returns
     */
    private static apply_invalidator_in_tree(invalidator: VarDataInvalidatorVO) {
        let invalid_nodes: VarDAGNode[] = this.filter_varsdatas_cache_by_invalidator(invalidator);

        if (!invalid_nodes) {
            return;
        }

        for (let i in invalid_nodes) {
            let node = invalid_nodes[i];

            if (!node) {
                continue;
            }
            if (!node.var_dag) {
                continue;
            }

            /**
             * On doit tout invalider vers le haut aussi
             */
            let list_nodes = [];
            DAGController.visit_bottom_up_from_node(node, async (n: VarDAGNode) => {
                list_nodes.push(n);
            });

            for (let j in list_nodes) {

                list_nodes[j].unlinkFromDAG(true);
                if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                    ConsoleHandler.log('VarsDatasVoUpdateHandler.apply_invalidator_in_tree:UNLINKED:' + list_nodes[j].var_data.index);
                }
            }
        }
    }

    /**
     * Doit être lancé depuis le thread des vars
     */
    private static filter_varsdatas_cache_by_invalidator(invalidator: VarDataInvalidatorVO): VarDAGNode[] {

        if (!invalidator) {
            return null;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
            ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:' + invalidator.var_data.index + ':');
        }

        if (invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT) {

            let node: VarDAGNode = CurrentVarDAGHolder.current_vardag.nodes[invalidator.var_data.index];

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:EXACT:' + invalidator.var_data.index +
                    ':!!node:' + !!node + ':!!node.var_data:' + !!node.var_data + ':value_type:' + node.var_data.value_type +
                    ':invalidate_denied:' + invalidator.invalidate_denied + ':invalidate_imports:' + invalidator.invalidate_imports);
            }

            if (!node) {
                return null;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) && (!invalidator.invalidate_denied)) {
                return null;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!invalidator.invalidate_imports)) {
                return null;
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:EXACT:' + invalidator.var_data.index + ': INVALIDATED');
            }

            return [node];
        }

        let res: VarDAGNode[] = [];


        for (let i in CurrentVarDAGHolder.current_vardag.nodes) {
            let node: VarDAGNode = CurrentVarDAGHolder.current_vardag.nodes[i];

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:INTERSECTED:' + invalidator.var_data.index +
                    ':!!node:' + !!node + ':!!node.var_data:' + !!node.var_data + ':value_type:' + node.var_data.value_type +
                    ':node_index:' + node.var_data.index + ':node_var_id:' + node.var_data.var_id + ':invalidator_var_id:' + invalidator.var_data.var_id +
                    ':invalidate_denied:' + invalidator.invalidate_denied + ':invalidate_imports:' + invalidator.invalidate_imports);
            }

            if (node.var_data._type != invalidator.var_data._type) {
                continue;
            }

            if (node.var_data.var_id != invalidator.var_data.var_id) {
                continue;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) && (!invalidator.invalidate_denied)) {
                continue;
            }

            if ((node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!invalidator.invalidate_imports)) {
                continue;
            }

            if ((invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED) && !MatroidController.matroid_intersects_matroid(node.var_data, invalidator.var_data)) {
                continue;
            }

            if (invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT) {
                throw new Error('Not Implemented');
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_INVALIDATION) {
                ConsoleHandler.log('VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_invalidator:INTERSECTED:' + invalidator.var_data.index +
                    ':node_index:' + node.var_data.index + ': INVALIDATED');
            }

            res.push(node);
        }

        return res;
    }

    // /**
    //  * Se lance sur le thread des vars
    //  */
    // private static filter_varsdatas_cache_by_exact_matroids(
    //     matroids: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {

    //     return new Promise(async (resolve, reject) => {

    //         let thrower = (error) => {
    //             //TODO fixme do something to inform user
    //             ConsoleHandler.error('failed filter_varsdatas_cache_by_exact_matroids' + error);
    //             resolve([]);
    //         };

    //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
    //             thrower,
    //             VarsBGThreadNameHolder.bgthread_name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids,
    //             resolve,
    //             matroids)) {
    //             return;
    //         }

    //         let res: VarDataBaseVO[] = [];

    //         for (let i in matroids) {
    //             let param = VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_exact_matroid(matroids[i]);
    //             if (!!param) {
    //                 res.push(param);
    //             }
    //         }

    //         resolve(res);
    //     });
    // }

    // /**
    //  * Doit être lancé depuis le thread des vars
    //  */
    // private static filter_varsdatas_cache_by_exact_matroid(matroid: VarDataBaseVO): VarDataBaseVO {
    //     let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[matroid.index];

    //     return wrapper ? wrapper.var_data : null;
    // }

    /**
     * On supprime les noeuds qui correspondent à l'invalidator en DB
     * Cas spécifique des vars pixels never delete : on doit d'abord charger avant de les supprimer et on retourne les vars chargées
     * @param invalidator
     */
    private static async apply_invalidator_in_db(invalidator: VarDataInvalidatorVO): Promise<VarDataBaseVO[]> {

        let pixels_never_delete = [];
        let controller = VarsController.var_conf_by_id[invalidator.var_data.var_id];

        if (controller.pixel_activated && controller.pixel_never_delete) {
            pixels_never_delete = await VarsDatasVoUpdateHandler.load_invalidateds_from_bdd(invalidator);
        }

        await VarsDatasVoUpdateHandler.delete_var_by_intersectors_without_triggers(controller.var_data_vo_type, invalidator);

        return pixels_never_delete;
    }

    /**
     * On charge depuis la bdd en fonction des types de datas recherchées. En revanche on doit déjà cibler un seul api_type_id
     */
    private static async load_invalidateds_from_bdd(invalidator: VarDataInvalidatorVO): Promise<VarDataBaseVO[]> {

        let var_data = invalidator.var_data;
        let query_ = query(var_data._type);

        switch (invalidator.invalidator_type) {
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                query_.filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, var_data.index);
                break;
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT:
                throw new Error('Not Implemented');
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:

                query_.filter_by_num_eq(field_names<VarDataBaseVO>().var_id, var_data.var_id);
                let matroid_fields = MatroidController.getMatroidFields(var_data._type);
                for (let j in matroid_fields) {
                    let matroid_field = matroid_fields[j];
                    query_.filter_by_num_x_ranges(matroid_field.field_id, var_data[matroid_field.field_id]);
                }
                break;
        }

        let valid_types = [RangeHandler.create_single_elt_NumRange(VarDataBaseVO.VALUE_TYPE_COMPUTED, NumSegment.TYPE_INT)];
        if (invalidator.invalidate_denied) {
            valid_types.push(RangeHandler.create_single_elt_NumRange(VarDataBaseVO.VALUE_TYPE_DENIED, NumSegment.TYPE_INT));
        }
        if (invalidator.invalidate_imports) {
            valid_types.push(RangeHandler.create_single_elt_NumRange(VarDataBaseVO.VALUE_TYPE_IMPORT, NumSegment.TYPE_INT));
        }

        query_.filter_by_num_x_ranges(field_names<VarDataBaseVO>().value_type, valid_types);

        return await query_.select_vos<VarDataBaseVO>();
    }


    /**
     * Opti de suppression des vars, sans triggers !
     *  WARN ça signifie que les triggers sur suppression de vardata sont interdits à ce stade
     *  !! Ne peut être utilisé safe que par handle_invalidation
     */
    private static async delete_var_by_intersectors_without_triggers(api_type_id: string, invalidator: VarDataInvalidatorVO) {

        switch (invalidator.invalidator_type) {
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:
                await VarsDatasVoUpdateHandler.delete_var_by_intersected_without_triggers(api_type_id, invalidator);
                break;
            case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                await VarsDatasVoUpdateHandler.delete_var_by_exact_without_triggers(api_type_id, invalidator);
                break;
            default:
                ConsoleHandler.error('invalidator_type not implemented: ' + invalidator.invalidator_type);
                break;
        }
    }

    private static async delete_var_by_intersected_without_triggers(api_type_id: string, invalidator: VarDataInvalidatorVO) {

        let moduleTable = VOsTypesManager.moduleTables_by_voType[api_type_id];
        let request = "DELETE FROM " + moduleTable.full_name + " WHERE " + ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(api_type_id, invalidator.var_data, null) + ";";
        await ModuleDAOServer.getInstance().query(request);
    }

    private static async delete_var_by_exact_without_triggers(api_type_id: string, invalidator: VarDataInvalidatorVO) {

        let moduleTable = VOsTypesManager.moduleTables_by_voType[api_type_id];
        let request = "DELETE FROM " + moduleTable.full_name + " WHERE _bdd_only_index = '" + invalidator.var_data.index + "';";
        await ModuleDAOServer.getInstance().query(request);
    }

    private static async get_deps_intersectors(intersector: VarDataBaseVO): Promise<{ [index: string]: VarDataBaseVO }> {
        let res: { [index: string]: VarDataBaseVO } = {};

        let node = VarsServerController.varcontrollers_dag.nodes[intersector.var_id];

        for (let j in node.incoming_deps) {
            let deps = node.incoming_deps[j];

            for (let i in deps) {
                let dep = deps[i];

                let controller = (dep.incoming_node as VarCtrlDAGNode).var_controller;

                let tmp = await controller.get_invalid_params_intersectors_from_dep_stats_wrapper(dep.dep_name, [intersector]);
                if (tmp && tmp.length) {
                    tmp.forEach((e) => res[e.index] = e);
                }
            }
        }

        return res;
    }

    /**
     * Pour chaque vo_type, on prend tous les varcontrollers concernés et on demande les intersecteurs en CD et en U
     */
    private static async init_leaf_intersectors(
        vo_types: string[],
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] }): Promise<{ [index: string]: VarDataBaseVO }> {

        let intersectors_by_index: { [index: string]: VarDataBaseVO } = {};

        // let vardag = new VarDAG();
        // for (let i in vo_types) {
        //     let vo_type = vo_types[i];

        //     let vos = vos_create_or_delete_buffer[vo_type].concat(
        //         vos_update_buffer[vo_type].map((e) => e.pre_update_vo),
        //         vos_update_buffer[vo_type].map((e) => e.post_update_vo));
        // }

        for (let i in vo_types) {
            let vo_type = vo_types[i];

            for (let j in VarsServerController.registered_vars_controller_by_api_type_id[vo_type]) {
                let var_controller = VarsServerController.registered_vars_controller_by_api_type_id[vo_type][j];

                if ((!!vos_create_or_delete_buffer[vo_type]) && vos_create_or_delete_buffer[vo_type].length) {

                    if (ConfigurationService.node_configuration && ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log(
                            'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_C_POST_D_group:' +
                            var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vos_create_or_delete_buffer[vo_type].length);
                    }

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_C_POST_D_group_stats_wrapper(vos_create_or_delete_buffer[vo_type]);
                    if (tmp && !!tmp.length) {
                        tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                    }
                }

                if ((!!vos_update_buffer[vo_type]) && vos_update_buffer[vo_type].length) {

                    if (ConfigurationService.node_configuration && ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log(
                            'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_U_group:' +
                            var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vos_update_buffer[vo_type].length);
                    }

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_U_group_stats_wrapper(vos_update_buffer[vo_type]);
                    if (tmp && !!tmp.length) {
                        tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                    }
                }
            }
        }

        return intersectors_by_index;
    }

    /**
     * Préparation du batch d'invalidation des vars suite à des CUD de vos
     * @param vos_update_buffer les updates par type à remplir
     * @param vos_create_or_delete_buffer les creates / deletes par type à remplir
     * @param vo_types la liste des vo_types à remplir
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon (et donc le buffer est vide)
     */
    private static prepare_updates(
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        vo_types: string[]) {

        let start_time = Dates.now();
        let real_start_time = start_time;
        let last_log_time = start_time;

        if (VarsDatasVoUpdateHandler.ordered_vos_cud && VarsDatasVoUpdateHandler.ordered_vos_cud.length) {
            ConsoleHandler.log('VarsDatasVoUpdateHandler:prepare_updates:IN :ordered_vos_cud length:' + VarsDatasVoUpdateHandler.ordered_vos_cud.length);
        }

        while (VarsDatasVoUpdateHandler.ordered_vos_cud && VarsDatasVoUpdateHandler.ordered_vos_cud.length) {


            let actual_time = Dates.now();

            if ((actual_time - last_log_time) >= 10) {
                ConsoleHandler.warn('VarsDatasVoUpdateHandler:prepare_updates:---:ordered_vos_cud length:' + VarsDatasVoUpdateHandler.ordered_vos_cud.length);
                last_log_time = actual_time;
            }

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.error('VarsDatasVoUpdateHandler:prepare_updates:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            let vo_cud = VarsDatasVoUpdateHandler.ordered_vos_cud.shift();

            // Si on a un champ _type, on est sur un VO, sinon c'est un update
            if (!!vo_cud['_type']) {
                if (!vos_create_or_delete_buffer[vo_cud['_type']]) {

                    vo_types.push(vo_cud['_type']);
                    vos_create_or_delete_buffer[vo_cud['_type']] = [];
                }
                vos_create_or_delete_buffer[vo_cud['_type']].push(vo_cud as IDistantVOBase);
            } else {
                let update_holder: DAOUpdateVOHolder<IDistantVOBase> = vo_cud as DAOUpdateVOHolder<IDistantVOBase>;
                if (!vos_update_buffer[update_holder.post_update_vo._type]) {
                    if (!vos_create_or_delete_buffer[update_holder.post_update_vo._type]) {
                        vo_types.push(update_holder.post_update_vo._type);
                    }

                    vos_update_buffer[update_holder.post_update_vo._type] = [];
                }
                vos_update_buffer[update_holder.post_update_vo._type].push(update_holder);
            }
        }

        ConsoleHandler.log('VarsDatasVoUpdateHandler:prepare_updates:OUT:ordered_vos_cud length:' + VarsDatasVoUpdateHandler.ordered_vos_cud.length);
    }

    private static getJSONFrom_ordered_vos_cud(): string {
        let res: any[] = [];

        for (let i in VarsDatasVoUpdateHandler.ordered_vos_cud) {
            let vo_cud = VarsDatasVoUpdateHandler.ordered_vos_cud[i];

            if (!!vo_cud['_type']) {
                let tmp = APIControllerWrapper.try_translate_vo_to_api(vo_cud);
                res.push(tmp);
            } else {
                let tmp = new DAOUpdateVOHolder<IDistantVOBase>(
                    APIControllerWrapper.try_translate_vo_to_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).pre_update_vo),
                    APIControllerWrapper.try_translate_vo_to_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).post_update_vo)
                );
                res.push(tmp);
            }
        }

        return JSON.stringify(res);
    }

    private static set_ordered_vos_cud_from_JSON(jsoned: string): void {

        try {

            let res: any[] = JSON.parse(jsoned);

            for (let i in res) {
                let vo_cud = res[i];

                if (!!vo_cud['_type']) {
                    let tmp = APIControllerWrapper.try_translate_vo_from_api(vo_cud);
                    VarsDatasVoUpdateHandler.ordered_vos_cud.push(tmp);
                } else {
                    let tmp = new DAOUpdateVOHolder<IDistantVOBase>(
                        APIControllerWrapper.try_translate_vo_from_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).pre_update_vo),
                        APIControllerWrapper.try_translate_vo_from_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).post_update_vo)
                    );
                    res.push(tmp);
                }
            }
        } catch (error) {
            ConsoleHandler.error('Impossible de recharger le ordered_vos_cud from params :' + jsoned + ':');
        }
    }

    private static async register_vo_cud_throttled(vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase>) {

        if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, vos_cud)) {
            return;
        }

        let block_ordered_vos_cud: boolean = await ModuleParams.getInstance().getParamValueAsBoolean(
            VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_block_ordered_vos_cud_PARAM_NAME,
            false,
            180000, // 3 minutes
        );

        if (block_ordered_vos_cud) {
            return;
        }

        VarsDatasVoUpdateHandler.ordered_vos_cud = VarsDatasVoUpdateHandler.ordered_vos_cud.concat(vos_cud);
        VarsDatasVoUpdateHandler.last_registration = Dates.now();

        VarsDatasVoUpdateHandler.throttled_update_param();
    }
}