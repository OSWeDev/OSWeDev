import TeamsWebhookContentActionCardInputVO from './TeamsWebhookContentActionCardInputVO';
import TeamsWebhookContentActionCardOpenURITargetVO from './TeamsWebhookContentActionCardOpenURITargetVO';
import TeamsWebhookContentAdaptiveCardVO from './TeamsWebhookContentAdaptiveCardVO';

export default class TeamsWebhookContentAttachmentsVO {

    public name: string;
    public contentType: string = "application/vnd.microsoft.card.adaptive";
    public content: TeamsWebhookContentAdaptiveCardVO;

    public constructor() { }

    public set_name(name: string): TeamsWebhookContentAttachmentsVO {
        this.name = name;
        return this;
    }

    public set_content(content: TeamsWebhookContentAdaptiveCardVO): TeamsWebhookContentAttachmentsVO {
        this.content = content;
        return this;
    }

}