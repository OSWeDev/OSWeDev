export default class TeamsWebhookContentTextBlockVO {

    public type: string = "TextBlock";
    public text: string;
    public color?: string;
    public wrap?: boolean = true;
    public maxLines?: number;
    public size?: string;
    public weight?: string;

    public constructor() { }

    public set_type(type: string): TeamsWebhookContentTextBlockVO {
        this.type = type;
        return this;
    }

    public set_text(text: string): TeamsWebhookContentTextBlockVO {
        this.text = text;
        return this;
    }

    public set_color(color: string): TeamsWebhookContentTextBlockVO {
        this.color = color;
        return this;
    }

    public set_wrap(wrap: boolean): TeamsWebhookContentTextBlockVO {
        this.wrap = wrap;
        return this;
    }

    public set_max_lines(maxLines: number): TeamsWebhookContentTextBlockVO {
        this.maxLines = maxLines;
        return this;
    }

    public set_size(size: string): TeamsWebhookContentTextBlockVO {
        this.size = size;
        return this;
    }

    public set_weight(weight: string): TeamsWebhookContentTextBlockVO {
        this.weight = weight;
        return this;
    }
}