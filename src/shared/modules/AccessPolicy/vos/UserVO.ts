import ConversionHandler from '../../../tools/ConversionHandler';

export default class UserVO {
    public static API_TYPE_ID: string = "user";

    public id: number;
    public _type: string = UserVO.API_TYPE_ID;

    public name: string;
    public email: string;
    public phone: string;
    public password: string;
    public password_change_date: string;
    public reminded_pwd_1: boolean;
    public reminded_pwd_2: boolean;
    public invalidated: boolean;
    public lang_id: number;
    public recovery_challenge: string;
    public recovery_expiration: number;
}
