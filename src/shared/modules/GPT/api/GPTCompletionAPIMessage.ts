import { ChatCompletionRole } from "openai/resources";
import GPTCompletionAPIConversationVO from "../vos/GPTCompletionAPIConversationVO";
import GPTAssistantAPIThreadMessageVO from "../vos/GPTAssistantAPIThreadMessageVO";

export default class GPTCompletionAPIMessage {

    public static ROLE_SYSTEM: ChatCompletionRole = 'system';
    public static ROLE_USER: ChatCompletionRole = 'user';
    public static ROLE_ASSISTANT: ChatCompletionRole = 'assistant';
    public static ROLE_FUNCTION: ChatCompletionRole = 'function';
    public static ROLE_TOOL: ChatCompletionRole = 'tool';

    public static ROLE_FROM_MESSAGEVO_ROLE: ChatCompletionRole[] = [
        'system',
        'user',
        'assistant',
        'function',
        'tool'
    ];

    public static fromConversation(conversation: GPTCompletionAPIConversationVO): GPTCompletionAPIMessage[] {
        let res: GPTCompletionAPIMessage[] = [];

        for (let i in conversation.messages) {
            let message = conversation.messages[i];

            res.push(GPTCompletionAPIMessage.fromMessage(message));
        }

        return res;
    }

    public static fromMessage(message: GPTAssistantAPIThreadMessageVO): GPTCompletionAPIMessage {
        let res: GPTCompletionAPIMessage = new GPTCompletionAPIMessage();

        res.role = GPTCompletionAPIMessage.ROLE_FROM_MESSAGEVO_ROLE[message.role_type];
        res.content = message.content;

        return res;
    }

    public role: ChatCompletionRole;
    public content: string;
    public name?: string;
}
