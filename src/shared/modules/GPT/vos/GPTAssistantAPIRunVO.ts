
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIRunVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_run";

    public id: number;
    public _type: string = GPTAssistantAPIRunVO.API_TYPE_ID;

    public thread_id: number;
    public assistant_id: number;

    public gpt_run_id: string;
}