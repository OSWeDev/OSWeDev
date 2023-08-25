import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import StackContext from '../../../StackContext';
import ModuleAccessPolicyServer from '../../AccessPolicy/ModuleAccessPolicyServer';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import SendInBlueMailServerController from '../../SendInBlue/SendInBlueMailServerController';
import FeedbackConfirmationMail_html_template from './FeedbackConfirmationMail_html_template.html';


export default class FeedbackConfirmationMail {

    public static CODE_TEXT_MAIL_SUBJECT_FeedbackConfirmationMail: string = 'mails.feedback.confirmation.subject';
    public static PARAM_NAME_FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.FeedbackConfirmationMail';

    public static MAILCATEGORY_FeedbackConfirmationMail = 'MAILCATEGORY.FeedbackConfirmationMail';

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!FeedbackConfirmationMail.instance) {
            FeedbackConfirmationMail.instance = new FeedbackConfirmationMail();
        }
        return FeedbackConfirmationMail.instance;
    }

    private static instance: FeedbackConfirmationMail = null;

    private constructor() {
    }

    public async sendConfirmationEmail(feedback: FeedbackVO): Promise<void> {

        // Si on est en impersonate, on envoie pas le mail au compte client mais au compte admin
        let user_id: number = ModuleAccessPolicyServer.getLoggedUserId();
        let target_user_id: number = feedback.is_impersonated ? feedback.impersonated_from_user_id : feedback.user_id;
        let user: UserVO = null;
        if (user_id == target_user_id) {
            user = await ModuleAccessPolicyServer.getSelfUser();
        } else {
            user = await query(UserVO.API_TYPE_ID).filter_by_id(target_user_id).exec_as_server().select_vo<UserVO>();
        }

        let FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValueAsString(FeedbackConfirmationMail.PARAM_NAME_FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID);
        let FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID: number = FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID_s) : null;

        // Send mail
        if (!!FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID) {

            // Using SendInBlue
            await SendInBlueMailServerController.getInstance().sendWithTemplate(
                FeedbackConfirmationMail.MAILCATEGORY_FeedbackConfirmationMail,
                SendInBlueMailVO.createNew(user.name, user.email),
                FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID,
                ['FeedbackConfirmationMail'],
                {
                    EMAIL: user.email,
                    FEEDBACK_TITLE: feedback.title,
                    FEEDBACK_ID: feedback.id.toString()
                });
        } else {

            let translatable_mail_subject: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(FeedbackConfirmationMail.CODE_TEXT_MAIL_SUBJECT_FeedbackConfirmationMail);
            let translated_mail_subject: TranslationVO = await ModuleTranslation.getInstance().getTranslation(user.lang_id, translatable_mail_subject.id);
            await ModuleMailerServer.getInstance().sendMail({
                to: user.email,
                subject: translated_mail_subject.translated,
                html: await ModuleMailerServer.getInstance().prepareHTML(FeedbackConfirmationMail_html_template, user.lang_id, {
                    FEEDBACK_TITLE: feedback.title,
                    FEEDBACK_ID: feedback.id.toString()
                })
            });
        }
    }
}