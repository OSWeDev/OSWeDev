import IDistantVOBase from '../../IDistantVOBase';

export default class UserRoleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "userroles";

    public static createNew(
        user_id: number,
        role_id: number
    ): UserRoleVO {
        const user_group: UserRoleVO = new UserRoleVO();

        user_group.user_id = user_id;
        user_group.role_id = role_id;

        return user_group;
    }

    public id: number;
    public _type: string = UserRoleVO.API_TYPE_ID;

    public user_id: number;
    public role_id: number;
}