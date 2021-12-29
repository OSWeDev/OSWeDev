import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import MailEventVO from '../Mailer/vos/MailEventVO';
import MailVO from '../Mailer/vos/MailVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import SendInBlueMailEventVO from './vos/SendInBlueMailEventVO';
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

    public static APINAME_sendinblue_event_webhook: string = 'sendinblue_event_webhook';
    public static APINAME_sendinblue_refresh_mail_events: string = 'sendinblue_refresh_mail_events';

    public static getInstance(): ModuleSendInBlue {
        if (!ModuleSendInBlue.instance) {
            ModuleSendInBlue.instance = new ModuleSendInBlue();
        }
        return ModuleSendInBlue.instance;
    }

    private static instance: ModuleSendInBlue = null;

    public sendinblue_event_webhook: (
        event: SendInBlueMailEventVO
    ) => Promise<any> = APIControllerWrapper.sah(ModuleSendInBlue.APINAME_sendinblue_event_webhook);

    public sendinblue_refresh_mail_events: (
        mail_id: number
    ) => Promise<any> = APIControllerWrapper.sah(ModuleSendInBlue.APINAME_sendinblue_refresh_mail_events);

    private constructor() {

        super("sendinblue", ModuleSendInBlue.MODULE_NAME);
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<SendInBlueMailEventVO, any>(
            null,
            ModuleSendInBlue.APINAME_sendinblue_event_webhook,
            [SendInBlueMailEventVO.API_TYPE_ID, MailEventVO.API_TYPE_ID, MailVO.API_TYPE_ID]
        ).disable_csrf_protection());

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<NumberParamVO, any>(
            null,
            ModuleSendInBlue.APINAME_sendinblue_refresh_mail_events,
            [MailEventVO.API_TYPE_ID, MailVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
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