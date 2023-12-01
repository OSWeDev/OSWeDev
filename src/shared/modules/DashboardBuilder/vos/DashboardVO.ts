import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import DashboardBuilderController from "../DashboardBuilderController";

export default class DashboardVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard";

    public _type: string = DashboardVO.API_TYPE_ID;

    public id: number;

    public weight: number;

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }

        return DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + this.id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}