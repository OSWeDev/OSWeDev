import AccessPolicyTools from '../../tools/AccessPolicyTools';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import ISimpleNumberVarData from './interfaces/ISimpleNumberVarData';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import VarsController from './VarsController';
import moment = require('moment');
import ModuleAPI from '../API/ModuleAPI';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import APIDAOApiTypeAndMatroidsParamsVO from '../DAO/vos/APIDAOApiTypeAndMatroidsParamsVO';
import IDistantVOBase from '../IDistantVOBase';
import IMatroid from '../Matroid/interfaces/IMatroid';

export default class ModuleVar extends Module {

    public static MODULE_NAME: string = 'Var';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleVar.MODULE_NAME;

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_VARCONF_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_VARCONF_ACCESS';
    public static POLICY_BO_IMPORTED_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_IMPORTED_ACCESS';
    public static POLICY_DESC_MODE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.DESC_MODE_ACCESS';

    public static APINAME_getSimpleVarDataValueSumFilterByMatroids: string = 'getSimpleVarDataValueSumFilterByMatroids';

    // public static APINAME_INVALIDATE_MATROID: string = 'invalidate_matroid';
    // public static APINAME_register_matroid_for_precalc: string = 'register_matroid_for_precalc';

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
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<APIDAOApiTypeAndMatroidsParamsVO, number>(
            ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids,
            (param: APIDAOApiTypeAndMatroidsParamsVO) => (param ? [param.API_TYPE_ID] : null),
            APIDAOApiTypeAndMatroidsParamsVO.translateCheckAccessParams
        ));

        // ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IVarMatroidDataParamVO, void>(
        //     ModuleVar.APINAME_INVALIDATE_MATROID,
        //     (param: IVarMatroidDataParamVO) => [VOsTypesManager.getInstance().moduleTables_by_voType[param._type].vo_type]
        // ));

        // ModuleAPI.getInstance().registerApi(new PostAPIDefinition<IVarMatroidDataParamVO, void>(
        //     ModuleVar.APINAME_register_matroid_for_precalc,
        //     (param: IVarMatroidDataParamVO) => [VOsTypesManager.getInstance().moduleTables_by_voType[param._type].vo_type]
        // ));
    }

    public async getSimpleVarDataValueSumFilterByMatroids<T extends IDistantVOBase, U extends IMatroid>(API_TYPE_ID: string, matroids: U[], fields_ids_mapper: { [matroid_field_id: string]: string }): Promise<number> {
        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        return await ModuleAPI.getInstance().handleAPI<APIDAOApiTypeAndMatroidsParamsVO, number>(ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids, API_TYPE_ID, matroids, fields_ids_mapper);
    }

    // public async invalidate_matroid(matroid_param: IVarMatroidDataParamVO): Promise<void> {
    //     if ((!matroid_param) || (!matroid_param._type)) {
    //         return null;
    //     }

    //     return ModuleAPI.getInstance().handleAPI<APIDAORangesParamsVO, void>(ModuleVar.APINAME_INVALIDATE_MATROID, matroid_param);
    // }

    // public async register_matroid_for_precalc(matroid_param: IVarMatroidDataParamVO): Promise<void> {
    //     if ((!matroid_param) || (!matroid_param._type)) {
    //         return null;
    //     }

    //     return ModuleAPI.getInstance().handleAPI<APIDAORangesParamsVO, void>(ModuleVar.APINAME_register_matroid_for_precalc, matroid_param);
    // }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await VarsController.getInstance().initialize();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await VarsController.getInstance().initialize();
        return true;
    }

    public register_simple_number_var_data(
        api_type_id: string,
        param_api_type_id: string,
        constructor: () => ISimpleNumberVarData,
        var_fields: Array<ModuleTableField<any>>, is_matroid: boolean = false) {
        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var conf');

        var_fields.unshift(var_id);
        var_fields = var_fields.concat([
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_float, 'Valeur'),
            new ModuleTableField('value_type', ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, VarsController.VALUE_TYPE_IMPORT).setEnumValues({
                [VarsController.VALUE_TYPE_IMPORT]: VarsController.VALUE_TYPE_LABELS[VarsController.VALUE_TYPE_IMPORT],
                [VarsController.VALUE_TYPE_COMPUTED]: VarsController.VALUE_TYPE_LABELS[VarsController.VALUE_TYPE_COMPUTED],
                [VarsController.VALUE_TYPE_MIXED]: VarsController.VALUE_TYPE_LABELS[VarsController.VALUE_TYPE_MIXED]
            }),
            new ModuleTableField('value_ts', ModuleTableField.FIELD_TYPE_tstz, 'Date mise à jour', false).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('missing_datas_infos', ModuleTableField.FIELD_TYPE_string_array, 'Datas manquantes', false),
        ]);

        let datatable = new ModuleTable(this, api_type_id, constructor, var_fields, null);
        if (is_matroid) {
            datatable.defineAsMatroid();
        }
        datatable.addAlias(param_api_type_id);
        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[SimpleVarConfVO.API_TYPE_ID]);
        this.datatables.push(datatable);
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
}