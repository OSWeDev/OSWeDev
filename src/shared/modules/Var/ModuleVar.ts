import AccessPolicyTools from '../../tools/AccessPolicyTools';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ContextFilterVO from '../ContextFilter/vos/ContextFilterVO';
import { query } from '../ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../Cron/ManualTasksController';
import ModuleDAO from '../DAO/ModuleDAO';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import APISimpleVOsParamVO, { APISimpleVOsParamVOStatic } from '../DAO/vos/APISimpleVOsParamVO';
import VOFieldRefVO from '../DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import APIGetVarDataByIndexParamVO from './params/APIGetVarDataByIndexParamVO';
import VarsController from './VarsController';
import VarsPerfMonController from './VarsPerfMonController';
import GetVarParamFromContextFiltersParamVO, { GetVarParamFromContextFiltersParamVOStatic } from './vos/GetVarParamFromContextFiltersParamVO';
import SlowVarVO from './vos/SlowVarVO';
import VarBatchNodePerfVO from './vos/VarBatchNodePerfVO';
import VarBatchPerfVO from './vos/VarBatchPerfVO';
import VarBatchVarPerfVO from './vos/VarBatchVarPerfVO';
import VarCacheConfVO from './vos/VarCacheConfVO';
import VarComputeTimeLearnBaseVO from './vos/VarComputeTimeLearnBaseVO';
import VarConfAutoDepVO from './vos/VarConfAutoDepVO';
import VarConfIds from './vos/VarConfIds';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';
import VarDataValueResVO from './vos/VarDataValueResVO';
import VarNodeParentPerfVO from './vos/VarNodeParentPerfVO';
import VarNodePerfElementVO from './vos/VarNodePerfElementVO';
import VarParamFieldTransformStrategyVO from './vos/VarParamFieldTransformStrategyVO';
import VarPerfElementVO from './vos/VarPerfElementVO';
import VarPerfVO from './vos/VarPerfVO';
import VarPixelFieldConfVO from './vos/VarPixelFieldConfVO';

export default class ModuleVar extends Module {

    public static MODULE_NAME: string = 'Var';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleVar.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_VARCONF_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_VARCONF_ACCESS';
    public static POLICY_BO_IMPORTED_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_IMPORTED_ACCESS';
    public static POLICY_DESC_MODE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.DESC_MODE_ACCESS';

    public static APINAME_getSimpleVarDataValueSumFilterByMatroids: string = 'getSimpleVarDataValueSumFilterByMatroids';
    public static APINAME_getSimpleVarDataCachedValueFromParam: string = 'getSimpleVarDataCachedValueFromParam';
    public static APINAME_configureVarCache: string = 'configureVarCache';

    public static APINAME_get_var_id_by_names: string = 'get_var_id_by_names';
    public static APINAME_register_params: string = 'register_params';
    public static APINAME_update_params_registration: string = 'update_params_registration';
    public static APINAME_unregister_params: string = 'unregister_params';

    public static APINAME_get_var_data_by_index: string = 'get_var_data_by_index';

    public static APINAME_getVarControllerVarsDeps: string = 'getVarControllerVarsDeps';
    public static APINAME_getParamDependencies: string = 'getParamDependencies';
    public static APINAME_getVarControllerDSDeps: string = 'getVarControllerDSDeps';
    public static APINAME_getVarParamDatas: string = 'getVarParamDatas';
    public static APINAME_getAggregatedVarDatas: string = 'getAggregatedVarDatas';

    public static APINAME_getVarParamFromContextFilters: string = 'getVarParamFromContextFilters';

    // public static APINAME_invalidate_cache_intersection: string = 'invalidate_cache_intersection';
    public static APINAME_delete_cache_intersection: string = 'delete_cache_intersection';
    public static APINAME_delete_cache_and_imports_intersection: string = 'delete_cache_and_imports_intersection';

    public static APINAME_invalidate_cache_exact: string = 'invalidate_cache_exact';
    public static APINAME_invalidate_cache_exact_and_parents: string = 'invalidate_cache_exact_and_parents';
    public static APINAME_invalidate_cache_intersection_and_parents: string = 'invalidate_cache_intersection_and_parents';

