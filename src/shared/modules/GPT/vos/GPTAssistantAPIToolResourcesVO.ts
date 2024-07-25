
import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIToolResourcesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_tool_resources";

    public id: number;
    public _type: string = GPTAssistantAPIToolResourcesVO.API_TYPE_ID;

    // A list of file IDs made available to the `code_interpreter` tool. There can be a maximum of 20 files associated with the tool.
    public code_interpreter_gpt_file_ids: string[];
    public code_interpreter_file_ids_ranges: NumRange[];

    // The ID of the vector store attached to this assistant. There can be a maximum of 1 vector store attached to the assistant/thread.
    public file_search_gpt_vector_store_ids: string[];
    public file_search_vector_store_ids_ranges: NumRange[];
}