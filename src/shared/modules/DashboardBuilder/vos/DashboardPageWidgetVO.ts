import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";
import IDashboardGridItem from "../interfaces/IDashboardGridItem";

export default class DashboardPageWidgetVO implements IDistantVOBase, IDashboardGridItem, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_pwidget";

    public id: number;
    public _type: string = DashboardPageWidgetVO.API_TYPE_ID;

    get translatable_name_code_text(): string {
        return DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + this.widget_id;
    }

    public widget_id: number;
    public page_id: number;

    public isDraggable: boolean;
    public isResizable: boolean;
    public static: boolean;
    public minH: number;
    public minW: number;
    public maxH: number;
    public maxW: number;
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public i: number;
    public dragAllowFrom: string;
    public dragIgnoreFrom: string;
    public resizeIgnoreFrom: string;
    public preserveAspectRatio: boolean;

    public weight: number;

    public json_options: string;
}