import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueServerController from './SendInBlueServerController';
import SendInBlueAttachmentVO from '../../../shared/modules/SendInBlue/vos/SendInBlueAttachmentVO';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import EnvHandler from '../../../shared/tools/EnvHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class SendInBlueMailServerController {

    public static getInstance(): SendInBlueMailServerController {
        if (!SendInBlueMailServerController.instance) {
            SendInBlueMailServerController.instance = new SendInBlueMailServerController();
        }
        return SendInBlueMailServerController.instance;
    }

    private static instance: SendInBlueMailServerController = null;

    private static PATH_EMAIL: string = 'smtp/email';

    public async send(to: SendInBlueMailVO, subject: string, textContent: string, htmlContent: string, tags: string[] = null, templateId: number = null, bcc: SendInBlueMailVO[] = null, cc: SendInBlueMailVO[] = null, attachments: SendInBlueAttachmentVO[] = null): Promise<boolean> {

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(to.email, this.convert_mails_vo_to_string_list(cc), this.convert_mails_vo_to_string_list(bcc))) {
                ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + to.email + ':' + this.convert_mails_vo_to_string_list(cc) + ':' + this.convert_mails_vo_to_string_list(bcc));

            } else {
                ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env: ' + subject);
                return;
            }
        }

        let postParams: any = {
            sender: await SendInBlueServerController.getInstance().getSender(),
            to: [to],
            replyTo: await SendInBlueServerController.getInstance().getReplyTo(),
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
            return false;
        }

        return true;
    }

    public async sendWithTemplate(to: SendInBlueMailVO, templateId: number, tags: string[] = null, params: { [param_name: string]: any } = {}, bcc: SendInBlueMailVO[] = null, cc: SendInBlueMailVO[] = null, attachments: SendInBlueAttachmentVO[] = null): Promise<boolean> {

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {

            if (ModuleMailerServer.getInstance().check_mail_whitelist(to.email, this.convert_mails_vo_to_string_list(cc), this.convert_mails_vo_to_string_list(bcc))) {
                ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + to.email + ':' + this.convert_mails_vo_to_string_list(cc) + ':' + this.convert_mails_vo_to_string_list(bcc));

            } else {
                ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env:templateId: ' + templateId);
                return;
            }
        }

        let postParams: any = {
            sender: await SendInBlueServerController.getInstance().getSender(),
            to: [to],
            templateId: templateId,
            replyTo: await SendInBlueServerController.getInstance().getReplyTo(),
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
            return false;
        }

        return true;
    }

    private add_default_params(params: any) {

        if (!params) {
            params = {};
        }

        // On ajoute les params d'environnement
        let envs: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();
        for (let i in envs) {
            if (!params[i]) {
                params[i] = envs[i];
            }
        }
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