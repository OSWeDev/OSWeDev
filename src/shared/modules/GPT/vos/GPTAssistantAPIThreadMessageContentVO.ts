
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIThreadMessageContentVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_thread_msg_content";

    public static TYPE_LABELS: string[] = [
        'image_file', // type hérité de GPT
        'text', // type hérité de GPT
        'action_url', // type OSWEDEV
        'email', // type OSWEDEV
    ];
    public static TYPE_IMAGE: number = 0;
    public static TYPE_TEXT: number = 1;
    public static TYPE_ACTION_URL: number = 2;
    public static TYPE_EMAIL: number = 3;

    public id: number;
    public _type: string = GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID;

    public content_type: number;

    public thread_message_id: number;
    public weight: number;

    // Dans le cas d'une image, le fichier GPT qui contient l'image
    public assistant_file_id: number;

    // Dans le cas d'une action, l'url de l'action
    public action_url_id: number;

    // Dans le cas d'un email, le lien vers le mail
    public email_id: number;

    // Dans le cas d'un texte, le texte
    public value: string;
    public annotations: string[]; // A voir si on veut gérer les retrieval et code_interpreter : https://platform.openai.com/docs/api-reference/messages/object
}