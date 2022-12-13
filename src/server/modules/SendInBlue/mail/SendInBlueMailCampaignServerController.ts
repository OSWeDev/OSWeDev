import ModuleRequest from '../../../../shared/modules/Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import SendInBlueServerController from '../SendInBlueServerController';
import SendInBlueContactVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueContactVO';
import SendInBlueListDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueListDetailVO';
import SendInBlueMailCampaignDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailCampaignDetailVO';
import SendInBlueMailCampaignsVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueMailCampaignsVO';
import SendInBlueListServerController from '../list/SendInBlueListServerController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ModuleMailerServer from '../../Mailer/ModuleMailerServer';
import ConfigurationService from '../../../env/ConfigurationService';
import SendInBlueRequestResultVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueRequestResultVO';

export default class SendInBlueMailCampaignServerController {

    public static getInstance(): SendInBlueMailCampaignServerController {
        if (!SendInBlueMailCampaignServerController.instance) {
            SendInBlueMailCampaignServerController.instance = new SendInBlueMailCampaignServerController();
        }
        return SendInBlueMailCampaignServerController.instance;
    }

    private static instance: SendInBlueMailCampaignServerController = null;

    private static PATH_CAMPAIGN: string = 'emailCampaigns';
    private static PATH_CAMPAIGN_SEND_NOW: string = 'sendNow';
    private static PATH_CAMPAIGN_SEND_TEST: string = 'sendTest';

    public async getCampaign(campaignId: number): Promise<SendInBlueMailCampaignDetailVO> {
        if (!campaignId) {
            return null;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueMailCampaignDetailVO>(ModuleRequest.METHOD_GET, SendInBlueMailCampaignServerController.PATH_CAMPAIGN + '/' + campaignId);
    }

    public async getCampaigns(): Promise<SendInBlueMailCampaignsVO> {
        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueMailCampaignsVO>(ModuleRequest.METHOD_GET, SendInBlueMailCampaignServerController.PATH_CAMPAIGN);
    }

    public async createAndSend(campaignName: string, subject: string, htmlContent: string, contacts: SendInBlueContactVO[], inlineImageActivation: boolean = false, testMail: boolean = false, contactsForTest: SendInBlueContactVO[] = null): Promise<boolean> {
        let campaign: SendInBlueMailCampaignDetailVO = await this.create(campaignName, subject, htmlContent, contacts, inlineImageActivation);

        if (!campaign) {
            return false;
        }

        return this.send(campaign.id, testMail, contactsForTest);
    }

    public async create(campaignName: string, subject: string, htmlContent: string, contacts: SendInBlueContactVO[], inlineImageActivation: boolean = false): Promise<SendInBlueMailCampaignDetailVO> {
        if (!campaignName || !subject || !htmlContent || !contacts || !contacts.length) {
            return null;
        }

        let list: SendInBlueListDetailVO = await SendInBlueListServerController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

        if (!list) {
            return null;
        }

        let recipientsData: any = {
            listIds: [list.id]
        };

        let res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueMailCampaignServerController.PATH_CAMPAIGN,
            {
                sender: await SendInBlueServerController.getInstance().getSender(),
                name: campaignName,
                htmlContent: htmlContent,
                subject: subject,
                replyTo: await SendInBlueServerController.getInstance().getReplyToEmail(),
                recipients: recipientsData,
                inlineImageActivation: inlineImageActivation,
            }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getCampaign(parseInt(res.id));
    }

    public async createWithTemplateAndSend(campaignName: string, subject: string, contacts: SendInBlueContactVO[], templateId: number, params: { [param_name: string]: any } = {}, inlineImageActivation: boolean = false, testMail: boolean = false, contactsForTest: SendInBlueContactVO[] = null): Promise<boolean> {
        let campaign: SendInBlueMailCampaignDetailVO = await this.createWithTemplate(campaignName, subject, contacts, templateId, params, inlineImageActivation);

        if (!campaign) {
            return false;
        }

        return this.send(campaign.id, testMail, contactsForTest);
    }

    public async createWithTemplate(campaignName: string, subject: string, contacts: SendInBlueContactVO[], templateId: number, params: { [param_name: string]: any } = {}, inlineImageActivation: boolean = false): Promise<SendInBlueMailCampaignDetailVO> {

        // On check que l'env permet d'envoyer des mails
        if (ConfigurationService.getInstance().node_configuration.BLOCK_MAIL_DELIVERY) {

            ConsoleHandler.warn('Envoi de mails interdit sur cet env:templateId: ' + templateId);
            return null;
        }

        if (!campaignName || !contacts || !contacts.length || !templateId || !subject) {
            return null;
        }

        let list: SendInBlueListDetailVO = await SendInBlueListServerController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

        if (!list) {
            return null;
        }

        let recipientsData: any = {
            listIds: [list.id]
        };

        let postParams: any = {
            sender: await SendInBlueServerController.getInstance().getSender(),
            name: campaignName,
            templateId: templateId,
            replyTo: await SendInBlueServerController.getInstance().getReplyToEmail(),
            recipients: recipientsData,
            inlineImageActivation: inlineImageActivation,
            subject: subject,
        };

        if (params) {
            postParams.params = params;
        }

        let res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueMailCampaignServerController.PATH_CAMPAIGN,
            postParams
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getCampaign(parseInt(res.id));
    }

    public async send(campaignId: number, testMail: boolean = false, contactsForTest: SendInBlueContactVO[] = null): Promise<boolean> {
        if (!campaignId) {
            return null;
        }

        let postParams: any = {};

        let urlSend: string = SendInBlueMailCampaignServerController.PATH_CAMPAIGN + '/' + campaignId + '/';

        if (testMail) {
            urlSend += SendInBlueMailCampaignServerController.PATH_CAMPAIGN_SEND_TEST;

            if (!contactsForTest || !contactsForTest.length) {
                return null;
            }

            postParams.emailTo = contactsForTest.map((c) => c.email);
        } else {
            urlSend += SendInBlueMailCampaignServerController.PATH_CAMPAIGN_SEND_NOW;
        }

        let res: { code: string, message: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
            ModuleRequest.METHOD_POST,
            urlSend,
            postParams
        );

        if (!res || res.code) {
            return false;
        }

        return true;
    }
}