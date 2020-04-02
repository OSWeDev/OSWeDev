import { Moment } from 'moment';
import ModuleRequest from '../../Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../DAO/vos/InsertOrDeleteQueryResult';
import ModuleSendInBlueListController from '../list/ModuleSendInBlueListController';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueContactVO from '../vos/SendInBlueContactVO';
import SendInBlueListDetailVO from '../vos/SendInBlueListDetailVO';
import SendInBlueSmsCampaignDetailVO from '../vos/SendInBlueSmsCampaignDetailVO';
import SendInBlueSmsCampaignsVO from '../vos/SendInBlueSmsCampaignsVO';
import SendInBlueSmsFormatVO from '../vos/SendInBlueSmsFormatVO';
import moment = require('moment');

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

    public async createAndSend(campaignName: string, content: string, contacts: SendInBlueContactVO[], scheduledAt: Moment, testSms: boolean = false, phoneTest: SendInBlueSmsFormatVO = null): Promise<boolean> {
        let campaign: SendInBlueSmsCampaignDetailVO = await this.create(campaignName, content, contacts, scheduledAt);

        if (!campaign) {
            return false;
        }

        if (scheduledAt && scheduledAt.isBefore(moment().utc(true), 'minute')) {
            return this.send(campaign.id, testSms, phoneTest);
        }

        return true;
    }

    public async create(campaignName: string, content: string, contacts: SendInBlueContactVO[], scheduledAt: Moment): Promise<SendInBlueSmsCampaignDetailVO> {
        if (!campaignName || !content || !contacts || !contacts.length) {
            return null;
        }

        let list: SendInBlueListDetailVO = await ModuleSendInBlueListController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

        if (!list || !content || !scheduledAt) {
            return null;
        }

        let recipientsData: any = {
            listIds: [list.id]
        };

        let scheduledAt_clone: Moment = moment(scheduledAt.format('Y-MM-DD')).utc(true).hour(scheduledAt.hour()).minute(scheduledAt.minute()).second(0);

        if (scheduledAt_clone.isBefore(moment().utc(true), 'minute')) {
            scheduledAt_clone = moment().utc(true).add(3, 'minutes');
        }

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN,
            {
                name: campaignName,
                sender: await ModuleSendInBlueController.getInstance().getSenderNameSMS(),
                content: content,
                recipients: recipientsData,
                scheduledAt: scheduledAt_clone.toISOString(),
            }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getCampaign(parseInt(res.id));
    }

    public async send(campaignId: number, testSms: boolean = false, phoneTest: SendInBlueSmsFormatVO = null): Promise<boolean> {
        if (!campaignId) {
            return null;
        }

        let postParams: any = {};

        let urlSend: string = ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN + '/' + campaignId + '/';

        if (testSms) {
            urlSend += ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN_SEND_TEST;

            if (!phoneTest || !SendInBlueSmsFormatVO.formate(phoneTest.tel, phoneTest.code_pays)) {
                return null;
            }

            postParams.phoneNumber = SendInBlueSmsFormatVO.formate(phoneTest.tel, phoneTest.code_pays);
        } else {
            urlSend += ModuleSendInBlueSmsCampaignController.PATH_CAMPAIGN_SEND_NOW;
        }

        let res: { code: string, message: string } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
            ModuleRequest.METHOD_POST,
            urlSend,
            postParams,
        );

        if (!res || res.code) {
            return false;
        }

        return true;
    }
}