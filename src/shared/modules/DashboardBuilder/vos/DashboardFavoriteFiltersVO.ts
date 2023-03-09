import DashboardBuilderController from "../DashboardBuilderController";
import IDistantVOBase from "../../IDistantVOBase";

export default class DashboardFavoriteFiltersVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dashboard_p_favorite_filters";

    public id: number;
    public _type: string = DashboardFavoriteFiltersVO.API_TYPE_ID;

    get translatable_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }

        return DashboardBuilderController.WIDGET_NAME_CODE_PREFIX + this.page_widget_id;
    }

    // page id of this favorite list
    public page_id: number;

    //
    public page_widget_id: number;

    public page_filters: string;

    public background: string;
}