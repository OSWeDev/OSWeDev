
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIErrorVO from './GPTAssistantAPIErrorVO';

export default class GPTRealtimeAPISessionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "gpt_realtime_session";
    public id: number;
    public _type: string = GPTRealtimeAPISessionVO.API_TYPE_ID;

    // The Unix timestamp (in seconds) for when the thread was created.
    public created_at: number;

    public name: string;
    // Timestamp for when the token expires. Currently, all tokens expire after one minute.
    public client_secret_expires_at: string;

    public assistant_id: number;

    // Ephemeral key usable in client environments to authenticate connections to the Realtime API. Use this in client-side environments rather than a standard API token, which should only be used server-side.
    public client_secret_value: string;

    // The format of input audio. Options are pcm16, g711_ulaw, or g711_alaw.
    public input_audio_format?: string;

    // Configuration for input audio transcription, defaults to off and can be set to null to turn off once on. Input audio transcription is not native to the model, since the model consumes audio directly. Transcription runs asynchronously through Whisper and should be treated as rough guidance rather than the representation understood by the model.
    public input_audio_transcription_model?: string;

    // The language of the input audio. Supplying the input language in ISO-639-1 (e.g. en) format will improve accuracy and latency.
    public input_audio_transcription_language?: string;

    // Maximum number of output tokens for a single assistant response, inclusive of tool calls. Provide an integer between 1 and 4096 to limit output tokens, or inf for the maximum available tokens for a given model. Defaults to inf.
    public max_response_output_tokens?: number;

    // The set of modalities the model can respond with. To disable audio, set this to ["text"].
    public modalities?: string[];

    // The format of output audio. Options are pcm16, g711_ulaw, or g711_alaw.
    public output_audio_format?: string;

    // Sampling temperature for the model, limited to [0.6, 1.2]. Defaults to 0.8.
    public temperature?: number;

    // How the model chooses tools. Options are auto, none, required, or specify a function.
    public tool_choice?: string;

    // Tools (functions) available to the model.
    public tools?: [];

    // Configuration for turn detection. Can be set to null to turn off. Server VAD means that the model will detect the start and end of speech based on audio volume and respond at the end of user speech.

    // Amount of audio to include before the VAD detected speech (in milliseconds). Defaults to 300ms.
    public turn_detection_prefix_padding_ms?: number;

    // Duration of silence to detect speech stop (in milliseconds). Defaults to 500ms. With shorter values the model will respond more quickly, but may jump in on short pauses from the user.
    public turn_detection_silence_duration_ms?: number;

    // Activation threshold for VAD (0.0 to 1.0), this defaults to 0.5. A higher threshold will require louder audio to activate the model, and thus might perform better in noisy environments.
    public turn_detection_threshold?: number;

    // Type of turn detection, only server_vad is currently supported.
    public turn_detection_type?: string;

    // The voice the model uses to respond. Voice cannot be changed during the session once the model has responded with audio at least once. Current voice options are alloy, ash, ballad, coral, echo sage, shimmer and verse.
    public voice?: string;
}