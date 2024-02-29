import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import MailEventVO from '../Mailer/vos/MailEventVO';
import MailVO from '../Mailer/vos/MailVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import SendInBlueMailEventVO from './vos/SendInBlueMailEventVO';
import SendInBlueVO from './vos/SendInBlueVO';
import ModuleTableController from '../DAO/ModuleTableController';

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

    // istanbul ignore next: nothing to test
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

        APIControllerWrapper.registerApi(new PostAPIDefinition<SendInBlueMailEventVO, any>(
            null,
            ModuleSendInBlue.APINAME_sendinblue_event_webhook,
            [SendInBlueMailEventVO.API_TYPE_ID, MailEventVO.API_TYPE_ID, MailVO.API_TYPE_ID]
        ).disable_csrf_protection());

        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, any>(
            null,
            ModuleSendInBlue.APINAME_sendinblue_refresh_mail_events,
            [MailEventVO.API_TYPE_ID, MailVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }

    public async initialize(): Promise<void> {
        this.initializeSendInBlueVO();
    }

    public initializeSendInBlueVO(): void {
        const datatable_fields = [
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().api_key, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'apiKey' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().host, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'host' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sender_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Sender name' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sender_email, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': 'Sender Email' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().replyto_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'ReplyTo name' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().replyto_email, ModuleTableFieldVO.FIELD_TYPE_email, DefaultTranslationVO.create_new({ 'fr-fr': 'ReplyTo Email' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().sender_sms_name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Sender SMS name (only alphanumeric characters)' }), true),
            ModuleTableFieldController.create_new(SendInBlueVO.API_TYPE_ID, field_names<SendInBlueVO>().default_folder_list, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Default Folder List' }), true),
        ];
        const datatable = ModuleTableController.create_new(this.name, SendInBlueVO, null, DefaultTranslationVO.create_new({ 'fr-fr': 'Parametres SendInBlue' }));
    }
}