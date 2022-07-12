import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class DashboardGraphVORefVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_graphvoref";
    public id: number;
    public _type: string = DashboardGraphVORefVO.API_TYPE_ID;
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public vo_type: string;
    public dashboard_id: number;
    public targets_to_exclude: string[]; //flèches cibles à exclure.
    public sources_to_exclude: string[]; //flèches sources à exclure.

}