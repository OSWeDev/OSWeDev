import INamedVO from "../../../interfaces/INamedVO";
import IDistantVOBase from "../../IDistantVOBase";
import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * DashboardViewportVO
 * - Represents a viewport for a dashboard
 * - Viewports are used to define the layout of the dashboard
 */
export default class DashboardViewportVO extends AbstractVO implements IDistantVOBase, INamedVO {
    public static API_TYPE_ID: string = "dashboard_viewport";

    public _type: string = DashboardViewportVO.API_TYPE_ID;

    public id: number;

    public name: string;

    public screen_min_width: number;
    public is_default: boolean;

}