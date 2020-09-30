import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import ServerBase from '../../../ServerBase';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import FeedbackConfirmationMail_html_template from './FeedbackConfirmationMail_html_template.html';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import SendInBlueMailServerController from '../../SendInBlue/SendInBlueMailServerController';
import SendInBlueMailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ModuleAccessPolicyServer from '../../AccessPolicy/ModuleAccessPolicyServer';
import StackContext from '../../../../shared/tools/StackContext';


export default class FeedbackConfirmationMail {

    public static CODE_TEXT_MAIL_SUBJECT_FeedbackConfirmationMail: string = 'mails.feedback.confirmation.subject';
    public static PARAM_NAME_FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID: string = 'SEND_IN_BLUE_TEMPLATE_ID.FeedbackConfirmationMail';

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

        // On doit se comporter comme un server à ce stade
        await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            // Si on est en impersonate, on envoie pas le mail au compte client mais au compte admin
            let user_id: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
            let target_user_id: number = feedback.is_impersonated ? feedback.impersonated_from_user_id : feedback.user_id;
            let user: UserVO = null;
            if (user_id == target_user_id) {
                user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
            } else {
                user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, target_user_id);
            }

            let FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(FeedbackConfirmationMail.PARAM_NAME_FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID);
            let FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID: number = FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID_s) : null;

            // Send mail
            if (!!FeedbackConfirmationMail_SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
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
        });
    }
}