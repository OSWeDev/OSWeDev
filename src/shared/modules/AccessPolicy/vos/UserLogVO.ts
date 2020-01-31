import { Moment } from 'moment';

export default class UserLogVO {
    public static API_TYPE_ID: string = "userlog";

    public static LOG_TYPE_LOGIN: number = 0;
    public static LOG_TYPE_LOGOUT: number = 1;
    public static LOG_TYPE_CSRF_REQUEST: number = 2;
    public static LOG_TYPE_LABELS: string[] = ['userlog.log_type.login', 'userlog.log_type.logout', 'userlog.log_type.csrf_request'];

    public id: number;
    public _type: string = UserLogVO.API_TYPE_ID;

    public user_id: number;
    public log_type: number;
    public log_time: Moment;

    public impersonated: boolean;

    public referer: string;

    public comment: string;
    public data: string;
}
