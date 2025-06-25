
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";

/**
 * @class VarWidgetOptionsVO
 */
export default class VarWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public constructor(
        public var_id?: number,
        public filter_type?: string,
        public filter_custom_field_filters?: { [field_id: string]: string },
        public filter_additional_params?: string,
        public bg_color?: string,
        public fg_color_value?: string,
        public fg_color_text?: string,
    ) {
        super();
    }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }
}