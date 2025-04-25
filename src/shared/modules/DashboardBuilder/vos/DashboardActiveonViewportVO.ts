import INamedVO from "../../../interfaces/INamedVO";
import IDistantVOBase from "../../IDistantVOBase";
import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * DashboardActiveonViewportVO
 * - Represents a viewport for a dashboard
 * - Viewports are used to define the layout of the dashboard
 */
export default class DashboardActiveonViewportVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_activeon_viewport";

    public _type: string = DashboardActiveonViewportVO.API_TYPE_ID;

    public id: number;

    public active: boolean;

    public dashboard_page_id: number;
    public dashboard_viewport_id: number;
}