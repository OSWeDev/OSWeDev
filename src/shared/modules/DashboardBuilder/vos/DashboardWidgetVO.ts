import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";

export default class DashboardWidgetVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_widget";

    public id: number;
    public _type: string = DashboardWidgetVO.API_TYPE_ID;

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }
        return DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + this.id;
    }

    public weight: number;

    public widget_component: string;
    public options_component: string;

    public default_width: number;
    public default_height: number;

    /**
     * Needs to be unique for ergonomy and widget retrieval
     */
    public icone_class: string;

    public default_background: string;
}