
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIAssistantFunctionVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_function";

    public id: number;
    public _type: string = GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID;

    public assistant_id: number;
    public function_id: number;
}