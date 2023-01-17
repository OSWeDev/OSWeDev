import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import PixelVarDataController from './PixelVarDataController';
import VarsDatasProxy from './VarsDatasProxy';
import VarServerControllerBase from './VarServerControllerBase';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

/**
 * On gère le buffer des mises à jour de vos en lien avec des vars pour invalider au plus vite les vars en cache en cas de modification d'un VO
 *  tout en empilant quelques centaines d'updates à la fois, pour ne pas invalider 100 fois les mêmes params, cette étape est coûteuse
 *  on sépare en revanche les vos par type_id et par type de modification (si on modifie 3 fois un vo on veut toutes les modifications pour l'invalidation donc on ignore rien par contre)
 */
export default class VarsDatasVoUpdateHandler {

    public static VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.ordered_vos_cud';
    public static VarsDatasVoUpdateHandler_block_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.block_ordered_vos_cud';
    public static delete_instead_of_invalidating_unregistered_var_datas_PARAM_NAME = 'VarsDatasVoUpdateHandler.delete_instead_of_invalidating_unregistered_var_datas';

    public static TASK_NAME_has_vos_cud: string = 'VarsDatasVoUpdateHandler.has_vos_cud';
    public static TASK_NAME_push_invalidators: string = 'VarsDatasVoUpdateHandler.push_invalidators';
    public static TASK_NAME_register_vo_cud = 'VarsDatasVoUpdateHandler.register_vo_cud';
    // public static TASK_NAME_filter_varsdatas_cache_by_matroids_intersection: string = 'VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_matroids_intersection';
    // public static TASK_NAME_filter_varsdatas_cache_by_exact_matroids: string = 'VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_exact_matroids';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller needs to be running in the var calculation bg thread
     */
    public static getInstance(): VarsDatasVoUpdateHandler {
        if (!VarsDatasVoUpdateHandler.instance) {
            VarsDatasVoUpdateHandler.instance = new VarsDatasVoUpdateHandler();
        }
        return VarsDatasVoUpdateHandler.instance;
    }

    private static instance: VarsDatasVoUpdateHandler = null;

    public ordered_vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase> = [];
    public last_call_handled_something: boolean = false;

