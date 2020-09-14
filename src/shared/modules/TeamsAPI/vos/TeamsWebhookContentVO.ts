import TeamsWebhookContentActionCardVO from './TeamsWebhookContentActionCardVO';
import TeamsWebhookContentSectionVO from './TeamsWebhookContentSectionVO';

export default class TeamsWebhookContentVO {
    public "@type": string = "MessageCard";
    public "@context": string = "http://schema.org/extensions";
    public summary: string = "Summary";
    public title: string = "Connector Card HTML formatting";
    public sections: TeamsWebhookContentSectionVO[] = [];
    public potentialAction: TeamsWebhookContentActionCardVO[] = [];

    public set_type(type: string): TeamsWebhookContentVO {
        this["@type"] = type;
        return this;
    }

    public set_context(context: string): TeamsWebhookContentVO {
        this["@context"] = context;
        return this;
    }

    public set_summary(summary: string): TeamsWebhookContentVO {
        this.summary = summary;
        return this;
    }

    public set_title(title: string): TeamsWebhookContentVO {
        this.title = title;
        return this;
    }

    public set_sections(sections: TeamsWebhookContentSectionVO[]): TeamsWebhookContentVO {
        this.sections = sections;
        return this;
    }

    public set_potentialAction(potentialAction: TeamsWebhookContentActionCardVO[]): TeamsWebhookContentVO {
        this.potentialAction = potentialAction;
        return this;
    }
}