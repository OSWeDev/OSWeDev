
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIRunStepUsageVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_run_step_usage";

    public id: number;
    public _type: string = GPTAssistantAPIRunStepUsageVO.API_TYPE_ID;

    public run_step_id: number;

    // Number of completion tokens used over the course of the run step.
    public completion_tokens: number;

    // Number of prompt tokens used over the course of the run step.
    public prompt_tokens: number;

    // Total number of tokens used(prompt + completion).
    public total_tokens: number;
}