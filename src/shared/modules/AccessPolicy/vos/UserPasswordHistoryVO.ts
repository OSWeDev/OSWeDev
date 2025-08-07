import IDistantVOBase from '../../IDistantVOBase';

export default class UserPasswordHistoryVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "user_password_history";

    public id: number;
    public _type: string = UserPasswordHistoryVO.API_TYPE_ID;

    public user_id: number;
    public password_hash: string;
    public created_date: number;
    public is_current: boolean;

    public constructor() {
        this.is_current = false;
    }
}
