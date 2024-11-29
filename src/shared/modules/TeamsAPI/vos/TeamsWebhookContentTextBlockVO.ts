// import { NodeHtmlMarkdown } from 'node-html-markdown';
import TurndownService from 'turndown';

export default class TeamsWebhookContentTextBlockVO {

    // private static nhm = new NodeHtmlMarkdown(
    //     /* options (optional) */ {},
    //     /* customTransformers (optional) */ undefined,
    //     /* customCodeBlockTranslators (optional) */ undefined
    // );

    private static turndown_service = new TurndownService();

    public type: string = "TextBlock";
    public text: string;
    public color?: string;
    public wrap?: boolean = true;
    public maxLines?: number;
    public size?: string;
    public weight?: string;

    public constructor() {

        // Personnaliser les règles pour Teams
        TeamsWebhookContentTextBlockVO.turndown_service.addRule('bold', {
            filter: ['strong', 'b'],
            replacement: (content) => `**${content}**`,
        });

        TeamsWebhookContentTextBlockVO.turndown_service.addRule('italic', {
            filter: ['em', 'i'],
            replacement: (content) => `*${content}*`,
        });

        TeamsWebhookContentTextBlockVO.turndown_service.addRule('removeUnsupported', {
            filter: (node) => {
                return ['script', 'style', 'iframe', 'table', 'img'].includes(node.nodeName.toLowerCase());
            },
            replacement: () => '',
        });
    }

    public set_type(type: string): TeamsWebhookContentTextBlockVO {
        this.type = type;
        return this;
    }

    public set_text(text: string): TeamsWebhookContentTextBlockVO {

        /**
         * On traduit le HTML en markdown pour Teams
         */

        // this.text = TeamsWebhookContentTextBlockVO.nhm.translate(text);

        this.text = TeamsWebhookContentTextBlockVO.turndown_service.turndown(text);

        // this.text = text;
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