
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTCompletionAPIConversationVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_completion_conversation";

    public id: number;
    public _type: string = GPTCompletionAPIConversationVO.API_TYPE_ID;

    public date: number;
}