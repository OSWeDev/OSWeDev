
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIThreadMessageContentImageFileVO from './GPTAssistantAPIThreadMessageContentImageFileVO';
import GPTAssistantAPIThreadMessageContentImageURLVO from './GPTAssistantAPIThreadMessageContentImageURLVO';
import GPTAssistantAPIThreadMessageContentTextVO from './GPTAssistantAPIThreadMessageContentTextVO';

/**
 * @see https://platform.openai.com/docs/api-reference/messages/object
 */
export default class GPTAssistantAPIThreadMessageContentVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_content";

    public static TYPE_LABELS: string[] = [
        'image_file', // type hérité de GPT
        'text', // type hérité de GPT
        'action_url', // type OSWEDEV
        'email', // type OSWEDEV
        'image_url', // type hérité de GPT
    ];
    public static TYPE_IMAGE: number = 0;
    public static TYPE_TEXT: number = 1;
    public static TYPE_ACTION_URL: number = 2;
    public static TYPE_EMAIL: number = 3;
    public static TYPE_IMAGE_URL: number = 4;
    public static FROM_OPENAI_TYPE_MAP: { [key: string]: number } = {
        "image_file": GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE,
        "text": GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT,
        "action_url": GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL,
        "email": GPTAssistantAPIThreadMessageContentVO.TYPE_EMAIL,
        "image_url": GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE_URL,
    };
    public static TO_OPENAI_TYPE_MAP: { [key: number]: string } = {
        [GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE]: "image_file",
        [GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT]: "text",
        [GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL]: "action_url",
        [GPTAssistantAPIThreadMessageContentVO.TYPE_EMAIL]: "email",
        [GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE_URL]: "image_url",
    };

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID;

    public thread_message_id: number;
    public gpt_thread_message_id: string;

    // Type de contenu GPT : texte
    public content_type_text: GPTAssistantAPIThreadMessageContentTextVO;
    // Type de contenu GPT : fichier image
    public content_type_image_file: GPTAssistantAPIThreadMessageContentImageFileVO;
    // Type de contenu GPT : URL d'image
    public content_type_image_url: GPTAssistantAPIThreadMessageContentImageURLVO;

    // Dans le cas d'une action, l'url de l'action
    public content_type_action_url_id: number;

    // Dans le cas d'un email, le lien vers le mail
    public content_type_email_id: number;

    public weight: number;
    public type: number;
}