import TeamsWebhookContentActionCardInputVO from './TeamsWebhookContentActionCardInputVO';
import TeamsWebhookContentActionCardOpenURITargetVO from './TeamsWebhookContentActionCardOpenURITargetVO';

export default class TeamsWebhookContentActionOpenUrlVO {

    public type: string = "Action.OpenUrl";
    public url: string;
    public style?: string;
    public title?: string;

    public constructor() { }

    public set_url(url: string): TeamsWebhookContentActionOpenUrlVO {
        this.url = url;
        return this;
    }

    public set_style(style: string): TeamsWebhookContentActionOpenUrlVO {
        this.style = style;
        return this;
    }

    public set_title(title: string): TeamsWebhookContentActionOpenUrlVO {
        this.title = title;
        return this;
    }
}