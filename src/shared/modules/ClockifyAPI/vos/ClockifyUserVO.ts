export default class ClockifyUserVO {
    public static API_TYPE_ID: string = "clockify_user";

    public static createNew(
        clockify_id: string,
        name: string,
        email: string,
        status: string
    ): ClockifyUserVO {
        let user: ClockifyUserVO = new ClockifyUserVO();

        user.clockify_id = clockify_id;
        user.name = name;
        user.email = email;
        user.status = status;

        return user;
    }

    public id: number;
    public _type: string = ClockifyUserVO.API_TYPE_ID;

    public clockify_id: string;
    public name: string;
    public email: string;
    public status: string;
}
