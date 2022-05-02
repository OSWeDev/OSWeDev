import { Moment } from "moment";
import IDistantVOBase from "../../IDistantVOBase";


export default class UserSessionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "user_sessions";

    public _type: string = UserSessionVO.API_TYPE_ID;
    public id: number;

    public sid: string;
    public sess: string;
    public expire: Moment;
}
