
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIThreadMessageFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_message_file";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageFileVO.API_TYPE_ID;

    public thread_message_id: number;
    public file_id: number;
}