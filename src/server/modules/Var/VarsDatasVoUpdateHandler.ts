

import { cloneDeep } from 'lodash';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import PushDataServerController from '../PushData/PushDataServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import VarsDatasProxy from './VarsDatasProxy';
import VarServerControllerBase from './VarServerControllerBase';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

/**
 * On gère le buffer des mises à jour de vos en lien avec des vars pour invalider au plus vite les vars en cache en cas de modification d'un VO
 *  tout en empilant quelques centaines d'updates à la fois, pour ne pas invalider 100 fois les mêmes params, cette étape est coûteuse
 *  on sépare en revanche les vos par type_id et par type de modification (si on modifie 3 fois un vo on veut toutes les modifications pour l'invalidation donc on ignore rien par contre)
 */
export default class VarsDatasVoUpdateHandler {

    public static VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME = 'VarsDatasVoUpdateHandler.ordered_vos_cud';
    public static delete_instead_of_invalidating_unregistered_var_datas_PARAM_NAME = 'VarsDatasVoUpdateHandler.delete_instead_of_invalidating_unregistered_var_datas';

    public static TASK_NAME_has_vos_cud: string = 'VarsDatasVoUpdateHandler.has_vos_cud';
    public static TASK_NAME_push_invalidate_matroids: string = 'VarsDatasVoUpdateHandler.push_invalidate_matroids';
    public static TASK_NAME_push_invalidate_intersectors: string = 'VarsDatasVoUpdateHandler.push_invalidate_intersectors';
    public static TASK_NAME_register_vo_cud = 'VarsDatasVoUpdateHandler.register_vo_cud';
    public static TASK_NAME_filter_varsdatas_cache_by_matroids_intersection: string = 'VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_matroids_intersection';
    public static TASK_NAME_filter_varsdatas_cache_by_exact_matroids: string = 'VarsDatasVoUpdateHandler.filter_varsdatas_cache_by_exact_matroids';

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

