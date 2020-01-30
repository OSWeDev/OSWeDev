import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueAttachmentVO from '../vos/SendInBlueAttachmentVO';
import SendInBlueMailVO from '../vos/SendInBlueMailVO';

export default class ModuleSendInBlueMailController {

    public static getInstance(): ModuleSendInBlueMailController {
        if (!ModuleSendInBlueMailController.instance) {
            ModuleSendInBlueMailController.instance = new ModuleSendInBlueMailController();
        }
        return ModuleSendInBlueMailController.instance;
    }

    private static instance: ModuleSendInBlueMailController = null;

    private static PATH_EMAIL: string = 'smtp/email';

    public async send(to: SendInBlueMailVO, subject: string, textContent: string, htmlContent: string, tags: string[] = null, templateId: number = null, bcc: SendInBlueMailVO[] = null, cc: SendInBlueMailVO[] = null, attachments: SendInBlueAttachmentVO[] = null): Promise<boolean> {
        let postParams: any = {
            sender: await ModuleSendInBlueController.getInstance().getSender(),
            to: [to],
            replyTo: await ModuleSendInBlueController.getInstance().getReplyTo(),
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

        let res: { messageId: string } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ messageId: string }>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueMailController.PATH_EMAIL,
            postParams
        );

        if (!res || !res.messageId) {
            return false;
        }

        return true;
    }

    public async sendWithTemplate(to: SendInBlueMailVO, templateId: number, tags: string[] = null, params: { [param_name: string]: any } = {}, bcc: SendInBlueMailVO[] = null, cc: SendInBlueMailVO[] = null, attachments: SendInBlueAttachmentVO[] = null): Promise<boolean> {
        let postParams: any = {
            sender: await ModuleSendInBlueController.getInstance().getSender(),
            to: [to],
            templateId: templateId,
            replyTo: await ModuleSendInBlueController.getInstance().getReplyTo(),
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

        let res: { messageId: string } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ messageId: string }>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueMailController.PATH_EMAIL,
            postParams
        );

        if (!res || !res.messageId) {
            return false;
        }

        return true;
    }
}