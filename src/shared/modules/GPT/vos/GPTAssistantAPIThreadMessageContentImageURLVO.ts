
import IDistantVOBase from '../../IDistantVOBase';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageContentImageURLVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_content_image_url";

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageContentImageURLVO.API_TYPE_ID;

    // The external URL of the image, must be a supported image types: jpeg, jpg, png, gif, webp.
    public url: string;

    // Specifies the detail level of the image.low uses fewer tokens, you can opt in to high resolution using high.Default value is auto
    public detail: string;
}