    public static MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache = 'force_empty_vars_datas_vo_update_cache';
    // public static MANUAL_TASK_NAME_switch_force_1_by_1_computation = 'switch_force_1_by_1_computation';
    public static MANUAL_TASK_NAME_switch_add_computation_time_to_learning_base = 'switch_add_computation_time_to_learning_base';

    public static getInstance(): ModuleVar {
        if (!ModuleVar.instance) {
            ModuleVar.instance = new ModuleVar();
        }
        return ModuleVar.instance;
    }

    private static instance: ModuleVar = null;

    public invalidate_cache_exact: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_exact);
    public invalidate_cache_exact_and_parents: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_exact_and_parents);
    public invalidate_cache_intersection_and_parents: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_intersection_and_parents);
    public delete_cache_and_imports_intersection: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_delete_cache_and_imports_intersection);
    public delete_cache_intersection: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_delete_cache_intersection);
    public getVarControllerDSDeps: (var_name: string) => Promise<string[]> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarControllerDSDeps);
    public getVarControllerVarsDeps: (var_name: string) => Promise<{ [dep_name: string]: string }> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarControllerVarsDeps);
    public getParamDependencies: (param: VarDataBaseVO) => Promise<{ [dep_id: string]: VarDataBaseVO }> = APIControllerWrapper.sah(ModuleVar.APINAME_getParamDependencies);
    public getVarParamDatas: (param: VarDataBaseVO) => Promise<{ [ds_name: string]: string }> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarParamDatas);
    public getAggregatedVarDatas: (param: VarDataBaseVO) => Promise<{ [var_data_index: string]: VarDataBaseVO }> = APIControllerWrapper.sah(ModuleVar.APINAME_getAggregatedVarDatas);
    /**
     * appelle la fonction {@link ModuleVarServer.register_params register_params} coté server
     * @see {@link ModuleVarServer.register_params}
     */
    public register_params: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_register_params);
    public update_params_registration: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_update_params_registration);
    public unregister_params: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_unregister_params);
    public get_var_id_by_names: () => Promise<VarConfIds> = APIControllerWrapper.sah(ModuleVar.APINAME_get_var_id_by_names);

    public get_var_data_by_index: <T extends VarDataBaseVO>(var_data_api_type_id: string, var_data_index: string) => Promise<T> = APIControllerWrapper.sah(ModuleVar.APINAME_get_var_data_by_index);

    public getVarParamFromContextFilters: (
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        active_api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        accept_max_ranges?: boolean,
    ) => Promise<VarDataBaseVO> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarParamFromContextFilters);

    public initializedasync_VarsController: boolean = false;

    private constructor() {

        super("var", ModuleVar.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeVarPixelFieldConfVO();
        this.initializeVarConfVO();
        this.initializeVarCacheConfVO();
        this.initializeVarDataValueResVO();
        this.initializeVarPerfVO();
        this.initializeSlowVarVO();
        this.initializeVarComputeTimeLearnBaseVO();
        this.initVarBatchPerfVO();
        this.initVarBatchVarPerfVO();
        this.initializeVarPerfElementVO();
        this.initVarBatchNodePerfVO();
        this.initVarNodeParentPerfVO();
        this.initVarNodePerfElementVO();

        VarsPerfMonController.getInstance().initialize_VarControllerPMLInfosVO(this);
        VarsPerfMonController.getInstance().initialize_DSControllerPMLInfosVO(this);
        VarsPerfMonController.getInstance().initialize_MatroidBasePMLInfoVO(this);

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache] = null;
        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_switch_add_computation_time_to_learning_base] = null;
        // ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_switch_force_1_by_1_computation] = null;
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_register_params,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_update_params_registration,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_unregister_params,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, { [dep_name: string]: string }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarControllerVarsDeps,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, string[]>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarControllerDSDeps,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [dep_id: string]: VarDataBaseVO }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getParamDependencies,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [ds_name: string]: string }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarParamDatas,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<GetVarParamFromContextFiltersParamVO, VarDataBaseVO>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_getVarParamFromContextFilters,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            GetVarParamFromContextFiltersParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [var_data_index: string]: VarDataBaseVO }>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_getAggregatedVarDatas,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVOStatic
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, VarConfIds>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_get_var_id_by_names,
            [VarConfVO.API_TYPE_ID]
        ));

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<APIGetVarDataByIndexParamVO, VarConfIds>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_get_var_data_by_index,
            ((param: APIGetVarDataByIndexParamVO) => [param.api_type_id])
        ));

        // APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
        //     ModuleVar.POLICY_DESC_MODE_ACCESS,
        //     ModuleVar.APINAME_invalidate_cache_intersection,
        //     (params: VarDataBaseVO[]) => {
        //         let res: string[] = [];

        //         for (let i in params) {
        //             let param = params[i];

        //             if (res.indexOf(param._type) < 0) {
        //                 res.push(param._type);
        //             }
        //         }

        //         return res;
        //     }
        // ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_delete_cache_and_imports_intersection,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_delete_cache_intersection,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_exact_and_parents,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_exact,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_intersection_and_parents,
            (params: VarDataBaseVO[]) => {
                let res: string[] = [];

                for (let i in params) {
                    let param = params[i];

                    if (res.indexOf(param._type) < 0) {
                        res.push(param._type);
                    }
                }

                return res;
            }
        ));
    }

    public async initializeasync(var_conf_by_id: { [var_id: number]: VarConfVO } = null) {
        if (this.initializedasync_VarsController) {
            return;
        }
        this.initializedasync_VarsController = true;

        if (!var_conf_by_id) {
            await VarsController.getInstance().initializeasync(VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(VarConfVO.API_TYPE_ID).select_vos<VarConfVO>()));
        } else {
            await VarsController.getInstance().initializeasync(var_conf_by_id);
        }
    }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.initializeasync();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await this.initializeasync();
        return true;
    }

    private initializeVarComputeTimeLearnBaseVO() {

        let datatable_fields = [
            new ModuleTableField('indexes', ModuleTableField.FIELD_TYPE_string_array, 'Indexs', true),
            new ModuleTableField('human_readable_indexes', ModuleTableField.FIELD_TYPE_string_array, 'Indexs humanisés', true),
            new ModuleTableField('computation_duration', ModuleTableField.FIELD_TYPE_float, 'Durée (ms)', true),
            new ModuleTableField('computation_start_time', ModuleTableField.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        let datatable = new ModuleTable(this, VarComputeTimeLearnBaseVO.API_TYPE_ID, () => new VarComputeTimeLearnBaseVO(), datatable_fields, null, "Base d\'apprentissage des Vars");
        this.datatables.push(datatable);
    }

    private initializeSlowVarVO() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Index du param').unique();
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);

        let datatable_fields = [
            labelField,
            var_id,
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, SlowVarVO.TYPE_NEEDS_TEST).setEnumValues(SlowVarVO.TYPE_LABELS),
            new ModuleTableField('perfs', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'perfs', false),
        ];

        let datatable = new ModuleTable(this, SlowVarVO.API_TYPE_ID, () => new SlowVarVO(), datatable_fields, labelField);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeVarPixelFieldConfVO() {

        let datatable_fields = [
            new ModuleTableField('pixel_vo_api_type_id', ModuleTableField.FIELD_TYPE_string, 'pixel_vo_api_type_id', false),
            new ModuleTableField('pixel_vo_field_id', ModuleTableField.FIELD_TYPE_string, 'pixel_vo_field_id', false),
            new ModuleTableField('pixel_param_field_id', ModuleTableField.FIELD_TYPE_string, 'pixel_param_field_id', false),
            new ModuleTableField('pixel_range_type', ModuleTableField.FIELD_TYPE_int, 'pixel_range_type', false),
            new ModuleTableField('pixel_segmentation_type', ModuleTableField.FIELD_TYPE_int, 'pixel_segmentation_type', false)
        ];

        let datatable = new ModuleTable(this, VarPixelFieldConfVO.API_TYPE_ID, () => new VarPixelFieldConfVO(), datatable_fields, null);
        datatable.define_default_label_function((vo: VarPixelFieldConfVO) => vo.pixel_vo_api_type_id + vo.pixel_vo_field_id, null);
        this.datatables.push(datatable);
    }

    private initVarBatchVarPerfVO() {
        let var_batch_perf_id = new ModuleTableField('var_batch_perf_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var batch perf', true);
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);

        let datatable_fields = [
            var_id,
            var_batch_perf_id,
            new ModuleTableField('ctree_ddeps_try_load_cache_complet', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_try_load_cache_complet', false),
            new ModuleTableField('ctree_ddeps_load_imports_and_split_nodes', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_load_imports_and_split_nodes', false),
            new ModuleTableField('ctree_ddeps_try_load_cache_partiel', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_try_load_cache_partiel', false),
            new ModuleTableField('ctree_ddeps_get_node_deps', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_get_node_deps', false),
            new ModuleTableField('ctree_ddeps_handle_pixellisation', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_handle_pixellisation', false),
            new ModuleTableField('load_node_datas', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'load_node_datas', false),
            new ModuleTableField('compute_node', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'compute_node', false),
        ];

        let datatable = new ModuleTable(this, VarBatchVarPerfVO.API_TYPE_ID, () => new VarBatchVarPerfVO(), datatable_fields, null);
        this.datatables.push(datatable);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        var_batch_perf_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarBatchPerfVO.API_TYPE_ID]);
    }

    private initVarBatchNodePerfVO() {

        let datatable_fields = [
            new ModuleTableField('index', ModuleTableField.FIELD_TYPE_string, 'index', true),
            new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_int, 'var_id', false),

            new ModuleTableField('ctree_deploy_deps', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_deploy_deps', false),
            new ModuleTableField('ctree_ddeps_try_load_cache_complet', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_try_load_cache_complet', false),
            new ModuleTableField('ctree_ddeps_load_imports_and_split_nodes', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_load_imports_and_split_nodes', false),
            new ModuleTableField('ctree_ddeps_try_load_cache_partiel', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_try_load_cache_partiel', false),
            new ModuleTableField('ctree_ddeps_get_node_deps', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_get_node_deps', false),
            new ModuleTableField('ctree_ddeps_handle_pixellisation', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'ctree_ddeps_handle_pixellisation', false),

            new ModuleTableField('load_node_datas', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'load_node_datas', false),
            new ModuleTableField('compute_node', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'compute_node', false),
        ];

        let datatable = new ModuleTable(this, VarBatchNodePerfVO.API_TYPE_ID, () => new VarBatchNodePerfVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }

    private initVarNodeParentPerfVO() {

        let datatable_fields = [
            new ModuleTableField('is_vardag', ModuleTableField.FIELD_TYPE_boolean, 'is_vardag', true, true, false),
            new ModuleTableField('perf_name', ModuleTableField.FIELD_TYPE_string, 'perf_name', false),
        ];

        let datatable = new ModuleTable(this, VarNodeParentPerfVO.API_TYPE_ID, () => new VarNodeParentPerfVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }

    private initVarNodePerfElementVO() {

        let datatable_fields = [
            new ModuleTableField('_start_time', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'start_time (ms)', false),
            new ModuleTableField('_initial_estimated_work_time', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'initial_estimated_work_time (ms)', false),
            new ModuleTableField('_updated_estimated_work_time', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'updated_estimated_work_time (ms)', false),
            new ModuleTableField('total_elapsed_time', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'total_elapsed_time (ms)', false),
            new ModuleTableField('skipped', ModuleTableField.FIELD_TYPE_boolean, 'skipped', true, true, false),
            new ModuleTableField('end_time', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'end_time (ms)', false),
            new ModuleTableField('nb_calls', ModuleTableField.FIELD_TYPE_int, 'nb_calls', true, true, 0),
            new ModuleTableField('sum_card', ModuleTableField.FIELD_TYPE_int, 'sum_card', true, true, 0),
            new ModuleTableField('parent_perf_ref', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'parent_perf_ref', false),
            new ModuleTableField('_nb_started_global', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'nb_started_global', false),
            new ModuleTableField('_initial_estimated_work_time_global', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'initial_estimated_work_time_global (ms)', false),
            new ModuleTableField('_updated_estimated_work_time_global', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'updated_estimated_work_time_global (ms)', false),
            new ModuleTableField('_start_time_global', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'start_time_global (ms)', false),
            new ModuleTableField('_nb_noeuds_global', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'nb_noeuds_global', false),
        ];

        let datatable = new ModuleTable(this, VarNodePerfElementVO.API_TYPE_ID, () => new VarNodePerfElementVO(null, null, null), datatable_fields, null);
        this.datatables.push(datatable);
    }

    private initVarBatchPerfVO() {

        let datatable_fields = [
            new ModuleTableField('batch_id', ModuleTableField.FIELD_TYPE_int, 'batch_id', true),

            new ModuleTableField('batch_wrapper', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'batch_wrapper', false),

            new ModuleTableField('handle_invalidate_validators', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'handle_invalidate_validators', false),

            new ModuleTableField('handle_buffer_varsdatasproxy', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'handle_buffer_varsdatasproxy', false),
            new ModuleTableField('handle_buffer_varsdatasvoupdate', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'handle_buffer_varsdatasvoupdate', false),

            new ModuleTableField('computation_wrapper', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'computation_wrapper', false),

            new ModuleTableField('create_tree', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'create_tree', false),

            new ModuleTableField('load_nodes_datas', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'load_nodes_datas', false),
            new ModuleTableField('compute_node_wrapper', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'compute_node_wrapper', false),

            new ModuleTableField('cache_datas', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'cache_datas', false),

            new ModuleTableField('nb_batch_vars', ModuleTableField.FIELD_TYPE_int, 'nb_batch_vars', false),
        ];

        let datatable = new ModuleTable(this, VarBatchPerfVO.API_TYPE_ID, () => new VarBatchPerfVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }

    private initializeVarPerfElementVO() {
        let datatable_fields = [
            new ModuleTableField('realised_sum_ms', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'realised_sum_ms (ms)', false),
            new ModuleTableField('realised_nb_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'realised_nb_card (ms)', false),
            new ModuleTableField('realised_nb_calls', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'realised_nb_calls (ms)', false),
        ];

        let datatable = new ModuleTable(this, VarPerfElementVO.API_TYPE_ID, () => new VarPerfElementVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }

    private initializeVarConfAutoDepVO(): ModuleTableField<any> {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dep Var conf', false);
        let datatable_fields = [
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type de dep', true, true, VarConfAutoDepVO.DEP_TYPE_STATIC).setEnumValues(VarConfAutoDepVO.DEP_TYPE_LABELS),
            var_id,
            new ModuleTableField('static_value', ModuleTableField.FIELD_TYPE_float, 'Valeur fixe', false, true, 0),
            new ModuleTableField('params_transform_strategies', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Stratégies de transformation des paramètres', false),
        ];

        let datatable = new ModuleTable(this, VarConfAutoDepVO.API_TYPE_ID, () => new VarConfAutoDepVO(), datatable_fields, null, 'Configuration de dependance pour var automatique');
        this.datatables.push(datatable);

        return var_id;
    }

    private initializeVarConfVO() {

        let var_id = this.initializeVarConfAutoDepVO();
        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur');
        let datatable_fields = [
            labelField,

            new ModuleTableField('is_auto', ModuleTableField.FIELD_TYPE_boolean, 'Variable automatisée', true, true, false),
            new ModuleTableField('auto_operator', ModuleTableField.FIELD_TYPE_enum, 'Opérateur automatisé', false).setEnumValues(VarConfVO.AUTO_OPERATEUR_LABELS),

            new ModuleTableField('auto_deps', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Dépendances automatisées', false),
            new ModuleTableField('auto_vofieldref_api_type_id', ModuleTableField.FIELD_TYPE_string, 'API_TYPE_ID vofieldref automatisé', false),
            new ModuleTableField('auto_vofieldref_field_id', ModuleTableField.FIELD_TYPE_string, 'FILED_ID vofieldref automatisé', false),

            new ModuleTableField('auto_param_fields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Fields param automatisé', false),
            new ModuleTableField('auto_param_context_api_type_ids', ModuleTableField.FIELD_TYPE_string_array, 'API_TYPE_IDs context automatisé', false),
            new ModuleTableField('auto_param_context_discarded_field_paths', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Discarded field paths context automatisé', false),
            new ModuleTableField('auto_param_context_use_technical_field_versioning', ModuleTableField.FIELD_TYPE_boolean, 'Use technical fields context automatisé', true, true, false),


            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données'),
            new ModuleTableField('segment_types', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Types des segments du matroid', false),
            new ModuleTableField('show_help_tooltip', ModuleTableField.FIELD_TYPE_boolean, 'Afficher la tooltip d\'aide', true, true, false),
            new ModuleTableField('disable_var', ModuleTableField.FIELD_TYPE_boolean, 'Désactiver la variable', true, true, false),

            new ModuleTableField('aggregator', ModuleTableField.FIELD_TYPE_enum, 'Type d\'aggrégation', true, true, VarConfVO.SUM_AGGREGATOR).setEnumValues(VarConfVO.AGGREGATOR_LABELS),

            new ModuleTableField('pixel_activated', ModuleTableField.FIELD_TYPE_boolean, 'Activer la pixellisation', true, true, false),
            new ModuleTableField('pixel_fields', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Pixeliser sur les champs', false),
            new ModuleTableField('pixel_never_delete', ModuleTableField.FIELD_TYPE_boolean, 'Ne pas supprimer les pixels en cache', true, true, true),
        ];

        let datatable = new ModuleTable(this, VarConfVO.API_TYPE_ID, () => new VarConfVO(undefined, undefined), datatable_fields, labelField);
        this.datatables.push(datatable);
        var_id.addManyToOneRelation(datatable);
    }

    private initializeVarCacheConfVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);
        let datatable_fields = [
            var_id,

            new ModuleTableField('use_cache_read_ms_to_partial_clean', ModuleTableField.FIELD_TYPE_boolean, 'Stocker lectures + clean auto', true, true, true),

            new ModuleTableField('cache_startegy', ModuleTableField.FIELD_TYPE_enum, 'Stratégie de mise en cache', true, true, 0).setEnumValues(VarCacheConfVO.VALUE_CACHE_STRATEGY_LABELS),
            new ModuleTableField('cache_bdd_only_requested_params', ModuleTableField.FIELD_TYPE_boolean, 'Cacher uniquement les params demandés', true, true, true),

            new ModuleTableField('estimated_ctree_ddeps_try_load_cache_complet_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_try_load_cache_complet_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_try_load_cache_partiel_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_try_load_cache_partiel_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_get_node_deps_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_get_node_deps_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_ctree_ddeps_handle_pixellisation_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_ctree_ddeps_handle_pixellisation_1k_card', true, true, 0.001),

            new ModuleTableField('estimated_load_node_datas_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_load_node_datas_1k_card', true, true, 0.001),
            new ModuleTableField('estimated_compute_node_1k_card', ModuleTableField.FIELD_TYPE_decimal_full_precision, 'estimated_compute_node_1k_card', true, true, 0.001),
        ];

        let datatable = new ModuleTable(this, VarCacheConfVO.API_TYPE_ID, () => new VarCacheConfVO(), datatable_fields, null);
        this.datatables.push(datatable);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
    }

    private initializeVarDataValueResVO() {

        let datatable_fields = [
            new ModuleTableField('index', ModuleTableField.FIELD_TYPE_string, 'Index', true),
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur', false),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_int, 'Type', true),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date', false),
            new ModuleTableField('is_computing', ModuleTableField.FIELD_TYPE_boolean, 'En cours de calcul...', false, true, false),
        ];

        let datatable = new ModuleTable(this, VarDataValueResVO.API_TYPE_ID, () => new VarDataValueResVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }


    private initializeVarPerfVO() {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', false);
        let name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        let datatable_fields = [
            var_id,
            name,
            new ModuleTableField('sum_ms', ModuleTableField.FIELD_TYPE_float, 'Tps total en ms', true, true, 0),
            new ModuleTableField('nb_card', ModuleTableField.FIELD_TYPE_float, 'Total cadinaux'),
            new ModuleTableField('nb_calls', ModuleTableField.FIELD_TYPE_float, 'Nombre d\'appels', true, true, 0),
            new ModuleTableField('mean_per_call', ModuleTableField.FIELD_TYPE_float, 'Tps moyen / appel'),
            new ModuleTableField('mean_per_cardinal_1000', ModuleTableField.FIELD_TYPE_float, 'Tps moyen / 1000 card'),
        ];

        let datatable = new ModuleTable(this, VarPerfVO.API_TYPE_ID, () => new VarPerfVO(), datatable_fields, name);
        this.datatables.push(datatable);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
    }
}