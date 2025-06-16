
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIErrorVO from './GPTAssistantAPIErrorVO';

export default class GPTRealtimeAPIEventVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_realtime_event";

    // The unique ID of the event.
    public static event_id: string;
    public static FROM_OPENAI_EVENT_TYPE_MAP: { [key: string]: number } = {
        "session.update": 0,
        "input_audio_buffer.append": 1,
        "input_audio_buffer.commit": 2,
        "input_audio_buffer.clear": 3,
        "conversation.item.create": 4,
        "conversation.item.truncate": 5,
        "conversation.item.delete": 6,
        "conversation.item.created": 7,
        "conversation.item.input_audio_transcription.completed": 8,
        "conversation.item.input_audio_transcription.failed": 9,
        "conversation.created": 10,
        "response.create": 11,
        "response.cancel": 12,
    };

    public static TO_OPENAI_EVENT_TYPE_MAP: { [key: number]: string } = {
        0: "system",
        1: "user",
        2: "assistant",
        3: "function",
        4: "tool",
    };
    public id: number;
    public _type: string = GPTRealtimeAPIEventVO.API_TYPE_ID;
    public type: number;
}