import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IDashboardGridItem from "../interfaces/IDashboardGridItem";

export default class DashboardViewportPageWidgetVO implements IDistantVOBase, IDashboardGridItem {
    public static API_TYPE_ID: string = "dashboard_viewport_pwidget";

    public id: number;
    public _type: string = DashboardViewportPageWidgetVO.API_TYPE_ID;

    public page_widget_id: number;
    public viewport_id: number;

    /**
     * Est-ce que le widget est activé dans le viewport ?
     */
    public activated: boolean;

    public static: boolean;

    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public i: number;
}