import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import APIDAOApiTypeAndMatroidsParamsVO from '../DAO/vos/APIDAOApiTypeAndMatroidsParamsVO';
import APISimpleVOParamVO from '../DAO/vos/APISimpleVOParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import IDistantVOBase from '../IDistantVOBase';
import IMatroid from '../Matroid/interfaces/IMatroid';
import Module from '../Module';
import ModulesManager from '../ModulesManager';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import ConfigureVarCacheParamVO from './params/ConfigureVarCacheParamVO';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import SimpleVarDataValueRes from './simple_vars/SimpleVarDataValueRes';
import VarsController from './VarsController';
import VarCacheConfVO from './vos/VarCacheConfVO';
import VarConfVOBase from './vos/VarConfVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
const moment = require('moment');

export default class ModuleVar extends Module {

    public static MODULE_NAME: string = 'Var';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleVar.MODULE_NAME;

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_VARCONF_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_VARCONF_ACCESS';
    public static POLICY_BO_IMPORTED_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_IMPORTED_ACCESS';
    public static POLICY_DESC_MODE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.DESC_MODE_ACCESS';

    public static APINAME_getSimpleVarDataValueSumFilterByMatroids: string = 'getSimpleVarDataValueSumFilterByMatroids';
    public static APINAME_getSimpleVarDataCachedValueFromParam: string = 'getSimpleVarDataCachedValueFromParam';
    public static APINAME_configureVarCache: string = 'configureVarCache';

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

        this.initializeSimpleVarConf();
        this.initializeVarCacheConfVO();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ConfigureVarCacheParamVO, VarCacheConfVO>(
            ModuleVar.APINAME_configureVarCache,
            [VarCacheConfVO.API_TYPE_ID],
            ConfigureVarCacheParamVO.translateCheckAccessParams,
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, number>(
            ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APISimpleVOParamVO, SimpleVarDataValueRes>(
            ModuleVar.APINAME_getSimpleVarDataCachedValueFromParam,
            (param: APISimpleVOParamVO) => ((param && param.vo) ? [param.vo._type] : null),
            APISimpleVOParamVO.translateCheckAccessParams
        ));
    }

    public async configureVarCache(var_conf: VarConfVOBase, var_cache_conf: VarCacheConfVO): Promise<VarCacheConfVO> {
        let server_side: boolean = (!!ModulesManager.getInstance().isServerSide);
        // Si on est côté client, on a pas besoin de la conf du cache

        if (!server_side) {
            return var_cache_conf;
        }

        return await ModuleAPI.getInstance().handleAPI<ConfigureVarCacheParamVO, VarCacheConfVO>(ModuleVar.APINAME_configureVarCache, var_conf, var_cache_conf);
    }

    public async getSimpleVarDataValueSumFilterByMatroids<T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<number> {
        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        return await ModuleAPI.getInstance().handleAPI<APIDAOApiTypeAndMatroidsParamsVO, number>(ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids, API_TYPE_ID, matroids, fields_ids_mapper);
    }

    public async getSimpleVarDataCachedValueFromParam<T extends IVarDataVOBase>(param: T): Promise<SimpleVarDataValueRes> {
        if (!param) {
            return null;
        }

        return await ModuleAPI.getInstance().handleAPI<APISimpleVOParamVO, SimpleVarDataValueRes>(ModuleVar.APINAME_getSimpleVarDataCachedValueFromParam, param);
    }

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
        constructor: () => IVarDataVOBase,
        var_fields: Array<ModuleTableField<any>>, is_matroid: boolean = false): ModuleTable<any> {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf');

        var_fields.unshift(var_id);
        var_fields = var_fields.concat([
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, VarsController.VALUE_TYPE_COMPUTED).setEnumValues({
                [VarsController.VALUE_TYPE_IMPORT]: VarsController.VALUE_TYPE_LABELS[VarsController.VALUE_TYPE_IMPORT],
                [VarsController.VALUE_TYPE_COMPUTED]: VarsController.VALUE_TYPE_LABELS[VarsController.VALUE_TYPE_COMPUTED],
                [VarsController.VALUE_TYPE_MIXED]: VarsController.VALUE_TYPE_LABELS[VarsController.VALUE_TYPE_MIXED]
            }),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date mise à jour').set_segmentation_type(TimeSegment.TYPE_SECOND),
        ]);

        let datatable = new ModuleTable(this, api_type_id, constructor, var_fields, null);
        if (is_matroid) {
            datatable.defineAsMatroid();
        }
        datatable.addAlias(param_api_type_id);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[SimpleVarConfVO.API_TYPE_ID]);
        this.datatables.push(datatable);
        return datatable;
    }

    private initializeSimpleVarConf() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur');
        let datatable_fields = [
            labelField,

            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données du jour'),
            new ModuleTableField('var_imported_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données importées'),

            new ModuleTableField('translatable_name', ModuleTableField.FIELD_TYPE_translatable_text, 'Code de traduction du nom'),
            new ModuleTableField('translatable_description', ModuleTableField.FIELD_TYPE_translatable_text, 'Code de traduction de la description'),
            new ModuleTableField('translatable_params_desc', ModuleTableField.FIELD_TYPE_translatable_text, 'Code de traduction de la desc des params'),

            new ModuleTableField('has_yearly_reset', ModuleTableField.FIELD_TYPE_boolean, 'Reset annuel ?', true, true, false),
            new ModuleTableField('yearly_reset_day_in_month', ModuleTableField.FIELD_TYPE_int, 'Jour du mois de reset (1-31)', false, true, 1),
            new ModuleTableField('yearly_reset_month', ModuleTableField.FIELD_TYPE_int, 'Mois du reset (0-11)', false, true, 0),
        ];

        let datatable = new ModuleTable(this, SimpleVarConfVO.API_TYPE_ID, () => new SimpleVarConfVO(), datatable_fields, labelField);
        this.datatables.push(datatable);
    }

    private initializeVarCacheConfVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf', true);
        let datatable_fields = [
            var_id,

            new ModuleTableField('consider_null_as_0_and_auto_clean_0_in_cache', ModuleTableField.FIELD_TYPE_boolean, 'Nettoyer si 0', true, true, true),
            new ModuleTableField('cache_timeout_ms', ModuleTableField.FIELD_TYPE_int, 'Timeout invalidation', false, true, 1000 * 12 * 60 * 60),
        ];

        let datatable = new ModuleTable(this, VarCacheConfVO.API_TYPE_ID, () => new VarCacheConfVO(), datatable_fields, null);
        this.datatables.push(datatable);
    }

}