
export default class UserVO {
    public static API_TYPE_ID: string = "user";

    public static createNew(
        name: string,
        email: string,
        phone: string,
        password: string,
        lang_id: number
    ): UserVO {
        let user: UserVO = new UserVO();

        user.name = name;
        user.email = email;
        user.phone = phone;
        user.password = password;
        user.lang_id = lang_id;

        return user;
    }

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
