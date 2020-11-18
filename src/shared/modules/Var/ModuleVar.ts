import AccessPolicyTools from '../../tools/AccessPolicyTools';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import APISimpleVOParamVO from '../DAO/vos/APISimpleVOParamVO';
import APISimpleVOsParamVO from '../DAO/vos/APISimpleVOsParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import VarsController from './VarsController';
import VarCacheConfVO from './vos/VarCacheConfVO';
import VarConfIds from './vos/VarConfIds';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';
import VarDataValueResVO from './vos/VarDataValueResVO';
const moment = require('moment');

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

    public static APINAME_invalidate_cache_intersection: string = 'invalidate_cache_intersection';
    public static APINAME_delete_cache_intersection: string = 'delete_cache_intersection';
    public static APINAME_delete_cache_and_imports_intersection: string = 'delete_cache_and_imports_intersection';

    public static getInstance(): ModuleVar {
        if (!ModuleVar.instance) {
            ModuleVar.instance = new ModuleVar();
        }
        return ModuleVar.instance;
    }

    private static instance: ModuleVar = null;

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
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_register_params,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVO.translateCheckAccessParams
        ).define_as_opti__aggregate_param((a: APISimpleVOsParamVO, b: APISimpleVOsParamVO) => a.vos = (b && b.vos && b.vos.length) ? a.vos.concat(b.vos) : a.vos));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOsParamVO, void>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_unregister_params,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOsParamVO.translateCheckAccessParams
        ).define_as_opti__aggregate_param((a: APISimpleVOsParamVO, b: APISimpleVOsParamVO) => a.vos = (b && b.vos && b.vos.length) ? a.vos.concat(b.vos) : a.vos));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, { [dep_name: string]: string }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarControllerVarsDeps,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<StringParamVO, string[]>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarControllerDSDeps,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [dep_id: string]: VarDataBaseVO }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getParamDependencies,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, { [ds_name: string]: string }>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_getVarParamDatas,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            APISimpleVOParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, VarConfIds>(
            ModuleVar.POLICY_FO_ACCESS,
            ModuleVar.APINAME_get_var_id_by_names,
            [VarConfVO.API_TYPE_ID]
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
            ModuleVar.POLICY_DESC_MODE_ACCESS,
            ModuleVar.APINAME_invalidate_cache_intersection,
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

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
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

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<VarDataBaseVO[], void>(
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
    }

    public async invalidate_cache_intersection(vos: VarDataBaseVO[]): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<VarDataBaseVO[], void>(ModuleVar.APINAME_invalidate_cache_intersection, vos);
    }
    public async delete_cache_and_imports_intersection(vos: VarDataBaseVO[]): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<VarDataBaseVO[], void>(ModuleVar.APINAME_delete_cache_and_imports_intersection, vos);
    }
    public async delete_cache_intersection(vos: VarDataBaseVO[]): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<VarDataBaseVO[], void>(ModuleVar.APINAME_delete_cache_intersection, vos);
    }

    public async getVarControllerDSDeps(var_name: string): Promise<string[]> {
        return await ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, string[]>(ModuleVar.APINAME_getVarControllerDSDeps, var_name);
    }
    public async getVarControllerVarsDeps(var_name: string): Promise<{ [dep_name: string]: string }> {
        return await ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, { [dep_name: string]: string }>(ModuleVar.APINAME_getVarControllerVarsDeps, var_name);
    }
    public async getParamDependencies(param: VarDataBaseVO): Promise<{ [dep_id: string]: VarDataBaseVO }> {
        return await ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, { [dep_id: string]: VarDataBaseVO }>(ModuleVar.APINAME_getParamDependencies, param);
    }
    public async getVarParamDatas(param: VarDataBaseVO): Promise<{ [ds_name: string]: string }> {
        return await ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, { [ds_name: string]: string }>(ModuleVar.APINAME_getVarParamDatas, param);
    }

    public async register_params(params: VarDataBaseVO[]): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<APISimpleVOsParamVO, void>(ModuleVar.APINAME_register_params, params);
    }

    public async unregister_params(params: VarDataBaseVO[]): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<APISimpleVOsParamVO, void>(ModuleVar.APINAME_unregister_params, params);
    }

    public async get_var_id_by_names(): Promise<VarConfIds> {
        return await ModuleAPI.getInstance().handleAPI<void, VarConfIds>(ModuleVar.APINAME_get_var_id_by_names);
    }

    // public async configureVarCache(var_conf: VarConfVO, var_cache_conf: VarCacheConfVO): Promise<VarCacheConfVO> {
    //     let server_side: boolean = (!!ModulesManager.getInstance().isServerSide);
    //     // Si on est côté client, on a pas besoin de la conf du cache

    //     if (!server_side) {
    //         return var_cache_conf;
    //     }

    //     return await ModuleAPI.getInstance().handleAPI<ConfigureVarCacheParamVO, VarCacheConfVO>(ModuleVar.APINAME_configureVarCache, var_conf, var_cache_conf);
    // }

    // public async getSimpleVarDataValueSumFilterByMatroids<T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<number> {
    //     if ((!matroids) || (!matroids.length)) {
    //         return null;
    //     }

    //     return await ModuleAPI.getInstance().handleAPI<APIDAOApiTypeAndMatroidsParamsVO, number>(ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids, API_TYPE_ID, matroids, fields_ids_mapper);
    // }

    // public async getSimpleVarDataCachedValueFromParam<T extends VarDataBaseVO>(param: T): Promise<VarDataValueResVO> {
    //     if (!param) {
    //         return null;
    //     }

    //     return await ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, VarDataValueResVO>(ModuleVar.APINAME_getSimpleVarDataCachedValueFromParam, param);
    // }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await VarsController.getInstance().initialize();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await VarsController.getInstance().initialize();
        return true;
    }

    public register_var_data(
        api_type_id: string,
        param_api_type_id: string,
        constructor: () => VarDataBaseVO,
        var_fields: Array<ModuleTableField<any>>, is_matroid: boolean = false): ModuleTable<any> {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf');

        var_fields.unshift(var_id);
        var_fields = var_fields.concat([
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, VarDataBaseVO.VALUE_TYPE_COMPUTED).setEnumValues({
                [VarDataBaseVO.VALUE_TYPE_IMPORT]: VarDataBaseVO.VALUE_TYPE_LABELS[VarDataBaseVO.VALUE_TYPE_IMPORT],
                [VarDataBaseVO.VALUE_TYPE_COMPUTED]: VarDataBaseVO.VALUE_TYPE_LABELS[VarDataBaseVO.VALUE_TYPE_COMPUTED]
            }),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date mise à jour').set_segmentation_type(TimeSegment.TYPE_SECOND),
        ]);

        let datatable = new ModuleTable(this, api_type_id, constructor, var_fields, null);
        if (is_matroid) {
            datatable.defineAsMatroid();
        }
        datatable.addAlias(param_api_type_id);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
        this.datatables.push(datatable);
        return datatable;
    }

    private initializeVarConfVO() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur');
        let datatable_fields = [
            labelField,

            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données'),
            new ModuleTableField('ts_ranges_field_name', ModuleTableField.FIELD_TYPE_string, 'Nom du champ ts_ranges', false, true, 'ts_ranges'),
            new ModuleTableField('ts_ranges_segment_type', ModuleTableField.FIELD_TYPE_int, 'Segment_type du ts_ranges', false, true, TimeSegment.TYPE_DAY),
        ];

        let datatable = new ModuleTable(this, VarConfVO.API_TYPE_ID, () => new VarConfVO(undefined, undefined, undefined), datatable_fields, labelField);
        this.datatables.push(datatable);
    }

    private initializeVarCacheConfVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);
        let datatable_fields = [
            var_id,

            new ModuleTableField('consider_null_as_0_and_auto_clean_0_in_cache', ModuleTableField.FIELD_TYPE_boolean, 'Nettoyer si 0', true, true, true),
            new ModuleTableField('cache_timeout_ms', ModuleTableField.FIELD_TYPE_int, 'Timeout invalidation', false, true, 1000 * 12 * 60 * 60),
            new ModuleTableField('cache_seuil_a', ModuleTableField.FIELD_TYPE_float, 'Seuil cache A', true, true, 1000),
            new ModuleTableField('cache_seuil_b', ModuleTableField.FIELD_TYPE_float, 'Seuil cache B', true, true, 1000),
            new ModuleTableField('cache_seuil_c', ModuleTableField.FIELD_TYPE_float, 'Seuil cache C', true, true, 1000),
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
        ];

        let datatable = new ModuleTable(this, VarDataValueResVO.API_TYPE_ID, () => new VarDataValueResVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }
}