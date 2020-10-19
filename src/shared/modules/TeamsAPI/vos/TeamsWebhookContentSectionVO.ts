import TeamsWebhookContentSectionFactVO from './TeamsWebhookContentSectionFactVO';

export default class TeamsWebhookContentSectionVO {

    // More infos : https://docs.microsoft.com/fr-fr/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using and https://docs.microsoft.com/fr-fr/microsoftteams/platform/task-modules-and-cards/cards/cards-format?tabs=adaptive-md%2Cconnector-html
    public activityTitle: string;
    public activitySubtitle: string;
    public activityImage: string;
    public facts: TeamsWebhookContentSectionFactVO[];
    public markdown: boolean;
    public text: string = "Check <a href=\"\">this page</a> for format examples";

    public constructor(
    ) { }

    public set_activityTitle(activityTitle: string): TeamsWebhookContentSectionVO {
        this.activityTitle = activityTitle;
        return this;
    }

    public set_activitySubtitle(activitySubtitle: string): TeamsWebhookContentSectionVO {
        this.activitySubtitle = activitySubtitle;
        return this;
    }

    public set_activityImage(activityImage: string): TeamsWebhookContentSectionVO {
        this.activityImage = activityImage;
        return this;
    }

    public set_markdown(markdown: boolean): TeamsWebhookContentSectionVO {
        this.markdown = markdown;
        return this;
    }

    public set_text(text: string): TeamsWebhookContentSectionVO {
        this.text = text;
        return this;
    }

    public set_facts(facts: TeamsWebhookContentSectionFactVO[]): TeamsWebhookContentSectionVO {
        this.facts = facts;
        return this;
    }
}