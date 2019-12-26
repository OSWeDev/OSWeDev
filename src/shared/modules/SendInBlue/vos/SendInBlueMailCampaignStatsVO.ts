import SendInBlueMailCampaignStatDetailVO from './SendInBlueMailCampaignStatDetailVO';

export default class SendInBlueMailCampaignStatsVO {
    public globalStats: SendInBlueMailCampaignStatDetailVO;
    public campaignStats: SendInBlueMailCampaignStatDetailVO[];
    public mirrorClick: number;
    public remaining: number;
    public linksStats: { [url: string]: number };
    public statsByDomain: { [domaineName: string]: SendInBlueMailCampaignStatDetailVO };
    public statsByDevice: { [deviceName: string]: SendInBlueMailCampaignStatDetailVO };
    public statsByBrowser: { [browserName: string]: SendInBlueMailCampaignStatDetailVO };
}