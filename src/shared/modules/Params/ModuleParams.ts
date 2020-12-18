import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import SetParamParamVO, { SetParamParamVOStatic } from './vos/apis/SetParamParamVO';
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

    public getParamValue: (param_name: string) => Promise<string> = ModuleAPI.sah(ModuleParams.APINAME_getParamValue);
    public setParamValue: (param_name: string, param_value: string) => Promise<void> = ModuleAPI.sah(ModuleParams.APINAME_setParamValue);
    public setParamValue_if_not_exists: (param_name: string, param_value: string) => Promise<void> = ModuleAPI.sah(ModuleParams.APINAME_setParamValue_if_not_exists);

    private constructor() {

        super("params", ModuleParams.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, string>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_getParamValue,
            [ParamVO.API_TYPE_ID],
            StringParamVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<SetParamParamVO, void>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_setParamValue,
            [ParamVO.API_TYPE_ID],
            SetParamParamVOStatic
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<SetParamParamVO, void>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_setParamValue_if_not_exists,
            [ParamVO.API_TYPE_ID],
            SetParamParamVOStatic
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

    public async getParamValueAsInt(param_name: string, default_if_undefined: number = null): Promise<number> {
        let res = await this.getParamValue(param_name);

        return (res != null) ? parseInt(res) : default_if_undefined;
    }

    public async getParamValueAsBoolean(param_name: string): Promise<boolean> {
        let res = await this.getParamValueAsInt(param_name);

        return res ? true : false;
    }

    public async getParamValueAsFloat(param_name: string): Promise<number> {
        let res = await this.getParamValue(param_name);

        return (res != null) ? parseFloat(res) : null;
    }

    public async setParamValueAsBoolean(param_name: string, param_value: boolean): Promise<void> {
        return await this.setParamValue(param_name, param_value ? '1' : '0');
    }

    public async setParamValueAsNumber(param_name: string, param_value: number): Promise<void> {
        return await this.setParamValue(param_name, param_value.toString());
    }
}