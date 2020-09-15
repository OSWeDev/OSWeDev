
export default class TeamsWebhookContentActionCardOpenURITargetVO {

    public os: string = "default";
    public uri: string;

    public constructor() { }

    public set_os(os: string): TeamsWebhookContentActionCardOpenURITargetVO {
        this.os = os;
        return this;
    }

    public set_uri(uri: string): TeamsWebhookContentActionCardOpenURITargetVO {
        this.uri = uri;
        return this;
    }
}