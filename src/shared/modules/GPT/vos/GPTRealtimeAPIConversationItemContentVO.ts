import IDistantVOBase from "../../IDistantVOBase";
import GPTRealtimeAPIConversationItemVO from "./GPTRealtimeAPIConversationItemVO";

export default class GPTRealtimeAPIConversationItemContentVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_realtime_conversation_item_content";

    // The unique ID of the event.
    public static conversation_item: GPTRealtimeAPIConversationItemVO;
    public id: number;
    public _type: string = GPTRealtimeAPIConversationItemContentVO.API_TYPE_ID;
    public type: string;
    public text: string;
    public audio: string;
    public transcript: string;
}