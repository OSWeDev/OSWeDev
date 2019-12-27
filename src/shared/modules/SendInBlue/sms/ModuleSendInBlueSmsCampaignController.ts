import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../DAO/vos/InsertOrDeleteQueryResult';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueCampaignRecipientsVO from '../vos/SendInBlueCampaignRecipientsVO';
import SendInBlueSmsCampaignDetailVO from '../vos/SendInBlueSmsCampaignDetailVO';
import SendInBlueSmsCampaignsVO from '../vos/SendInBlueSmsCampaignsVO';

export default class ModuleSendInBlueSmsCampaignController {

    public static getInstance(): ModuleSendInBlueSmsCampaignController {
        if (!ModuleSendInBlueSmsCampaignController.instance) {
            ModuleSendInBlueSmsCampaignController.instance = new ModuleSendInBlueSmsCampaignController();
        }
        return ModuleSendInBlueSmsCampaignController.instance;
    }

    private static instance: ModuleSendInBlueSmsCampaignController = null;

    private static PATH_CAMPAIGN: string = 'smsCampaigns';
    private static PATH_CAMPAIGN_SEND_NOW: string = 'sendNow';
    private static PATH_CAMPAIGN_SEND_TEST: string = 'sendTest';

    public async getCampaign(campaignId: number): Promise<SendInBlueSmsCampaignDetailVO> {
        if (!campaignId) {
            return null;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueSmsCampaignDetailVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN + '/' + campaignId);
    }

    public async getCampaigns(): Promise<SendInBlueSmsCampaignsVO> {
        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueSmsCampaignsVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN);
    }

    public async create(campaignName: string, content: string, recipients: SendInBlueCampaignRecipientsVO): Promise<SendInBlueSmsCampaignDetailVO> {
        if (!campaignName || !content || !recipients || !recipients.lists || !recipients.lists.length) {
            return null;
        }

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN,
            {
                name: campaignName,
                sender: ModuleSendInBlueController.getInstance().getSenderNameSMS(),
                content: content,
                recipients: { exclusionListIds: recipients.exclusionLists, listIds: recipients.lists },
            }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getCampaign(parseInt(res.id));
    }

    public async send(campaignId: number, testSms: boolean = false, phoneTest: string = null): Promise<boolean> {
        if (!campaignId) {
            return null;
        }

        let urlSend: string = ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN + '/' + campaignId + '/';

        if (testSms) {
            urlSend += ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN_SEND_TEST;
        } else {
            urlSend += ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN_SEND_NOW;
        }

        let res: { code: string, message: string } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
            ModuleRequest.METHOD_POST,
            urlSend,
            { phoneNumber: phoneTest }
        );

        if (!res || res.code) {
            return false;
        }

        return true;
    }
}