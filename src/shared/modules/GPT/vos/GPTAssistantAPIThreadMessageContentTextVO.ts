
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIThreadMessageContentFileCitationVO from './GPTAssistantAPIThreadMessageContentFileCitationVO';
import GPTAssistantAPIThreadMessageContentFilePathVO from './GPTAssistantAPIThreadMessageContentFilePathVO';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageContentTextVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_content_text";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageContentTextVO.API_TYPE_ID;

    // The data that makes up the text.
    public value: string;

    public annotations: Array<GPTAssistantAPIThreadMessageContentFileCitationVO | GPTAssistantAPIThreadMessageContentFilePathVO>;
}