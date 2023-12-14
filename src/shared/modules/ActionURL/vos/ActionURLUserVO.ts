
import IDistantVOBase from '../../IDistantVOBase';

export default class ActionURLUserVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "action_url_user";

    public id: number;
    public _type: string = ActionURLUserVO.API_TYPE_ID;

    public action_id: number;
    public user_id: number;
}