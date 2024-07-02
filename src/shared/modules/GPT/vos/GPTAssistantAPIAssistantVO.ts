
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class GPTAssistantAPIAssistantVO implements IDistantVOBase, IVersionedVO {

    public static API_TYPE_ID: string = "gpt_assistant_assistant";

    public id: number;
    public _type: string = GPTAssistantAPIAssistantVO.API_TYPE_ID;

    public gpt_assistant_id: string;

    public nom: string;
    public description: string;

    // The Unix timestamp(in seconds) for when the assistant was created.
    public created_at: number;

    // ID of the model to use.You can use the List models API to see all of your available models, or see our Model overview for descriptions of them.
    public model: string;

    // The system instructions that the assistant uses.The maximum length is 32768 characters.
    public instructions: string;

    // The list of tools enabled on the assistant.There can be a maximum of 128 tools per assistant.Tools can be of types code_interpreter, retrieval, or function.
    public tools: Array<unknown>;

    // The list of file IDs attached to the assistant.There can be a maximum of 20 files attached to the assistant.Files are ordered by their creation date in ascending order.
    public file_ids: Array<unknown>;

    // Set of 16 key - value pairs that can be attached to an object.This can be useful for storing additional information about the object in a structured format.Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
    public metadata: unknown;

    // IVersionedVO
    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}