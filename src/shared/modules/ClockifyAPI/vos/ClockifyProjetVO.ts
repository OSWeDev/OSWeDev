
export default class ClockifyProjetVO {
    public static API_TYPE_ID: string = "clockify_projet";

    public static createNew(
        clockify_id: string,
        client_id: number,
        name: string,
        archived: boolean,
        note: string,
        is_public: boolean
    ): ClockifyProjetVO {
        let projet: ClockifyProjetVO = new ClockifyProjetVO();

        projet.clockify_id = clockify_id;
        projet.client_id = client_id;
        projet.name = name;
        projet.archived = archived;
        projet.note = note;
        projet.is_public = is_public;

        return projet;
    }

    public id: number;
    public _type: string = ClockifyProjetVO.API_TYPE_ID;

    public clockify_id: string;
    public client_id: number;
    public name: string;
    public archived: boolean;
    public note: string;
    public is_public: boolean;
}
