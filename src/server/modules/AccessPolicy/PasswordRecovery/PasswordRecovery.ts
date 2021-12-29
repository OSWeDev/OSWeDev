import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserLogVO from '../../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
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
import recovery_mail_html_template from './recovery_mail_html_template.html';


export default class PasswordRecovery {

    public static CODE_TEXT_MAIL_SUBJECT_RECOVERY: string = 'mails.pwd.recovery.subject';
    public static CODE_TEXT_SMS_RECOVERY: string = 'mails.pwd.recovery.sms';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.PasswordRecovery';

    public static MAILCATEGORY_PasswordRecovery = 'MAILCATEGORY.PasswordRecovery';

    public static getInstance() {
        if (!PasswordRecovery.instance) {
            PasswordRecovery.instance = new PasswordRecovery();
        }
        return PasswordRecovery.instance;
    }

    private static instance: PasswordRecovery = null;

    private constructor() {
    }

    public async beginRecovery(email: string): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        return await this.beginRecovery_user(user);
    }

    public async beginRecovery_uid(uid: number): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        return await this.beginRecovery_user(user);
    }

    public async beginRecovery_user(user: UserVO): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        // On doit se comporter comme un server à ce stade
        await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

            let SEND_IN_BLUE_TEMPLATE_ID: number = await ModuleParams.getInstance().getParamValueAsInt(PasswordRecovery.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);

            // Send mail
            if (!!SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    PasswordRecovery.MAILCATEGORY_PasswordRecovery,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    SEND_IN_BLUE_TEMPLATE_ID,
                    ['PasswordRecovery'],
                    {
                        EMAIL: user.email,
                        UID: user.id.toString(),
                        CODE_CHALLENGE: user.recovery_challenge
                    });
            } else {

                // Send mail
                let translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordRecovery.CODE_TEXT_MAIL_SUBJECT_RECOVERY);
                let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
                await ModuleMailerServer.getInstance().sendMail({
                    to: user.email,
                    subject: translated_mail_subject.translated,
                    html: await ModuleMailerServer.getInstance().prepareHTML(recovery_mail_html_template, user.lang_id, {
                        EMAIL: user.email,
                        UID: user.id.toString(),
                        CODE_CHALLENGE: user.recovery_challenge
                    })
                });
            }
        });
    }

    public async beginRecoverySMS(email: string): Promise<boolean> {

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        return await this.beginRecoverySMS_user(user);
    }

    public async beginRecoverySMS_uid(uid: number): Promise<boolean> {

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        return await this.beginRecoverySMS_user(user);
    }

    public async beginRecoverySMS_user(user: UserVO): Promise<boolean> {

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

        let lang = await ModuleDAO.getInstance().getVoById<LangVO>(LangVO.API_TYPE_ID, user.lang_id);
        let translatable_text = await ModuleTranslation.getInstance().getTranslatableText(PasswordRecovery.CODE_TEXT_SMS_RECOVERY);
        let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable_text.id);

        let session = StackContext.getInstance().get('SESSION');
        let sid = session.sid;

        // On doit se comporter comme un server à ce stade
        await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

            // Using SendInBlue
            await SendInBlueSmsServerController.getInstance().send(
                SendInBlueSmsFormatVO.createNew(phone, lang.code_phone),
                await ModuleMailerServer.getInstance().prepareHTML(translation.translated, user.lang_id, {
                    EMAIL: user.email,
                    UID: user.id.toString(),
                    CODE_CHALLENGE: user.recovery_challenge,
                    SESSION_SHARE_SID: sid ? encodeURIComponent(sid) : null
                }),
                'PasswordRecovery');
        });
    }
}