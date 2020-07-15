import { Moment } from 'moment';
import IDistantVOBase from '../../IDistantVOBase';

export default class NotificationVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "notification";

    public static TYPE_NAMES: string[] = ['notification.TYPE_NOTIF_SIMPLE', 'notification.TYPE_NOTIF_DAO', 'notification.TYPE_NOTIF_HOOK', 'notification.TYPE_NOTIF_VARDATA', 'notification.TYPE_NOTIF_WRAPPER'];
    public static TYPE_NOTIF_SIMPLE: number = 0;
    public static TYPE_NOTIF_DAO: number = 1;
    public static TYPE_NOTIF_HOOK: number = 2;
    public static TYPE_NOTIF_VARDATA: number = 3;
    public static TYPE_NOTIF_WRAPPER: number = 4;

    public static SIMPLE_NAMES: string[] = ['notification.SIMPLE_SUCCESS', 'notification.SIMPLE_INFO', 'notification.SIMPLE_WARN', 'notification.SIMPLE_ERROR'];
    public static SIMPLE_SUCCESS: number = 0;
    public static SIMPLE_INFO: number = 1;
    public static SIMPLE_WARN: number = 2;
    public static SIMPLE_ERROR: number = 3;

    public static DAO_NAMES: string[] = ['notification.DAO_GET_VO_BY_ID', 'notification.DAO_GET_VOS'];
    public static DAO_GET_VO_BY_ID: number = 0;
    public static DAO_GET_VOS: number = 1;

    public id: number;
    public _type: string = NotificationVO.API_TYPE_ID;

    public read: boolean;

    public notification_type: number;
    public user_id: number;

    // For Simple Notification
    public simple_notif_type: number;
    public simple_notif_label: string;

    // For DAO Notification
    public api_type_id: string;
    public dao_notif_vo_id: number;
    public dao_notif_type: number;

    public auto_read_if_connected: boolean;

    public creation_date: Moment;
    public read_date: Moment;

    public vos: string;
}