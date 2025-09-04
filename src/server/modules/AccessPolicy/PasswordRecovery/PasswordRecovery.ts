import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueMailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueSmsFormatVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import StackContext from '../../../StackContext';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import TemplateHandlerServer from '../../Mailer/TemplateHandlerServer';
import ParamsServerController from '../../Params/ParamsServerController';
import SendInBlueMailServerController from '../../SendInBlue/SendInBlueMailServerController';
import SendInBlueSmsServerController from '../../SendInBlue/sms/SendInBlueSmsServerController';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';
import recovery_mail_html_template from './recovery_mail_html_template.html';
// ConsoleHandler non importé ici (chemin introuvable dans ce contexte) => usage console.warn


export default class PasswordRecovery {

    public static CODE_TEXT_MAIL_SUBJECT_RECOVERY: string = 'mails.pwd.recovery.subject';
    public static CODE_TEXT_SMS_RECOVERY: string = 'mails.pwd.recovery.sms';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.PasswordRecovery';

    public static MAILCATEGORY_PasswordRecovery = 'MAILCATEGORY.PasswordRecovery';

    /** Paramètres optionnels pour régler le rate limit (par défaut si non définis) */
    public static PARAM_NAME_RECOVERY_MAX_PER_IP = 'PasswordRecovery.max_per_ip_15min';
    public static PARAM_NAME_RECOVERY_MAX_PER_USER = 'PasswordRecovery.max_per_user_15min';
    public static PARAM_NAME_RECOVERY_SMS_MAX_PER_IP = 'PasswordRecoverySMS.max_per_ip_15min';
    public static PARAM_NAME_RECOVERY_SMS_MAX_PER_USER = 'PasswordRecoverySMS.max_per_user_15min';
    /** Fenêtre temporelle en ms (15 minutes) */
    private static WINDOW_MS = 15 * 60 * 1000;

    /** Stores en mémoire (flush naturel via nettoyage lors des accès) */
    private static recovery_ip_hits: { [ip: string]: number[] } = {};
    private static recovery_user_hits: { [user_id: number]: number[] } = {};
    private static recovery_sms_ip_hits: { [ip: string]: number[] } = {};
    private static recovery_sms_user_hits: { [user_id: number]: number[] } = {};

    private static instance: PasswordRecovery = null; // singleton

    private constructor() { }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!PasswordRecovery.instance) {
            PasswordRecovery.instance = new PasswordRecovery();
        }
        return PasswordRecovery.instance;
    }

    /** Nettoyage + enregistrement + contrôle. Retourne false si bloqué */
    private static async checkAndRegister(kind: 'mail' | 'sms', ip: string, user: UserVO): Promise<boolean> {
        const now = Date.now();
        const window_start = now - PasswordRecovery.WINDOW_MS;

        const max_ip_param = (kind === 'mail') ? PasswordRecovery.PARAM_NAME_RECOVERY_MAX_PER_IP : PasswordRecovery.PARAM_NAME_RECOVERY_SMS_MAX_PER_IP;
        const max_user_param = (kind === 'mail') ? PasswordRecovery.PARAM_NAME_RECOVERY_MAX_PER_USER : PasswordRecovery.PARAM_NAME_RECOVERY_SMS_MAX_PER_USER;

        const default_ip_limit = (kind === 'mail') ? 5 : 3; // limites par défaut
        const default_user_limit = (kind === 'mail') ? 5 : 3;

        let max_per_ip = await ParamsServerController.getParamValueAsInt(max_ip_param);
        if ((!max_per_ip && max_per_ip !== 0) || (max_per_ip <= 0)) { max_per_ip = default_ip_limit; }
        let max_per_user = await ParamsServerController.getParamValueAsInt(max_user_param);
        if ((!max_per_user && max_per_user !== 0) || (max_per_user <= 0)) { max_per_user = default_user_limit; }

        // Sélection des bons stores
        const ip_store = (kind === 'mail') ? PasswordRecovery.recovery_ip_hits : PasswordRecovery.recovery_sms_ip_hits;
        const user_store = (kind === 'mail') ? PasswordRecovery.recovery_user_hits : PasswordRecovery.recovery_sms_user_hits;

        if (ip) {
            ip_store[ip] = (ip_store[ip] || []).filter(ts => ts >= window_start);
        }
        if (user) {
            user_store[user.id] = (user_store[user.id] || []).filter(ts => ts >= window_start);
        }

        const ip_hits = ip ? (ip_store[ip] || []).length : 0;
        const user_hits = user ? (user_store[user.id] || []).length : 0;

        if ((ip && ip_hits >= max_per_ip) || (user && user_hits >= max_per_user)) {
            console.warn(`[ANTI-SPAM][PWD-${kind.toUpperCase()}] Blocked recovery request - IP:${ip} User:${user?.id}`);
            return false;
        }

        // Enregistrement
        if (ip) {
            ip_store[ip].push(now);
        }
        if (user) {
            user_store[user.id].push(now);
        }
        return true;
    }



    public async beginRecovery(email: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecovery(email);

        return await this.beginRecovery_user(user);
    }

    public async beginRecovery_uid(uid: number): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecoveryUID(uid);

        return await this.beginRecovery_user(user);
    }

    public async beginRecovery_user(user: UserVO): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        // Anti-spam basique par IP + utilisateur
        const client_ip = StackContext.get('CLIENT_IP');
        if (!(await PasswordRecovery.checkAndRegister('mail', client_ip, user))) {
            return false; // On ne révèle pas la raison précise côté client
        }

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        const SEND_IN_BLUE_TEMPLATE_ID: number = await ParamsServerController.getParamValueAsInt(PasswordRecovery.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);

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
                html: await TemplateHandlerServer.apply_template(recovery_mail_html_template, user.lang_id, true, {
                    EMAIL: user.email,
                    UID: user.id.toString(),
                    CODE_CHALLENGE: user.recovery_challenge
                })
            });
        }

        return true;
    }

    public async beginRecoverySMS(email: string): Promise<boolean> {

        if (!await ParamsServerController.getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecovery(email);

        return await this.beginRecoverySMS_user(user);
    }

    public async beginRecoverySMS_uid(uid: number): Promise<boolean> {

        if (!await ParamsServerController.getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecoveryUID(uid);

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

        // Anti-spam basique par IP + utilisateur (SMS)
        const client_ip = StackContext.get('CLIENT_IP');
        if (!(await PasswordRecovery.checkAndRegister('sms', client_ip, user))) {
            return false;
        }

        let phone = user.phone;

        phone = phone.replace(' ', '');

        const lang = await query(LangVO.API_TYPE_ID).filter_by_id(user.lang_id).select_vo<LangVO>();
        const translation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, PasswordRecovery.CODE_TEXT_SMS_RECOVERY, TranslatableTextVO.API_TYPE_ID)
            .filter_by_id(user.lang_id, LangVO.API_TYPE_ID).select_vo<TranslationVO>();

        const sid = StackContext.get('SID');

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        // Using SendInBlue
        await SendInBlueSmsServerController.getInstance().send(
            SendInBlueSmsFormatVO.createNew(phone, lang.code_phone),
            await TemplateHandlerServer.apply_template(translation.translated, user.lang_id, true, {
                EMAIL: user.email,
                UID: user.id.toString(),
                CODE_CHALLENGE: user.recovery_challenge,
                SESSION_SHARE_SID: sid ? encodeURIComponent(sid) : null
            }),
            'PasswordRecovery');

        return true;
    }
}