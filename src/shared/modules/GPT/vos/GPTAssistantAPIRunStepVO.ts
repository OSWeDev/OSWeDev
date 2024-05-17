
import IDistantVOBase from '../../IDistantVOBase';

/**
 * @see https://platform.openai.com/docs/api-reference/run-steps/step-object
 */
export default class GPTAssistantAPIRunStepVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_run_step";

    // message_creation or tool_calls
    public static FROM_OPENAI_TYPE_MAP: { [key: string]: number } = {
        "message_creation": 0,
        "tool_calls": 1,
    };

    public static TO_OPENAI_TYPE_MAP: { [key: number]: string } = {
        0: "message_creation",
        1: "tool_calls",
    };

    public static TYPE_LABELS: string[] = [
        "GPTAssistantAPIRunStepVO.TYPE_MESSAGE_CREATION",
        "GPTAssistantAPIRunStepVO.TYPE_TOOL_CALLS",
    ];

    public static TYPE_MESSAGE_CREATION: number = 0;
    public static TYPE_TOOL_CALLS: number = 1;

    // in_progress, cancelled, failed, completed, or expired
    public static FROM_OPENAI_STATUS_MAP: { [key: string]: number } = {
        "in_progress": 0,
        "cancelled": 1,
        "failed": 2,
        "completed": 3,
        "expired": 4,
    };

    public static TO_OPENAI_STATUS_MAP: { [key: number]: string } = {
        0: "in_progress",
        1: "cancelled",
        2: "failed",
        3: "completed",
        4: "expired",
    };

    public static STATUS_LABELS: string[] = [
        "GPTAssistantAPIRunStepVO.STATUS_IN_PROGRESS",
        "GPTAssistantAPIRunStepVO.STATUS_CANCELLED",
        "GPTAssistantAPIRunStepVO.STATUS_FAILED",
        "GPTAssistantAPIRunStepVO.STATUS_COMPLETED",
        "GPTAssistantAPIRunStepVO.STATUS_EXPIRED",
    ];
    public static STATUS_IN_PROGRESS: number = 0;
    public static STATUS_CANCELLED: number = 1;
    public static STATUS_FAILED: number = 2;
    public static STATUS_COMPLETED: number = 3;
    public static STATUS_EXPIRED: number = 4;

    public id: number;
    public _type: string = GPTAssistantAPIRunStepVO.API_TYPE_ID;

    public thread_id: number;
    public assistant_id: number;
    public run_id: number;

    // The identifier of the run step, which can be referenced in API endpoints.
    public gpt_run_step_id: string;

    // The Unix timestamp(in seconds) for when the run step was created.
    public created_at: number;

    // The ID of the thread that was run.
    public gpt_thread_id: string;

    // The ID of the assistant associated with the run step.
    public gpt_assistant_id: string;

    // The ID of the run that this run step is a part of.
    public gpt_run_id: string;

    /**
     * The type of run step, which can be either message_creation or tool_calls.
     * En enum pour OSWedev, à traduire pour OpenAI
     */
    public type: number;

    /**
     * The status of the run step, which can be either in_progress, cancelled, failed, completed, or expired.
     * En enum pour OSWedev, à traduire pour OpenAI
     */
    public status: number;

    // The details of the run step.
    public step_details: unknown;


    // The last error associated with this run step.Will be null if there are no errors.
    public last_error: unknown;

    // The Unix timestamp(in seconds) for when the run step expired. A step is considered expired if the parent run is expired.
    public expired_at: number;

    // The Unix timestamp(in seconds) for when the run step was cancelled.
    public cancelled_at: number;

    // The Unix timestamp(in seconds) for when the run step failed.
    public failed_at: number;

    // The Unix timestamp(in seconds) for when the run step completed.
    public completed_at: number;

    /**
     * Set of 16 key - value pairs that can be attached to an object.
     * This can be useful for storing additional information about the object in a structured format.
     * Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
     */
    public metadata: unknown;

    // Usage statistics related to the run step. This value will be null while the run step's status is in_progress. => GPTAssistantAPIRunStepUsageVO
}