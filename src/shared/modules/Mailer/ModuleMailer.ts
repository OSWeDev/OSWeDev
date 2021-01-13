import { SendMailOptions } from 'nodemailer';
import ModuleAPI from '../API/ModuleAPI';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import PrepareHTMLParamVO from './vos/PrepareHTMLParamVO';

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


    public static getInstance(): ModuleMailer {
        if (!ModuleMailer.instance) {
            ModuleMailer.instance = new ModuleMailer();
        }
        return ModuleMailer.instance;
    }

    private static instance: ModuleMailer = null;

    private constructor() {

        super("mailer", "MAILER");
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
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<SendMailOptions, any>(
            null, // droit null ok ???,
            ModuleMailer.APINAME_sendMail,
            [],
        ));

        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<PrepareHTMLParamVO, string>(
            null, // droit null ok ???,
            ModuleMailer.APINAME_prepareHTML,
            [],
            PrepareHTMLParamVO.translateCheckAccessParams
        ));
    }

    public async sendMail(
        mailOptions: SendMailOptions
    ): Promise<any> {

        return await ModuleAPI.getInstance().handleAPI<SendMailOptions, any>(
            ModuleMailer.APINAME_sendMail,
            mailOptions);
    }

    public async prepareHTML(
        template: string,
        lang_id: number,
        vars: { [name: string]: string },
    ): Promise<any> {

        return await ModuleAPI.getInstance().handleAPI<PrepareHTMLParamVO, string>(
            ModuleMailer.APINAME_prepareHTML,
            template,
            lang_id,
            vars);
    }
}