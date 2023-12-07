
export default class ClockifyTimeEntryVO {
    public static API_TYPE_ID: string = "clockify_time_entry";

    public static createNew(
        clockify_id: string,
        description: string,
        projet_id: number,
        tache_id: number,
        user_id: number,
        start_time: number,
        end_time: number
    ): ClockifyTimeEntryVO {
        let time_entry: ClockifyTimeEntryVO = new ClockifyTimeEntryVO();

        time_entry.clockify_id = clockify_id;
        time_entry.description = description;
        time_entry.projet_id = projet_id;
        time_entry.tache_id = tache_id;
        time_entry.user_id = user_id;
        time_entry.start_time = start_time;
        time_entry.end_time = end_time;

        return time_entry;
    }

    public id: number;
    public _type: string = ClockifyTimeEntryVO.API_TYPE_ID;

    public clockify_id: string;
    public description: string;
    public projet_id: number;
    public tache_id: number;
    public user_id: number;
    public start_time: number;
    public end_time: number;
}
