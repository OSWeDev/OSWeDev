import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MailCategoryUserVO from '../../../shared/modules/Mailer/vos/MailCategoryUserVO';
import MailCategoryVO from '../../../shared/modules/Mailer/vos/MailCategoryVO';
import MailEventVO from '../../../shared/modules/Mailer/vos/MailEventVO';
import MailVO from '../../../shared/modules/Mailer/vos/MailVO';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ModuleSendInBlue from '../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueAttachmentVO from '../../../shared/modules/SendInBlue/vos/SendInBlueAttachmentVO';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import ParamsServerController from '../Params/ParamsServerController';
import SendInBlueServerController from './SendInBlueServerController';

export default class SendInBlueMailServerController {

    public static PATH_EMAIL: string = 'smtp/email';
    public static PATH_STATS_EVENTS: string = 'smtp/statistics/events';

    private static instance: SendInBlueMailServerController = null;

    // istanbul ignore next: nothing to test
    public static getInstance(): SendInBlueMailServerController {
        if (!SendInBlueMailServerController.instance) {
            SendInBlueMailServerController.instance = new SendInBlueMailServerController();
        }
        return SendInBlueMailServerController.instance;
    }

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

        // let use_sandbox: boolean = false;

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.node_configuration.block_mail_delivery) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(to.email, this.convert_mails_vo_to_string_list(cc), this.convert_mails_vo_to_string_list(bcc))) {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + to.email + ':' + this.convert_mails_vo_to_string_list(cc) + ':' + this.convert_mails_vo_to_string_list(bcc));

            } else {
                // // On utilise le mode sandbox de Brevo pour les tests => TODO FIXME quand on a validé ce mode, ne plus bloquer l'envoi
                // use_sandbox = true;
                ConsoleHandler.warn('Envoi de mails interdit sur cet env: ' + subject);
                return false;
            }
        }

        try {

            if (!to || !to.email || !to.email.trim().length) {
                ConsoleHandler.error('SendInBlueMailServerController.send:Failed:to vide ou sans email:' + JSON.stringify(to) + ':' + subject + ':' + textContent + ':' + htmlContent + ':' + tags + ':' + templateId + ':' + bcc + ':' + cc + ':' + attachments + ':' + sender + ':' + reply_to);
                return false;
            }

            if (!await this.check_optin(to.email, mail_category)) {
                ConsoleHandler.warn('SendInBlueMailServerController.send:Failed:Utilisateur non optin:' + to.email + ':' + subject + ':' + textContent + ':' + htmlContent + ':' + tags + ':' + templateId + ':' + bcc + ':' + cc + ':' + attachments + ':' + sender + ':' + reply_to);
                return false;
            }

            const postParams: any = {
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

            // // TODO FIXME : quand on valide le mode sandbox, on arrête de bloquer l'envoi des mails, mais on les envoie en mode sandbox
            // // Sauf que pour le moment ça marche pas du tout.... https://developers.brevo.com/docs/using-sandbox-mode-to-send-an-email
            // // Par ailleurs, on n'aura pas de log d'après la doc dans brevo, et c'était mon but initial... donc je laisse en plan
            // // if (use_sandbox) {
            // if (ConfigurationService.node_configuration.block_mail_delivery) {
            //     postParams.headers = {
            //         'X-Sib-Sandbox': 'drop',
            //     };
            // }

            const res: { messageId: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ messageId: string }>(
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
        } catch (error) {
            ConsoleHandler.error('SendInBlueMailServerController.send:Failed:' + error + ':' + JSON.stringify(to) + ':' + subject + ':' + textContent + ':' + htmlContent + ':' + tags + ':' + templateId + ':' + bcc + ':' + cc + ':' + attachments + ':' + sender + ':' + reply_to);
        }

        return false;
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
        if (ConfigurationService.node_configuration.block_mail_delivery) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(to.email, this.convert_mails_vo_to_string_list(cc), this.convert_mails_vo_to_string_list(bcc))) {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + to.email + ':' + this.convert_mails_vo_to_string_list(cc) + ':' + this.convert_mails_vo_to_string_list(bcc));

            } else {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env:templateId: ' + templateId);
                return null;
            }
        }

        try {

            if (!to || !to.email || !to.email.trim().length) {
                ConsoleHandler.error('SendInBlueMailServerController.send:Failed:to vide ou sans email:' + JSON.stringify(to) + ':' + templateId + ':' + tags + ':' + params + ':' + bcc + ':' + cc + ':' + attachments + ':' + sender + ':' + reply_to);
                return null;
            }

            if (!await this.check_optin(to.email, mail_category)) {
                ConsoleHandler.warn('SendInBlueMailServerController.send:Failed:Utilisateur non optin:' + to.email + ':' + templateId + ':' + tags + ':' + params + ':' + bcc + ':' + cc + ':' + attachments + ':' + sender + ':' + reply_to);
                return null;
            }

            const postParams: any = {
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
            const param_cc = await ParamsServerController.getParamValueAsString(ModuleSendInBlue.PARAM_NAME_TEMPLATE_CC_PREFIX + templateId);
            const param_bcc = await ParamsServerController.getParamValueAsString(ModuleSendInBlue.PARAM_NAME_TEMPLATE_BCC_PREFIX + templateId);
            if (param_cc && param_cc.length) {
                if (!postParams.cc) {
                    postParams.cc = [];
                }
                const ccs = param_cc.split(',');
                for (const i in ccs) {
                    const cc_ = ccs[i];
                    postParams.cc.push(SendInBlueMailVO.createNew(cc_, cc_));
                }
            }

            if (param_bcc && param_bcc.length) {
                if (!postParams.bcc) {
                    postParams.bcc = [];
                }
                const bccs = param_bcc.split(',');
                for (const i in bccs) {
                    const bcc_ = bccs[i];
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

            const res: { messageId: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ messageId: string }>(
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
        } catch (error) {
            ConsoleHandler.error('SendInBlueMailServerController.sendWithTemplate:Failed:' + error + ':' + JSON.stringify(to) + ':' + templateId + ':' + tags + ':' + params + ':' + bcc + ':' + cc + ':' + attachments + ':' + sender + ':' + reply_to);
        }

        return null;
    }

    private async check_optin(email: string, mail_category: string): Promise<boolean> {

        if ((!mail_category) || (!email)) {
            ConsoleHandler.error('SendInBlueMailServerController.check_optin:Failed:paramètres invalides:' + mail_category + ':' + email + ':');
            return false;
        }

        let category = await ModuleDAO.instance.getNamedVoByName<MailCategoryVO>(MailCategoryVO.API_TYPE_ID, mail_category);

        if (!category) {
            category = new MailCategoryVO();
            category.name = mail_category;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(category);
            if (!category.id) {
                ConsoleHandler.error('SendInBlueMailServerController.check_optin:Failed:Impossible de créer la nouvelle catégorie de mail:' + mail_category + ':');
                return false;
            }

            return category.type_optin == MailCategoryVO.TYPE_OPTIN_OPTOUT; // Si par défaut on crée la catégorie en optout, on peut pas avoir optout à ce stade
        }

        // On cheche le user correspondant à l'email (sinon on ne peut pas savoir s'il est optin ou optout)
        const user: UserVO = await query(UserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<UserVO>().email, email)
            .filter_is_false(field_names<UserVO>().blocked) // On ne prend que les utilisateurs pas bloqués
            .exec_as_server()
            .select_vo<UserVO>();
        if (!user) {
            // Par défaut on est en optout donc si on trouve pas l'utilisateur, il va recevoir le mail et ne peut se désinscrire
            return true;
        }

        // on cherche l'optin/out potentiel en base
        const optin_optout: MailCategoryUserVO = await query(MailCategoryUserVO.API_TYPE_ID)
            .filter_by_id(user.id, UserVO.API_TYPE_ID)
            .filter_by_id(category.id, MailCategoryVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<MailCategoryUserVO>();

        if (optin_optout) {
            return (category.type_optin == MailCategoryVO.TYPE_OPTIN_OPTIN);
        }

        return (category.type_optin == MailCategoryVO.TYPE_OPTIN_OPTOUT);
    }

    private async insert_new_mail(to_mail: string, message_id: string, mail_category: string): Promise<MailVO> {

        if ((!mail_category) || (!message_id) || (!to_mail)) {
            ConsoleHandler.error('SendInBlueMailServerController.insert_new_mail:Failed:paramètres invalides:' + mail_category + ':' + message_id + ':' + to_mail + ':');
            return null;
        }

        let category = await ModuleDAO.instance.getNamedVoByName<MailCategoryVO>(MailCategoryVO.API_TYPE_ID, mail_category);

        if (!category) {
            category = new MailCategoryVO();
            category.name = mail_category;
            const res_cat = await ModuleDAOServer.instance.insertOrUpdateVO_as_server(category);
            if (!res_cat || !res_cat.id) {
                ConsoleHandler.error('SendInBlueMailServerController.insert_new_mail:Failed:Impossible de créer la nouvelle catégorie de mail:' + mail_category + ':');
                return null;
            }
            category.id = res_cat.id;
        }

        const mail = new MailVO();
        mail.category_id = category.id;
        mail.email = to_mail;
        mail.last_state = MailEventVO.EVENT_Initie;
        mail.last_up_date = Dates.now();
        mail.message_id = message_id;
        mail.send_date = mail.last_up_date;
        mail.sent_by_id = StackContext.get('UID');
        mail.sent_to_id = await this.get_uid_if_exists(to_mail);
        const res = await ModuleDAOServer.instance.insertOrUpdateVO_as_server(mail);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('SendInBlueMailServerController.insert_new_mail:failed inserting new mail:' + JSON.stringify(mail) + ':');
            return null;
        }

        // et on insère le premier event qui est interne
        const first_event = new MailEventVO();
        first_event.event = MailEventVO.EVENT_Initie;
        first_event.event_date = Dates.now();
        first_event.mail_id = mail.id;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(first_event);

        return mail;
    }

    private async get_uid_if_exists(email: string) {
        const user: UserVO = await query(UserVO.API_TYPE_ID).filter_by_text_eq(field_names<UserVO>().email, email).exec_as_server().select_vo<UserVO>();
        if (user) {
            return user.id;
        }
        return null;
    }

    private add_default_params(params: any) {

        if (!params) {
            params = {};
        }

        // On ajoute CERTAINS params d'environnement en maj
        if (!params.APP_TITLE) {
            params.APP_TITLE = ConfigurationService.node_configuration.app_title;
        }

        if (!params.PORT) {
            params.PORT = ConfigurationService.node_configuration.port;
        }

        if (!params.URL_RECOVERY_CHALLENGE) {
            params.URL_RECOVERY_CHALLENGE = ConfigurationService.node_configuration.url_recovery_challenge;
        }

        if (!params.URL_RECOVERY) {
            params.URL_RECOVERY = ConfigurationService.node_configuration.url_recovery;
        }

        if (!params.BASE_URL) {
            params.BASE_URL = ConfigurationService.node_configuration.base_url;
        }

        const sid = StackContext.get('SID');
        params['SESSION_SHARE_SID'] = sid ? encodeURIComponent(sid) : null;
    }

    private convert_mails_vo_to_string_list(bcc: SendInBlueMailVO[]): string {
        let res: string = '';

        for (const i in bcc) {
            const e = bcc[i];

            if (!res) {
                res = e.email;
            } else {
                res += ',' + e.email;
            }
        }

        return res;
    }
}