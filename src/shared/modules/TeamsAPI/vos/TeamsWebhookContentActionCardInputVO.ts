
export default class TeamsWebhookContentActionCardInputVO {

    public "@type": string = "TextInput";
    public isMultiline: boolean;
    public id: string;
    public title: string;

    public constructor() { }

    public set_type(type: string): TeamsWebhookContentActionCardInputVO {
        this["@type"] = type;
        return this;
    }

    public set_title(title: string): TeamsWebhookContentActionCardInputVO {
        this.title = title;
        return this;
    }

    public set_id(id: string): TeamsWebhookContentActionCardInputVO {
        this.id = id;
        return this;
    }

    public set_isMultiline(isMultiline: boolean): TeamsWebhookContentActionCardInputVO {
        this.isMultiline = isMultiline;
        return this;
    }
}