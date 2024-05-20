
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIErrorVO from './GPTAssistantAPIErrorVO';

export default class GPTAssistantAPIVectorStoreFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_vector_store_file";

    // in_progress, completed, cancelled, or failed
    public static STATUS_LABELS: string[] = [
        'GPTAssistantAPIVectorStoreFileVO.STATUS_IN_PROGRESS',
        'GPTAssistantAPIVectorStoreFileVO.STATUS_COMPLETED',
        'GPTAssistantAPIVectorStoreFileVO.STATUS_CANCELLED',
        'GPTAssistantAPIVectorStoreFileVO.STATUS_FAILED',
    ];
    public static STATUS_IN_PROGRESS: number = 0;
    public static STATUS_COMPLETED: number = 1;
    public static STATUS_CANCELLED: number = 2;
    public static STATUS_FAILED: number = 3;
    public static TO_OPENAI_STATUS_MAP: { [key: number]: string } = {
        [GPTAssistantAPIVectorStoreFileVO.STATUS_IN_PROGRESS]: "in_progress",
        [GPTAssistantAPIVectorStoreFileVO.STATUS_COMPLETED]: "completed",
        [GPTAssistantAPIVectorStoreFileVO.STATUS_CANCELLED]: "cancelled",
        [GPTAssistantAPIVectorStoreFileVO.STATUS_FAILED]: "failed",
    };
    public static FROM_OPENAI_STATUS_MAP: { [key: string]: number } = {
        "in_progress": GPTAssistantAPIVectorStoreFileVO.STATUS_IN_PROGRESS,
        "completed": GPTAssistantAPIVectorStoreFileVO.STATUS_COMPLETED,
        "cancelled": GPTAssistantAPIVectorStoreFileVO.STATUS_CANCELLED,
        "failed": GPTAssistantAPIVectorStoreFileVO.STATUS_FAILED,
    };

    public id: number;
    public _type: string = GPTAssistantAPIVectorStoreFileVO.API_TYPE_ID;

    public file_id: number;
    public gpt_id: string;

    // The Unix timestamp(in seconds) for when the vector store file was created.
    public created_at: number;

    // The total vector store usage in bytes.Note that this may be different from the original file size.
    public usage_bytes: number;

    // The ID of the vector store that the File is attached to.
    public vector_store_gpt_id: string;
    public vector_store_id: number;

    /**
     * The status of the vector store file, which can be either in_progress, completed, cancelled, or failed.
     * The status completed indicates that the vector store file is ready for use.
     */
    public status: string;

    // The last error associated with this vector store file. Will be null if there are no errors.
    public last_error: GPTAssistantAPIErrorVO;
}