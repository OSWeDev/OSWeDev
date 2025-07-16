
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIThreadMessageAttachmentVO from './GPTAssistantAPIThreadMessageAttachmentVO';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg";

    public static GPTMSG_ROLE_LABELS: string[] = [
        'GPTAssistantAPIThreadMessageVO.system',
        'GPTAssistantAPIThreadMessageVO.user',
        'GPTAssistantAPIThreadMessageVO.assistant',
        'GPTAssistantAPIThreadMessageVO.function',
        'GPTAssistantAPIThreadMessageVO.tool'
    ];
    public static GPTMSG_ROLE_SYSTEM: number = 0;
    public static GPTMSG_ROLE_USER: number = 1;
    public static GPTMSG_ROLE_ASSISTANT: number = 2;
    public static GPTMSG_ROLE_FUNCTION: number = 3;
    public static GPTMSG_ROLE_TOOL: number = 4;

    public static FROM_OPENAI_ROLE_MAP: { [key: string]: number } = {
        "system": 0,
        "user": 1,
        "assistant": 2,
        "function": 3,
        "tool": 4,
    };

    public static TO_OPENAI_ROLE_MAP: { [key: number]: string } = {
        0: "system",
        1: "user",
        2: "assistant",
        3: "function",
        4: "tool",
    };

    // in_progress, incomplete, or completed
    public static FROM_OPENAI_STATUS_MAP: { [key: string]: number } = {
        "in_progress": 0,
        "incomplete": 1,
        "completed": 2,
    };

    public static TO_OPENAI_STATUS_MAP: { [key: number]: string } = {
        0: "in_progress",
        1: "incomplete",
        2: "completed",
    };

    public static STATUS_LABELS: string[] = [
        "GPTAssistantAPIThreadMessageVO.STATUS_IN_PROGRESS",
        "GPTAssistantAPIThreadMessageVO.STATUS_INCOMPLETE",
        "GPTAssistantAPIThreadMessageVO.STATUS_COMPLETED",
    ];
    public static STATUS_IN_PROGRESS: number = 0;
    public static STATUS_INCOMPLETE: number = 1;
    public static STATUS_COMPLETED: number = 2;


    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageVO.API_TYPE_ID;

    /**
     * The entity that produced the message. One of user or assistant.
     * Enum dans OSWedev, à traduire pour OpenAI
     * @warning: system, function et tool ne sont pas des valeurs possibles dans OpenAI d'après la dernière doc, à voir si on les garde
     */
    public role: number;

    public user_id: number;

    /**
     * L'assistant si c'est un message de l'assistant
     */
    public assistant_id: number;

    /**
     * Le run_id si c'est un message de l'assistant
     */
    public run_id: number;

    // Si on a choisi de modifier un message par exemple, on l'archive, ce qui signifie que dans la synchro avec openai, on supprime le message côté openai, et la liaison avec nous
    public archived: boolean;

    // If applicable, the ID of the assistant that authored this message.
    public gpt_assistant_id: string;

    // The ID of the run associated with the creation of this message.Value is null when messages are created manually using the create message or create thread endpoints.
    public gpt_run_id: string;

    // The thread ID that this message belongs to.
    public gpt_thread_id: string;
    public thread_id: number;

    public oselia_run_id: number;

    // public autogen_voice_summary_done: boolean;
    public autogen_voice_summary: boolean;
    public autogen_tts_id: number;

    /**
     * Le prompt, si l'assistant vient de répondre à un prompt l'assistant_id est aussi saisi, sinon c'est le prompt en lui même
     */
    public prompt_id: number;

    /**
     * The Unix timestamp(in seconds) for when the message was created in OSWedev.
     */
    public date: number;

    // The identifier, which can be referenced in API endpoints.
    public gpt_id: string;

    // The Unix timestamp(in seconds) for when the message was created.
    public created_at: number;

    // On an incomplete message, details about why the message is incomplete.
    public incomplete_details: unknown;

    // The Unix timestamp(in seconds) for when the message was completed.
    public completed_at: number;

    // The Unix timestamp(in seconds) for when the message was marked as incomplete.
    public incomplete_at: number;

    /**
     * The status of the message, which can be either in_progress, incomplete, or completed.
     * Enum dans OSWedev, à traduire pour OpenAI
     */
    public status: number;

    // The content of the message in array of text and / or images. => GPTAssistantAPIThreadMessageContentVO[]

    // A list of files attached to the message, and the tools they were added to.
    public attachments: GPTAssistantAPIThreadMessageAttachmentVO[];

    /**
     * Set of 16 key - value pairs that can be attached to an object.
     * This can be useful for storing additional information about the object in a structured format.
     * Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
     */
    public metadata: unknown;

    /**
     * Lien vers le thread duquel on a pipe/dupliqué le message
     * @see GPTAssistantAPIThreadVO.pipe_outputs_to_thread_id
     */
    public piped_from_thread_id: number;

    /**
     * Lien vers le thread message qu'on a pipe/dupliqué ici
     * @see GPTAssistantAPIThreadVO.pipe_outputs_to_thread_id
     */
    public piped_from_thread_message_id: number;



    public weight: number;

    public is_ready: boolean;
}