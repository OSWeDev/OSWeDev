import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaThreadFeedbackVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_thread_feedback";

    public id: number;
    public _type: string = OseliaThreadFeedbackVO.API_TYPE_ID;

    public assistant_thread_id: number;
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