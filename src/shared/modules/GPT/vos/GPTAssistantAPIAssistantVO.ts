
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIAssistantVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_assistant";

    public id: number;
    public _type: string = GPTAssistantAPIAssistantVO.API_TYPE_ID;

    public gpt_assistant_id: string;
    public nom: string;
    public description: string;
}