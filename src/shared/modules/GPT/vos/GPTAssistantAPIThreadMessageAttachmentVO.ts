
import IDistantVOBase from '../../IDistantVOBase';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageAttachmentVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_attachment";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageAttachmentVO.API_TYPE_ID;

    public file_id: number;

    // The ID of the file to attach to the message.
    public gpt_file_id: string;

    // The tools to add this file to. 'code_interpreter' | 'file_search'
    public add_to_tool_code_interpreter: boolean;
    // The tools to add this file to. 'code_interpreter' | 'file_search'
    public add_to_tool_file_search: boolean;
}