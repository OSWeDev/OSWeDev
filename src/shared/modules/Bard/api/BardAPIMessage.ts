import GPTConversationVO from "../vos/BardConversationVO";
import GPTMessageVO from "../vos/BardMessageVO";

export default class BardAPIMessage {

    public static ROLE_FROM_MESSAGEVO_ROLE: { [role_message_vo_id: number]: string } = {
        0: 'system',
        1: 'user',
        2: 'assistant'
    };

    public static fromConversation(conversation: GPTConversationVO): BardAPIMessage[] {
        let res: BardAPIMessage[] = [];

        // for (let i in conversation.messages) {
        //     let message = conversation.messages[i];

        //     res.push(BardAPIMessage.fromMessage(message));
        // }

        return res;
    }

    public static fromMessage(message: GPTMessageVO): BardAPIMessage {
        let res: BardAPIMessage = new BardAPIMessage();

        res.role = BardAPIMessage.ROLE_FROM_MESSAGEVO_ROLE[message.role_type];
        res.content = message.content;

        return res;
    }

    public role: string;
    public content: string;
}
