import TeamsWebhookContentActionCardInputVO from './TeamsWebhookContentActionCardInputVO';
import TeamsWebhookContentActionCardOpenURITargetVO from './TeamsWebhookContentActionCardOpenURITargetVO';

export default class TeamsWebhookContentActionCardVO {

    public "@type": string = "HttpPOST";
    public name: string;
    public inputs: TeamsWebhookContentActionCardInputVO[];
    public actions: TeamsWebhookContentActionCardVO[];
    public target: string;
    public targets: TeamsWebhookContentActionCardOpenURITargetVO[];

    public constructor() { }

    public set_type(type: string): TeamsWebhookContentActionCardVO {
        this["@type"] = type;
        return this;
    }

    public set_name(name: string): TeamsWebhookContentActionCardVO {
        this.name = name;
        return this;
    }

    public set_target(target: string): TeamsWebhookContentActionCardVO {
        this.target = target;
        return this;
    }

    public set_inputs(inputs: TeamsWebhookContentActionCardInputVO[]): TeamsWebhookContentActionCardVO {
        this.inputs = inputs;
        return this;
    }

    public set_actions(actions: TeamsWebhookContentActionCardVO[]): TeamsWebhookContentActionCardVO {
        this.actions = actions;
        return this;
    }

    public set_targets(targets: TeamsWebhookContentActionCardOpenURITargetVO[]): TeamsWebhookContentActionCardVO {
        this.targets = targets;
        return this;
    }
}