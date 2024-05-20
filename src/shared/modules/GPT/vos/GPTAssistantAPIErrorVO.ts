
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIErrorVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_error";

    public static CODE_LABELS: string[] = [
        'GPTAssistantAPIErrorVO.CODE_FINE_TUNE',
        'GPTAssistantAPIErrorVO.CODE_FINE_TUNE_RESULTS',
    ];
    public static CODE_SERVER_ERROR: number = 0;
    public static CODE_RATE_LIMIT_EXCEEDED: number = 1;
    public static TO_OPENAI_CODE_MAP: { [key: number]: string } = {
        [GPTAssistantAPIErrorVO.CODE_SERVER_ERROR]: "server_error",
        [GPTAssistantAPIErrorVO.CODE_RATE_LIMIT_EXCEEDED]: "rate_limit_exceeded",
    };
    public static FROM_OPENAI_CODE_MAP: { [key: string]: number } = {
        "server_error": GPTAssistantAPIErrorVO.CODE_SERVER_ERROR,
        "rate_limit_exceeded": GPTAssistantAPIErrorVO.CODE_RATE_LIMIT_EXCEEDED,
    };

    public id: number;
    public _type: string = GPTAssistantAPIErrorVO.API_TYPE_ID;

    // One of server_error or rate_limit_exceeded.
    public code: string;

    // A human-readable description of the error.
    public message: string;
}