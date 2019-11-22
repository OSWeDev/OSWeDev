import { ClientResponse } from 'http';
import * as SibAPI from 'sib-api-v3-typescript';

export default class ModuleSendInBlueMailCampaignController {

    public static getInstance(): ModuleSendInBlueMailCampaignController {
        if (!ModuleSendInBlueMailCampaignController.instance) {
            ModuleSendInBlueMailCampaignController.instance = new ModuleSendInBlueMailCampaignController();
        }
        return ModuleSendInBlueMailCampaignController.instance;
    }

    private static instance: ModuleSendInBlueMailCampaignController = null;

    public async getCampaign(campaignId: number): Promise<SibAPI.GetEmailCampaign> {
        // TODO
        let res: {
            response: ClientResponse;
            body: SibAPI.GetEmailCampaign;
        } = await new SibAPI.EmailCampaignsApi().getEmailCampaign(campaignId);

        if (res && res.response && res.response.statusCode == 200) {
            return res.body;
        }

        return null;
    }

    public async getCampaigns(type?: string, status?: string, startDate?: Date, endDate?: Date, limit?: number, offset?: number): Promise<SibAPI.GetEmailCampaign[]> {
        // TODO
        let res: {
            response: ClientResponse;
            body: SibAPI.GetEmailCampaigns;
        } = await new SibAPI.EmailCampaignsApi().getEmailCampaigns(type, status, startDate, endDate, limit, offset);

        if (res && res.response && res.response.statusCode == 200 && res.body && res.body.campaigns) {
            return res.body.campaigns;
        }

        return null;
    }

    public async create(
        tag: string,
        sender: SibAPI.CreateEmailCampaignSender,
        name: string,
        htmlContent: string,
        htmlUrl: string,
        templateId: number,
        scheduledAt: Date,
        subject: string,
        replyTo: string,
        toField: string,
        recipients: SibAPI.CreateEmailCampaignRecipients,
        attachmentUrl: string,
        inlineImageActivation: boolean,
        mirrorActive: boolean,
        footer: string,
        header: string,
        utmCampaign: string,
        params: any,
    ): Promise<number> {
        // TODO
        let campaign: SibAPI.CreateEmailCampaign = new SibAPI.CreateEmailCampaign();
        campaign.tag = tag;
        campaign.sender = sender;
        campaign.name = name;
        campaign.htmlContent = htmlContent;
        campaign.htmlUrl = htmlUrl;
        campaign.templateId = templateId;
        campaign.scheduledAt = scheduledAt;
        campaign.subject = subject;
        campaign.replyTo = replyTo;
        campaign.toField = toField;
        campaign.recipients = recipients;
        campaign.attachmentUrl = attachmentUrl;
        campaign.inlineImageActivation = inlineImageActivation;
        campaign.mirrorActive = mirrorActive;
        campaign.footer = footer;
        campaign.header = header;
        campaign.utmCampaign = utmCampaign;
        campaign.params = params;

        let res: {
            response: ClientResponse;
            body: SibAPI.CreateModel;
        } = await new SibAPI.EmailCampaignsApi().createEmailCampaign(campaign);

        if (res && res.response && res.response.statusCode == 200 && res.body && res.body.id) {
            return res.body.id;
        }

        return null;
    }

    public async send(campaignId: number): Promise<boolean> {
        // TODO
        let res: {
            response: ClientResponse;
            body?: any;
        } = await new SibAPI.EmailCampaignsApi().sendEmailCampaignNow(campaignId);

        if (res && res.response && res.response.statusCode == 200 && res.body) {
            return true;
        }

        return false;
    }
}