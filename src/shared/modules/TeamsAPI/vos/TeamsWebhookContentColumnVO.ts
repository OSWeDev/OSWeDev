export default class TeamsWebhookContentColumnVO {

    public type: string = "Column";
    public items?: any[];
    public backgroundImage?: string; // URL to the background image
    public width?: string;
    public bleed?: boolean; // If set to true, the column set will have a visible separator on the left and right sides of the column set.

    public constructor() { }

    public set_items(items: any[]): TeamsWebhookContentColumnVO {
        this.items = items;
        return this;
    }

    public set_background_image(backgroundImage: string): TeamsWebhookContentColumnVO {
        this.backgroundImage = backgroundImage;
        return this;
    }

    public set_width(width: string): TeamsWebhookContentColumnVO {
        this.width = width;
        return this;
    }

    public set_bleed(bleed: boolean): TeamsWebhookContentColumnVO {
        this.bleed = bleed;
        return this;
    }
}