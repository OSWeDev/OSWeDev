import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";

export default class DashboardPageVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_page";

    public id: number;
    public _type: string = DashboardPageVO.API_TYPE_ID;

    public dashboard_id: number;
    public weight: number;

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }
        return DashboardBuilderController.PAGE_NAME_CODE_PREFIX + this.id;
    }
}