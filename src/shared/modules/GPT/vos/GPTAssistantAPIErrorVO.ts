
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIErrorVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_error";

    public static CODE_LABELS: string[] = [
        'GPTAssistantAPIErrorVO.CODE_SERVER_ERROR',
        'GPTAssistantAPIErrorVO.CODE_RATE_LIMIT_EXCEEDED',
        'GPTAssistantAPIErrorVO.CODE_INVALID_PROMPT',
        'GPTAssistantAPIErrorVO.CODE_INTERNAL_ERROR',
        'GPTAssistantAPIErrorVO.CODE_FILE_NOT_FOUND',
        'GPTAssistantAPIErrorVO.CODE_PARSING_ERROR',
        'GPTAssistantAPIErrorVO.CODE_UNHANDLED_MIME_TYPE',
    ];
    public static CODE_SERVER_ERROR: number = 0;
    public static CODE_RATE_LIMIT_EXCEEDED: number = 1;
    public static CODE_INVALID_PROMPT: number = 2;
    public static CODE_INTERNAL_ERROR: number = 3;
    public static CODE_FILE_NOT_FOUND: number = 4;
    public static CODE_PARSING_ERROR: number = 5;
    public static CODE_UNHANDLED_MIME_TYPE: number = 6;
    public static FROM_OPENAI_CODE_MAP: { [key: string]: number } = {
        "server_error": GPTAssistantAPIErrorVO.CODE_SERVER_ERROR,
        "rate_limit_exceeded": GPTAssistantAPIErrorVO.CODE_RATE_LIMIT_EXCEEDED,
        "invalid_prompt": GPTAssistantAPIErrorVO.CODE_INVALID_PROMPT,
        "internal_error": GPTAssistantAPIErrorVO.CODE_INTERNAL_ERROR,
        "file_not_found": GPTAssistantAPIErrorVO.CODE_FILE_NOT_FOUND,
        "parsing_error": GPTAssistantAPIErrorVO.CODE_PARSING_ERROR,
        "unhandled_mime_type": GPTAssistantAPIErrorVO.CODE_UNHANDLED_MIME_TYPE,
    };
    public static TO_OPENAI_CODE_MAP: { [key: number]: string } = {
        [GPTAssistantAPIErrorVO.CODE_SERVER_ERROR]: "server_error",
        [GPTAssistantAPIErrorVO.CODE_RATE_LIMIT_EXCEEDED]: "rate_limit_exceeded",
        [GPTAssistantAPIErrorVO.CODE_INVALID_PROMPT]: "invalid_prompt",
        [GPTAssistantAPIErrorVO.CODE_INTERNAL_ERROR]: "internal_error",
        [GPTAssistantAPIErrorVO.CODE_FILE_NOT_FOUND]: "file_not_found",
        [GPTAssistantAPIErrorVO.CODE_PARSING_ERROR]: "parsing_error",
        [GPTAssistantAPIErrorVO.CODE_UNHANDLED_MIME_TYPE]: "unhandled_mime_type",
    };

    public id: number;
    public _type: string = GPTAssistantAPIErrorVO.API_TYPE_ID;

    /**
     * One of "server_error" | "rate_limit_exceeded" | "invalid_prompt" | "internal_error" | "file_not_found" | "parsing_error" | "unhandled_mime_type"
     * Enum in OSWedev, traduire pour OpenAI
     */
    public code: number;

    // A human-readable description of the error.
    public message: string;
}