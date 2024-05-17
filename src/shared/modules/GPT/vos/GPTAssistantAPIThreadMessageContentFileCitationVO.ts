
import IDistantVOBase from '../../IDistantVOBase';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageContentFileCitationVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_content_file_citation";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageContentFileCitationVO.API_TYPE_ID;

    // The text in the message content that needs to be replaced.
    public text: string;

    // The ID of the specific File the citation is from.
    public gpt_file_id: string;
    public file_id: number;

    // The specific quote in the file.
    public quote: string;

    public start_index: number;
    public end_index: number;
}