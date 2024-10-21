import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueMailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueSmsFormatVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import StackContext from '../../../StackContext';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import TemplateHandlerServer from '../../Mailer/TemplateHandlerServer';
import SendInBlueMailServerController from '../../SendInBlue/SendInBlueMailServerController';
import SendInBlueSmsServerController from '../../SendInBlue/sms/SendInBlueSmsServerController';
import ModuleAccessPolicyServer from '../ModuleAccessPolicyServer';


export default class UserRecapture {

    public static CODE_TEXT_MAIL_SUBJECT_recapture: string = 'mails.pwd.recapture.subject';
    public static PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.UserRecapture';
    public static CODE_TEXT_SMS_recapture: string = 'sms.pwd.recapture';

    public static MAILCATEGORY_UserRecapture = 'MAILCATEGORY.UserRecapture';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!UserRecapture.instance) {
            UserRecapture.instance = new UserRecapture();
        }
        return UserRecapture.instance;
    }

    private static instance: UserRecapture = null;

    private constructor() {
    }

    public async beginrecapture(email: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.beginrecapture_user(user);
    }

    public async beginrecapture_uid(uid: number): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.beginrecapture_user(user);
    }

    public async beginrecapture_user(user: UserVO): Promise<boolean> {

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        const SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValueAsString(UserRecapture.PARAM_NAME_SEND_IN_BLUE_TEMPLATE_ID);
        const SEND_IN_BLUE_TEMPLATE_ID: number = SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(SEND_IN_BLUE_TEMPLATE_ID_s) : null;

        // Send mail
        if (SEND_IN_BLUE_TEMPLATE_ID) {

            // Using SendInBlue
            await SendInBlueMailServerController.getInstance().sendWithTemplate(
                UserRecapture.MAILCATEGORY_UserRecapture,
                SendInBlueMailVO.createNew(user.name, user.email),
                SEND_IN_BLUE_TEMPLATE_ID,
                ['UserRecapture'],
                {
                    EMAIL: user.email,
                    UID: user.id.toString(),
                    CODE_CHALLENGE: user.recovery_challenge
                });
        }
        return true;
    }

    public async beginRecaptureSMS(email: string): Promise<boolean> {

        if (!await ModuleParams.getInstance().getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION)) {
            return;
        }

        const user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

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
        const translatable_text = await ModuleTranslation.getInstance().getTranslatableText(UserRecapture.CODE_TEXT_SMS_recapture);
        const translation = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable_text.id);

        await ModuleAccessPolicyServer.getInstance().generate_challenge(user);

        // Using SendInBlue
        await SendInBlueSmsServerController.getInstance().send(
            SendInBlueSmsFormatVO.createNew(phone, lang.code_phone),
            await TemplateHandlerServer.apply_template(translation.translated, user.lang_id, true, {
                EMAIL: user.email,
                UID: user.id.toString(),
                CODE_CHALLENGE: user.recovery_challenge
            }),
            'UserRecapture');
    }
}