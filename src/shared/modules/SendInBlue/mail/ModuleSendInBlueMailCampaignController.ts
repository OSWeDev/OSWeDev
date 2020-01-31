import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../DAO/vos/InsertOrDeleteQueryResult';
import ModuleSendInBlueListController from '../list/ModuleSendInBlueListController';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueContactVO from '../vos/SendInBlueContactVO';
import SendInBlueListDetailVO from '../vos/SendInBlueListDetailVO';
import SendInBlueMailCampaignDetailVO from '../vos/SendInBlueMailCampaignDetailVO';
import SendInBlueMailCampaignsVO from '../vos/SendInBlueMailCampaignsVO';

export default class ModuleSendInBlueMailCampaignController {

    public static getInstance(): ModuleSendInBlueMailCampaignController {
        if (!ModuleSendInBlueMailCampaignController.instance) {
            ModuleSendInBlueMailCampaignController.instance = new ModuleSendInBlueMailCampaignController();
        }
        return ModuleSendInBlueMailCampaignController.instance;
    }

    private static instance: ModuleSendInBlueMailCampaignController = null;

    private static PATH_CAMPAIGN: string = 'emailCampaigns';
    private static PATH_CAMPAIGN_SEND_NOW: string = 'sendNow';
    private static PATH_CAMPAIGN_SEND_TEST: string = 'sendTest';

    public async getCampaign(campaignId: number): Promise<SendInBlueMailCampaignDetailVO> {
        if (!campaignId) {
            return null;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueMailCampaignDetailVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN + '/' + campaignId);
    }

    public async getCampaigns(): Promise<SendInBlueMailCampaignsVO> {
        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueMailCampaignsVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN);
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

        let list: SendInBlueListDetailVO = await ModuleSendInBlueListController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

        if (!list) {
            return null;
        }

        let recipientsData: any = {
            listIds: [list.id]
        };

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN,
            {
                sender: await ModuleSendInBlueController.getInstance().getSender(),
                name: campaignName,
                htmlContent: htmlContent,
                subject: subject,
                replyTo: await ModuleSendInBlueController.getInstance().getReplyToEmail(),
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
        if (!campaignName || !contacts || !contacts.length || !templateId || !subject) {
            return null;
        }

        let list: SendInBlueListDetailVO = await ModuleSendInBlueListController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

        if (!list) {
            return null;
        }

        let recipientsData: any = {
            listIds: [list.id]
        };

        let postParams: any = {
            sender: await ModuleSendInBlueController.getInstance().getSender(),
            name: campaignName,
            templateId: templateId,
            replyTo: await ModuleSendInBlueController.getInstance().getReplyToEmail(),
            recipients: recipientsData,
            inlineImageActivation: inlineImageActivation,
            subject: subject,
        };

        if (params) {
            postParams.params = params;
        }

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN,
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

        let urlSend: string = ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN + '/' + campaignId + '/';

        if (testMail) {
            urlSend += ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN_SEND_TEST;

            if (!contactsForTest || !contactsForTest.length) {
                return null;
            }

            postParams.emailTo = contactsForTest.map((c) => c.email);
        } else {
            urlSend += ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN_SEND_NOW;
        }

        let res: { code: string, message: string } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
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