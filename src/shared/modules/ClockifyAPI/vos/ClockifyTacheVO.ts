export default class ClockifyTacheVO {
    public static API_TYPE_ID: string = "clockify_tache";

    public static createNew(
        clockify_id: string,
        projet_id: number,
        name: string,
        status: string
    ): ClockifyTacheVO {
        const tache: ClockifyTacheVO = new ClockifyTacheVO();

        tache.clockify_id = clockify_id;
        tache.projet_id = projet_id;
        tache.name = name;
        tache.status = status;

        return tache;
    }

    public id: number;
    public _type: string = ClockifyTacheVO.API_TYPE_ID;

    public clockify_id: string;
    public projet_id: number;
    public name: string;
    public status: string;
}
