import { ClientResponse } from 'http';
import * as SibAPI from 'sib-api-v3-typescript';

export default class ModuleSendInBlueSmsCampaignController {

    public static getInstance(): ModuleSendInBlueSmsCampaignController {
        if (!ModuleSendInBlueSmsCampaignController.instance) {
            ModuleSendInBlueSmsCampaignController.instance = new ModuleSendInBlueSmsCampaignController();
        }
        return ModuleSendInBlueSmsCampaignController.instance;
    }

    private static instance: ModuleSendInBlueSmsCampaignController = null;

    public async getCampaign(campaignId: number): Promise<SibAPI.GetSmsCampaign> {
        // TODO
        let res: {
            response: ClientResponse;
            body: SibAPI.GetSmsCampaign;
        } = await new SibAPI.SMSCampaignsApi().getSmsCampaign(campaignId);

        if (res && res.response && res.response.statusCode == 200 && res.body) {
            return res.body;
        }

        return null;
    }

    public async getCampaigns(): Promise<SibAPI.GetSmsCampaign[]> {
        // TODO
        let res: {
            response: ClientResponse;
            body: SibAPI.GetSmsCampaigns;
        } = await new SibAPI.SMSCampaignsApi().getSmsCampaigns();

        if (res && res.response && res.response.statusCode == 200 && res.body && res.body.campaigns) {
            return res.body.campaigns;
        }

        return null;
    }

    public async create(name: string, sender: string, content: string, recipients: SibAPI.CreateSmsCampaignRecipients, scheduledAt: Date): Promise<number> {
        // TODO
        let campaign: SibAPI.CreateSmsCampaign = new SibAPI.CreateSmsCampaign();
        campaign.name = name;
        campaign.sender = sender;
        campaign.content = content;
        campaign.recipients = recipients;
        campaign.scheduledAt = scheduledAt;

        let res: {
            response: ClientResponse;
            body: SibAPI.CreateModel;
        } = await new SibAPI.SMSCampaignsApi().createSmsCampaign(campaign);

        if (res && res.response && res.response.statusCode == 200 && res.body && res.body.id) {
            return res.body.id;
        }

        return null;
    }

    public async send(campaingId: number): Promise<boolean> {
        // TODO
        let res: {
            response: ClientResponse;
            body?: any;
        } = await new SibAPI.SMSCampaignsApi().sendSmsCampaignNow(campaingId);

        if (res && res.response && res.response.statusCode == 200 && res.body) {
            return true;
        }

        return false;
    }
}