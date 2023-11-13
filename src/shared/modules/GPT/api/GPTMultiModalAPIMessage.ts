import { readFileSync } from "fs";
import ConsoleHandler from "../../../tools/ConsoleHandler";
import GPTMultiModalConversationVO from "../vos/GPTMultiModalConversationVO";
import GPTMultiModalMessagePartVO from "../vos/GPTMultiModalMessagePartVO";
import GPTMultiModalMessageVO from "../vos/GPTMultiModalMessageVO";

export default class GPTMultiModalAPIMessage {

    public static ROLE_FROM_MESSAGEVO_ROLE: { [role_message_vo_id: number]: string } = {
        0: 'system',
        1: 'user',
        2: 'assistant'
    };

    public static fromConversation(conversation: GPTMultiModalConversationVO): GPTMultiModalAPIMessage[] {
        let res: GPTMultiModalAPIMessage[] = [];

        for (let i in conversation.messages) {
            let message = conversation.messages[i];

            res.push(GPTMultiModalAPIMessage.fromMessage(message));
        }

        return res;
    }

    public static fromMessage(message: GPTMultiModalMessageVO): GPTMultiModalAPIMessage {
        let res: GPTMultiModalAPIMessage = new GPTMultiModalAPIMessage();

        res.role = GPTMultiModalAPIMessage.ROLE_FROM_MESSAGEVO_ROLE[message.role_type];
        res.content = [];

        for (let i in message.content) {
            let content = message.content[i];

            switch (content.type) {
                case GPTMultiModalMessagePartVO.CONTENT_TYPE_TEXT:
                    res.content.push({
                        type: content.type,
                        text: content.text
                    });
                    break;

                case GPTMultiModalMessagePartVO.CONTENT_TYPE_IMAGE_URL:

                    if ((!content.image_url) || (!content.image_url.url)) {
                        ConsoleHandler.error('GPTMultiModalAPIMessage: no image_url.url for content', content);
                        break;
                    }

                    const base64String = this.toBase64(content.image_url.url.startsWith('http') ? content.image_url.url.replace(/^https?:[/][/][^/]+[/](.*)$/ig, '$1') : content.image_url.url);
                    const withPrefix: string = 'data:image/png;base64,' + base64String;

                    // res.content.push({
                    //     type: content.type,
                    //     image_url: content.image_url ? {
                    //         url: content.image_url.url
                    //     } : null
                    // });

                    res.content.push({
                        type: content.type,
                        image_url: {
                            url: withPrefix
                        }
                    });

                    break;
            }
        }

        return res;
    }

    private static toBase64(filePath: string) {
        const img = readFileSync(filePath);

        return Buffer.from(img).toString('base64');
    }

    public role: string;
    public content: Array<{
        type: string;
        text?: string;
        image_url?: {
            url: string;
        };
    }>;
}
