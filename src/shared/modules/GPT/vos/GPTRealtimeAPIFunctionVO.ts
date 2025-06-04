
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIErrorVO from './GPTAssistantAPIErrorVO';

export default class GPTRealtimeAPIFunctionVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_realtime_function";

    // The unique ID of the event.
    // public event_id?: string; // A mettre en obligatoire si on utilise les events
    public id: number;
    public _type: string = GPTRealtimeAPIFunctionVO.API_TYPE_ID;
    public type: string = "function";
    public name: string;
    public description: string;
}