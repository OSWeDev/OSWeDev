import ObjectHandler from "../../../tools/ObjectHandler";
import AbstractVO from "../../VO/abstract/AbstractVO";
import IWidgetFilterDependancy from "../interfaces/IWidgetFilterDependancy";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import VOFieldRefVO from "./VOFieldRefVO";

/**
 * MonthFilterWidgetOptionsVO
 */
export default class MonthFilterWidgetOptionsVO extends AbstractVO implements IWidgetFilterDependancy {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "MonthFilterWidgetOptions.vo_field_ref.placeholder.";


    public constructor(
        public is_vo_field_ref?: boolean,
        public vo_field_ref?: VOFieldRefVO,
        public custom_filter_name?: string,
        public month_relative_mode?: boolean,
        public min_month?: number,
        public max_month?: number,
        public auto_select_month?: boolean,
        public auto_select_month_relative_mode?: boolean,
        public auto_select_month_min?: number,
        public auto_select_month_max?: number,
        public is_relative_to_other_filter?: boolean,
        public relative_to_other_filter_id?: number,
        public hide_filter?: boolean,
        public can_select_all?: boolean,
        public is_month_cumulable?: boolean,
        public is_month_cumulated_selected?: boolean,
        public is_all_months_selected?: boolean,
        public can_ytd?: boolean,
        public ytd_option_m_minus_x?: number,
    ) {
        super();
    }


    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        const res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        const options: MonthFilterWidgetOptionsVO = (page_widget && page_widget.json_options) ? ObjectHandler.try_get_json(page_widget.json_options) : null;
        if ((!options) || (!options.vo_field_ref)) {
            return res;
        }

        if (!options.is_vo_field_ref) {
            return res;
        }

        if ((!options.vo_field_ref.api_type_id) || (!options.vo_field_ref.field_id)) {
            return res;
        }

        if (!res[options.vo_field_ref.api_type_id]) {
            res[options.vo_field_ref.api_type_id] = {};
        }

        res[options.vo_field_ref.api_type_id][options.vo_field_ref.field_id] = true;

        return res;
    }
}