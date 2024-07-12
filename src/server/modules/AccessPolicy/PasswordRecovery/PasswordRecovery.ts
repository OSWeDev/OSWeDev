import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserLogVO from '../../../../shared/modules/AccessPolicy/vos/UserLogVO';
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
import recovery_mail_html_template from './recovery_mail_html_template.html';


export default class PasswordRecovery {

    public static CODE_TEXT_MAIL_SUBJECT_RECOVERY: string = 'mails.pwd.recovery.subject';
    public static CODE_TEXT_SMS_RECOVERY: string = 'mails.pwd.recovery.sms';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.PasswordRecovery';

    public static MAILCATEGORY_PasswordRecovery = 'MAILCATEGORY.PasswordRecovery';

    // istanbul ignore next: nothing to test : getInstance
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

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        return await this.beginRecovery_user(user);
    }

    public async beginRecovery_uid(uid: number): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        return await this.beginRecovery_user(user);
    }

    public async beginRecovery_user(user: UserVO): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        const SEND_IN_BLUE_TEMPLATE_ID: number = await ModuleParams.getInstance().getParamValueAsInt(PasswordRecovery.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);

        // Send mail
        if (SEND_IN_BLUE_TEMPLATE_ID) {

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
            const translated_mail_subject: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, PasswordRecovery.CODE_TEXT_MAIL_SUBJECT_RECOVERY, TranslatableTextVO.API_TYPE_ID)
                .filter_by_id(user.lang_id, LangVO.API_TYPE_ID).select_vo<TranslationVO>();

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

    public async beginRecoverySMS(email: string): Promise<boolean> {

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        return await this.beginRecoverySMS_user(user);
    }

    public async beginRecoverySMS_uid(uid: number): Promise<boolean> {

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

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

        const lang = await query(LangVO.API_TYPE_ID).filter_by_id(user.lang_id).select_vo<LangVO>();
        const translation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, PasswordRecovery.CODE_TEXT_SMS_RECOVERY, TranslatableTextVO.API_TYPE_ID)
            .filter_by_id(user.lang_id, LangVO.API_TYPE_ID).select_vo<TranslationVO>();

        const session = StackContext.get('SESSION');
        const sid = session.sid;

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
    }
}