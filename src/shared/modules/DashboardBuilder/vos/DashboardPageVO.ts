import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import DashboardBuilderController from "../DashboardBuilderController";
import IDashboardPageVO from "../interfaces/IDashboardPageVO";

export default class DashboardPageVO implements IDashboardPageVO, IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard_page";

    public _type: string = DashboardPageVO.API_TYPE_ID;

    public id: number;

    public dashboard_id: number;

    public weight: number;

    public hide_navigation: boolean;

    public group_filters: boolean;

    get translatable_group_filters_code_text(): string {

        if (!this.id) {
            return null;
        }

        return DashboardBuilderController.PAGE_NAME_CODE_PREFIX + this.id + ".group_filters" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }

        return DashboardBuilderController.PAGE_NAME_CODE_PREFIX + this.id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}