import IDistantVOBase from '../../IDistantVOBase';

export default class SendInBlueVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "sendinblue";


    public static ACCOUNT_API: number = 0;
    public static ACCOUNT_API_NAME: string = 'sendinblue.account.api';
    public static ACCOUNT_PARTNER: number = 1;
    public static ACCOUNT_PARTNER_NAME: string = 'sendinblue.account.partner';
    public static ACCOUNT_TYPE: { [account_id: number]: string } = {
        [SendInBlueVO.ACCOUNT_API]: SendInBlueVO.ACCOUNT_API_NAME,
        [SendInBlueVO.ACCOUNT_PARTNER]: SendInBlueVO.ACCOUNT_PARTNER_NAME,
    };

    public id: number;
    public _type: string = SendInBlueVO.API_TYPE_ID;

    public api_key: string;
    public account: number;
}