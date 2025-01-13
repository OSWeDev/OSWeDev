import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class DashboardGraphColorPaletteVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_graphcolorpalettevo";
    public id: number;
    public _type: string = DashboardGraphColorPaletteVO.API_TYPE_ID;
    public name: string;
    public colors: string[];
}