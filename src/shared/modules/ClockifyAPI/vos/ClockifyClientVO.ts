export default class ClockifyClientVO {
    public static API_TYPE_ID: string = "clockify_client";

    public static createNew(
        clockify_id: string,
        name: string,
        email: string,
        archived: boolean,
        note: string
    ): ClockifyClientVO {
        let client: ClockifyClientVO = new ClockifyClientVO();

        client.clockify_id = clockify_id;
        client.name = name;
        client.email = email;
        client.archived = archived;
        client.note = note;

        return client;
    }

    public id: number;
    public _type: string = ClockifyClientVO.API_TYPE_ID;

    public clockify_id: string;
    public name: string;
    public email: string;
    public archived: boolean;
    public note: string;
}
