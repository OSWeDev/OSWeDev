
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIErrorVO from './GPTAssistantAPIErrorVO';
import GPTRealtimeAPIFunctionVO from './GPTRealtimeAPIFunctionVO';

export default class GPTRealtimeAPISessionVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_realtime_session";
    
    // The unique ID of the event.
    public static event_id: string;
    public id: number;
    public session_id: string;
    public object: string;
    public model: string;
    public modalities: string[];
    public instructions: string;
    public voice: string;
    public input_audio_format: string;
    public output_audio_format: string;
    public input_audio_transcription: string;
    public turn_detection: {
        type: string;
        threshold: number;
        prefix_padding_ms: number;
        silence_duration_ms: number;
    }
    
    public tools: GPTRealtimeAPIFunctionVO[];
    public tool_choice: string;
    public temperature: number;
    public max_output_tokens: number;
    public _type: string = GPTRealtimeAPISessionVO.API_TYPE_ID;
    public type: number;
}