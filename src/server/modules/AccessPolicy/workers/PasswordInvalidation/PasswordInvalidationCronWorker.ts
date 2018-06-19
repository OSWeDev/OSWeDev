import * as moment from 'moment';
import { Moment } from 'moment';
import ICronWorker from '../../../../../shared/modules/Cron/interfaces/ICronWorker';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleMailerServer from '../../../Mailer/ModuleMailerServer';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';

import invalidation_mail_html_template from './invalidation_mail_html_template.html';
import reminder1_mail_html_template from './reminder1_mail_html_template.html';
import reminder2_mail_html_template from './reminder2_mail_html_template.html';

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

        for (let i in users) {
            let user: UserVO = users[i];

            if (user.invalidated) {
                continue;
            }

            let date_modif_pass: Moment = moment(user.password_change_date);
            let nb_days: number = moment().diff(date_modif_pass) / 1000 / 60 / 60 / 24;
            let nb_days_to_invalidation: number = ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_PWD_INVALIDATION_DAYS) - nb_days;

            // Le cas de l'invalidation
            if (nb_days_to_invalidation < 0) {

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
                            html: await ModuleMailerServer.getInstance().prepareHTML(invalidation_mail_html_template, user.lang_id)
                        });
                    }
                }
            }

            // Premier rappel
            if ((!user.reminded_pwd_1) && (nb_days_to_invalidation <= ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD1_DAYS))) {
                user.reminded_pwd_1 = true;
                await ModuleDAO.getInstance().insertOrUpdateVO(user);

                if (translatable_mail_reminder1_subject) {
                    let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_reminder1_subject.id);

                    if (translated_mail_subject) {

                        await ModuleMailerServer.getInstance().sendMail({
                            to: user.email,
                            subject: translated_mail_subject.translated,
                            html: await ModuleMailerServer.getInstance().prepareHTML(reminder1_mail_html_template, user.lang_id)
                        });
                    }
                }
            }

            // Second rappel
            if ((!user.reminded_pwd_2) && (nb_days_to_invalidation <= ModuleAccessPolicy.getInstance().getParamValue(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD2_DAYS))) {
                user.reminded_pwd_2 = true;
                await ModuleDAO.getInstance().insertOrUpdateVO(user);

                if (translatable_mail_reminder2_subject) {
                    let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_reminder2_subject.id);

                    if (translated_mail_subject) {

                        await ModuleMailerServer.getInstance().sendMail({
                            to: user.email,
                            subject: translated_mail_subject.translated,
                            html: await ModuleMailerServer.getInstance().prepareHTML(reminder2_mail_html_template, user.lang_id)
                        });
                    }
                }
            }
        }
    }
}