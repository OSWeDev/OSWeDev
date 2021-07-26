import IDistantVOBase from "../../IDistantVOBase";

export default class PerfMonLineVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "perfmon_line";

    public id: number;
    public _type: string = PerfMonLineVO.API_TYPE_ID;

    public uid: number;
    public start_time: number;
    public end_time: number;
    public line_type_id: number;
    public user_id: number;
    public client_tab_id: string;
    public is_server: boolean;
    public parent_id: number;
}