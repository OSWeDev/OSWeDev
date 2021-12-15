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
import SendInBlueMailServerController from '../../../SendInBlue/SendInBlueMailServerController';
import SendInBlueMailVO from '../../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import ModuleAccessPolicyServer from '../../ModuleAccessPolicyServer';


export default class PasswordInvalidationCronWorker implements ICronWorker {

    public static CODE_TEXT_MAIL_SUBJECT_INVALIDATION: string = 'mails.pwd.invalidation.subject';
    public static CODE_TEXT_MAIL_SUBJECT_REMINDER1: string = 'mails.pwd.reminder1.subject';
    public static CODE_TEXT_MAIL_SUBJECT_REMINDER2: string = 'mails.pwd.reminder2.subject';
    public static PARAM_NAME_REMIND1_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.REMIND1';
    public static PARAM_NAME_REMIND2_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.REMIND2';
    public static PARAM_NAME_INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.INVALIDATE';

    public static MAILCATEGORY_PasswordInvalidation_RMD1 = 'MAILCATEGORY.PasswordInvalidation_RMD1';
    public static MAILCATEGORY_PasswordInvalidation_RMD2 = 'MAILCATEGORY.PasswordInvalidation_RMD2';
    public static MAILCATEGORY_PasswordInvalidation_INVALIDATE = 'MAILCATEGORY.PasswordInvalidation_INVALIDATE';

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
            await ModuleParams.getInstance().getParamValueAsInt(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD1_DAYS),
            await ModuleParams.getInstance().getParamValueAsInt(ModuleAccessPolicy.PARAM_NAME_REMINDER_PWD2_DAYS),
            await ModuleParams.getInstance().getParamValueAsInt(ModuleAccessPolicy.PARAM_NAME_PWD_INVALIDATION_DAYS),
            users_to_remind_1,
            users_to_remind_2,
            users_to_invalidate);

        for (let i in users_to_remind_1) {
            let user = users_to_remind_1[i];

            user.reminded_pwd_1 = true;
            await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

            let REMIND1_SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(PasswordInvalidationCronWorker.PARAM_NAME_REMIND1_SEND_IN_BLUE_TEMPLATE_ID);
            let REMIND1_SEND_IN_BLUE_TEMPLATE_ID: number = REMIND1_SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(REMIND1_SEND_IN_BLUE_TEMPLATE_ID_s) : null;

            // Send mail
            if (!!REMIND1_SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    PasswordInvalidationCronWorker.MAILCATEGORY_PasswordInvalidation_RMD1,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    REMIND1_SEND_IN_BLUE_TEMPLATE_ID,
                    ['REMIND1'],
                    {
                        EMAIL: user.email,
                        UID: user.id.toString(),
                        CODE_CHALLENGE: user.recovery_challenge
                    });
            } else {

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
        }

        for (let i in users_to_remind_2) {
            let user = users_to_remind_2[i];

            user.reminded_pwd_1 = true;
            user.reminded_pwd_2 = true;
            await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

            let REMIND2_SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(PasswordInvalidationCronWorker.PARAM_NAME_REMIND2_SEND_IN_BLUE_TEMPLATE_ID);
            let REMIND2_SEND_IN_BLUE_TEMPLATE_ID: number = REMIND2_SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(REMIND2_SEND_IN_BLUE_TEMPLATE_ID_s) : null;

            // Send mail
            if (!!REMIND2_SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    PasswordInvalidationCronWorker.MAILCATEGORY_PasswordInvalidation_RMD2,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    REMIND2_SEND_IN_BLUE_TEMPLATE_ID,
                    ['REMIND2'],
                    {
                        EMAIL: user.email,
                        UID: user.id.toString(),
                        CODE_CHALLENGE: user.recovery_challenge
                    });
            } else {

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
        }

        for (let i in users_to_invalidate) {
            let user = users_to_invalidate[i];

            user.invalidated = true;
            user.password = '';
            user.reminded_pwd_1 = true;
            user.reminded_pwd_2 = true;
            await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

            let INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(PasswordInvalidationCronWorker.PARAM_NAME_INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID);
            let INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID: number = INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID_s) : null;

            // Send mail
            if (!!INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    PasswordInvalidationCronWorker.MAILCATEGORY_PasswordInvalidation_INVALIDATE,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    INVALIDATE_SEND_IN_BLUE_TEMPLATE_ID,
                    ['INVALIDATE'],
                    {
                        EMAIL: user.email,
                        UID: user.id.toString(),
                        CODE_CHALLENGE: user.recovery_challenge
                    });
            } else {

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
}