import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import ModuleSendInBlueController from './ModuleSendInBlueController';
import SendInBlueVO from './vos/SendInBlueVO';

export default class ModuleSendInBlue extends Module {

    public static MODULE_NAME: string = 'SendInBlue';

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

        await ModuleSendInBlueController.getInstance().loadParam();
    }

    public initializeSendInBlueVO(): void {
        let datatable_fields = [
            new ModuleTableField('api_key', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'apiKey' }), true),
            new ModuleTableField('host', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'host' }), true),
            new ModuleTableField('sender_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Sender name' }), true),
            new ModuleTableField('sender_email', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Sender Email' }), true),
            new ModuleTableField('replyto_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'ReplyTo name' }), true),
            new ModuleTableField('replyto_email', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'ReplyTo Email' }), true),
            new ModuleTableField('sender_sms_name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Sender SMS name (only alphanumeric characters)' }), true),
            new ModuleTableField('default_folder_list', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Default Folder List' }), true),
        ];
        let datatable = new ModuleTable(this, SendInBlueVO.API_TYPE_ID, () => new SendInBlueVO(), datatable_fields, null, new DefaultTranslation({ fr: 'Parametres SendInBlue' }));
        this.datatables.push(datatable);
    }
}