import { SendMailOptions } from 'nodemailer';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import ModuleAPI from '../API/ModuleAPI';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import MailCategoryVO from './vos/MailCategoryVO';
import MailEventVO from './vos/MailEventVO';
import MailVO from './vos/MailVO';
import PrepareHTMLParamVO, { PrepareHTMLParamVOStatic } from './vos/PrepareHTMLParamVO';

export default class ModuleMailer extends Module {

    public static PARAM_NAME_HOST = 'host';
    public static PARAM_NAME_PORT = 'port';
    public static PARAM_NAME_SECURE = 'secure';
    public static PARAM_NAME_AUTH_USER = 'auth_user';
    public static PARAM_NAME_AUTH_PASS = 'auth_pass';
    public static PARAM_NAME_FROM = 'from_address';
    public static PARAM_NAME_SUBJECT_PREFIX = 'subject_prefix';
    public static PARAM_NAME_SUBJECT_SUFFIX = 'subject_suffix';

    public static APINAME_sendMail: string = "send_mail";
    public static APINAME_prepareHTML: string = "prepare_html";


    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleMailer {
        if (!ModuleMailer.instance) {
            ModuleMailer.instance = new ModuleMailer();
        }
        return ModuleMailer.instance;
    }

    private static instance: ModuleMailer = null;

    public prepareHTML: (
        template: string,
        lang_id: number,
        vars: { [name: string]: string },
    ) => Promise<any> = APIControllerWrapper.sah<PrepareHTMLParamVO, string>(ModuleMailer.APINAME_prepareHTML);

    public sendMail: (
        mailOptions: SendMailOptions
    ) => Promise<any> = APIControllerWrapper.sah<SendMailOptions, any>(
        ModuleMailer.APINAME_sendMail);

    private constructor() {

        super("mailer", "Mailer");
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [
            new ModuleTableField(ModuleMailer.PARAM_NAME_HOST, ModuleTableField.FIELD_TYPE_string, 'host', true, true, '127.0.0.1'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_PORT, ModuleTableField.FIELD_TYPE_int, 'port', true, true, 25),
            new ModuleTableField(ModuleMailer.PARAM_NAME_SECURE, ModuleTableField.FIELD_TYPE_boolean, 'secure', true, true, false),
            new ModuleTableField(ModuleMailer.PARAM_NAME_AUTH_USER, ModuleTableField.FIELD_TYPE_string, 'auth_user'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_AUTH_PASS, ModuleTableField.FIELD_TYPE_string, 'auth_pass'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_FROM, ModuleTableField.FIELD_TYPE_email, 'from_address', true, true, 'noreply@wedev.fr'),
            new ModuleTableField(ModuleMailer.PARAM_NAME_SUBJECT_PREFIX, ModuleTableField.FIELD_TYPE_string, 'subject_prefix', false, true, '[WEDEV] '),
            new ModuleTableField(ModuleMailer.PARAM_NAME_SUBJECT_SUFFIX, ModuleTableField.FIELD_TYPE_string, 'subject_suffix'),
        ];
        this.datatables = [];

        this.initializeMailCategoryVO();
        this.initializeMailVO();
        this.initializeMailEventVO();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SendMailOptions, any>(
            null, // droit null ok ???,
            ModuleMailer.APINAME_sendMail,
            [],
        ));

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<PrepareHTMLParamVO, string>(
            null, // droit null ok ???,
            ModuleMailer.APINAME_prepareHTML,
            [],
            PrepareHTMLParamVOStatic
        ));
    }

    private initializeMailVO() {
        let category_id: ModuleTableField<number> = new ModuleTableField<number>('category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Catégorie', true, false);
        let sent_by_id: ModuleTableField<number> = new ModuleTableField<number>('sent_by_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Envoyé par', false);
        let sent_to_id: ModuleTableField<number> = new ModuleTableField<number>('sent_to_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Envoyé à', false);

        let label = new ModuleTableField('message_id', ModuleTableField.FIELD_TYPE_string, 'ID de suivi', true);

        let datatable_fields = [
            category_id,
            sent_by_id,
            sent_to_id,

            new ModuleTableField('last_state', ModuleTableField.FIELD_TYPE_enum, 'Dernier évènement', true, true, MailEventVO.EVENT_Initie).setEnumValues(MailEventVO.EVENT_NAMES).index(),

            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'Email', true).index(),
            label,
            new ModuleTableField('send_date', ModuleTableField.FIELD_TYPE_tstz, 'Date d\'envoi', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('last_up_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de mise à jour', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];
        let datatable = new ModuleTable(this, MailVO.API_TYPE_ID, () => new MailVO(), datatable_fields, label, "Mails");
        category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[MailCategoryVO.API_TYPE_ID]);
        sent_by_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        sent_to_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeMailCategoryVO() {
        let label = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_translatable_text, 'Nom', true);
        let datatable_fields = [
            label
        ];
        let datatable = new ModuleTable(this, MailCategoryVO.API_TYPE_ID, () => new MailCategoryVO(), datatable_fields, label, "Catégories de mail");
        this.datatables.push(datatable);
    }

    private initializeMailEventVO() {
        let mail_id: ModuleTableField<number> = new ModuleTableField<number>('mail_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Mail', true, false);
        let label = new ModuleTableField('event_date', ModuleTableField.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND);

        let datatable_fields = [
            mail_id,
            label,
            new ModuleTableField('event', ModuleTableField.FIELD_TYPE_enum, 'Evènement', true, true, MailEventVO.EVENT_Initie).setEnumValues(MailEventVO.EVENT_NAMES).index(),
            new ModuleTableField('reason', ModuleTableField.FIELD_TYPE_string, 'Raison', false),
        ];
        let datatable = new ModuleTable(this, MailEventVO.API_TYPE_ID, () => new MailEventVO(), datatable_fields, label, "Evènements de mail");
        mail_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[MailVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }
}