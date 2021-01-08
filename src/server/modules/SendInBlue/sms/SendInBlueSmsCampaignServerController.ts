import { Moment } from 'moment';
import ModuleRequest from '../../../../shared/modules/Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import SendInBlueListServerController from '../list/SendInBlueListServerController';
import SendInBlueServerController from '../SendInBlueServerController';
import SendInBlueContactVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueContactVO';
import SendInBlueListDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueListDetailVO';
import SendInBlueSmsCampaignDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsCampaignDetailVO';
import SendInBlueSmsCampaignsVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsCampaignsVO';
import SendInBlueSmsFormatVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import ConfigurationService from '../../../env/ConfigurationService';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import SendInBlueRequestResultVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueRequestResultVO';
const moment = require('moment');

export default class SendInBlueSmsCampaignServerController {

    public static getInstance(): SendInBlueSmsCampaignServerController {
        if (!SendInBlueSmsCampaignServerController.instance) {
            SendInBlueSmsCampaignServerController.instance = new SendInBlueSmsCampaignServerController();
        }
        return SendInBlueSmsCampaignServerController.instance;
    }

    private static instance: SendInBlueSmsCampaignServerController = null;

    private static PATH_CAMPAIGN: string = 'smsCampaigns';
    private static PATH_CAMPAIGN_SEND_NOW: string = 'sendNow';
    private static PATH_CAMPAIGN_SEND_TEST: string = 'sendTest';

    public async getCampaign(campaignId: number): Promise<SendInBlueSmsCampaignDetailVO> {
        if (!campaignId) {
            return null;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueSmsCampaignDetailVO>(ModuleRequest.METHOD_GET, SendInBlueSmsCampaignServerController.PATH_CAMPAIGN + '/' + campaignId);
    }

    public async getCampaigns(): Promise<SendInBlueSmsCampaignsVO> {
        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueSmsCampaignsVO>(ModuleRequest.METHOD_GET, SendInBlueSmsCampaignServerController.PATH_CAMPAIGN);
    }

    public async createAndSend(campaignName: string, content: string, contacts: SendInBlueContactVO[], scheduledAt: Moment, testSms: boolean = false, phoneTest: SendInBlueSmsFormatVO = null): Promise<boolean> {

        // On check que l'env permet d'envoyer des mails
        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {

            ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env:templateId: ' + content);
            return null;
        }

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

        let list: SendInBlueListDetailVO = await SendInBlueListServerController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

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

        let res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueSmsCampaignServerController.PATH_CAMPAIGN,
            {
                name: campaignName,
                sender: await SendInBlueServerController.getInstance().getSenderNameSMS(),
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

        let urlSend: string = SendInBlueSmsCampaignServerController.PATH_CAMPAIGN + '/' + campaignId + '/';

        if (testSms) {
            urlSend += SendInBlueSmsCampaignServerController.PATH_CAMPAIGN_SEND_TEST;

            if (!phoneTest || !SendInBlueSmsFormatVO.formate(phoneTest.tel, phoneTest.code_pays)) {
                return null;
            }

            postParams.phoneNumber = SendInBlueSmsFormatVO.formate(phoneTest.tel, phoneTest.code_pays);
        } else {
            urlSend += SendInBlueSmsCampaignServerController.PATH_CAMPAIGN_SEND_NOW;
        }

        let res: { code: string, message: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
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