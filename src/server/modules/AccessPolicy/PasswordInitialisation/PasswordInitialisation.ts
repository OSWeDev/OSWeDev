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

        // On doit se comporter comme un server à ce stade
        await StackContext.runPromise({ IS_CLIENT: false }, async () => {

            await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

            let SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(PasswordInitialisation.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);
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
                let translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordInitialisation.CODE_TEXT_MAIL_SUBJECT_initpwd);
                let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
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
        });
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
        let translatable_text = await ModuleTranslation.getInstance().getTranslatableText(PasswordInitialisation.CODE_TEXT_SMS_initpwd);
        let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable_text.id);

        // On doit se comporter comme un server à ce stade
        await StackContext.runPromise({ IS_CLIENT: false }, async () => {

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
        });
    }
}