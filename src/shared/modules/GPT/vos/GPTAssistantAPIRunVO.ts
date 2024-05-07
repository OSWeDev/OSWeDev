
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIRunVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_run";

    public id: number;
    public _type: string = GPTAssistantAPIRunVO.API_TYPE_ID;

    public thread_id: number;
    public assistant_id: number;

    public is_best_run: boolean;
    public ask_user_which_run_is_best: boolean;
    public rerun_of_run_id: number;

    public gpt_run_id: string;

    // The Unix timestamp(in seconds) for when the run was created.
    public created_at: number;

    // The ID of the thread that was executed on as a part of this run.
    public gpt_thread_id: string;

    // The ID of the assistant used for execution of this run.
    public gpt_assistant_id: string;

    // The status of the run, which can be either queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired.
    public status: string;

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

    // The model that the assistant used for this run.
    public model: string;

    // The instructions that the assistant used for this run.
    public instructions: string;

    // The list of tools that the assistant used for this run.
    public tools: Array<unknown>;

    // The list of File IDs the assistant used for this run.
    public file_ids: Array<unknown>;

    // Set of 16 key - value pairs that can be attached to an object.This can be useful for storing additional information about the object in a structured format.Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
    public metadata: unknown;

    // The sampling temperature used for this run.If not set, defaults to 1.
    public temperature: number;
}