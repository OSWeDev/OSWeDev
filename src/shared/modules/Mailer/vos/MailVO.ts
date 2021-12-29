
import IDistantVOBase from '../../IDistantVOBase';

export default class MailVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "mail";

    public id: number;
    public _type: string = MailVO.API_TYPE_ID;

    public category_id: number;
    public sent_by_id: number;
    public sent_to_id: number;

    public last_state: number;

    public email: string;
    public message_id: string;
    public send_date: number;
    public last_up_date: number;
}