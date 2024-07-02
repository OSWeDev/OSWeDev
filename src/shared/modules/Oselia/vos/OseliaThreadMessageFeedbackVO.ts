import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaThreadMessageFeedbackVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_thread_msg_feedback";

    public id: number;
    public _type: string = OseliaThreadMessageFeedbackVO.API_TYPE_ID;

    // Le message sur lequel on a fait le feedback
    public assistant_thread_message_id: number;
    // l'assistant qui a répondu au prompt via ce message
    public assistant_id: number;
    // le prompt auquel l'assistant a répondu via ce message
    public prompt_id: number;

    public user_id: number;

    public feedback: string;
    public feedback_positive: boolean;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}