
import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIVectorStoreFileBatchVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_vector_store_file_batch";

    // in_progress, completed, cancelled or failed.
    public static STATUS_LABELS: string[] = [
        'GPTAssistantAPIVectorStoreFileBatchVO.STATUS_IN_PROGRESS',
        'GPTAssistantAPIVectorStoreFileBatchVO.STATUS_COMPLETED',
        'GPTAssistantAPIVectorStoreFileBatchVO.STATUS_CANCELLED',
        'GPTAssistantAPIVectorStoreFileBatchVO.STATUS_FAILED',
    ];
    public static STATUS_IN_PROGRESS: number = 0;
    public static STATUS_COMPLETED: number = 1;
    public static STATUS_CANCELLED: number = 2;
    public static STATUS_FAILED: number = 3;
    public static TO_OPENAI_STATUS_MAP: { [key: number]: string } = {
        [GPTAssistantAPIVectorStoreFileBatchVO.STATUS_IN_PROGRESS]: "in_progress",
        [GPTAssistantAPIVectorStoreFileBatchVO.STATUS_COMPLETED]: "completed",
        [GPTAssistantAPIVectorStoreFileBatchVO.STATUS_CANCELLED]: "cancelled",
        [GPTAssistantAPIVectorStoreFileBatchVO.STATUS_FAILED]: "failed",
    };
    public static FROM_OPENAI_STATUS_MAP: { [key: string]: number } = {
        "in_progress": GPTAssistantAPIVectorStoreFileBatchVO.STATUS_IN_PROGRESS,
        "completed": GPTAssistantAPIVectorStoreFileBatchVO.STATUS_COMPLETED,
        "cancelled": GPTAssistantAPIVectorStoreFileBatchVO.STATUS_CANCELLED,
        "failed": GPTAssistantAPIVectorStoreFileBatchVO.STATUS_FAILED,
    };

    public id: number;
    public _type: string = GPTAssistantAPIVectorStoreFileBatchVO.API_TYPE_ID;

    // The identifier, which can be referenced in API endpoints.
    public gpt_id: string;

    // The Unix timestamp(in seconds) for when the vector store files batch was created.
    public created_at: number;

    // The ID of the vector store that the File is attached to.
    public vector_store_gpt_id: string;
    public vector_store_id: number;

    // Les gpt_file_id des fichiers de ce batch => nécessaires pour la création sur OpenAI mais impossible à mettre à jour, et pas renvoyés par OpenAI...
    public gpt_file_ids: string[];
    public file_id_ranges: NumRange[];

    /**
     * The status of the vector store files batch, which can be either in_progress, completed, cancelled or failed.
     * Enum in OSWedev, à traduire pour OpenAI
     */

    public status: number;

    // The number of files that are currently being processed.
    public file_counts_in_progress: number;

    // The number of files that have been successfully processed.
    public file_counts_completed: number;

    // The number of files that have failed to process.
    public file_counts_failed: number;

    // The number of files that were cancelled.
    public file_counts_cancelled: number;

    // The total number of files.
    public file_counts_total: number;
}