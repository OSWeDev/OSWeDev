import SendInBlueMailCampaignStatVO from './SendInBlueMailCampaignStatVO';

export default class SendInBlueListDetailVO {
    public id: number;
    public name: string;
    public totalSubscribers: number;
    public totalBlacklisted: number;
    public folderId: number;
    public createdAt: string;
    public campaignStats: SendInBlueMailCampaignStatVO[];
    public dynamicList: boolean;
}