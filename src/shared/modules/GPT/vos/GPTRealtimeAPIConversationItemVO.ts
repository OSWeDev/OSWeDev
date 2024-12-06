import IDistantVOBase from "../../IDistantVOBase";

export default class GPTRealtimeAPIConversationItemVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_realtime_conversation_item";

    // The unique ID of the event.
    public static event_id: string;
    public id: number;
    public _type: string = GPTRealtimeAPIConversationItemVO.API_TYPE_ID;
    public type: string;
    public status: string;
    public role: string;
    
}