import TeamsWebhookContentActionCardInputVO from './TeamsWebhookContentActionCardInputVO';
import TeamsWebhookContentActionCardOpenURITargetVO from './TeamsWebhookContentActionCardOpenURITargetVO';
import TeamsWebhookContentColumnVO from './TeamsWebhookContentColumnVO';

export default class TeamsWebhookContentColumnSetVO {

    public type: string = "ColumnSet";
    public columns?: TeamsWebhookContentColumnVO[];
    public style?: string;
    public bleed?: boolean; // If set to true, the column set will have a visible separator on the left and right sides of the column set.

    public constructor() { }

    public set_columns(columns: TeamsWebhookContentColumnVO[]): TeamsWebhookContentColumnSetVO {
        this.columns = columns;
        return this;
    }

    public set_style(style: string): TeamsWebhookContentColumnSetVO {
        this.style = style;
        return this;
    }

    public set_bleed(bleed: boolean): TeamsWebhookContentColumnSetVO {
        this.bleed = bleed;
        return this;
    }
}