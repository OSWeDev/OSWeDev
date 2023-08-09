
import IDistantVOBase from '../../IDistantVOBase';

export default class NotificationVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "notification";

    public static TYPE_NAMES: string[] = [
        'notification.TYPE_NOTIF_SIMPLE',
        'notification.TYPE_NOTIF_DAO',
        'notification.TYPE_NOTIF_HOOK',
        'notification.TYPE_NOTIF_VARDATA',
        'notification.TYPE_NOTIF_WRAPPER',
        'notification.TYPE_NOTIF_TECH',
        'notification.TYPE_NOTIF_PROMPT',
        'notification.TYPE_NOTIF_REDIRECT',
        'notification.TYPE_NOTIF_APIRESULT'
    ];
    public static TYPE_NOTIF_SIMPLE: number = 0;
    public static TYPE_NOTIF_DAO: number = 1;
    public static TYPE_NOTIF_HOOK: number = 2;
    public static TYPE_NOTIF_VARDATA: number = 3;
    public static TYPE_NOTIF_WRAPPER: number = 4;
    public static TYPE_NOTIF_TECH: number = 5;
    public static TYPE_NOTIF_PROMPT: number = 6;
    public static TYPE_NOTIF_REDIRECT: number = 7;
    public static TYPE_NOTIF_APIRESULT: number = 8;

    public static TECH_DISCONNECT_AND_REDIRECT_HOME: string = "TYPE_NOTIF_TECH_DISCONNECT_AND_REDIRECT_HOME";
    public static TECH_LOGGED_AND_REDIRECT_HOME: string = "TYPE_NOTIF_TECH_LOGGED_AND_REDIRECT_HOME";
    public static TECH_RELOAD: string = "TYPE_NOTIF_TECH_RELOAD";

    public static SIMPLE_NAMES: string[] = ['notification.SIMPLE_SUCCESS', 'notification.SIMPLE_INFO', 'notification.SIMPLE_WARN', 'notification.SIMPLE_ERROR'];
    public static SIMPLE_SUCCESS: number = 0;
    public static SIMPLE_INFO: number = 1;
    public static SIMPLE_WARN: number = 2;
    public static SIMPLE_ERROR: number = 3;

    public static DAO_NAMES: string[] = ['notification.DAO_GET_VO_BY_ID', 'notification.DAO_GET_VOS', 'notification.DAO_REMOVE_ID'];
    public static DAO_GET_VO_BY_ID: number = 0;
    public static DAO_GET_VOS: number = 1;
    public static DAO_REMOVE_ID: number = 2;

    public id: number;
    public _type: string = NotificationVO.API_TYPE_ID;

    public read: boolean;

    public notification_type: number;
    public user_id: number;
    public client_tab_id: string;
    public socket_ids: string[];

    // For Simple Notification
    public simple_notif_type: number;
    public simple_notif_label: string;
    public simple_notif_json_params: string;

    public simple_downloadable_link: string;

    public prompt_uid: number;
    public prompt_result: string;

    // For DAO Notification
    public api_type_id: string;
    public dao_notif_vo_id: number;
    public dao_notif_type: number;

    public auto_read_if_connected: boolean;

    public creation_date: number;
    public read_date: number;

    public vos: string;

    // For Redirection Notification
    public notif_route: string;
    public notif_route_params_name: string[];
    public notif_route_params_values: string[];
}