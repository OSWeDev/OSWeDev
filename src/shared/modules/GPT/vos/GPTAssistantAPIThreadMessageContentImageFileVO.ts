
import IDistantVOBase from '../../IDistantVOBase';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageContentImageFileVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_content_image_file";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageContentImageFileVO.API_TYPE_ID;

    // The File ID of the image in the message content.Set purpose = "vision" when uploading the File if you need to later display the file content.
    public gpt_file_id: string;
    public file_id: number;

    // Specifies the detail level of the image if specified by the user.low uses fewer tokens, you can opt in to high resolution using high.
    public detail: string;
}