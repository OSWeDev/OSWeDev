import * as moment from 'moment';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import TextHandler from '../../../../shared/tools/TextHandler';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';

import recovery_mail_html_template from './recovery_mail_html_template.html';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';
import ServerBase from '../../../ServerBase';

export default class PasswordRecovery {

    public static CODE_TEXT_MAIL_SUBJECT_RECOVERY: string = 'mails.pwd.recovery.subject';

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

        // on génère un code qu'on stocke dans le user en base (en datant) et qu'on envoie par mail
        let challenge: string = TextHandler.getInstance().generateChallenge();
        user.recovery_challenge = challenge;
        console.debug("challenge:" + user.email + ':' + challenge + ':');
        user.recovery_expiration = moment().add(ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_RECOVERY_HOURS), 'hours').valueOf();
        await ModuleDAO.getInstance().insertOrUpdateVO(user);

        // Send mail
        let translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordRecovery.CODE_TEXT_MAIL_SUBJECT_RECOVERY);
        let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
        await ModuleMailerServer.getInstance().sendMail({
            to: user.email,
            subject: translated_mail_subject.translated,
            html: await ModuleMailerServer.getInstance().prepareHTML(recovery_mail_html_template, user.lang_id, {
                EMAIL: user.email,
                CODE_CHALLENGE: challenge
            })
        });
    }
}