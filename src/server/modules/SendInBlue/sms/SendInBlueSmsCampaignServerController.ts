
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
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';

export default class SendInBlueSmsCampaignServerController {

    // istanbul ignore next: nothing to test
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

    public async createAndSend(campaignName: string, content: string, contacts: SendInBlueContactVO[], scheduledAt: number, testSms: boolean = false, phoneTest: SendInBlueSmsFormatVO = null): Promise<boolean> {

        // On check que l'env permet d'envoyer des mails
        if (ConfigurationService.node_configuration.block_mail_delivery) {

            ConsoleHandler.warn('Envoi de mails interdit sur cet env:templateId: ' + content);
            return null;
        }

        const campaign: SendInBlueSmsCampaignDetailVO = await this.create(campaignName, content, contacts, scheduledAt);

        if (!campaign) {
            return false;
        }

        if (scheduledAt && Dates.isBefore(scheduledAt, Dates.now(), TimeSegment.TYPE_MINUTE)) {
            return this.send(campaign.id, testSms, phoneTest);
        }

        return true;
    }

    public async create(campaignName: string, content: string, contacts: SendInBlueContactVO[], scheduledAt: number): Promise<SendInBlueSmsCampaignDetailVO> {
        if (!campaignName || !content || !contacts || !contacts.length) {
            return null;
        }

        const list: SendInBlueListDetailVO = await SendInBlueListServerController.getInstance().createAndAddExistingContactsToList(campaignName, contacts);

        if (!list || !content || !scheduledAt) {
            return null;
        }

        const recipientsData: any = {
            listIds: [list.id]
        };

        let scheduledAt_clone: number =
            Dates.minutes(
                Dates.hours(
                    Dates.startOf(scheduledAt, TimeSegment.TYPE_DAY),
                    Dates.hours(scheduledAt)),
                Dates.minutes(scheduledAt));

        if (Dates.isBefore(scheduledAt_clone, Dates.now(), TimeSegment.TYPE_MINUTE)) {
            scheduledAt_clone = Dates.add(Dates.now(), 3, TimeSegment.TYPE_MINUTE);
        }

        const res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueSmsCampaignServerController.PATH_CAMPAIGN,
            {
                name: campaignName,
                sender: await SendInBlueServerController.getInstance().getSenderNameSMS(),
                content: content,
                recipients: recipientsData,
                scheduledAt: Dates.toISOString(scheduledAt_clone),
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

        const postParams: any = {};

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

        const res: { code: string, message: string } = await SendInBlueServerController.getInstance().sendRequestFromApp<{ code: string, message: string }>(
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