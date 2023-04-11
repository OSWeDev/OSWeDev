
import IDistantVOBase from '../../IDistantVOBase';

export default class FeedbackStateVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "feedback_state";

    public id: number;
    public _type: string = FeedbackStateVO.API_TYPE_ID;

    public name: string;
    public weight: number;
    public is_default_state: number;
}
