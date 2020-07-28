import * as moment from 'moment';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import TextHandler from '../../../../shared/tools/TextHandler';
import ServerBase from '../../../ServerBase';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import initpwd_mail_html_template from './initpwd_mail_html_template.html';


export default class PasswordInitialisation {

    public static CODE_TEXT_MAIL_SUBJECT_initpwd: string = 'mails.pwd.initpwd.subject';

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

        // On doit se comporter comme un server à ce stade
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        httpContext.set('IS_CLIENT', false);

        // on génère un code qu'on stocke dans le user en base (en datant) et qu'on envoie par mail
        let challenge: string = TextHandler.getInstance().generateChallenge();
        user.recovery_challenge = challenge;
        console.debug("challenge:" + user.email + ':' + challenge + ':');
        user.recovery_expiration = moment().utc(true).add(ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS), 'hours').valueOf();
        await ModuleDAO.getInstance().insertOrUpdateVO(user);

        // Send mail
        let translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordInitialisation.CODE_TEXT_MAIL_SUBJECT_initpwd);
        let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
        await ModuleMailerServer.getInstance().sendMail({
            to: user.email,
            subject: translated_mail_subject.translated,
            html: await ModuleMailerServer.getInstance().prepareHTML(initpwd_mail_html_template, user.lang_id, {
                EMAIL: user.email,
                UID: user.id.toString(),
                CODE_CHALLENGE: challenge
            })
        });
    }
}