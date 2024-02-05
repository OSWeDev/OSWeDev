import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueServerController from './SendInBlueServerController';
import SendInBlueAttachmentVO from '../../../shared/modules/SendInBlue/vos/SendInBlueAttachmentVO';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleSendInBlue from '../../../shared/modules/SendInBlue/ModuleSendInBlue';
import MailVO from '../../../shared/modules/Mailer/vos/MailVO';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import StackContext from '../../StackContext';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MailEventVO from '../../../shared/modules/Mailer/vos/MailEventVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import MailCategoryVO from '../../../shared/modules/Mailer/vos/MailCategoryVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';

export default class SendInBlueMailServerController {

    public static PATH_EMAIL: string = 'smtp/email';
    public static PATH_STATS_EVENTS: string = 'smtp/statistics/events';

    public static getInstance(): SendInBlueMailServerController {
        if (!SendInBlueMailServerController.instance) {
            SendInBlueMailServerController.instance = new SendInBlueMailServerController();
        }
        return SendInBlueMailServerController.instance;
    }

    private static instance: SendInBlueMailServerController = null;

    public async send(
        mail_category: string,
        to: SendInBlueMailVO,
        subject: string,
        textContent: string,
        htmlContent: string,
        tags: string[] = null,
        templateId: number = null,
        bcc: SendInBlueMailVO[] = null,
        cc: SendInBlueMailVO[] = null,
        attachments: SendInBlueAttachmentVO[] = null,
        sender: SendInBlueMailVO = null,
        reply_to: SendInBlueMailVO = null): Promise<boolean> {

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.node_configuration.BLOCK_MAIL_DELIVERY) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(to.email, this.convert_mails_vo_to_string_list(cc), this.convert_mails_vo_to_string_list(bcc))) {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + to.email + ':' + this.convert_mails_vo_to_string_list(cc) + ':' + this.convert_mails_vo_to_string_list(bcc));

            } else {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env: ' + subject);
                return;
            }
        }

        let postParams: any = {
            sender: sender ? sender : await SendInBlueServerController.getInstance().getSender(),
            to: [to],
            replyTo: reply_to ? reply_to : await SendInBlueServerController.getInstance().getReplyTo(),
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent,
        };

        if (bcc && bcc.length > 0) {
            postParams.bcc = bcc;
        }

        if (cc && cc.length > 0) {
            postParams.cc = cc;
        }

        if (attachments && attachments.length > 0) {
            postParams.attachments = attachments;
        }

        if (templateId) {
            postParams.templateId = templateId;
        }

        if (tags && tags.length > 0) {
            postParams.tags = tags;
        }

        let res: { messageId: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ messageId: string }>(
            ModuleRequest.METHOD_POST,
            SendInBlueMailServerController.PATH_EMAIL,
            postParams
        );

        if (!res || !res.messageId) {
            ConsoleHandler.error('SendInBlueMailServerController.send:Failed:res vide ou pas de messageId:' + JSON.stringify(postParams) + ':');
            return false;
        }

        /**
         * On stocke le mail en base
         */
        await this.insert_new_mail(to.email, res.messageId, mail_category);

        return true;
    }

    public async sendWithTemplate(
        mail_category: string,
        to: SendInBlueMailVO,
        templateId: number,
        tags: string[] = null,
        params: { [param_name: string]: any } = {},
        bcc: SendInBlueMailVO[] = null,
        cc: SendInBlueMailVO[] = null,
        attachments: SendInBlueAttachmentVO[] = null,
        sender: SendInBlueMailVO = null,
        reply_to: SendInBlueMailVO = null): Promise<MailVO> {

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.node_configuration.BLOCK_MAIL_DELIVERY) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(to.email, this.convert_mails_vo_to_string_list(cc), this.convert_mails_vo_to_string_list(bcc))) {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + to.email + ':' + this.convert_mails_vo_to_string_list(cc) + ':' + this.convert_mails_vo_to_string_list(bcc));

            } else {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env:templateId: ' + templateId);
                return null;
            }
        }

        let postParams: any = {
            sender: sender ? sender : await SendInBlueServerController.getInstance().getSender(),
            to: [to],
            templateId: templateId,
            replyTo: reply_to ? reply_to : await SendInBlueServerController.getInstance().getReplyTo(),
        };

        if (bcc && bcc.length > 0) {
            postParams.bcc = bcc;
        }

        if (cc && cc.length > 0) {
            postParams.cc = cc;
        }

        /**
         * On tente de charger des params supplémentaires sur ce template pour les cc et bcc :
         *  ( plusieurs adresses possibles séparées par des ',' )
         *  PARAM_NAME_TEMPLATE_CC_PREFIX + template_id
         *  PARAM_NAME_TEMPLATE_BCC_PREFIX + template_id
         */
        let param_cc = await ModuleParams.getInstance().getParamValueAsString(ModuleSendInBlue.PARAM_NAME_TEMPLATE_CC_PREFIX + templateId);
        let param_bcc = await ModuleParams.getInstance().getParamValueAsString(ModuleSendInBlue.PARAM_NAME_TEMPLATE_BCC_PREFIX + templateId);
        if (param_cc && param_cc.length) {
            if (!postParams.cc) {
                postParams.cc = [];
            }
            let ccs = param_cc.split(',');
            for (let i in ccs) {
                let cc_ = ccs[i];
                postParams.cc.push(SendInBlueMailVO.createNew(cc_, cc_));
            }
        }

        if (param_bcc && param_bcc.length) {
            if (!postParams.bcc) {
                postParams.bcc = [];
            }
            let bccs = param_bcc.split(',');
            for (let i in bccs) {
                let bcc_ = bccs[i];
                postParams.bcc.push(SendInBlueMailVO.createNew(bcc_, bcc_));
            }
        }

        if (attachments && attachments.length > 0) {
            postParams.attachments = attachments;
        }

        if (tags && tags.length > 0) {
            postParams.tags = tags;
        }

        if (params) {
            postParams.params = params;
        }

        this.add_default_params(params);

        let res: { messageId: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ messageId: string }>(
            ModuleRequest.METHOD_POST,
            SendInBlueMailServerController.PATH_EMAIL,
            postParams
        );

        if (!res || !res.messageId) {
            ConsoleHandler.error('SendInBlueMailServerController.send:Failed:res vide ou pas de messageId:' + JSON.stringify(postParams) + ':');
            return null;
        }

        /**
         * On stocke le mail en base et on retourne le MailVO
         */
        return await this.insert_new_mail(to.email, res.messageId, mail_category);
    }

    private async insert_new_mail(to_mail: string, message_id: string, mail_category: string): Promise<MailVO> {

        if ((!mail_category) || (!message_id) || (!to_mail)) {
            ConsoleHandler.error('SendInBlueMailServerController.insert_new_mail:Failed:paramètres invalides:' + mail_category + ':' + message_id + ':' + to_mail + ':');
            return null;
        }

        let category = await ModuleDAO.getInstance().getNamedVoByName<MailCategoryVO>(MailCategoryVO.API_TYPE_ID, mail_category);

        if (!category) {
            category = new MailCategoryVO();
            category.name = mail_category;
            let res_cat = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(category);
            if (!res_cat || !res_cat.id) {
                ConsoleHandler.error('SendInBlueMailServerController.insert_new_mail:Failed:Impossible de créer la nouvelle catégorie de mail:' + mail_category + ':');
                return null;
            }
            category.id = res_cat.id;
        }

        let mail = new MailVO();
        mail.category_id = category.id;
        mail.email = to_mail;
        mail.last_state = MailEventVO.EVENT_Initie;
        mail.last_up_date = Dates.now();
        mail.message_id = message_id;
        mail.send_date = mail.last_up_date;
        mail.sent_by_id = StackContext.get('UID');
        mail.sent_to_id = await this.get_uid_if_exists(to_mail);
        let res = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mail);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('SendInBlueMailServerController.insert_new_mail:failed inserting new mail:' + JSON.stringify(mail) + ':');
            return null;
        }

        // et on insère le premier event qui est interne
        let first_event = new MailEventVO();
        first_event.event = MailEventVO.EVENT_Initie;
        first_event.event_date = Dates.now();
        first_event.mail_id = mail.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(first_event);

        return mail;
    }

    private async get_uid_if_exists(email: string) {
        let user: UserVO = await query(UserVO.API_TYPE_ID).filter_by_text_eq('email', email).exec_as_server().select_vo<UserVO>();
        if (!!user) {
            return user.id;
        }
        return null;
    }

    private add_default_params(params: any) {

        if (!params) {
            params = {};
        }

        // On ajoute les params d'environnement
        let envs: EnvParam = ConfigurationService.node_configuration;
        for (let i in envs) {
            if (!params[i]) {
                params[i] = envs[i];
            }
        }

        let session = StackContext.get('SESSION');
        let sid = session ? session.sid : null;
        params['SESSION_SHARE_SID'] = sid ? encodeURIComponent(sid) : null;
    }

    private convert_mails_vo_to_string_list(bcc: SendInBlueMailVO[]): string {
        let res: string = '';

        for (let i in bcc) {
            let e = bcc[i];

            if (!res) {
                res = e.email;
            } else {
                res += ',' + e.email;
            }
        }

        return res;
    }
}