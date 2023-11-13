
import IDistantVOBase from '../../IDistantVOBase';
import GPTMultiModalMessageVO from './GPTMultiModalMessageVO';

export default class GPTMultiModalConversationVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_multimodalconversation";

    public id: number;
    public _type: string = GPTMultiModalConversationVO.API_TYPE_ID;


    public messages: GPTMultiModalMessageVO[];
}