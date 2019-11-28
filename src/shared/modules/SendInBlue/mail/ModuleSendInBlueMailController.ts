import { ClientResponse } from 'http';
import * as SibAPI from 'sib-api-v3-typescript';

export default class ModuleSendInBlueMailController {

    public static getInstance(): ModuleSendInBlueMailController {
        if (!ModuleSendInBlueMailController.instance) {
            ModuleSendInBlueMailController.instance = new ModuleSendInBlueMailController();
        }
        return ModuleSendInBlueMailController.instance;
    }

    private static instance: ModuleSendInBlueMailController = null;

    public async send(
        sender: SibAPI.SendSmtpEmailSender,
        to: SibAPI.SendSmtpEmailTo[],
        bcc: SibAPI.SendSmtpEmailBcc[],
        cc: SibAPI.SendSmtpEmailCc[],
        htmlContent: string,
        textContent: string,
        subject: string,
        replyTo: SibAPI.SendSmtpEmailReplyTo,
        attachment: SibAPI.SendSmtpEmailAttachment[],
        headers: any,
        templateId: number,
        params: any,
        tags: string[]
    ): Promise<string> {
        // TODO
        let mail: SibAPI.SendSmtpEmail = new SibAPI.SendSmtpEmail();
        mail.sender = sender;
        mail.to = to;
        mail.bcc = bcc;
        mail.cc = cc;
        mail.htmlContent = htmlContent;
        mail.textContent = textContent;
        mail.subject = subject;
        mail.replyTo = replyTo;
        mail.attachment = attachment;
        mail.headers = headers;
        mail.templateId = templateId;
        mail.params = params;
        mail.tags = tags;

        let res: {
            response: ClientResponse;
            body: SibAPI.CreateSmtpEmail;
        } = await new SibAPI.SMTPApi().sendTransacEmail(mail);

        if (res && res.response && res.response.statusCode == 200 && res.body && res.body.messageId) {
            return res.body.messageId;
        }

        return null;
    }
}