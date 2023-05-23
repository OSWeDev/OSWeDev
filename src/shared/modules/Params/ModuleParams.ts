import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import GetParamParamAsBooleanVO, { GetParamParamAsBooleanVOStatic } from './vos/apis/GetParamParamAsBooleanVO';
import GetParamParamAsNumberVO, { GetParamParamAsNumberVOStatic } from './vos/apis/GetParamParamAsNumberVO';
import GetParamParamAsStringVO, { GetParamParamAsStringVOStatic } from './vos/apis/GetParamParamAsStringVO';
import SetParamParamVO, { SetParamParamVOStatic } from './vos/apis/SetParamParamVO';
import ParamVO from './vos/ParamVO';

export default class ModuleParams extends Module {

    public static MODULE_NAME: string = "Params";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleParams.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleParams.MODULE_NAME + ".BO_ACCESS";

    // public static APINAME_getParamValue: string = "getParamValue";
    public static APINAME_getParamValueAsString: string = "getParamValueAsString";
    public static APINAME_getParamValueAsInt: string = "getParamValueAsInt";
    public static APINAME_getParamValueAsBoolean: string = "getParamValueAsBoolean";
    public static APINAME_getParamValueAsFloat: string = "getParamValueAsFloat";
    public static APINAME_setParamValue: string = "setParamValue";
    public static APINAME_setParamValue_if_not_exists: string = "setParamValue_if_not_exists";

    //gestion des Feedbacks
    public static APINAME_feedback_activate_api_logs: boolean = false; //Désactive l'envoie d'api logs lors des feedbacks vers trello
    public static APINAME_feedback_display_screenshots: boolean = false; //N'affiche pas le screen en dessous du lien associé à celui-ci

    public static getInstance(): ModuleParams {
        if (!ModuleParams.instance) {
            ModuleParams.instance = new ModuleParams();
        }
        return ModuleParams.instance;
    }

    private static instance: ModuleParams = null;

    // public getParamValue: (
    //     param_name: string,
    //     default_if_undefined?: string | number | boolean,
    //     max_cache_age_ms?: number) => Promise<string> = APIControllerWrapper.sah(ModuleParams.APINAME_getParamValue);
    public getParamValueAsString: (
        param_name: string,
        default_if_undefined?: string,
        max_cache_age_ms?: number) => Promise<string> = APIControllerWrapper.sah(ModuleParams.APINAME_getParamValueAsString);
    public getParamValueAsInt: (
        param_name: string,
        default_if_undefined?: number,
        max_cache_age_ms?: number) => Promise<number> = APIControllerWrapper.sah(ModuleParams.APINAME_getParamValueAsInt);
    public getParamValueAsBoolean: (
        param_name: string,
        default_if_undefined?: boolean,
        max_cache_age_ms?: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleParams.APINAME_getParamValueAsBoolean);
    public getParamValueAsFloat: (
        param_name: string,
        default_if_undefined?: number,
        max_cache_age_ms?: number) => Promise<number> = APIControllerWrapper.sah(ModuleParams.APINAME_getParamValueAsFloat);
    public setParamValue: (param_name: string, param_value: string) => Promise<void> = APIControllerWrapper.sah(ModuleParams.APINAME_setParamValue);
    public setParamValue_if_not_exists: (param_name: string, param_value: string) => Promise<void> = APIControllerWrapper.sah(ModuleParams.APINAME_setParamValue_if_not_exists);

    private constructor() {

        super("params", ModuleParams.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    /**
     * Usage interdit, utiliser getParamValueAsString ou getParamValueAsInt ou getParamValueAsBoolean ou getParamValueAsFloat
     * @deprecated
     * @see getParamValueAsString
     * @see getParamValueAsInt
     * @see getParamValueAsBoolean
     * @see getParamValueAsFloat
     */
    public getParamValue(param_name: string): any { }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<GetParamParamAsStringVO, string>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_getParamValueAsString,
            [ParamVO.API_TYPE_ID],
            GetParamParamAsStringVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<GetParamParamAsNumberVO, number>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_getParamValueAsInt,
            [ParamVO.API_TYPE_ID],
            GetParamParamAsNumberVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<GetParamParamAsBooleanVO, boolean>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_getParamValueAsBoolean,
            [ParamVO.API_TYPE_ID],
            GetParamParamAsBooleanVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<GetParamParamAsNumberVO, number>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_getParamValueAsFloat,
            [ParamVO.API_TYPE_ID],
            GetParamParamAsNumberVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<SetParamParamVO, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_setParamValue,
            [ParamVO.API_TYPE_ID],
            SetParamParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<SetParamParamVO, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ParamVO.API_TYPE_ID),
            ModuleParams.APINAME_setParamValue_if_not_exists,
            [ParamVO.API_TYPE_ID],
            SetParamParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true).unique();
        let datatable_fields = [
            label_field,
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_string, 'Valeur', false),
            new ModuleTableField('last_up_date', ModuleTableField.FIELD_TYPE_tstz, 'Dernière mise à jour', false)
        ];

        this.datatables.push(new ModuleTable(this, ParamVO.API_TYPE_ID, () => new ParamVO(), datatable_fields, label_field, "Params"));
    }

    public async setParamValueAsBoolean(param_name: string, param_value: boolean): Promise<void> {
        return await this.setParamValue(param_name, param_value ? '1' : '0');
    }

    public async setParamValueAsNumber(param_name: string, param_value: number): Promise<void> {
        return await this.setParamValue(param_name, param_value.toString());
    }
}