import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import ServerBase from '../../../ServerBase';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import SendInBlueMailServerController from '../../SendInBlue/SendInBlueMailServerController';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';
import recovery_mail_html_template from './recovery_mail_html_template.html';


export default class PasswordRecovery {

    public static CODE_TEXT_MAIL_SUBJECT_RECOVERY: string = 'mails.pwd.recovery.subject';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.PasswordRecovery';

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

        if (!user) {
            return false;
        }

        // On doit se comporter comme un server à ce stade
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        httpContext.set('IS_CLIENT', false);

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        let SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(PasswordRecovery.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);
        let SEND_IN_BLUE_TEMPLATE_ID: number = SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(SEND_IN_BLUE_TEMPLATE_ID_s) : null;

        // Send mail
        if (!!SEND_IN_BLUE_TEMPLATE_ID) {

            // Using SendInBlue
            await SendInBlueMailServerController.getInstance().sendWithTemplate(
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
    }
}