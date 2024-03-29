import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueMailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueSmsFormatVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import StackContext from '../../../StackContext';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import SendInBlueMailServerController from '../../SendInBlue/SendInBlueMailServerController';
import SendInBlueSmsServerController from '../../SendInBlue/sms/SendInBlueSmsServerController';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';
import initpwd_mail_html_template from './initpwd_mail_html_template.html';


export default class PasswordInitialisation {

    public static CODE_TEXT_MAIL_SUBJECT_initpwd: string = 'mails.pwd.initpwd.subject';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.PasswordInitialisation';
    public static CODE_TEXT_SMS_initpwd: string = 'sms.pwd.initpwd';

    public static MAILCATEGORY_PasswordInitialisation = 'MAILCATEGORY.PasswordInitialisation';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!PasswordInitialisation.instance) {
            PasswordInitialisation.instance = new PasswordInitialisation();
        }
        return PasswordInitialisation.instance;
    }

    private static instance: PasswordInitialisation = null;

    private constructor() {
    }

    public async begininitpwd(email: string): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.begininitpwd_user(user);
    }

    public async begininitpwd_uid(uid: number): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.begininitpwd_user(user);
    }

    public async begininitpwd_user(user: UserVO): Promise<boolean> {

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        let SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValueAsString(PasswordInitialisation.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);
        let SEND_IN_BLUE_TEMPLATE_ID: number = SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(SEND_IN_BLUE_TEMPLATE_ID_s) : null;

        // Send mail
        if (!!SEND_IN_BLUE_TEMPLATE_ID) {

            // Using SendInBlue
            await SendInBlueMailServerController.getInstance().sendWithTemplate(
                PasswordInitialisation.MAILCATEGORY_PasswordInitialisation,
                SendInBlueMailVO.createNew(user.name, user.email),
                SEND_IN_BLUE_TEMPLATE_ID,
                ['PasswordInitialisation'],
                {
                    EMAIL: user.email,
                    UID: user.id.toString(),
                    CODE_CHALLENGE: user.recovery_challenge
                });
        } else {

            // Using APP
            let translated_mail_subject: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, PasswordInitialisation.CODE_TEXT_MAIL_SUBJECT_initpwd, TranslatableTextVO.API_TYPE_ID)
                .filter_by_id(user.lang_id, LangVO.API_TYPE_ID).select_vo<TranslationVO>();
            await ModuleMailerServer.getInstance().sendMail({
                to: user.email,
                subject: translated_mail_subject.translated,
                html: await ModuleMailerServer.getInstance().prepareHTML(initpwd_mail_html_template, user.lang_id, {
                    EMAIL: user.email,
                    UID: user.id.toString(),
                    CODE_CHALLENGE: user.recovery_challenge
                })
            });
        }
        return true;
    }

    public async beginRecoverySMS(email: string): Promise<boolean> {

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        if (!user.phone) {
            return false;
        }

        let phone = user.phone;

        phone = phone.replace(' ', '');

        let lang = await query(LangVO.API_TYPE_ID).filter_by_id(user.lang_id).select_vo<LangVO>();
        let translation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, PasswordInitialisation.CODE_TEXT_SMS_initpwd, TranslatableTextVO.API_TYPE_ID)
            .filter_by_id(user.lang_id, LangVO.API_TYPE_ID).select_vo<TranslationVO>();


        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        // Using SendInBlue
        await SendInBlueSmsServerController.getInstance().send(
            SendInBlueSmsFormatVO.createNew(phone, lang.code_phone),
            await ModuleMailerServer.getInstance().prepareHTML(translation.translated, user.lang_id, {
                EMAIL: user.email,
                UID: user.id.toString(),
                CODE_CHALLENGE: user.recovery_challenge
            }),
            'PasswordRecovery');
    }
}