import { SendMailOptions } from 'nodemailer';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import MailCategoryUserVO from './vos/MailCategoryUserVO';
import MailCategoryVO from './vos/MailCategoryVO';
import MailEventVO from './vos/MailEventVO';
import MailVO from './vos/MailVO';

export default class ModuleMailer extends Module {

    public static PARAM_NAME_HOST = 'ModuleMailer.host';
    public static PARAM_NAME_PORT = 'ModuleMailer.port';
    public static PARAM_NAME_SECURE = 'ModuleMailer.secure';
    public static PARAM_NAME_AUTH_USER = 'ModuleMailer.auth_user';
    public static PARAM_NAME_AUTH_PASS = 'ModuleMailer.auth_pass';
    public static PARAM_NAME_FROM = 'ModuleMailer.from_address';
    public static PARAM_NAME_SUBJECT_PREFIX = 'ModuleMailer.subject_prefix';
    public static PARAM_NAME_SUBJECT_SUFFIX = 'ModuleMailer.subject_suffix';

    public static DEFAULT_HOST: string = '127.0.0.1';
    public static DEFAULT_PORT: number = 25;
    public static DEFAULT_SECURE: boolean = false;
    public static DEFAULT_AUTH_USER: string = null;
    public static DEFAULT_AUTH_PASS: string = null;
    public static DEFAULT_FROM: string = 'noreply@wedev.fr';
    public static DEFAULT_SUBJECT_PREFIX: string = '[WEDEV] ';
    public static DEFAULT_SUBJECT_SUFFIX: string = null;

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

    public sendMail: (
        mailOptions: SendMailOptions
    ) => Promise<any> = APIControllerWrapper.sah<SendMailOptions, any>(
        ModuleMailer.APINAME_sendMail);

    private constructor() {

        super("mailer", "Mailer");
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.initializeMailCategoryVO();
        this.initialize_MailCategoryUserVO();
        this.initializeMailVO();
        this.initializeMailEventVO();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<SendMailOptions, any>(
            null, // droit null ok ???,
            ModuleMailer.APINAME_sendMail,
            [],
        ));
    }

    private initializeMailVO() {
        const category_id = ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', true, false);
        const sent_by_id = ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().sent_by_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Envoyé par', false);
        const sent_to_id = ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().sent_to_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Envoyé à', false);

        const label = ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().message_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID de suivi', true).unique();

        ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().last_state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Dernier évènement', true, true, MailEventVO.EVENT_Initie).setEnumValues(MailEventVO.EVENT_NAMES).index();
        ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().email, ModuleTableFieldVO.FIELD_TYPE_string, 'Email', true).index();
        ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().send_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'envoi', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(MailVO.API_TYPE_ID, field_names<MailVO>().last_up_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de mise à jour', true).set_segmentation_type(TimeSegment.TYPE_SECOND);

        ModuleTableController.create_new(this.name, MailVO, label, "Mails");
        category_id.set_many_to_one_target_moduletable_name(MailCategoryVO.API_TYPE_ID);
        sent_by_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        sent_to_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    private initialize_MailCategoryUserVO() {
        ModuleTableFieldController.create_new(MailCategoryUserVO.API_TYPE_ID, field_names<MailCategoryUserVO>().mail_category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', true).set_many_to_one_target_moduletable_name(MailCategoryVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(MailCategoryUserVO.API_TYPE_ID, field_names<MailCategoryUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true).set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        ModuleTableController.create_new(this.name, MailCategoryUserVO, null, "Optin/Optout des utilisateurs");
    }
    private initializeMailCategoryVO() {
        const label = ModuleTableFieldController.create_new(MailCategoryVO.API_TYPE_ID, field_names<MailCategoryVO>().name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom', true).unique();
        ModuleTableFieldController.create_new(MailCategoryVO.API_TYPE_ID, field_names<MailCategoryVO>().type_optin, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type d\'optin', true, true, MailCategoryVO.TYPE_OPTIN_OPTOUT).setEnumValues(MailCategoryVO.TYPE_OPTIN_LABELS).index(); // Par défaut on met de l'optout pour le moment pour ne pas changer le comportement actuel
        ModuleTableFieldController.create_new(MailCategoryVO.API_TYPE_ID, field_names<MailCategoryVO>().user_role_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Rôles utilisateurs', false).set_many_to_one_target_moduletable_name(RoleVO.API_TYPE_ID);
        ModuleTableController.create_new(this.name, MailCategoryVO, label, "Catégories de mail");
    }

    private initializeMailEventVO() {
        const mail_id = ModuleTableFieldController.create_new(MailEventVO.API_TYPE_ID, field_names<MailEventVO>().mail_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Mail', true, false);
        const label = ModuleTableFieldController.create_new(MailEventVO.API_TYPE_ID, field_names<MailEventVO>().event_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true).set_segmentation_type(TimeSegment.TYPE_SECOND);

        const datatable_fields = [
            mail_id,
            label,
            ModuleTableFieldController.create_new(MailEventVO.API_TYPE_ID, field_names<MailEventVO>().event, ModuleTableFieldVO.FIELD_TYPE_enum, 'Evènement', true, true, MailEventVO.EVENT_Initie).setEnumValues(MailEventVO.EVENT_NAMES).index(),
            ModuleTableFieldController.create_new(MailEventVO.API_TYPE_ID, field_names<MailEventVO>().reason, ModuleTableFieldVO.FIELD_TYPE_string, 'Raison', false),
        ];
        const datatable = ModuleTableController.create_new(this.name, MailEventVO, label, "Evènements de mail");
        mail_id.set_many_to_one_target_moduletable_name(MailVO.API_TYPE_ID);
    }
}