import TeamsWebhookContentActionCardInputVO from './TeamsWebhookContentActionCardInputVO';
import TeamsWebhookContentActionCardOpenURITargetVO from './TeamsWebhookContentActionCardOpenURITargetVO';

export default class TeamsWebhookContentImageVO {

    public type: string = "Image";
    public url: string;
    public size?: string;

    public constructor() { }

    public set_url(url: string): TeamsWebhookContentImageVO {
        this.url = url;
        return this;
    }

    public set_size(size: string): TeamsWebhookContentImageVO {
        this.size = size;
        return this;
    }
}