    public register_vo_cud = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.register_vo_cud_throttled.bind(this), 1000, { leading: true, trailing: true });

    private last_registration: number = null;

    /**
     * le JSON ne devrait être utilisé que au lancement de l'appli, mais systématiquement par contre au lancement, le reste du temps c'est l'appli qui fait référence pour les voscud
     */
    private has_retrieved_vos_cud: boolean = false;

    /**
     * La liste des intersecteurs à appliquer pour invalider les vars en base
     */
    private invalidate_intersectors: VarDataBaseVO[] = [];
    /**
     * La liste des matroids à invalider
     */
    private invalidate_matroids: VarDataBaseVO[] = [];

    private throttled_update_param = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_param.bind(this), 30000, { leading: false, trailing: true });
    private throttle_push_invalidate_intersectors = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.throttled_push_invalidate_intersectors.bind(this), 1000, { leading: false, trailing: true });
    private throttle_push_invalidate_matroids = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.throttled_push_invalidate_matroids.bind(this), 1000, { leading: false, trailing: true });

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, this.register_vo_cud.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_has_vos_cud, this.has_vos_cud.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_matroids_intersection, this.filter_varsdatas_cache_by_matroids_intersection.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids, this.filter_varsdatas_cache_by_exact_matroids.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_intersectors, this.push_invalidate_intersectors.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_matroids, this.push_invalidate_matroids.bind(this));
    }

    /**
     * Demander l'invalidation par intersecteurs (mais sans remonter l'arbre)
     * @param invalidate_intersectors
     * @returns
     */
    public async push_invalidate_intersectors(invalidate_intersectors: VarDataBaseVO[]): Promise<void> {
        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                reject,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_intersectors,
                resolve,
                invalidate_intersectors)) {
                return;
            }

            this.throttle_push_invalidate_intersectors(invalidate_intersectors);
            resolve();
        });
    }

    /**
     * Demander l'invalidation de matroids exacts (mais sans remonter l'arbre)
     * @param invalidate_matroids
     * @returns
     */
    public async push_invalidate_matroids(invalidate_matroids: VarDataBaseVO[]): Promise<void> {
        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                reject,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasVoUpdateHandler.TASK_NAME_push_invalidate_matroids,
                resolve,
                invalidate_matroids)) {
                return;
            }

            this.throttle_push_invalidate_matroids(invalidate_matroids);
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

                let uid: number = StackContext.getInstance().get('UID');
                let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');
                if (uid) {
                    await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'force_empty_vars_datas_vo_update_cache.done', true);
                }
                ConsoleHandler.getInstance().warn("Cache des modifications de VO vidé. Prêt pour le redémarrage");
                return;
            }
            await ThreadHandler.getInstance().sleep(5000);
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

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__handle_buffer],
            async () => {

                this.last_call_handled_something = false;

                if (!this.has_retrieved_vos_cud) {
                    this.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValue(
                        VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

                    this.has_retrieved_vos_cud = true;
                }

                if ((!this.ordered_vos_cud) || (!this.ordered_vos_cud.length)) {
                    return false;
                }

                // if ((!this.ordered_vos_cud) || (!this.ordered_vos_cud.length)) {

                //     this.set_ordered_vos_cud_from_JSON(await ModuleParams.getInstance().getParamValue(
                //         VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME));

                //     return false; // je vois pas pourquoi .... this.last_registration && Dates.now() .add(-500, 'ms').isBefore(this.last_registration);
                // }

                this.last_call_handled_something = true;

                // Si on a des modifs en cours, on refuse de dépiler de suite pour éviter de faire des calculs en boucle
                // Sauf si on a trop de demandes déjà en attente dans ce cas on commence à dépiler pour alléger la mémoire
                if ((this.ordered_vos_cud.length < 1000) && this.last_registration && ((Dates.now() - 1) < this.last_registration)) {
                    return true;
                }

                let limit = this.ordered_vos_cud.length;

                let vo_types: string[] = [];
                let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
                let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

                limit = this.prepare_updates(limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);

                let intersectors_by_index: { [index: string]: VarDataBaseVO } = await this.init_leaf_intersectors(vo_types, vos_update_buffer, vos_create_or_delete_buffer);

                await this.invalidate_datas_and_parents(intersectors_by_index);

                // On met à jour le param en base pour refléter les modifs qui restent en attente de traitement
                this.throttled_update_param();

                // Si on continue d'invalider des Vos on attend sagement avant de relancer les calculs
                return this.last_registration && ((Dates.now() - 1) < this.last_registration);
            },
            this
        );
    }

    /**
     * Opti de suppression des vars, sans triggers !
     *  WARN ça signifie que les triggers sur suppression de vardata sont interdits à ce stade
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

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 3));

        for (let api_type_id in varindexes_by_api_type_id) {
            let indexes = varindexes_by_api_type_id[api_type_id];

            if ((!indexes) || (!indexes.length)) {
                continue;
            }

            if (promises.length >= max) {
                await Promise.all(promises);
                promises = [];
            }

            promises.push((async () => {
                let moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
                let request = "DELETE FROM " + moduleTable.full_name + " WHERE _bdd_only_index in ('" + indexes.join("','") + "');";
                await ModuleDAOServer.getInstance().query(request);
            })());
        }

        if (!!promises.length) {
            await Promise.all(promises);
        }
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
        intersectors_by_index: { [index: string]: VarDataBaseVO }
    ) {

        let solved_intersectors_by_index: { [index: string]: VarDataBaseVO } = {};
        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__invalidate_datas_and_parents],
            async () => {

                let promises = [];
                let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 3));
                let invalidate_intersectors: VarDataBaseVO[] = [];

                while (ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors_by_index)) {
                    for (let i in intersectors_by_index) {
                        let intersector = intersectors_by_index[i];

                        if (DEBUG_VARS) {
                            ConsoleHandler.getInstance().log('invalidate_datas_and_parents:START SOLVING:' + intersector.index + ':');
                        }
                        if (solved_intersectors_by_index[intersector.index]) {
                            continue;
                        }
                        solved_intersectors_by_index[intersector.index] = intersector;
                        invalidate_intersectors.push(intersector);

                        if (promises.length >= max) {
                            await Promise.all(promises);
                            promises = [];
                        }

                        promises.push((async () => {

                            let deps_intersectors = await this.get_deps_intersectors(intersector);

                            for (let j in deps_intersectors) {
                                let dep_intersector = deps_intersectors[j];

                                if (intersectors_by_index[dep_intersector.index]) {
                                    continue;
                                }
                                if (solved_intersectors_by_index[dep_intersector.index]) {
                                    continue;
                                }

                                if (DEBUG_VARS) {
                                    ConsoleHandler.getInstance().log('invalidate_datas_and_parents:' + intersector.index + '=>' + dep_intersector.index + ':');
                                }

                                intersectors_by_index[dep_intersector.index] = dep_intersector;
                            }

                            if (DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('invalidate_datas_and_parents:END SOLVING:' + intersector.index + ':');
                            }
                            delete intersectors_by_index[intersector.index];
                        })());
                    }

                    if (promises && promises.length) {
                        await Promise.all(promises);
                    }
                }

                await this.push_invalidate_intersectors(invalidate_intersectors);
            },
            this
        );
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

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__update_param],
            async () => {

                await ModuleParams.getInstance().setParamValue(
                    VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_ordered_vos_cud_PARAM_NAME,
                    this.getJSONFrom_ordered_vos_cud());
            },
            this
        );
    }

    public async handle_invalidate_intersectors() {
        if (this.invalidate_intersectors && this.invalidate_intersectors.length) {
            ConsoleHandler.getInstance().log('handle_invalidate_intersectors:IN:' + this.invalidate_intersectors.length);

            // On va faire l'union de tous les invalidate_intersectors pour avoir un ensemble de tous les intersecteurs à invalider
            // On regroupe par var_id
            let invalidate_intersectors_by_var_id: { [var_id: string]: VarDataBaseVO[] } = {};
            let old_invalidate_intersectors = cloneDeep(this.invalidate_intersectors);

            for (let i in old_invalidate_intersectors) {
                let invalidate_intersector = old_invalidate_intersectors[i];

                if (!invalidate_intersectors_by_var_id[invalidate_intersector.var_id]) {
                    invalidate_intersectors_by_var_id[invalidate_intersector.var_id] = [];
                }

                invalidate_intersectors_by_var_id[invalidate_intersector.var_id].push(invalidate_intersector);
            }

            let invalidate_intersectors = [];

            for (let i in invalidate_intersectors_by_var_id) {
                if (!invalidate_intersectors_by_var_id[i]) {
                    continue;
                }

                // TEMP DEBUG JFE :
                // for (let j in invalidate_intersectors_by_var_id[i]) {
                //     console.log('avant union;' + invalidate_intersectors_by_var_id[i][j].var_id + ';' + invalidate_intersectors_by_var_id[i][j]._bdd_only_index);
                // }

                let res = MatroidController.getInstance().union(invalidate_intersectors_by_var_id[i]);

                if (res && (res.length > 0)) {
                    invalidate_intersectors.push(...res);

                    // TEMP DEBUG JFE :
                    // for (let k in res) {
                    //     console.log('apres union;' + res[k].var_id + ';' + res[k]._bdd_only_index);
                    // }
                }
            }

            ConsoleHandler.getInstance().log('handle_invalidate_intersectors:UNION:' + invalidate_intersectors.length);

            this.invalidate_intersectors = [];
            await this.intersect_invalid_datas_and_push_for_update(invalidate_intersectors);
            ConsoleHandler.getInstance().log('handle_invalidate_intersectors:OUT:' + invalidate_intersectors.length + '=>' + this.invalidate_intersectors.length);
        }
    }

    public async handle_invalidate_matroids() {
        if (this.invalidate_matroids && this.invalidate_matroids.length) {
            ConsoleHandler.getInstance().log('handle_invalidate_matroids:IN:' + this.invalidate_matroids.length);
            let invalidate_matroids = this.invalidate_matroids;
            this.invalidate_matroids = [];
            await this.invalidate_exact_datas_and_push_for_update(invalidate_matroids);
            ConsoleHandler.getInstance().log('handle_invalidate_matroids:OUT:' + invalidate_matroids.length + '=>' + this.invalidate_matroids.length);
        }
    }

    private throttled_push_invalidate_intersectors(invalidate_intersectors: VarDataBaseVO[]) {
        this.invalidate_intersectors = this.invalidate_intersectors.concat(invalidate_intersectors);
        VarsdatasComputerBGThread.getInstance().force_run_asap();
    }

    private throttled_push_invalidate_matroids(invalidate_matroids: VarDataBaseVO[]) {
        this.invalidate_matroids = this.invalidate_matroids.concat(invalidate_matroids);
        VarsdatasComputerBGThread.getInstance().force_run_asap();
    }

    /**
     * Se lance sur le thread des vars
     */
    private filter_varsdatas_cache_by_matroids_intersection(
        api_type_id: string,
        matroids: IMatroid[],
        fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<VarDataBaseVO[]> {

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                //TODO fixme do something to inform user
                ConsoleHandler.getInstance().error('failed filter_varsdatas_cache_by_matroids_intersection' + error);
                resolve([]);
            };

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                thrower,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_matroids_intersection,
                resolve,
                api_type_id,
                matroids,
                fields_ids_mapper)) {
                return;
            }

            let res: VarDataBaseVO[] = [];

            for (let i in matroids) {
                res = res.concat(this.filter_varsdatas_cache_by_matroid_intersection(api_type_id, matroids[i], fields_ids_mapper));
            }

            resolve(res);
        });
    }

    /**
     * Doit être lancé depuis le thread des vars
     */
    private filter_varsdatas_cache_by_matroid_intersection(
        api_type_id: string,
        matroid: IMatroid,
        fields_ids_mapper: { [matroid_field_id: string]: string }): VarDataBaseVO[] {

        let res: VarDataBaseVO[] = [];

        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        let matroid_fields = MatroidController.getInstance().getMatroidFields(matroid._type);

        if (!moduleTable) {
            return null;
        }

        for (let i in VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes) {
            let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[i];

            if (wrapper.var_data._type != api_type_id) {
                continue;
            }

            if (!!(matroid as VarDataBaseVO).var_id) {

                if (wrapper.var_data.var_id != (matroid as VarDataBaseVO).var_id) {
                    continue;
                }
            }

            let isok = true;
            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];

                let ranges: IRange[] = matroid[matroid_field.field_id];
                let field = moduleTable.getFieldFromId((fields_ids_mapper && fields_ids_mapper[matroid_field.field_id]) ? fields_ids_mapper[matroid_field.field_id] : matroid_field.field_id);

                if (!RangeHandler.getInstance().any_range_intersects_any_range(
                    wrapper.var_data[field.field_id],
                    ranges)) {
                    isok = false;
                    break;
                }
            }
            if (!isok) {
                continue;
            }

            res.push(wrapper.var_data);
        }

        return res;
    }

    /**
     * Se lance sur le thread des vars
     */
    private filter_varsdatas_cache_by_exact_matroids(
        matroids: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                //TODO fixme do something to inform user
                ConsoleHandler.getInstance().error('failed filter_varsdatas_cache_by_exact_matroids' + error);
                resolve([]);
            };

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                thrower,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasVoUpdateHandler.TASK_NAME_filter_varsdatas_cache_by_exact_matroids,
                resolve,
                matroids)) {
                return;
            }

            let res: VarDataBaseVO[] = [];

            for (let i in matroids) {
                let param = this.filter_varsdatas_cache_by_exact_matroid(matroids[i]);
                if (!!param) {
                    res.push(param);
                }
            }

            resolve(res);
        });
    }

    /**
     * Doit être lancé depuis le thread des vars
     */
    private filter_varsdatas_cache_by_exact_matroid(matroid: VarDataBaseVO): VarDataBaseVO {
        let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[matroid.index];

        return wrapper ? wrapper.var_data : null;
    }

    /**
     * Recherche en BDD et en cache les var_datas passés en param (exactement), et on push les invalidations dans le buffer de vars
     * @param invalidate_matroids
     */
    private async invalidate_exact_datas_and_push_for_update(invalidate_matroids: VarDataBaseVO[]) {

        let matroids_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
        for (let i in invalidate_matroids) {
            let invalidate_intersector = invalidate_matroids[i];

            if (!matroids_by_var_id[invalidate_intersector.var_id]) {
                matroids_by_var_id[invalidate_intersector.var_id] = {};
            }
            matroids_by_var_id[invalidate_intersector.var_id][invalidate_intersector.index] = invalidate_intersector;
        }

        for (let var_id_s in matroids_by_var_id) {
            let matroids = matroids_by_var_id[var_id_s];

            if ((!matroids) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(matroids))) {
                continue;
            }

            let sample_inter = matroids[ObjectHandler.getInstance().getFirstAttributeName(matroids)];
            let list = Object.values(matroids);

            let indexes = Object.keys(matroids);
            if ((!indexes) || (!indexes.length)) {
                return;
            }
            let var_datas: VarDataBaseVO[] = await query(sample_inter._type).filter_by_text_eq('_bdd_only_index', indexes).select_vos<VarDataBaseVO>();
            let cached: VarDataBaseVO[] = await this.filter_varsdatas_cache_by_exact_matroids(list);

            await this.handle_invalidation(var_datas, cached);
        }
    }

    private async handle_invalidation(
        var_datas: VarDataBaseVO[],
        cached: VarDataBaseVO[],
    ) {
        let env = ConfigurationService.getInstance().node_configuration;

        /**
         * On ajoute les vars subs (front et back) et les vars en cache
         */
        let registered_var_datas: VarDataBaseVO[] = [];

        // pour les vars subs en front,
        //  soit on est en bdd(donc on vient de la trouver et on peut filtrer sur celles chargées de la bdd)
        //  soit on est en cache et on les trouve en dessous
        registered_var_datas = await VarsTabsSubsController.getInstance().filter_by_subs(var_datas);
        registered_var_datas = (registered_var_datas && registered_var_datas.length) ?
            ((cached && cached.length) ? registered_var_datas.concat(cached) : registered_var_datas) : cached;

        let var_data_by_index: { [index: string]: VarDataBaseVO } = {};

        /**
         * Tout sauf les imports et les denied
         */
        let var_datas_no_denied_and_no_import: VarDataBaseVO[] = [];

        for (let i in var_datas) {
            let var_data = var_datas[i];
            var_data_by_index[var_data.index] = var_data;

            if ((var_data.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) && (var_data.value_type != VarDataBaseVO.VALUE_TYPE_DENIED)) {
                delete var_data.value;
                var_data.value_ts = null;
                var_datas_no_denied_and_no_import.push(var_data);
            }
        }

        // Si on retrouve les mêmes qu'en bdd on ignore, on est déjà en train de les invalider
        for (let i in registered_var_datas) {
            let registered_var_data = registered_var_datas[i];

            if ((registered_var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) || (registered_var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED)) {
                continue;
            }

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

        let delete_instead_of_invalidating_unregistered_var_datas = await ModuleParams.getInstance().getParamValueAsBoolean(VarsDatasVoUpdateHandler.delete_instead_of_invalidating_unregistered_var_datas_PARAM_NAME, true);

        if (registered_var_datas && registered_var_datas.length) {
            if (env.DEBUG_VARS) {
                registered_var_datas.forEach((v) => ConsoleHandler.getInstance().log(
                    'find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_registered_var_datas:INDEXES:' + v.index));
            }
            // On supprime quand même en bdd ces vars sinon on rechargera la version de la bdd à moment donné
            let bdd_vars_registered = registered_var_datas.filter((v) => (!!v.id) &&
                (v.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) && (v.value_type != VarDataBaseVO.VALUE_TYPE_DENIED));
            if (bdd_vars_registered && bdd_vars_registered.length) {
                await this.delete_vars_pack_without_triggers(bdd_vars_registered);
                if (env.DEBUG_VARS) {
                    ConsoleHandler.getInstance().log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_registered_var_datas:DELETED ' + bdd_vars_registered.length + ' vars from BDD cache.');
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
            await VarsDatasProxy.getInstance().prepend_var_datas(bdd_vars_registered, false);

            // // bdd_vars_registered à la place de registered_var_datas : pourquoi on remettrait en calcul les imports et denied ?
            // // si on les remet en calcul, c'est pour mettre à jour les calculs en bdd à la fin donc on indique cela (avec false)
            // await VarsDatasProxy.getInstance().prepend_var_datas(bdd_vars_registered, false);
            if (env.DEBUG_VARS) {
                ConsoleHandler.getInstance().log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_registered_var_datas:RECALC  ' + registered_var_datas.length + ' vars from APP cache.');
            }
        }

        if (unregistered_var_datas && unregistered_var_datas.length) {
            if (env.DEBUG_VARS) {
                unregistered_var_datas.forEach((v) => ConsoleHandler.getInstance().log(
                    'find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:INDEXES:' + v.index));
            }

            /**
             * Ajout de la fonctionnalité de pixellisation et de non suppression des pixels
             *  si on a une pixellisation sur la varconf, et que les pixels ne doivent pas être supprimés, en cas d'invalidation de pixel
             *  on les append aux prochains calculs.
             */
            let vars_to_delete: VarDataBaseVO[] = [];
            let vars_to_append: VarDataBaseVO[] = [];

            for (let i in unregistered_var_datas) {
                let unregistered_var_data = unregistered_var_datas[i];

                if (!delete_instead_of_invalidating_unregistered_var_datas) {
                    vars_to_append.push(unregistered_var_data);
                    continue;
                }

                let conf = VarsController.getInstance().var_conf_by_id[unregistered_var_data.var_id];
                if (conf.pixel_activated && conf.pixel_never_delete) {
                    vars_to_append.push(unregistered_var_data);
                    continue;
                }

                vars_to_delete.push(unregistered_var_data);
            }

            if (vars_to_delete && vars_to_delete.length) {
                // On fait les suppressions en parallèle
                await this.delete_vars_pack_without_triggers(vars_to_delete);
                if (env.DEBUG_VARS) {
                    ConsoleHandler.getInstance().log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:DELETED ' + unregistered_var_datas.length + ' vars from BDD cache.');
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

                await VarsDatasProxy.getInstance().append_var_datas(vars_to_append);
                if (env.DEBUG_VARS) {
                    ConsoleHandler.getInstance().log('find_invalid_datas_and_push_for_update:delete_instead_of_invalidating_unregistered_var_datas:RECALC  ' + unregistered_var_datas.length + ' vars from BDD cache.');
                }
            }
        }
    }

    /**
     * Recherche en BDD et en cache par intersection des var_datas qui correspondent aux intersecteurs, et on push les invalidations dans le buffer de vars
     * @param invalidate_intersectors
     */
    private async intersect_invalid_datas_and_push_for_update(invalidate_intersectors: VarDataBaseVO[]) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasVoUpdateHandler__find_invalid_datas_and_push_for_update],
            async () => {

                let intersectors_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
                for (let i in invalidate_intersectors) {
                    let invalidate_intersector = invalidate_intersectors[i];

                    if (!intersectors_by_var_id[invalidate_intersector.var_id]) {
                        intersectors_by_var_id[invalidate_intersector.var_id] = {};
                    }
                    intersectors_by_var_id[invalidate_intersector.var_id][invalidate_intersector.index] = invalidate_intersector;
                }

                let var_datas_by_index: { [index: string]: VarDataBaseVO } = {};
                let cached_by_index: { [index: string]: VarDataBaseVO } = {};

                let promises = [];

                let max_connections_to_use: number = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL - 1));

                for (let var_id_s in intersectors_by_var_id) {
                    let intersectors = intersectors_by_var_id[var_id_s];

                    if ((!intersectors) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(intersectors))) {
                        continue;
                    }

                    let sample_inter = intersectors[ObjectHandler.getInstance().getFirstAttributeName(intersectors)];
                    let list = Object.values(intersectors);

                    if ((!!max_connections_to_use) && (promises.length >= max_connections_to_use)) {
                        await Promise.all(promises);
                        promises = [];
                    }

                    promises.push((async () => {
                        let tmp_var_datas: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroidsIntersections(sample_inter._type, list, null);

                        if (tmp_var_datas && (tmp_var_datas.length > 0)) {
                            for (let i in tmp_var_datas) {
                                let var_data = tmp_var_datas[i];
                                var_datas_by_index[var_data.index] = var_data;
                            }
                        }
                    })());

                    promises.push((async () => {
                        let tmp_cached: VarDataBaseVO[] = await this.filter_varsdatas_cache_by_matroids_intersection(sample_inter._type, list, null);

                        if (tmp_cached && (tmp_cached.length > 0)) {
                            for (let i in tmp_cached) {
                                let var_data = tmp_cached[i];
                                cached_by_index[var_data.index] = var_data;
                            }
                        }
                    })());
                }

                if (promises.length > 0) {
                    await Promise.all(promises);
                    promises = [];
                }

                await this.handle_invalidation(
                    Object.values(var_datas_by_index),
                    Object.values(cached_by_index),
                );
            },
            this
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
                ConsoleHandler.getInstance().warn('VarsDatasVoUpdateHandler:compute_intersectors:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
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

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: Check Vars Deps GRAPH - And build it ...');

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_create_or_delete_buffer ...');
                for (let vos_create_or_delete_buffer_i in vos_create_or_delete_buffer) {
                    let vos = vos_create_or_delete_buffer[vos_create_or_delete_buffer_i];

                    for (let vo_i in vos) {
                        let vo = vos[vo_i];

                        ConsoleHandler.getInstance().error(
                            JSON.stringify(VOsTypesManager.getInstance().moduleTables_by_voType[vo._type].get_bdd_version(vo)));
                    }
                }
                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_create_or_delete_buffer ---');

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_update_buffer ...');
                for (let vos_update_buffer_i in vos_update_buffer) {
                    let vos = vos_update_buffer[vos_update_buffer_i];

                    for (let vo_i in vos) {
                        let vo: DAOUpdateVOHolder<IDistantVOBase> = vos[vo_i];

                        ConsoleHandler.getInstance().error(
                            JSON.stringify(VOsTypesManager.getInstance().moduleTables_by_voType[vo.post_update_vo._type].get_bdd_version(vo.post_update_vo)));
                    }
                }
                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: vos_update_buffer ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_ctrls_to_update_1st_stage ...');
                // for (let var_id in original_ctrls_to_update_1st_stage) {
                //     let var_: VarServerControllerBase<VarDataBaseVO> = original_ctrls_to_update_1st_stage[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + var_.varConf.name);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_ctrls_to_update_1st_stage ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: ctrls_to_update_1st_stage ...');
                // for (let var_id in ctrls_to_update_1st_stage) {
                //     let var_: VarServerControllerBase<VarDataBaseVO> = ctrls_to_update_1st_stage[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + var_.varConf.name);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: ctrls_to_update_1st_stage ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_markers ...');
                // for (let var_id in original_markers) {
                //     let e: number = original_markers[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + e);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: original_markers ---');

                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: markers ...');
                // for (let var_id in markers) {
                //     let e: number = markers[var_id];

                //     ConsoleHandler.getInstance().error(var_id + ':' + e);
                // }
                // ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: markers ---');

                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: intersectors_by_var_id ...');
                for (let var_id in intersectors_by_var_id) {
                    let vos = intersectors_by_var_id[var_id];

                    for (let index in vos) {

                        ConsoleHandler.getInstance().error(var_id + ':' + index);
                    }
                }
                ConsoleHandler.getInstance().error('DEAD DEP LOOP : compute_intersectors: intersectors_by_var_id ---');

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

        for (let i in vo_types) {
            let vo_type = vo_types[i];

            for (let j in VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type]) {
                let var_controller = VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type][j];

                for (let k in vos_create_or_delete_buffer[vo_type]) {
                    let vo_create_or_delete = vos_create_or_delete_buffer[vo_type][k];

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_C_POST_D(vo_create_or_delete);
                    if ((!tmp) || (!tmp.length)) {
                        continue;
                    }
                    tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                }

                for (let k in vos_update_buffer[vo_type]) {
                    let vo_update_buffer = vos_update_buffer[vo_type][k];

                    let tmp = await var_controller.get_invalid_params_intersectors_on_POST_U(vo_update_buffer);
                    if ((!tmp) || (!tmp.length)) {
                        continue;
                    }
                    tmp.forEach((e) => e ? intersectors_by_index[e.index] = e : null);
                }
            }
        }

        return intersectors_by_index;
    }

    /**
     * Préparation du batch d'invalidation des vars suite à des CUD de vos
     * @param limit nombre max de CUDs à prendre en compte dans ce batch
     * @param vos_update_buffer les updates par type à remplir
     * @param vos_create_or_delete_buffer les creates / deletes par type à remplir
     * @param vo_types la liste des vo_types à remplir
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon (et donc le buffer est vide)
     */
    private prepare_updates(limit: number, vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> }, vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] }, vo_types: string[]): number {

        let start_time = Dates.now();
        let real_start_time = start_time;

        while ((limit > 0) && this.ordered_vos_cud && this.ordered_vos_cud.length) {


            let actual_time = Dates.now();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.getInstance().warn('VarsDatasVoUpdateHandler:prepare_updates:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
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

            limit--;
        }

        return limit;
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
            ConsoleHandler.getInstance().error('Impossible de recharger le ordered_vos_cud from params :' + jsoned + ':');
        }
    }

    private async register_vo_cud_throttled(vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase>) {

        if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasVoUpdateHandler.TASK_NAME_register_vo_cud, vos_cud)) {
            return;
        }

        this.ordered_vos_cud = this.ordered_vos_cud.concat(vos_cud);
        this.last_registration = Dates.now();

        this.throttled_update_param();
        VarsdatasComputerBGThread.getInstance().force_run_asap();
    }
}