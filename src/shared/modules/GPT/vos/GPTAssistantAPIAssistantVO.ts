
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';
import GPTAssistantAPIToolResourcesVO from './GPTAssistantAPIToolResourcesVO';

/**
 * @see https://platform.openai.com/docs/api-reference/assistants/createAssistant
 */
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

    // Version OSWedev du champs tools, décomposé en code interpréteur, recherche de fichier, et fonctions
    public tools_code_interpreter: boolean;
    // Version OSWedev du champs tools, décomposé en code interpréteur, recherche de fichier, et fonctions
    public tools_file_search: boolean;
    // Version OSWedev du champs tools, décomposé en code interpréteur, recherche de fichier, et fonctions
    public tools_functions: boolean;

    // A set of resources that are used by the assistant's tools. The resources are specific to the type of tool. For example, the code_interpreter tool requires a list of file IDs, while the file_search tool requires a list of vector store IDs.
    public tool_resources: GPTAssistantAPIToolResourcesVO;

    // Set of 16 key - value pairs that can be attached to an object.This can be useful for storing additional information about the object in a structured format.Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
    public metadata: unknown;

    // What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
    public temperature: number;

    /**
     * An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass.So 0.1 means only the tokens comprising the top 10 % probability mass are considered.
     * We generally recommend altering this or temperature but not both.
     */
    public top_p: number;

    /**
     * Specifies the format that the model must output. Compatible with GPT-4o, GPT-4 Turbo, and all GPT-3.5 Turbo models since gpt-3.5-turbo-1106.
     * Setting to { "type": "json_object" } enables JSON mode, which guarantees the message the model generates is valid JSON.
     * Important: when using JSON mode, you must also instruct the model to produce JSON yourself via a system or user message.
     *  Without this, the model may generate an unending stream of whitespace until the generation reaches the token limit,
     *  resulting in a long-running and seemingly "stuck" request. Also note that the message content may be partially cut off
     *  if finish_reason="length", which indicates the generation exceeded max_tokens or the conversation exceeded the max context length.
     */
    public response_format: unknown;

    public archived: boolean;

    // IVersionedVO
    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}