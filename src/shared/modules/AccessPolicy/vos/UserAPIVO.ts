
import IDistantVOBase from '../../IDistantVOBase';

export default class UserAPIVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "userapi";

    public static createNew(
        api_key: string,
        user_id: number,
    ): UserAPIVO {
        let user: UserAPIVO = new UserAPIVO();

        user.api_key = api_key;
        user.user_id = user_id;

        return user;
    }

    public id: number;
    public _type: string = UserAPIVO.API_TYPE_ID;

    public name: string;
    public api_key: string;
    public user_id: number;
}
