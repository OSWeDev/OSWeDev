import SendInBlueCampaignRecipientsVO from './SendInBlueCampaignRecipientsVO';
import SendInBlueSmsCampaignStatDetailVO from './SendInBlueSmsCampaignStatDetailVO';

export default class SendInBlueSmsCampaignDetailVO {
    public id: number;
    public name: string;
    public status: string;
    public content: string;
    public scheduledAt: string;
    public testSent: boolean;
    public sender: string;
    public createdAt: string;
    public modifiedAt: string;
    public recipients: SendInBlueCampaignRecipientsVO;
    public statistics: SendInBlueSmsCampaignStatDetailVO;
}