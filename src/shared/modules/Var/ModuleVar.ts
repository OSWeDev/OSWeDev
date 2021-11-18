import AccessPolicyTools from '../../tools/AccessPolicyTools';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ContextFilterVO from '../ContextFilter/vos/ContextFilterVO';
import ManualTasksController from '../Cron/ManualTasksController';
import ModuleDAO from '../DAO/ModuleDAO';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import APISimpleVOsParamVO, { APISimpleVOsParamVOStatic } from '../DAO/vos/APISimpleVOsParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import VarsController from './VarsController';
import VarsPerfMonController from './VarsPerfMonController';
import GetVarParamFromContextFiltersParamVO, { GetVarParamFromContextFiltersParamVOStatic } from './vos/GetVarParamFromContextFiltersParamVO';
import SlowVarVO from './vos/SlowVarVO';
import VarCacheConfVO from './vos/VarCacheConfVO';
import VarConfIds from './vos/VarConfIds';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';
import VarDataValueResVO from './vos/VarDataValueResVO';
import VarPerfVO from './vos/VarPerfVO';

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
    public static APINAME_unregister_params: string = 'unregister_params';

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
    // public invalidate_cache_intersection: (vos: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_invalidate_cache_intersection);
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
    public unregister_params: (params: VarDataBaseVO[]) => Promise<void> = APIControllerWrapper.sah(ModuleVar.APINAME_unregister_params);
    public get_var_id_by_names: () => Promise<VarConfIds> = APIControllerWrapper.sah(ModuleVar.APINAME_get_var_id_by_names);

    public getVarParamFromContextFilters: (
        var_name: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        active_api_type_ids: string[]
    ) => Promise<VarDataBaseVO> = APIControllerWrapper.sah(ModuleVar.APINAME_getVarParamFromContextFilters);


    private constructor() {

        super("var", ModuleVar.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeVarConfVO();
        this.initializeVarCacheConfVO();
        this.initializeVarDataValueResVO();
        this.initializeVarPerfVO();
        this.initializeSlowVarVO();

        VarsPerfMonController.getInstance().initialize_VarControllerPMLInfosVO(this);
        VarsPerfMonController.getInstance().initialize_DSControllerPMLInfosVO(this);
        VarsPerfMonController.getInstance().initialize_MatroidBasePMLInfoVO(this);

        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVar.MANUAL_TASK_NAME_force_empty_vars_datas_vo_update_cache] = null;
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
        if (!var_conf_by_id) {
            VarsController.getInstance().initializeasync(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<VarConfVO>(VarConfVO.API_TYPE_ID)));
        } else {
            VarsController.getInstance().initializeasync(var_conf_by_id);
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

    private initializeSlowVarVO() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Index du param');
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);

        let datatable_fields = [
            labelField,
            var_id,
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, SlowVarVO.TYPE_NEEDS_TEST).setEnumValues(SlowVarVO.TYPE_LABELS),
            new ModuleTableField('estimated_calculation_time', ModuleTableField.FIELD_TYPE_int, 'Durée estimée', false),
            new ModuleTableField('computation_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date du batch', true),
        ];

        let datatable = new ModuleTable(this, SlowVarVO.API_TYPE_ID, () => new SlowVarVO(), datatable_fields, labelField);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeVarConfVO() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur');
        let datatable_fields = [
            labelField,

            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données'),
            new ModuleTableField('ts_ranges_field_name', ModuleTableField.FIELD_TYPE_string, 'Nom du champ ts_ranges', false, true, 'ts_ranges'),
            new ModuleTableField('ts_ranges_segment_type', ModuleTableField.FIELD_TYPE_int, 'Segment_type du ts_ranges', false, true, TimeSegment.TYPE_DAY),
            new ModuleTableField('segment_types', ModuleTableField.FIELD_TYPE_plain_vo_obj, 'Types des segments du matroid', false),
        ];

        let datatable = new ModuleTable(this, VarConfVO.API_TYPE_ID, () => new VarConfVO(undefined, undefined, undefined), datatable_fields, labelField);
        this.datatables.push(datatable);
    }

    private initializeVarCacheConfVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);
        let datatable_fields = [
            var_id,

            new ModuleTableField('cache_timeout_ms', ModuleTableField.FIELD_TYPE_int, 'Timeout invalidation', true, true, 0),
            new ModuleTableField('cache_seuil_a', ModuleTableField.FIELD_TYPE_float, 'Seuil cache A', true, true, 1000),
            new ModuleTableField('cache_seuil_b', ModuleTableField.FIELD_TYPE_float, 'Seuil cache B', true, true, 1000),
            new ModuleTableField('cache_seuil_c', ModuleTableField.FIELD_TYPE_float, 'Seuil cache C', true, true, 1000),
            new ModuleTableField('cache_seuil_c_element', ModuleTableField.FIELD_TYPE_float, 'Seuil cache C - élément', true, true, 1000),
            new ModuleTableField('calculation_cost_for_1000_card', ModuleTableField.FIELD_TYPE_float, 'Ms calcul pour 1000', true, true, 1000)
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