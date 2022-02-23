import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";

export default class VOFieldRefVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "vo_field_ref";

    public id: number;
    public _type: string = VOFieldRefVO.API_TYPE_ID;

    public page_widget_id: number;

    public api_type_id: string;
    public field_id: string;

    public weight: number;

    get translatable_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        if (!this.api_type_id) {
            return null;
        }
        if (!this.field_id) {
            return null;
        }

        return DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.page_widget_id + '.' + this.api_type_id + '.' + this.field_id;
    }
}