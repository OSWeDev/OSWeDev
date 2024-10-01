import IDistantVOBase from "../../IDistantVOBase";
import IDashboardGridItem from "../interfaces/IDashboardGridItem";

/**
 * @class DashboardWidgetPositionVO
 *  - DashboardWidgetPositionVO resprésente la position d'un widget dans un dashboard selon un layout donné
 */
export default class DashboardWidgetPositionVO implements IDistantVOBase, IDashboardGridItem {
    public static API_TYPE_ID: string = "dashboard_widget_position";

    public id: number;
    public _type: string = DashboardWidgetPositionVO.API_TYPE_ID;

    public x: number;
    public y: number;
    public w: number;
    public h: number;

    public show_widget_on_viewport: boolean;

    public dashboard_page_widget_id: number;
    public dashboard_viewport_id: number;

    public i: number;
    public static: boolean;

    public widget_id: number;
}