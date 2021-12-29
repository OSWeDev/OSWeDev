
import IDistantVOBase from '../../IDistantVOBase';

export default class MailEventVO implements IDistantVOBase {

    public static EVENT_NAMES: string[] = [
        'mail_event.EVENT_Initie',
        'mail_event.EVENT_Envoye', 'mail_event.EVENT_Delivre', 'mail_event.EVENT_Ouverture',
        'mail_event.EVENT_Clic', 'mail_event.EVENT_Soft_bounce', 'mail_event.EVENT_Hard_bounce',
        'mail_event.EVENT_Email_invalide', 'mail_event.EVENT_Error', 'mail_event.EVENT_Differe',
        'mail_event.EVENT_Plainte', 'mail_event.EVENT_Desinscrit', 'mail_event.EVENT_Bloque',
    ];
    public static EVENT_Initie: number = 0;
    public static EVENT_Envoye: number = 1;
    public static EVENT_Delivre: number = 2;
    public static EVENT_Ouverture: number = 3;
    public static EVENT_Clic: number = 4;
    public static EVENT_Soft_bounce: number = 5;
    public static EVENT_Hard_bounce: number = 6;
    public static EVENT_Email_invalide: number = 7;
    public static EVENT_Error: number = 8;
    public static EVENT_Differe: number = 9;
    public static EVENT_Plainte: number = 10;
    public static EVENT_Desinscrit: number = 11;
    public static EVENT_Bloque: number = 12;

    public static API_TYPE_ID: string = "mail_event";

    public id: number;
    public _type: string = MailEventVO.API_TYPE_ID;

    public mail_id: number;

    public event: number;
    public event_date: number;
    public reason: string;
}