
import IDistantVOBase from '../../IDistantVOBase';
import GPTMessageVO from './GPTMessageVO';

export default class GPTConversationVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_conversation";

    public id: number;
    public _type: string = GPTConversationVO.API_TYPE_ID;


    public messages: GPTMessageVO[];
}