import SendInBlueCampaignRecipientsVO from './SendInBlueCampaignRecipientsVO';
import SendInBlueMailCampaignStatsVO from './SendInBlueMailCampaignStatsVO';
import SendInBlueMailVO from './SendInBlueMailVO';

export default class SendInBlueMailCampaignDetailVO {
    public id: number;
    public name: string;
    public subject: string;
    public type: string;
    public status: string;
    public scheduledAt: string;
    public testSent: boolean;
    public header: string;
    public footer: string;
    public sender: SendInBlueMailVO;
    public replyTo: string;
    public toField: string;
    public htmlContent: string;
    public shareLink: string;
    public tag: string;
    public createdAt: string;
    public modifiedAt: string;
    public inlineImageActivation: boolean;
    public mirrorActive: boolean;
    public recurring: boolean;
    public recipients: SendInBlueCampaignRecipientsVO;
    public statistics: SendInBlueMailCampaignStatsVO;
}