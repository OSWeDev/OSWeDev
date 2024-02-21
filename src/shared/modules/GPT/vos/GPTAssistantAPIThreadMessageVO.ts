
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIThreadMessageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg";

    public static GPTMSG_ROLE_TYPE_LABELS: string[] = [
        'system',
        'user',
        'assistant',
        'function',
        'tool'
    ];
    public static GPTMSG_ROLE_TYPE_SYSTEM: number = 0;
    public static GPTMSG_ROLE_TYPE_USER: number = 1;
    public static GPTMSG_ROLE_TYPE_ASSISTANT: number = 2;
    public static GPTMSG_ROLE_TYPE_FUNCTION: number = 3;
    public static GPTMSG_ROLE_TYPE_TOOL: number = 4;

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageVO.API_TYPE_ID;

    public thread_id: number;

    public role_type: number;
    public user_id: number;
    public run_id: number;

    /**
     * L'assistant si c'est un message de l'assistant
     */
    public assistant_id: number;
    /**
     * Le prompt, si l'assistant vient de répondre à un prompt l'assistant_id est aussi saisi, sinon c'est le prompt en lui même
     */
    public prompt_id: number;

    public date: number;

    public gpt_message_id: string;
}