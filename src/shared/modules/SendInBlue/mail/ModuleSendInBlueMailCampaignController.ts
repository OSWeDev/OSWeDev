import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../DAO/vos/InsertOrDeleteQueryResult';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueCampaignRecipientsVO from '../vos/SendInBlueCampaignRecipientsVO';
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

    public async create(campaignName: string, subject: string, htmlContent: string, recipients: SendInBlueCampaignRecipientsVO, inlineImageActivation: boolean = false): Promise<SendInBlueMailCampaignDetailVO> {
        if (!campaignName || !subject || !htmlContent || !recipients || !recipients.lists || !recipients.lists.length) {
            return null;
        }

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN,
            {
                sender: ModuleSendInBlueController.getInstance().getSender(),
                campaignName: campaignName,
                htmlContent: htmlContent,
                subject: subject,
                replyTo: ModuleSendInBlueController.getInstance().getReplyToEmail(),
                recipients: { exclusionListIds: recipients.exclusionLists, listIds: recipients.lists },
                inlineImageActivation: inlineImageActivation,
            }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getCampaign(parseInt(res.id));
    }

    public async send(campaignId: number, testMail: boolean = false, emailsToForTest: string[] = null): Promise<boolean> {
        if (!campaignId) {
            return null;
        }

        let urlSend: string = ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN + '/' + campaignId + '/';

        if (testMail) {
            urlSend += ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN_SEND_TEST;
        } else {
            urlSend += ModuleSendInBlueMailCampaignController.PATH_CAMPAIGN_SEND_NOW;
        }

        let res: { code: string, message: string } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
            ModuleRequest.METHOD_POST,
            urlSend,
            { emailTo: emailsToForTest }
        );

        if (!res || res.code) {
            return false;
        }

        return true;
    }
}