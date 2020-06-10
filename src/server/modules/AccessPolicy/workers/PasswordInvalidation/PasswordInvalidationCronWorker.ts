import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import ModuleMailerServer from '../../../Mailer/ModuleMailerServer';
import invalidation_mail_html_template from './invalidation_mail_html_template.html';
import PasswordInvalidationController from './PasswordInvalidationController';
import reminder1_mail_html_template from './reminder1_mail_html_template.html';
import reminder2_mail_html_template from './reminder2_mail_html_template.html';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';


export default class PasswordInvalidationCronWorker implements ICronWorker {

    public static CODE_TEXT_MAIL_SUBJECT_INVALIDATION: string = 'mails.pwd.invalidation.subject';
    public static CODE_TEXT_MAIL_SUBJECT_REMINDER1: string = 'mails.pwd.reminder1.subject';
    public static CODE_TEXT_MAIL_SUBJECT_REMINDER2: string = 'mails.pwd.reminder2.subject';

    public static getInstance() {
        if (!PasswordInvalidationCronWorker.instance) {
            PasswordInvalidationCronWorker.instance = new PasswordInvalidationCronWorker();
        }
        return PasswordInvalidationCronWorker.instance;
    }

    private static instance: PasswordInvalidationCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "PasswordInvalidationCronWorker";
    }

    public async work() {
        // On check les dates d'invalidation et de reminder
        let users: UserVO[] = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);
        let translatable_mail_invalidation_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordInvalidationCronWorker.CODE_TEXT_MAIL_SUBJECT_INVALIDATION);
        let translatable_mail_reminder1_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordInvalidationCronWorker.CODE_TEXT_MAIL_SUBJECT_REMINDER1);
        let translatable_mail_reminder2_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(PasswordInvalidationCronWorker.CODE_TEXT_MAIL_SUBJECT_REMINDER2);

        let users_to_remind_1: UserVO[] = [];
        let users_to_remind_2: UserVO[] = [];
        let users_to_invalidate: UserVO[] = [];

        PasswordInvalidationController.getInstance().get_users_to_remind_and_invalidate(
            users,
            ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD1_DAYS),
            ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD2_DAYS),
            ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_PWD_INVALIDATION_DAYS),
            users_to_remind_1,
            users_to_remind_2,
            users_to_invalidate);

        for (let i in users_to_remind_1) {
            let user = users_to_remind_1[i];

            user.reminded_pwd_1 = true;
            await ModuleDAO.getInstance().insertOrUpdateVO(user);

            if (translatable_mail_reminder1_subject) {
                let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_reminder1_subject.id);

                if (translated_mail_subject) {

                    await ModuleMailerServer.getInstance().sendMail({
                        to: user.email,
                        subject: translated_mail_subject.translated,
                        html: await ModuleMailerServer.getInstance().prepareHTML(reminder1_mail_html_template, user.lang_id, {
                            EMAIL: user.email
                        })
                    });
                }
            }
        }

        for (let i in users_to_remind_2) {
            let user = users_to_remind_2[i];

            user.reminded_pwd_1 = true;
            user.reminded_pwd_2 = true;
            await ModuleDAO.getInstance().insertOrUpdateVO(user);

            if (translatable_mail_reminder2_subject) {
                let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_reminder2_subject.id);

                if (translated_mail_subject) {

                    await ModuleMailerServer.getInstance().sendMail({
                        to: user.email,
                        subject: translated_mail_subject.translated,
                        html: await ModuleMailerServer.getInstance().prepareHTML(reminder2_mail_html_template, user.lang_id, {
                            EMAIL: user.email
                        })
                    });
                }
            }
        }

        for (let i in users_to_invalidate) {
            let user = users_to_invalidate[i];

            user.invalidated = true;
            user.password = '';
            user.reminded_pwd_1 = true;
            user.reminded_pwd_2 = true;

            await ModuleDAO.getInstance().insertOrUpdateVO(user);

            if (translatable_mail_invalidation_subject) {
                let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_invalidation_subject.id);

                if (translated_mail_subject) {

                    await ModuleMailerServer.getInstance().sendMail({
                        to: user.email,
                        subject: translated_mail_subject.translated,
                        html: await ModuleMailerServer.getInstance().prepareHTML(invalidation_mail_html_template, user.lang_id, {
                            EMAIL: user.email
                        })
                    });
                }
            }
        }
    }
}