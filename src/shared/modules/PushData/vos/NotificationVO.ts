import IDistantVOBase from '../../IDistantVOBase';
import ConversionHandler from '../../../tools/ConversionHandler';

export default class NotificationVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "notification";

    public static TYPE_NAMES: string[] = ['NOTIF_SIMPLE', 'TYPE_NOTIF_DAO', 'TYPE_NOTIF_HOOK'];
    public static TYPE_NOTIF_SIMPLE: number = 0;
    public static TYPE_NOTIF_DAO: number = 1;
    public static TYPE_NOTIF_HOOK: number = 2;

    public static SIMPLE_SUCCESS: number = 0;
    public static SIMPLE_INFO: number = 10;
    public static SIMPLE_WARN: number = 20;
    public static SIMPLE_ERROR: number = 30;


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
}