import GPTConversationVO from "../vos/GPTConversationVO";
import GPTMessageVO from "../vos/GPTMessageVO";

export default class GPTAPIMessage {

    public static ROLE_FROM_MESSAGEVO_ROLE: { [role_message_vo_id: number]: string } = {
        0: 'system',
        1: 'user',
        2: 'assistant'
    };

    public static fromConversation(conversation: GPTConversationVO): GPTAPIMessage[] {
        let res: GPTAPIMessage[] = [];

        for (let i in conversation.messages) {
            let message = conversation.messages[i];

            res.push(GPTAPIMessage.fromMessage(message));
        }

        return res;
    }

    public static fromMessage(message: GPTMessageVO): GPTAPIMessage {
        let res: GPTAPIMessage = new GPTAPIMessage();

        res.role = GPTAPIMessage.ROLE_FROM_MESSAGEVO_ROLE[message.role_type];
        res.content = message.content;

        return res;
    }

    public role: string;
    public content: string;
}