    public register_vo_cud = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.register_vo_cud_throttled.bind(this), 100, { leading: true, trailing: true });

    private last_registration: number = null;

    /**
     * le JSON ne devrait être utilisé que au lancement de l'appli, mais systématiquement par contre au lancement, le reste du temps c'est l'appli qui fait référence pour les voscud
     */
    private has_retrieved_vos_cud: boolean = false;

    /**
     * La liste des invalidations en attente de traitement
     */
    private invalidators: VarDataInvalidatorVO[] = [];

    private throttled_update_param = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_param.bind(this), 30000, { leading: false, trailing: true });
    private throttle_push_invalidators = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.throttled_push_invalidators.bind(this), 1000, { leading: false, trailing: true });

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, this.register_vo_cud.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_has_vos_cud, this.has_vos_cud.bind(this));
        // ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_matroids_intersection, this.filter_varsdatas_cache_by_matroids_intersection.bind(this));
        // ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids, this.filter_varsdatas_cache_by_exact_matroids.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_push_invalidators, this.push_invalidators.bind(this));
    }

    // /**
    //  * Demander l'invalidation par intersecteurs (mais sans remonter l'arbre)
    //  * @param invalidate_intersectors
    //  * @returns
    //  */
    // public async push_invalidate_intersectors(invalidate_intersectors: VarDataBaseVO[]): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
    //             reject,
    //             VarsdatasComputerBGThread.getInstance().name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_intersectors,
    //             resolve,
    //             invalidate_intersectors)) {
    //             return;
    //         }

    //         this.throttle_push_invalidate_intersectors(invalidate_intersectors);
    //         resolve();
    //     });
    // }

    // /**
    //  * Demander l'invalidation de matroids exacts (mais sans remonter l'arbre)
    //  * @param invalidate_matroids
    //  * @returns
    //  */
    // public async push_invalidate_matroids(invalidate_matroids: VarDataBaseVO[]): Promise<void> {
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
    //             reject,
    //             VarsdatasComputerBGThread.getInstance().name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_matroids,
    //             resolve,
    //             invalidate_matroids)) {
    //             return;
    //         }

    //         this.throttle_push_invalidate_matroids(invalidate_matroids);
    //         resolve();
    //     });
    // }

    /**
     * Demander une ou des invalidations
     * @param invalidators
     * @returns
     */
    public async push_invalidators(invalidators: VarDataInvalidatorVO[]): Promise<void> {

        if ((!invalidators) || (!invalidators.length)) {
            return;
        }

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                reject,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasVoUpdateHandler.TASK_NAME_push_invalidators,
                resolve,
                invalidators)) {
                return;
            }

            this.throttle_push_invalidators(invalidators);
            resolve();
        });
    }

    /**
     * Objectif on bloque le ModuleDAO en modification, et on informe via notif quand on a à la fois bloqué les updates et vidé le cache de ce module
     */
    public async force_empty_vars_datas_vo_update_cache() {

        ModuleDAOServer.getInstance().global_update_blocker = true;
        let max_sleeps = 100;

        while (true) {

            if ((!VarsDatasVoUpdateHandler.getInstance().ordered_vos_cud) ||
                (!VarsDatasVoUpdateHandler.getInstance().ordered_vos_cud.length)) {

                let uid: number = StackContext.get('UID');
                let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');
                if (uid) {
                    await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'force_empty_vars_datas_vo_update_cache.done', true);
                }
                ConsoleHandler.warn("Cache des modifications de VO vidé. Prêt pour le redémarrage");
                return;
            }
            await ThreadHandler.sleep(5000);
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
    public async handle_buffer(): Promise<boolean> {

        this.last_call_handled_something = false;

        if (!this.has_retrieved_vos_cud) {
            this.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValueAsString(
                VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

            this.has_retrieved_vos_cud = true;
        }

        if ((!this.ordered_vos_cud) || (!this.ordered_vos_cud.length)) {
            return false;
        }

        // if ((!this.ordered_vos_cud) || (!this.ordered_vos_cud.length)) {

        //     this.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValueAsString(
        //         VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

        //     return false; // je vois pas pourquoi .... this.last_registration && Dates.now() .add(-500, 'ms').isBefore(this.last_registration);
        // }

        this.last_call_handled_something = true;

        // On throttle en amont donc je pense que ce n'est plus utile et qu'on perd facilement une seconde pour rien ici
        // // Si on a des modifs en cours, on refuse de dépiler de suite pour éviter de faire des calculs en boucle
        // // Sauf si on a trop de demandes déjà en attente dans ce cas on commence à dépiler pour alléger la mémoire
        // if ((this.ordered_vos_cud.length < 1000) && this.last_registration && ((Dates.now() - 1) < this.last_registration)) {
        //     return true;
        // }

        // Si on met la limit à ordered_vos_cud.length c'est qu'elle sert à rien ...
        // let limit = this.ordered_vos_cud.length;

        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

        this.prepare_updates(vos_update_buffer, vos_create_or_delete_buffer, vo_types);

        let intersectors_by_index: { [index: string]: VarDataBaseVO } = await this.init_leaf_intersectors(vo_types, vos_update_buffer, vos_create_or_delete_buffer);
        let solved_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO } = {};

        let max = Math.max(ConfigurationService.node_configuration.MAX_POOL / 2, 1);
        let promise_pipeline = new PromisePipeline(max);
        for (let i in intersectors_by_index) {
            let intersector = intersectors_by_index[i];

            await promise_pipeline.push(async () => {
                await this.invalidate_datas_and_parents(
                    new VarDataInvalidatorVO(intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, true, false, false),
                    solved_invalidators_by_index);
            });
        }

        await promise_pipeline.end();
        await this.push_invalidators(Object.values(solved_invalidators_by_index));

        // On met à jour le param en base pour refléter les modifs qui restent en attente de traitement
        this.throttled_update_param();

        // Si on continue d'invalider des Vos on attend sagement avant de relancer les calculs
        return (!!this.ordered_vos_cud) && (this.ordered_vos_cud.length > 0);
    }

    /**
     * Opti de suppression des vars, sans triggers !
     *  WARN ça signifie que les triggers sur suppression de vardata sont interdits à ce stade
     *  !! Ne peut être utilisé safe que par handle_invalidation
     */
    public async delete_vars_pack_without_triggers(vars_to_delete: VarDataBaseVO[]) {

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
    public async invalidate_datas_and_parents(
        invalidator: VarDataInvalidatorVO,
        solved_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO }
    ) {

        let intersectors_by_index: { [index: string]: VarDataBaseVO } = {
            [invalidator.var_data.index]: invalidator.var_data
        };

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));

        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors_by_index)) {
            let promise_pipeline = new PromisePipeline(max);

            for (let i in intersectors_by_index) {
                let intersector = intersectors_by_index[i];

                if (DEBUG_VARS) {
                    ConsoleHandler.log('invalidate_datas_and_parents:START SOLVING:' + intersector.index + ':');
                }
                let conf_id = this.get_validator_config_id(invalidator, true, intersector.index);
                if (solved_invalidators_by_index[conf_id]) {
                    delete intersectors_by_index[i];
                    continue;
                }
                solved_invalidators_by_index[conf_id] = new VarDataInvalidatorVO(
                    intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false,
                    invalidator.invalidate_denied, invalidator.invalidate_imports);

                await promise_pipeline.push(async () => {

                    try {

                        let deps_intersectors = await this.get_deps_intersectors(intersector);

                        for (let j in deps_intersectors) {
                            let dep_intersector = deps_intersectors[j];

                            if (intersectors_by_index[dep_intersector.index]) {
                                continue;
                            }
                            let dep_intersector_conf_id = this.get_validator_config_id(invalidator, true, dep_intersector.index);
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

    public async has_vos_cud(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                reject,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasVoUpdateHandler.TASK_NAME_has_vos_cud, resolve)) {
                return;
            }

            resolve(this.ordered_vos_cud && (this.ordered_vos_cud.length > 0));
        });
    }

    public async update_param() {

        await ModuleParams.getInstance().setParamValue(
            VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME,
            this.getJSONFrom_ordered_vos_cud());
    }

    /**
     * On doit faire une union sur les intersecteurs, mais ni sur les inclusions ni sur les exacts
     * Pour le moment on implémente pas les inclusions, qui n'ont pas une utilité évidente (on a pas d'interface pour faire ça pour le moment a priori en plus)
     */
    public async handle_invalidators() {
        if (this.invalidators && this.invalidators.length) {
            ConsoleHandler.log('handle_invalidators:IN:' + this.invalidators.length);
            let invalidators = this.invalidators;
            this.invalidators = [];

            let invalidate_intersectors: VarDataInvalidatorVO[] = [];
            let invalidate_included: VarDataInvalidatorVO[] = [];
            let invalidate_exact: VarDataInvalidatorVO[] = [];

            for (let i in invalidators) {
                let invalidator = invalidators[i];

                switch (invalidator.invalidator_type) {
                    case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                        invalidate_exact.push(invalidator);
                        break;
                    case VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT:
                        invalidate_included.push(invalidator);
                        break;
                    case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:
                        invalidate_intersectors.push(invalidator);
                        break;
                }
            }

            if (invalidate_included && invalidate_included.length) {
                throw new Error('Not Implemented');
            }

            let solved_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO } = {};
            if (invalidate_exact && invalidate_exact.length) {
                ConsoleHandler.log('handle_invalidators:invalidate_exact:' + invalidate_exact.length);

                /**
                 * Gestion des invalidations de parents :
                 *  Sur un exact, invalidation de l'arbre ça veut dire demander l'invalidation exacte de ce matroid, puis l'invalidation par intersection
                 *      de ses parents (et de tout l'arbre en remontant).
                 */
                let start_time = Dates.now();
                for (let i in invalidate_exact) {
                    let invalidator = invalidate_exact[i];

                    if (!invalidator.propagate_to_parents) {
                        continue;
                    }

                    await this.invalidate_datas_and_parents(invalidator, solved_invalidators_by_index);

                    let actual_time = Dates.now();

                    if (actual_time > (start_time + 10)) {
                        start_time = actual_time;
                        ConsoleHandler.warn('handle_invalidators:invalidate_exact:invalidate_datas_and_parents:---:invalidate_exact:' +
                            i + ':' + invalidate_exact.length);
                    }
                }

                for (let i in solved_invalidators_by_index) {
                    let solved_intersector = solved_invalidators_by_index[i];

                    if (invalidate_intersectors.find((ii) => ii.var_data.index == solved_intersector.var_data.index)) {
                        continue;
                    }

                    invalidate_intersectors.push(solved_intersector);
                }

                await this.invalidate_exact_datas_and_push_for_update(invalidate_exact);
            }

            if (invalidate_intersectors && invalidate_intersectors.length) {
                ConsoleHandler.log('handle_invalidators:invalidate_intersectors:' + invalidate_intersectors.length);


                /**
                 * Pour l'union des invalidators, on peut union à condition d'avoir :
                 *  - un var_id identique
                 *  - une conf de types de var_data à supprimer identiques (donc denied / imports identiques)
                 *
                 * Ensuite on veut faire l'union à la fois avant de déployer les invalidations qui propagate_to_parents, et après avoir propagé
                 * Donc on commence par séparer les invalidations qui propagent, pour les union + appliquer
                 * et enuite on aura plus que des invalidations qui ne propagent pas, et on les unionne pour les appliquer
                 */
                let invalidate_intersectors_propagation: VarDataInvalidatorVO[] = invalidate_intersectors.filter((invalidator) => invalidator.propagate_to_parents);
                let invalidate_intersectors_no_propagation: VarDataInvalidatorVO[] = invalidate_intersectors.filter((invalidator) => !invalidator.propagate_to_parents);
                let union_invalidate_intersectors_propagation = this.union_invalidators(invalidate_intersectors_propagation);

                solved_invalidators_by_index = {};
                let start_time = Dates.now();
                for (let i in union_invalidate_intersectors_propagation) {
                    let invalidator = union_invalidate_intersectors_propagation[i];

                    if (!invalidator.propagate_to_parents) {
                        continue;
                    }

                    await this.invalidate_datas_and_parents(invalidator, solved_invalidators_by_index);

                    let actual_time = Dates.now();

                    if (actual_time > (start_time + 10)) {
                        start_time = actual_time;
                        ConsoleHandler.warn('handle_invalidators:invalidate_intersectors:invalidate_datas_and_parents:---:intersectors_by_index:' +
                            i + ':' + union_invalidate_intersectors_propagation.length);
                    }
                }

                for (let i in solved_invalidators_by_index) {
                    let solved_intersector = solved_invalidators_by_index[i];

                    if (invalidate_intersectors_no_propagation.find((ii) => ii.var_data.index == solved_intersector.var_data.index)) {
                        continue;
                    }

                    invalidate_intersectors_no_propagation.push(solved_intersector);
                }

                ConsoleHandler.log('handle_invalidators:invalidate_intersectors:PRE UNION:' + invalidate_intersectors_no_propagation.length);
                let union_invalidate_intersectors_no_propagation = this.union_invalidators(invalidate_intersectors_no_propagation);
                ConsoleHandler.log('handle_invalidators:invalidate_intersectors:POST UNION:' + union_invalidate_intersectors_no_propagation.length);
                await this.intersect_invalid_datas_and_push_for_update(union_invalidate_intersectors_no_propagation);
            }
            ConsoleHandler.log('handle_invalidators:OUT:' + invalidators.length + '=>' + this.invalidators.length);
        }
    }

    /**
     * Pour l'union des invalidators, on peut union à condition d'avoir :
     *  - un var_id identique
     *  - une conf de types de var_data à supprimer identiques (donc denied / imports identiques)
     *
     * !! à ce stade on considère que le propagate est commun à tous ces invalidators
     */
    private union_invalidators(invalidators: VarDataInvalidatorVO[]): VarDataInvalidatorVO[] {
        let union_invalidators: VarDataInvalidatorVO[] = [];

        /**
         * On commence par regrouper par confs de types de var_data à supprimer
         */
        let invalidators_by_conf: { [conf_id: string]: VarDataInvalidatorVO[] } = {};

        for (let i in invalidators) {
            let invalidator = invalidators[i];

            let conf_id = this.get_validator_config_id(invalidator);
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
            let union_var_datas = MatroidController.getInstance().union(this_conf_invalidators.map((invalidator) => invalidator.var_data));

            for (let i in union_var_datas) {
                let union_var_data = union_var_datas[i];
                let union_invalidator = new VarDataInvalidatorVO(union_var_data, kept_invalidator.invalidator_type, kept_invalidator.propagate_to_parents, kept_invalidator.invalidate_denied, kept_invalidator.invalidate_imports);
                union_invalidators.push(union_invalidator);
            }
        }

        return union_invalidators;
    }

    private get_validator_config_id(
        invalidator: VarDataInvalidatorVO,
        include_index: boolean = false,
        index: string = null): string {

        return (invalidator && !!invalidator.var_data) ?
            invalidator.var_data.var_id + '_' + (invalidator.invalidate_denied ? '1' : '0') + '_' + (invalidator.invalidate_imports ? '1' : '0')
            + (include_index ? '_' + (index ? index : invalidator.var_data.index) : '') :
            null;
    }

    private throttled_push_invalidators(invalidators: VarDataInvalidatorVO[]) {
        if ((!invalidators) || (!invalidators.length)) {
            return;
        }

        this.invalidators = this.invalidators.concat(invalidators);
        VarsdatasComputerBGThread.getInstance().force_run_asap();
    }

    // /**
    //  * Se lance sur le thread des vars
    //  */
    // private filter_varsdatas_cache_by_matroids_intersection(
    //     api_type_id: string,
    //     matroids: IMatroid[],
    //     fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<VarDataBaseVO[]> {

    //     return new Promise(async (resolve, reject) => {

    //         let thrower = (error) => {
    //             //TODO fixme do something to inform user
    //             ConsoleHandler.error('failed filter_varsdatas_cache_by_matroids_intersection' + error);
    //             resolve([]);
    //         };

    //         if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
    //             thrower,
    //             VarsdatasComputerBGThread.getInstance().name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_matroids_intersection,
    //             resolve,
    //             api_type_id,
    //             matroids,
    //             fields_ids_mapper)) {
    //             return;
    //         }

    //         let res: VarDataBaseVO[] = [];

    //         for (let i in matroids) {
    //             res = res.concat(this.filter_varsdatas_cache_by_matroid_intersection(api_type_id, matroids[i], fields_ids_mapper));
    //         }

    //         resolve(res);
    //     });
    // }

    // /**
    //  * Doit être lancé depuis le thread des vars
    //  */
    // private filter_varsdatas_cache_by_matroid_intersection(
    //     api_type_id: string,
    //     matroid: IMatroid,
    //     fields_ids_mapper: { [matroid_field_id: string]: string }): VarDataBaseVO[] {

    //     let res: VarDataBaseVO[] = [];

    //     let moduleTable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[api_type_id];
    //     let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

    //     if (!moduleTable) {
    //         return null;
    //     }

    //     for (let i in VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes) {
    //         let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[i];

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
     * Doit être lancé depuis le thread des vars
     */
    private filter_varsdatas_cache_by_invalidator(invalidator: VarDataInvalidatorVO): VarDataBaseVO[] {

        let res: VarDataBaseVO[] = [];

        for (let i in VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes) {
            let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[i];

            if (wrapper.var_data._type != invalidator.var_data._type) {
                continue;
            }

            if (wrapper.var_data.var_id != invalidator.var_data.var_id) {
                continue;
            }

            if ((wrapper.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) && (!invalidator.invalidate_denied)) {
                continue;
            }

            if ((wrapper.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!invalidator.invalidate_imports)) {
                continue;
            }

            if ((invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED) && !MatroidController.getInstance().matroid_intersects_matroid(wrapper.var_data, invalidator.var_data)) {
                continue;
            }

            if ((invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT) && (wrapper.var_data.index != invalidator.var_data.index)) {
                continue;
            }

            if (invalidator.invalidator_type == VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT) {
                throw new Error('Not Implemented');
            }

            res.push(wrapper.var_data);
        }

        return res;
    }

    // /**
    //  * Se lance sur le thread des vars
    //  */
    // private filter_varsdatas_cache_by_exact_matroids(
    //     matroids: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {

    //     return new Promise(async (resolve, reject) => {

    //         let thrower = (error) => {
    //             //TODO fixme do something to inform user
    //             ConsoleHandler.error('failed filter_varsdatas_cache_by_exact_matroids' + error);
    //             resolve([]);
    //         };

    //         if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
    //             thrower,
    //             VarsdatasComputerBGThread.getInstance().name,
    //             VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids,
    //             resolve,
    //             matroids)) {
    //             return;
    //         }

    //         let res: VarDataBaseVO[] = [];

    //         for (let i in matroids) {
    //             let param = this.filter_varsdatas_cache_by_exact_matroid(matroids[i]);
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
    // private filter_varsdatas_cache_by_exact_matroid(matroid: VarDataBaseVO): VarDataBaseVO {
    //     let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[matroid.index];

    //     return wrapper ? wrapper.var_data : null;
    // }

    /**
     * Recherche en BDD et en cache les var_datas passés en param (exactement), et on push les invalidations dans le buffer de vars
     * !! On doit être sur le thread des vars
     * @param exact_invalidators
     */
    private async invalidate_exact_datas_and_push_for_update(exact_invalidators: VarDataInvalidatorVO[]) {

        let invalidators_by_var_id: { [var_id: number]: VarDataInvalidatorVO[] } = {};
        for (let i in exact_invalidators) {
            let invalidator = exact_invalidators[i];

            if (!invalidators_by_var_id[invalidator.var_data.var_id]) {
                invalidators_by_var_id[invalidator.var_data.var_id] = [];
            }
            invalidators_by_var_id[invalidator.var_data.var_id].push(invalidator);
        }

        for (let var_id_s in invalidators_by_var_id) {
            let invalidators: VarDataInvalidatorVO[] = invalidators_by_var_id[var_id_s];

            if ((!invalidators) || (!invalidators.length)) {
                continue;
            }

            let var_datas: VarDataBaseVO[] = await this.load_invalidateds_from_bdd(invalidators);
            let cached: VarDataBaseVO[] = [];

            for (let i in invalidators) {
                let invalidator = invalidators[i];
                let cached_i = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[invalidator.var_data.index];

                if (!cached_i) {
                    continue;
                }

                if ((cached_i.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) && (!invalidator.invalidate_denied)) {
                    continue;
                }

                if ((cached_i.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (!invalidator.invalidate_imports)) {
                    continue;
                }

                cached.push(cached_i.var_data);
            }

            await this.handle_invalidation(var_datas, cached);
        }
    }

    // /**
    //  * ça fonctionne pas puisqu'on peut être sur un invalidateur de type intersection FIXME delete
    //  */
    // private can_invalidate(
    //     var_data: VarDataBaseVO,
    //     invalidators_for_var_data: { [invalidator_index: string]: VarDataInvalidatorVO }): boolean {
    //     let can_invalidate = false;

    //     if ((var_data.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) && (var_data.value_type != VarDataBaseVO.VALUE_TYPE_DENIED)) {
    //         return true;
    //     }

    //     if (var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
    //         for (let j in invalidators_for_var_data) {
    //             let invalidator = invalidators_for_var_data[j];
    //             if (invalidator.invalidate_imports) {
    //                 return true;
    //             }
    //         }
    //     }

    //     if (var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
    //         for (let j in invalidators_for_var_data) {
    //             let invalidator = invalidators_for_var_data[j];
    //             if (invalidator.invalidate_denied) {
    //                 return true;
    //             }
    //         }
    //     }

    //     return can_invalidate;
    // }

    /**
     * @param invalidators Params de l'invalidation. à ce stade on s'intéresse au type de vars qu'on peut invalider
     * @param var_datas
     * @param cached
     * @returns
     */
    private async handle_invalidation(
        // invalidators: { [vardata_index: string]: { [invalidator_index: string]: VarDataInvalidatorVO } },
        var_datas: VarDataBaseVO[],
        cached: VarDataBaseVO[],
    ) {
        let env = ConfigurationService.node_configuration;

        let var_data_by_index: { [index: string]: VarDataBaseVO } = {};
        for (let i in var_datas) {
            let var_data = var_datas[i];
            var_data_by_index[var_data.index] = var_data;
        }

        /**
         * On ajoute les vars subs (front et back) et les vars en cache
         */
        let registered_var_datas: VarDataBaseVO[] = [];

        // pour les vars subs en front,
        //  soit on est en bdd(donc on vient de la trouver et on peut filtrer sur celles chargées de la bdd)
        //  soit on est en cache et on les trouve en dessous
        let registered_var_datas_indexes = await VarsTabsSubsController.getInstance().filter_by_subs(Object.keys(var_data_by_index));
        registered_var_datas = (registered_var_datas_indexes && registered_var_datas_indexes.length) ? registered_var_datas_indexes.map((index) => var_data_by_index[index]) : [];
        registered_var_datas = (registered_var_datas && registered_var_datas.length) ?
            ((cached && cached.length) ? registered_var_datas.concat(cached) : registered_var_datas) : cached;

        var_data_by_index = {};

        /**
         * Tout sauf les imports et les denied
         */
        let var_datas_no_denied_and_no_import: VarDataBaseVO[] = [];

        for (let i in var_datas) {
            let var_data = var_datas[i];
            var_data_by_index[var_data.index] = var_data;

            // let can_invalidate = this.can_invalidate(var_data, invalidators[var_data.index]);

            // if (!can_invalidate) {
            //     continue;
            // }

            // On doit avoir filtré en amont les types de datas (import et denied) pour éviter de les supprimer à ce stade à moins que ce soit explicitement l'objectif....
            delete var_data.value;
            var_data.value_ts = null;
            var_datas_no_denied_and_no_import.push(var_data);
        }

        // Si on retrouve les mêmes qu'en bdd on ignore, on est déjà en train de les invalider
        for (let i in registered_var_datas) {
            let registered_var_data = registered_var_datas[i];

            // let can_invalidate = this.can_invalidate(registered_var_data, invalidators[registered_var_data.index]);

            // if (!can_invalidate) {
            //     continue;
            // }

            // Je sais pas pkoi mais on est obligé de le faire ici même si on push dans le var_datas les objets
            //  (pour moi par ref) et qu'on supprime la value et le value_ts dedans...
            delete registered_var_data.value;
            registered_var_data.value_ts = null;

            if (var_data_by_index[registered_var_data.index]) {
                continue;
            }

            var_data_by_index[registered_var_data.index] = registered_var_data;

            if ((registered_var_data.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) && (registered_var_data.value_type != VarDataBaseVO.VALUE_TYPE_DENIED)) {
                delete registered_var_data.value;
                registered_var_data.value_ts = null;
                var_datas_no_denied_and_no_import.push(registered_var_data);
            }
        }

        if ((!var_datas_no_denied_and_no_import) || (!var_datas_no_denied_and_no_import.length)) {
            return;
        }

        let unregistered_var_datas: VarDataBaseVO[] = VarsController.getInstance().substract_vars_datas(var_datas_no_denied_and_no_import, registered_var_datas);

        let delete_instead_of_invalidating_unregistered_var_datas = await ModuleParams.getInstance().getParamValueAsBoolean(VarsDatasVoUpdateHandler.delete_instead_of_invalidating_unregistered_var_datas_PARAM_NAME, true, 180000);

        if (registered_var_datas && registered_var_datas.length) {
            if (env.DEBUG_VARS) {
                registered_var_datas.forEach((v) => {
                    let w = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[v.index];
                    ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_registered_var_datas:INDEXES:' + v.index +
                        ':client_user_id:' + (w ? w.client_user_id : 'N/A') + ':client_tab_id:' + (w ? w.client_tab_id : 'N/A') + ':is_server_request:' + (w ? w.is_server_request : 'N/A') + ':reason:' + (w ? w.reason : 'N/A'));
                });
            }
            // On supprime quand même en bdd ces vars sinon on rechargera la version de la bdd à moment donné
            let bdd_vars_registered = registered_var_datas.filter((v) => (!!v.id) &&
                (v.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) && (v.value_type != VarDataBaseVO.VALUE_TYPE_DENIED));
            if (bdd_vars_registered && bdd_vars_registered.length) {
                await this.delete_vars_pack_without_triggers(bdd_vars_registered);
                if (env.DEBUG_VARS) {
                    ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_registered_var_datas:DELETED ' + bdd_vars_registered.length + ' vars from BDD cache.');
                }
            }

            // Je comprends pas la logique de la version actuelle.
            //  On devrait virer directement du wrapper les infos qui indiquent qu'on existe en BDD, puisque c'est plus le cas. Si le wrapper existe pas encore ok, on push dans le cache,
            //  mais si ça existe déjà faut surtout supprimer le wrapper actuel. Donc en fait faudrait limite supprimer la var du cache en supprimant le wrapper et en créer un nouveau.
            for (let i in bdd_vars_registered) {
                let bdd_var_registered = bdd_vars_registered[i];

                delete bdd_var_registered.id;
                delete bdd_var_registered.value_ts;
                delete bdd_var_registered.value_type;
                delete bdd_var_registered.value;

                if (!VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[bdd_var_registered.index]) {
                    continue;
                }
                delete VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[bdd_var_registered.index];
            }

            // bdd_vars_registered à la place de registered_var_datas : pourquoi on remettrait en calcul les imports et denied ?

            // FIXME TODO : On perd l'info de qui a demandé à la base (client_tab_id & server_id) faudrait les sauvegarder depuis le wrapper avant de le supprimer pour chaque var
            await VarsDatasProxy.getInstance().append_var_datas(bdd_vars_registered, 'handle_invalidation__registered_var_datas');

            if (env.DEBUG_VARS) {
                ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_registered_var_datas:RECALC  ' + registered_var_datas.length + ' vars from APP cache.');
            }
        }

        if (unregistered_var_datas && unregistered_var_datas.length) {
            if (env.DEBUG_VARS) {
                unregistered_var_datas.forEach((v) => {
                    let w = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[v.index];
                    ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:INDEXES:' + v.index +
                        ':client_user_id:' + (w ? w.client_user_id : 'N/A') + ':client_tab_id:' + (w ? w.client_tab_id : 'N/A') + ':is_server_request:' + (w ? w.is_server_request : 'N/A') + ':reason:' + (w ? w.reason : 'N/A'));
                });
            }

            /**
             * Ajout de la fonctionnalité de pixellisation et de non suppression des pixels
             *  si on a une pixellisation sur la varconf, et que les pixels ne doivent pas être supprimés, en cas d'invalidation de pixel
             *  on les append aux prochains calculs.
             */
            let vars_to_append: VarDataBaseVO[] = [];

            // On doit toujours delete en base, sinon on risque de recharger la data depuis la bdd à moment donné dans les calculs
            if (unregistered_var_datas && unregistered_var_datas.length) {
                await this.delete_vars_pack_without_triggers(unregistered_var_datas);
                if (env.DEBUG_VARS) {
                    ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:DELETED ' + unregistered_var_datas.length + ' vars from BDD cache.');
                }
            }

            for (let i in unregistered_var_datas) {
                let unregistered_var_data = unregistered_var_datas[i];

                if (!delete_instead_of_invalidating_unregistered_var_datas) {
                    vars_to_append.push(unregistered_var_data);
                    continue;
                }

                let conf = VarsController.getInstance().var_conf_by_id[unregistered_var_data.var_id];
                if (conf.pixel_activated && conf.pixel_never_delete) {

                    // On remet en calcul les pixels, et uniquement les pixels
                    if (PixelVarDataController.getInstance().get_pixel_card(unregistered_var_data) == 1) {
                        vars_to_append.push(unregistered_var_data);
                    }
                }
            }

            if (vars_to_append && vars_to_append.length) {

                // Même remarque, on doit surement supprimer le wrapper actuel si il existe pour le recalculer
                for (let i in vars_to_append) {
                    let var_to_append = vars_to_append[i];

                    delete var_to_append.id;
                    delete var_to_append.value_ts;
                    delete var_to_append.value_type;
                    delete var_to_append.value;

                    if (!VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[var_to_append.index]) {
                        continue;
                    }
                    delete VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[var_to_append.index];
                }

                /**
                 * On recalcule les pixels qu'on a identfié comme pixel_never_delete
                 */
                // FIXME TODO : On perd l'info de qui a demandé à la base (client_tab_id & server_id) faudrait les sauvegarder depuis le wrapper avant de le supprimer pour chaque var
                await VarsDatasProxy.getInstance().append_var_datas(vars_to_append, 'handle_invalidation__unregistered_var_datas');

                if (env.DEBUG_VARS) {
                    // ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:RECALC  ' + unregistered_var_datas.length + ' vars from BDD cache.');
                    ConsoleHandler.log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:IGNORE (unregistered)  ' + unregistered_var_datas.length + ' vars from BDD cache.');
                }
            }
        }
    }

    /**
     * On charge depuis la bdd en fonction des types de datas recherchées. En revanche on doit déjà cibler un seul api_type_id
     */
    private async load_invalidateds_from_bdd(invalidators: VarDataInvalidatorVO[]): Promise<VarDataBaseVO[]> {

        if ((!invalidators) || (!invalidators.length)) {
            return null;
        }

        let query_ = query(invalidators[ObjectHandler.getInstance().getFirstAttributeName(invalidators)].var_data._type);
        let filters = [];

        for (let i in invalidators) {
            let invalidator = invalidators[i];
            let var_data = invalidator.var_data;

            let invalidator_filters = [];

            switch (invalidator.invalidator_type) {
                case VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT:
                    invalidator_filters.push(filter(var_data._type, '_bdd_only_index').by_text_eq(var_data.index));
                    break;
                case VarDataInvalidatorVO.INVALIDATOR_TYPE_INCLUDED_OR_EXACT:
                    throw new Error('Not Implemented');
                case VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED:

                    invalidator_filters.push(filter(var_data._type, 'var_id').by_num_eq(var_data.var_id));
                    let matroid_fields = MatroidController.getInstance().getMatroidFields(var_data._type);
                    for (let j in matroid_fields) {
                        let matroid_field = matroid_fields[j];
                        invalidator_filters.push(filter(var_data._type, matroid_field.field_id).by_num_x_ranges(var_data[matroid_field.field_id]));
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

            invalidator_filters.push(filter(var_data._type, 'value_type').by_num_x_ranges(valid_types));

            let invalidator_filter_group = ContextFilterVO.and(invalidator_filters);
            filters.push(invalidator_filter_group);
        }

        let filters_group = ContextFilterVO.or(filters);

        return await query_.add_filters([filters_group]).select_vos<VarDataBaseVO>();
    }

    /**
     * Recherche en BDD et en cache par intersection des var_datas qui correspondent aux intersecteurs, et on push les invalidations dans le buffer de vars
     * @param invalidate_intersectors
     */
    private async intersect_invalid_datas_and_push_for_update(invalidators_intersectors: VarDataInvalidatorVO[]) {

        // let invalidate_intersectors: VarDataBaseVO[] = [];

        let invalidators_by_var_id: { [var_id: number]: VarDataInvalidatorVO[] } = {};

        for (let i in invalidators_intersectors) {
            let invalidator = invalidators_intersectors[i];
            let var_data = invalidator.var_data;
            if (!invalidators_by_var_id[var_data.var_id]) {
                invalidators_by_var_id[var_data.var_id] = [];
            }
            invalidators_by_var_id[var_data.var_id].push(invalidator);
        }

        let var_datas_by_index: { [index: string]: VarDataBaseVO } = {};
        let cached_by_index: { [index: string]: VarDataBaseVO } = {};

        let max_connections_to_use: number = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL - 1));
        let promise_pipeline = new PromisePipeline(max_connections_to_use);

        for (let var_id_s in invalidators_by_var_id) {
            let invalidators: VarDataInvalidatorVO[] = invalidators_by_var_id[var_id_s];

            if ((!invalidators) || (!invalidators.length)) {
                continue;
            }

            let self = this;
            await promise_pipeline.push(async () => {
                let tmp_var_datas: VarDataBaseVO[] = await self.load_invalidateds_from_bdd(invalidators);

                if (tmp_var_datas && (tmp_var_datas.length > 0)) {
                    for (let i in tmp_var_datas) {
                        let var_data = tmp_var_datas[i];
                        var_datas_by_index[var_data.index] = var_data;
                    }
                }
            });

            await promise_pipeline.push(async () => {
                for (let i in invalidators) {
                    let invalidator = invalidators[i];

                    let tmp_cached: VarDataBaseVO[] = await this.filter_varsdatas_cache_by_invalidator(invalidator);
                    if (tmp_cached && (tmp_cached.length > 0)) {
                        for (let j in tmp_cached) {
                            let var_data = tmp_cached[j];
                            cached_by_index[var_data.index] = var_data;
                        }
                    }
                }
            });
        }

        await promise_pipeline.end();

        await this.handle_invalidation(
            Object.values(var_datas_by_index),
            Object.values(cached_by_index),
        );
    }

    private async compute_intersectors(
        ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> },
        markers: { [var_id: number]: number },
        intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> }
    ) {

        let start_time = Dates.now();
        let real_start_time = start_time;

        let original_markers = Object.assign({}, markers);
        let original_ctrls_to_update_1st_stage = Object.assign({}, ctrls_to_update_1st_stage);

        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(ctrls_to_update_1st_stage)) {

            let actual_time = Dates.now();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.warn('VarsDatasVoUpdateHandler:compute_intersectors:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            let did_something = false;
            let tmp_ctrls_to_update_1st_stage = Object.assign({}, ctrls_to_update_1st_stage);
            for (let i in tmp_ctrls_to_update_1st_stage) {
                let ctrl = ctrls_to_update_1st_stage[i];

                if (markers[ctrl.varConf.id] != 1) {
                    continue;
                }

                did_something = true;
                let Nx = VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, ctrl);

                await this.compute_deps_intersectors_and_union(Nx, intersectors_by_var_id);
                let self = this;

                await DAGController.getInstance().visit_bottom_up_from_node(Nx, async (Ny: VarCtrlDAGNode) => {
                    markers[Ny.var_controller.varConf.id]--;

                    if (!markers[Ny.var_controller.varConf.id]) {
                        await self.compute_deps_intersectors_and_union(Ny, intersectors_by_var_id);
                    }
                });

                delete ctrls_to_update_1st_stage[i];
            }

            /**
             * Force get out of deps loops
             */
            if (!did_something) {
                let blocked = true;


                // On essaie de libérer un des markers 'minimal' pour continuer de remonter depuis ce noeud
                let min_value = null;
                let min_ctrl_id = null;
                for (let i in ctrls_to_update_1st_stage) {
                    let ctrl = ctrls_to_update_1st_stage[i];

                    if ((min_value === null) || ((markers[ctrl.varConf.id] > 0) && (min_value > markers[ctrl.varConf.id]))) {

                        min_value = markers[ctrl.varConf.id];
                        min_ctrl_id = ctrl.varConf.id;
                    }
                }

                if (min_ctrl_id) {

                    markers[min_ctrl_id] = 1;
                    blocked = false;
                }

                // for (let i in ctrls_to_update_1st_stage) {
                //     let ctrl = ctrls_to_update_1st_stage[i];

                //     if (markers[ctrl.varConf.id] > 1) {
                //         blocked = false;
                //         markers[ctrl.varConf.id]--;
                //     }
                // }

                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: Check Vars Deps GRAPH - And build it ...');

                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: vos_create_or_delete_buffer ...');
                for (let vos_create_or_delete_buffer_i in vos_create_or_delete_buffer) {
                    let vos = vos_create_or_delete_buffer[vos_create_or_delete_buffer_i];

                    for (let vo_i in vos) {
                        let vo = vos[vo_i];

                        ConsoleHandler.error(
                            JSON.stringify(VOsTypesManager.moduleTables_by_voType[vo._type].get_bdd_version(vo)));
                    }
                }
                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: vos_create_or_delete_buffer ---');

                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: vos_update_buffer ...');
                for (let vos_update_buffer_i in vos_update_buffer) {
                    let vos = vos_update_buffer[vos_update_buffer_i];

                    for (let vo_i in vos) {
                        let vo: DAOUpdateVOHolder<IDistantVOBase> = vos[vo_i];

                        ConsoleHandler.error(
                            JSON.stringify(VOsTypesManager.moduleTables_by_voType[vo.post_update_vo._type].get_bdd_version(vo.post_update_vo)));
                    }
                }
                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: vos_update_buffer ---');

                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: original_ctrls_to_update_1st_stage ...');
                // for (let var_id in original_ctrls_to_update_1st_stage) {
                //     let var_: VarServerControllerBase<VarDataBaseVO> = original_ctrls_to_update_1st_stage[var_id];

                //     ConsoleHandler.error(var_id + ':' + var_.varConf.name);
                // }
                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: original_ctrls_to_update_1st_stage ---');

                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: ctrls_to_update_1st_stage ...');
                // for (let var_id in ctrls_to_update_1st_stage) {
                //     let var_: VarServerControllerBase<VarDataBaseVO> = ctrls_to_update_1st_stage[var_id];

                //     ConsoleHandler.error(var_id + ':' + var_.varConf.name);
                // }
                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: ctrls_to_update_1st_stage ---');

                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: original_markers ...');
                // for (let var_id in original_markers) {
                //     let e: number = original_markers[var_id];

                //     ConsoleHandler.error(var_id + ':' + e);
                // }
                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: original_markers ---');

                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: markers ...');
                // for (let var_id in markers) {
                //     let e: number = markers[var_id];

                //     ConsoleHandler.error(var_id + ':' + e);
                // }
                // ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: markers ---');

                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: intersectors_by_var_id ...');
                for (let var_id in intersectors_by_var_id) {
                    let vos = intersectors_by_var_id[var_id];

                    for (let index in vos) {

                        ConsoleHandler.error(var_id + ':' + index);
                    }
                }
                ConsoleHandler.error('DEAD DEP LOOP : compute_intersectors: intersectors_by_var_id ---');

                if (blocked) {
                    let tmp_ctrls_to_update_1st_stage_ = Object.assign({}, ctrls_to_update_1st_stage);
                    for (let i in tmp_ctrls_to_update_1st_stage_) {
                        delete ctrls_to_update_1st_stage[i];
                    }
                }
            }
        }
    }

    private async compute_deps_intersectors_and_union(
        Nx: VarCtrlDAGNode,
        intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } }
    ) {
        let intersectors = intersectors_by_var_id[Nx.var_controller.varConf.id];
        intersectors = intersectors ? intersectors : {};

        let has_deps_to_compute: boolean = false;

        for (let j in Nx.outgoing_deps) {
            let dep = Nx.outgoing_deps[j];
            let controller = (dep.outgoing_node as VarCtrlDAGNode).var_controller;

            if (!intersectors_by_var_id[controller.varConf.id]) {
                continue;
            }

            has_deps_to_compute = true;
            let tmp = await Nx.var_controller.get_invalid_params_intersectors_from_dep(
                dep.dep_name,
                Object.values(intersectors_by_var_id[controller.varConf.id]));
            if (tmp && tmp.length) {
                tmp.forEach((e) => intersectors[e.index] = e);
            }
        }

        if (!has_deps_to_compute) {
            return;
        }

        intersectors = ObjectHandler.getInstance().mapByStringFieldFromArray(
            MatroidController.getInstance().union(Object.values(intersectors)), 'index');

        if ((!intersectors) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors))) {
            return;
        }
        intersectors_by_var_id[Nx.var_controller.varConf.id] = intersectors;
    }

    private async get_deps_intersectors(intersector: VarDataBaseVO): Promise<{ [index: string]: VarDataBaseVO }> {
        let res: { [index: string]: VarDataBaseVO } = {};

        let node = VarsServerController.getInstance().varcontrollers_dag.nodes[intersector.var_id];

        for (let j in node.incoming_deps) {
            let dep = node.incoming_deps[j];
            let controller = (dep.incoming_node as VarCtrlDAGNode).var_controller;

            let tmp = await controller.get_invalid_params_intersectors_from_dep(dep.dep_name, [intersector]);
            if (tmp && tmp.length) {
                tmp.forEach((e) => res[e.index] = e);
            }
        }

        return res;
    }

    /**
     * L'idée est de noter les noeuds de l'arbre en partant des noeuds de base (ctrls_to_update_1st_stage) et en remontant dans l'arbre en
     *  indiquant un +1 sur chaque noeud. Ce marqueur est utlisé par le suite pour savoir les dépendances en attente ou résolues
     * @param ctrls_to_update_1st_stage
     * @param markers
     */
    private async init_markers(ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> }, markers: { [var_id: number]: number }) {
        for (let i in ctrls_to_update_1st_stage) {
            let ctrl = ctrls_to_update_1st_stage[i];

            await DAGController.getInstance().visit_bottom_up_from_node(
                VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, ctrl),
                async (node: VarCtrlDAGNode) => {
                    let controller = node.var_controller;
                    if (!markers[controller.varConf.id]) {
                        markers[controller.varConf.id] = 0;
                    }
                    markers[controller.varConf.id]++;
                });
        }
    }

    /**
     * Pour chaque vo_type, on prend tous les varcontrollers concernés et on demande les intersecteurs en CD et en U
     */
    private async init_leaf_intersectors(
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

            for (let j in VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type]) {
                let var_controller = VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type][j];

                if ((!!vos_create_or_delete_buffer[vo_type]) && vos_create_or_delete_buffer[vo_type].length) {

                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log(
                            'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_C_POST_D_group:' +
                            var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vos_create_or_delete_buffer[vo_type].length);
                    }

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_C_POST_D_group(vos_create_or_delete_buffer[vo_type]);
                    if (tmp && !!tmp.length) {
                        tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                    }
                }

                if ((!!vos_update_buffer[vo_type]) && vos_update_buffer[vo_type].length) {

                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log(
                            'init_leaf_intersectors:get_invalid_params_intersectors_on_POST_U_group:' +
                            var_controller.varConf.id + ':' + var_controller.varConf.name + ':' + vos_update_buffer[vo_type].length);
                    }

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_U_group(vos_update_buffer[vo_type]);
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
    private prepare_updates(
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        vo_types: string[]) {

        let start_time = Dates.now();
        let real_start_time = start_time;
        let last_log_time = start_time;

        if (this.ordered_vos_cud && this.ordered_vos_cud.length) {
            ConsoleHandler.log('VarsDatasVoUpdateHandler:prepare_updates:IN :ordered_vos_cud length:' + this.ordered_vos_cud.length);
        }

        while (this.ordered_vos_cud && this.ordered_vos_cud.length) {


            let actual_time = Dates.now();

            if ((actual_time - last_log_time) >= 10) {
                ConsoleHandler.warn('VarsDatasVoUpdateHandler:prepare_updates:---:ordered_vos_cud length:' + this.ordered_vos_cud.length);
                last_log_time = actual_time;

                /**
                 * on se rajoute de sortir au bout de 10 secondes si on a des demandes en attente par ailleurs de calcul par des clients ou serveur
                 */
                if (VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes) {
                    for (let i in VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes) {
                        let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[i];
                        if ((wrapper.is_server_request || wrapper.client_tab_id || wrapper.client_user_id) && !VarsServerController.getInstance().has_valid_value(wrapper.var_data)) {
                            ConsoleHandler.warn('VarsDatasVoUpdateHandler:prepare_updates:INTERROMPU:demandes client ou serveur en attente de résolution:' + wrapper.var_data.index);
                            return;
                        }
                    }
                }
            }

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.error('VarsDatasVoUpdateHandler:prepare_updates:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            let vo_cud = this.ordered_vos_cud.shift();

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

        ConsoleHandler.log('VarsDatasVoUpdateHandler:prepare_updates:OUT:ordered_vos_cud length:' + this.ordered_vos_cud.length);
    }

    private getJSONFrom_ordered_vos_cud(): string {
        let res: any[] = [];

        for (let i in this.ordered_vos_cud) {
            let vo_cud = this.ordered_vos_cud[i];

            if (!!vo_cud['_type']) {
                let tmp = APIControllerWrapper.getInstance().try_translate_vo_to_api(vo_cud);
                res.push(tmp);
            } else {
                let tmp = new DAOUpdateVOHolder<IDistantVOBase>(
                    APIControllerWrapper.getInstance().try_translate_vo_to_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).pre_update_vo),
                    APIControllerWrapper.getInstance().try_translate_vo_to_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).post_update_vo)
                );
                res.push(tmp);
            }
        }

        return JSON.stringify(res);
    }

    private set_ordered_vos_cud_from_JSON(jsoned: string): void {

        try {

            let res: any[] = JSON.parse(jsoned);

            for (let i in res) {
                let vo_cud = res[i];

                if (!!vo_cud['_type']) {
                    let tmp = APIControllerWrapper.getInstance().try_translate_vo_from_api(vo_cud);
                    this.ordered_vos_cud.push(tmp);
                } else {
                    let tmp = new DAOUpdateVOHolder<IDistantVOBase>(
                        APIControllerWrapper.getInstance().try_translate_vo_from_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).pre_update_vo),
                        APIControllerWrapper.getInstance().try_translate_vo_from_api((vo_cud as DAOUpdateVOHolder<IDistantVOBase>).post_update_vo)
                    );
                    res.push(tmp);
                }
            }
        } catch (error) {
            ConsoleHandler.error('Impossible de recharger le ordered_vos_cud from params :' + jsoned + ':');
        }
    }

    private async register_vo_cud_throttled(vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase>) {

        if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, vos_cud)) {
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

        this.ordered_vos_cud = this.ordered_vos_cud.concat(vos_cud);
        this.last_registration = Dates.now();

        this.throttled_update_param();
        VarsdatasComputerBGThread.getInstance().force_run_asap();
    }
}