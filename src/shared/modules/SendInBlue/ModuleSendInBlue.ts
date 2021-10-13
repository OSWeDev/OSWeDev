import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import SendInBlueVO from './vos/SendInBlueVO';

export default class ModuleSendInBlue extends Module {

    public static MODULE_NAME: string = 'SendInBlue';

    public static PARAM_NAME_SMS_ACTIVATION: string = 'ModuleSendInBlue.SMS_ACTIVATION';

    /**
     * Option pour paramétrer des CC et BCC directement en BDD pour chaque templateId
     *  ( plusieurs adresses possibles séparées par des ',' )
     *  PARAM_NAME_TEMPLATE_CC_PREFIX + template_id
     *  PARAM_NAME_TEMPLATE_BCC_PREFIX + template_id
     */
    public static PARAM_NAME_TEMPLATE_CC_PREFIX: string = 'ModuleSendInBlue.TEMPLATE_CC.template_id_';
    public static PARAM_NAME_TEMPLATE_BCC_PREFIX: string = 'ModuleSendInBlue.TEMPLATE_BCC.template_id_';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSendInBlue.MODULE_NAME;

    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSendInBlue.MODULE_NAME + '.BO_ACCESS';

    public static getInstance(): ModuleSendInBlue {
        if (!ModuleSendInBlue.instance) {
            ModuleSendInBlue.instance = new ModuleSendInBlue();
        }
        return ModuleSendInBlue.instance;
    }

    private static instance: ModuleSendInBlue = null;

    private constructor() {

        super("sendinblue", ModuleSendInBlue.MODULE_NAME);
    }

    public async initialize(): Promise<void> {
        this.fields = [];
        this.datatables = [];

        this.initializeSendInBlueVO();
    }

    public initializeSendInBlueVO(): void {
        let datatable_fields = [
            new ModuleTableField('api_key', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'apiKey' }), true),
            new ModuleTableField('host', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'host' }), true),
            new ModuleTableField('sender_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Sender name' }), true),
            new ModuleTableField('sender_email', ModuleTableField.FIELD_TYPE_email, new DefaultTranslation({ 'fr-fr': 'Sender Email' }), true),
            new ModuleTableField('replyto_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'ReplyTo name' }), true),
            new ModuleTableField('replyto_email', ModuleTableField.FIELD_TYPE_email, new DefaultTranslation({ 'fr-fr': 'ReplyTo Email' }), true),
            new ModuleTableField('sender_sms_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Sender SMS name (only alphanumeric characters)' }), true),
            new ModuleTableField('default_folder_list', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Default Folder List' }), true),
        ];
        let datatable = new ModuleTable(this, SendInBlueVO.API_TYPE_ID, () => new SendInBlueVO(), datatable_fields, null, new DefaultTranslation({ 'fr-fr': 'Parametres SendInBlue' }));
        this.datatables.push(datatable);
    }
}