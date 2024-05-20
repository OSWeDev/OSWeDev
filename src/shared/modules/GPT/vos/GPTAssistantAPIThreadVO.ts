
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIToolResourcesVO from './GPTAssistantAPIToolResourcesVO';

export default class GPTAssistantAPIThreadVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread";

    public id: number;
    public _type: string = GPTAssistantAPIThreadVO.API_TYPE_ID;

    public user_id: number;

    public gpt_thread_id: string;
    public current_default_assistant_id: number;

    /**
     * Un run est en cours sur ce thread
     */
    public oselia_is_running: boolean;

    /**
     * L'assistant qui est en train de répondre
     */
    public current_oselia_assistant_id: number;

    /**
     * Le prompt auquel l'assistant est en train de répondre
     */
    public current_oselia_prompt_id: number;

    // The Unix timestamp (in seconds) for when the thread was created.
    public created_at: number;

    /**
     * A set of resources that are made available to the assistant's tools in this thread.
     * The resources are specific to the type of tool.
     * For example, the code_interpreter tool requires a list of file IDs, while the file_search tool requires a list of vector store IDs.
     */
    public tool_resources: GPTAssistantAPIToolResourcesVO;

    /**
     * Set of 16 key-value pairs that can be attached to an object.
     * This can be useful for storing additional information about the object in a structured format.
     * Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
     */
    public metadata: unknown;

    public archived: boolean;
}