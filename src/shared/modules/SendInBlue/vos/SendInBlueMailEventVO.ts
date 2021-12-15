import IDistantVOBase from '../../IDistantVOBase';

export default class SendInBlueMailEventVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "sendinblue_mailevent";

    public id: number;
    public _type: string = SendInBlueMailEventVO.API_TYPE_ID;

    public event: string;
    public email: string;
    public date: number;
    public replyto_name: string;
    public messageId: string;
    public reason: string;
    public subject: string;
    public tag: string;
    public sending_ip: string;
    public ts_epoch: number;
}