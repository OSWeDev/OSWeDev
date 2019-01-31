import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import ModuleTable from '../ModuleTable';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import DefaultTranslationManager from '../Translation/DefaultTranslationManager';
import VarsController from './VarsController';

export default class ModuleVar extends Module {

    public static MODULE_NAME: string = 'Var';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleVar.MODULE_NAME;


    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_VARCONF_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_VARCONF_ACCESS';
    public static POLICY_BO_IMPORTED_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.BO_IMPORTED_ACCESS';
    public static POLICY_DESC_MODE_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleVar.MODULE_NAME + '.DESC_MODE_ACCESS';


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

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await VarsController.getInstance().initialize();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await VarsController.getInstance().initialize();
        return true;
    }

    private initializeSimpleVarConf() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur');
        let datatable_fields = [
            labelField,

            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données du jour'),
            new ModuleTableField('var_imported_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données importées'),

            new ModuleTableField('json_params', ModuleTableField.FIELD_TYPE_string, 'Paramètres'),

            new ModuleTableField('translatable_name', ModuleTableField.FIELD_TYPE_string, 'Code de traduction du nom'),
            new ModuleTableField('translatable_description', ModuleTableField.FIELD_TYPE_string, 'Code de traduction de la description'),
            new ModuleTableField('translatable_params_desc', ModuleTableField.FIELD_TYPE_string, 'Code de traduction de la desc des params'),
        ];

        let datatable = new ModuleTable(this, SimpleVarConfVO.API_TYPE_ID, datatable_fields, labelField);
        this.datatables.push(datatable);
    }
}