import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import SetParamParamVO from './vos/apis/SetParamParamVO';
import ParamVO from './vos/ParamVO';

export default class ModuleParams extends Module {

    public static MODULE_NAME: string = "Params";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleParams.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleParams.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_getParamValue: string = "getParamValue";
    public static APINAME_setParamValue: string = "setParamValue";
    public static APINAME_setParamValue_if_not_exists: string = "setParamValue_if_not_exists";

    public static getInstance(): ModuleParams {
        if (!ModuleParams.instance) {
            ModuleParams.instance = new ModuleParams();
        }
        return ModuleParams.instance;
    }

    private static instance: ModuleParams = null;

    private constructor() {

        super("params", ModuleParams.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, string>(
            ModuleParams.APINAME_getParamValue,
            [ParamVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<SetParamParamVO, void>(
            ModuleParams.APINAME_setParamValue,
            [ParamVO.API_TYPE_ID],
            SetParamParamVO.translateCheckAccessParams
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<SetParamParamVO, void>(
            ModuleParams.APINAME_setParamValue_if_not_exists,
            [ParamVO.API_TYPE_ID],
            SetParamParamVO.translateCheckAccessParams
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let datatable_fields = [
            label_field,
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_string, 'Valeur', false),
            new ModuleTableField('last_up_date', ModuleTableField.FIELD_TYPE_tstz, 'Dernière mise à jour', false)
        ];

        this.datatables.push(new ModuleTable(this, ParamVO.API_TYPE_ID, () => new ParamVO(), datatable_fields, label_field, "Params"));
    }

    public async getParamValue(param_name: string): Promise<string> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, string>(ModuleParams.APINAME_getParamValue, param_name);
    }

    public async getParamValueAsInt(param_name: string): Promise<number> {
        let res = await this.getParamValue(param_name);

        return res ? parseInt(res) : null;
    }

    public async getParamValueAsBoolean(param_name: string): Promise<boolean> {
        let res = await this.getParamValueAsInt(param_name);

        return res ? true : false;
    }

    public async getParamValueAsFloat(param_name: string): Promise<number> {
        let res = await this.getParamValue(param_name);

        return res ? parseFloat(res) : null;
    }

    public async setParamValue(param_name: string, param_value: string): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<SetParamParamVO, void>(ModuleParams.APINAME_setParamValue, param_name, param_value);
    }

    public async setParamValueAsBoolean(param_name: string, param_value: boolean): Promise<void> {
        return await this.setParamValue(param_name, param_value ? '1' : '0');
    }

    public async setParamValueAsNumber(param_name: string, param_value: number): Promise<void> {
        return await this.setParamValue(param_name, param_value.toString());
    }

    public async setParamValue_if_not_exists(param_name: string, param_value: string): Promise<void> {
        return await ModuleAPI.getInstance().handleAPI<SetParamParamVO, void>(ModuleParams.APINAME_setParamValue_if_not_exists, param_name, param_value);
    }
}