
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_file";

    public static PURPOSE_LABELS: string[] = [
        'fine-tune',
        'fine-tune-results',
        'assistants',
        'assistants_output'
    ];
    public static PURPOSE_FINE_TUNE: number = 0;
    public static PURPOSE_FINE_TUNE_RESULTS: number = 1;
    public static PURPOSE_ASSISTANTS: number = 2;
    public static PURPOSE_ASSISTANTS_OUTPUT: number = 3;

    public static STATUS_LABELS: string[] = [
        'uploaded',
        'processed',
        'error'
    ];
    public static STATUS_UPLOADED: number = 0;
    public static STATUS_PROCESSED: number = 1;
    public static STATUS_ERROR: number = 2;

    public id: number;
    public _type: string = GPTAssistantAPIFileVO.API_TYPE_ID;

    public file_id: number;

    public gpt_file_id: string;
    public purpose: number;
    public status: number;
    public filename: string;
    public created_at: number;
    public bytes: number;
}