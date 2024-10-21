import TeamsWebhookContentActionCardInputVO from './TeamsWebhookContentActionCardInputVO';
import TeamsWebhookContentActionCardOpenURITargetVO from './TeamsWebhookContentActionCardOpenURITargetVO';

export default class TeamsWebhookContentAdaptiveCardVO {

    public type: string = "AdaptiveCard";
    public version: string = "1.2";
    public body?: object[];
    public actions?: object[];
    public $schema = "http://adaptivecards.io/schemas/adaptive-card.json";

    public constructor() { }

    public set_body(body: object[]): TeamsWebhookContentAdaptiveCardVO {
        this.body = body;
        return this;
    }

    public set_actions(actions: object[]): TeamsWebhookContentAdaptiveCardVO {
        this.actions = actions;
        return this;
    }
}