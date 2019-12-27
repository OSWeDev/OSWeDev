import IDistantVOBase from '../../IDistantVOBase';

export default class SendInBlueVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "sendinblue";

    public id: number;
    public _type: string = SendInBlueVO.API_TYPE_ID;

    public api_key: string;
    public host: string;
    public sender_name: string;
    public sender_email: string;
    public replyto_name: string;
    public replyto_email: string;
    public sender_sms_name: string;
    public default_folder_list: string;
}