
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIVectorStoreVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_vector_store";

    // last_active_at
    public static EXPIRES_AFTER_ANCHOR_LABELS: string[] = [
        'GPTAssistantAPIVectorStoreVO.EXPIRES_AFTER_ANCHOR_LAST_ACTIVE_AT',
    ];
    public static EXPIRES_AFTER_ANCHOR_LAST_ACTIVE_AT: number = 0;
    public static TO_OPENAI_EXPIRES_AFTER_ANCHOR_MAP: { [key: number]: string } = {
        [GPTAssistantAPIVectorStoreVO.EXPIRES_AFTER_ANCHOR_LAST_ACTIVE_AT]: "last_active_at",
    };
    public static FROM_OPENAI_EXPIRES_AFTER_ANCHOR_MAP: { [key: string]: number } = {
        "last_active_at": GPTAssistantAPIVectorStoreVO.EXPIRES_AFTER_ANCHOR_LAST_ACTIVE_AT,
    };

    // expired, in_progress, or completed
    public static STATUS_LABELS: string[] = [
        'GPTAssistantAPIVectorStoreVO.STATUS_EXPIRED',
        'GPTAssistantAPIVectorStoreVO.STATUS_IN_PROGRESS',
        'GPTAssistantAPIVectorStoreVO.STATUS_COMPLETED',
    ];
    public static STATUS_EXPIRED: number = 0;
    public static STATUS_IN_PROGRESS: number = 1;
    public static STATUS_COMPLETED: number = 2;
    public static TO_OPENAI_STATUS_MAP: { [key: number]: string } = {
        [GPTAssistantAPIVectorStoreVO.STATUS_EXPIRED]: "expired",
        [GPTAssistantAPIVectorStoreVO.STATUS_IN_PROGRESS]: "in_progress",
        [GPTAssistantAPIVectorStoreVO.STATUS_COMPLETED]: "completed",
    };
    public static FROM_OPENAI_STATUS_MAP: { [key: string]: number } = {
        "expired": GPTAssistantAPIVectorStoreVO.STATUS_EXPIRED,
        "in_progress": GPTAssistantAPIVectorStoreVO.STATUS_IN_PROGRESS,
        "completed": GPTAssistantAPIVectorStoreVO.STATUS_COMPLETED,
    };

    public id: number;
    public _type: string = GPTAssistantAPIVectorStoreVO.API_TYPE_ID;

    // The identifier, which can be referenced in API endpoints.
    public gpt_id: string;

    // The Unix timestamp(in seconds) for when the vector store was created.
    public created_at: number;

    // The name of the vector store.
    public name: string;

    // The total number of bytes used by the files in the vector store.
    public usage_bytes: number;

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

    /**
     * The status of the vector store, which can be either expired, in_progress, or completed.
     * A status of completed indicates that the vector store is ready for use.
     * Enum in OSWedev, à traduire pour OpenAI
     */
    public status: number;

    /**
     * The expiration policy for a vector store.
     * Anchor timestamp after which the expiration policy applies. Supported anchors: last_active_at.
     * Enum in OSWedev, à traduire pour OpenAI
     */
    public expires_after_anchor: number;

    /**
     * The expiration policy for a vector store.
     * The number of days after the anchor time that the vector store will expire.
     */
    public expires_after_days: number;

    // The Unix timestamp(in seconds) for when the vector store will expire.
    public expires_at: number;

    // The Unix timestamp(in seconds) for when the vector store was last active.
    public last_active_at: number;

    // Set of 16 key - value pairs that can be attached to an object.This can be useful for storing additional information about the object in a structured format.Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
    public metadata: unknown;
}