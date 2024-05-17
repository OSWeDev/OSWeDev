
import IDistantVOBase from '../../IDistantVOBase';

/**
 * @see https://platform.openai.com/docs/api-reference/runs/object
 */
export default class GPTAssistantAPIRunVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_run";

    // queued, in_progress, requires_action, cancelling, cancelled, failed, completed, incomplete, or expired
    public static FROM_OPENAI_STATUS_MAP: { [key: string]: number } = {
        "queued": 0,
        "in_progress": 1,
        "requires_action": 2,
        "cancelling": 3,
        "cancelled": 4,
        "failed": 5,
        "completed": 6,
        "incomplete": 7,
        "expired": 8,
    };

    public static TO_OPENAI_STATUS_MAP: { [key: number]: string } = {
        0: "queued",
        1: "in_progress",
        2: "requires_action",
        3: "cancelling",
        4: "cancelled",
        5: "failed",
        6: "completed",
        7: "incomplete",
        8: "expired",
    };

    public static STATUS_LABELS: string[] = [
        "GPTAssistantAPIRunVO.STATUS_QUEUED",
        "GPTAssistantAPIRunVO.STATUS_IN_PROGRESS",
        "GPTAssistantAPIRunVO.STATUS_REQUIRES_ACTION",
        "GPTAssistantAPIRunVO.STATUS_CANCELLING",
        "GPTAssistantAPIRunVO.STATUS_CANCELLED",
        "GPTAssistantAPIRunVO.STATUS_FAILED",
        "GPTAssistantAPIRunVO.STATUS_COMPLETED",
        "GPTAssistantAPIRunVO.STATUS_INCOMPLETE",
        "GPTAssistantAPIRunVO.STATUS_EXPIRED",
    ];
    public static STATUS_QUEUED: number = 0;
    public static STATUS_IN_PROGRESS: number = 1;
    public static STATUS_REQUIRES_ACTION: number = 2;
    public static STATUS_CANCELLING: number = 3;
    public static STATUS_CANCELLED: number = 4;
    public static STATUS_FAILED: number = 5;
    public static STATUS_COMPLETED: number = 6;
    public static STATUS_INCOMPLETE: number = 7;
    public static STATUS_EXPIRED: number = 8;

    public id: number;
    public _type: string = GPTAssistantAPIRunVO.API_TYPE_ID;

    public thread_id: number;
    public assistant_id: number;

    public is_best_run: boolean;
    public ask_user_which_run_is_best: boolean;
    public rerun_of_run_id: number;

    // The identifier, which can be referenced in API endpoints.
    public gpt_run_id: string;

    // The Unix timestamp(in seconds) for when the run was created.
    public created_at: number;

    // The ID of the thread that was executed on as a part of this run.
    public gpt_thread_id: string;

    // The ID of the assistant used for execution of this run.
    public gpt_assistant_id: string;

    /**
     * The status of the run, which can be either queued, in_progress, requires_action, cancelling, cancelled, failed, completed, incomplete, or expired.
     *  En enum pour OSWedev, à traduire pour OpenAI
     */
    public status: number;

    // Details on the action required to continue the run.Will be null if no action is required.
    public required_action: unknown;

    // The last error associated with this run.Will be null if there are no errors.
    public last_error: unknown;

    // The Unix timestamp(in seconds) for when the run will expire.
    public expires_at: number;

    // The Unix timestamp(in seconds) for when the run was started.
    public started_at: number;

    // The Unix timestamp(in seconds) for when the run was cancelled.
    public cancelled_at: number;

    // The Unix timestamp(in seconds) for when the run failed.
    public failed_at: number;

    // The Unix timestamp(in seconds) for when the run was completed.
    public completed_at: number;

    // Details on why the run is incomplete.Will be null if the run is not incomplete.
    public incomplete_details: unknown;





    // The model that the assistant used for this run.
    public model: string;

    // The instructions that the assistant used for this run.
    public instructions: string;

    // The list of tools that the assistant used for this run.
    public tools: Array<unknown>;

    // Set of 16 key - value pairs that can be attached to an object.This can be useful for storing additional information about the object in a structured format.Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
    public metadata: unknown;

    // The sampling temperature used for this run.If not set, defaults to 1.
    public temperature: number;

    // Usage statistics related to the run.This value will be null if the run is not in a terminal state(i.e.in_progress, queued, etc.). => GPTAssistantAPIRunUsageVO

    // The nucleus sampling value used for this run.If not set, defaults to 1.
    public top_p: number;

    // The maximum number of prompt tokens specified to have been used over the course of the run.
    public max_prompt_tokens: number;

    // The maximum number of completion tokens specified to have been used over the course of the run.
    public max_completion_tokens: number;

    // Controls for how a thread will be truncated prior to the run.Use this to control the intial context window of the run.
    public truncation_strategy: unknown;

    /**
     * Controls which(if any) tool is called by the model.none means the model will not call any tools and instead generates a message.
     *  auto is the default value and means the model can pick between generating a message or calling one or more tools.
     *  required means the model must call one or more tools before responding to the user.
     *  Specifying a particular tool like { "type": "file_search" } or { "type": "function", "function": { "name": "my_function" } } forces the model to call that tool.
     */
    public tool_choice: unknown;

    /**
     * Specifies the format that the model must output.Compatible with GPT - 4o, GPT - 4 Turbo, and all GPT - 3.5 Turbo models since gpt - 3.5 - turbo - 1106.
     * Setting to { "type": "json_object" } enables JSON mode, which guarantees the message the model generates is valid JSON.
     *  Important: when using JSON mode, you must also instruct the model to produce JSON yourself via a system or user message.
     *  Without this, the model may generate an unending stream of whitespace until the generation reaches the token limit, resulting in a long - running and seemingly "stuck" request.
     *  Also note that the message content may be partially cut off if finish_reason = "length", which indicates the generation exceeded max_tokens or the conversation exceeded the max context length.
     */
    public response_format: unknown;
}