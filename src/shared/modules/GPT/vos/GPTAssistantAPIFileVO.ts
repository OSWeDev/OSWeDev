
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_file";

    public static PURPOSE_LABELS: string[] = [
        'GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE',
        'GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE_RESULTS',
        'GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS',
        'GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS_OUTPUT',
        'GPTAssistantAPIFileVO.PURPOSE_BATCH',
        'GPTAssistantAPIFileVO.PURPOSE_BATCH_OUTPUT',
        'GPTAssistantAPIFileVO.PURPOSE_VISION',
    ];
    public static PURPOSE_FINE_TUNE: number = 0;
    public static PURPOSE_FINE_TUNE_RESULTS: number = 1;
    public static PURPOSE_ASSISTANTS: number = 2;
    public static PURPOSE_ASSISTANTS_OUTPUT: number = 3;
    public static PURPOSE_BATCH: number = 4;
    public static PURPOSE_BATCH_OUTPUT: number = 5;
    public static PURPOSE_VISION: number = 6;
    public static TO_OPENAI_PURPOSE_MAP: { [key: number]: string } = {
        [GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE]: "fine_tune",
        [GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE_RESULTS]: "fine_tune_results",
        [GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS]: "assistants",
        [GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS_OUTPUT]: "assistants_output",
        [GPTAssistantAPIFileVO.PURPOSE_BATCH]: "batch",
        [GPTAssistantAPIFileVO.PURPOSE_BATCH_OUTPUT]: "batch_output",
        [GPTAssistantAPIFileVO.PURPOSE_VISION]: "vision",
    };
    public static FROM_OPENAI_PURPOSE_MAP: { [key: string]: number } = {
        "fine_tune": GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE,
        "fine_tune_results": GPTAssistantAPIFileVO.PURPOSE_FINE_TUNE_RESULTS,
        "assistants": GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS,
        "assistants_output": GPTAssistantAPIFileVO.PURPOSE_ASSISTANTS_OUTPUT,
        "batch": GPTAssistantAPIFileVO.PURPOSE_BATCH,
        "batch_output": GPTAssistantAPIFileVO.PURPOSE_BATCH_OUTPUT,
        "vision": GPTAssistantAPIFileVO.PURPOSE_VISION,
    };

    public id: number;
    public _type: string = GPTAssistantAPIFileVO.API_TYPE_ID;

    public file_id: number;

    public gpt_file_id: string;
    public purpose: number;
    public filename: string;
    public created_at: number;
    public bytes: number;

    public archived: boolean;
}