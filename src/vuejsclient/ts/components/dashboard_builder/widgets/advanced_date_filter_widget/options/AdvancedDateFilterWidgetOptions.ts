import IWidgetFilterDependancy from "../../../../../../../shared/modules/DashboardBuilder/interfaces/IWidgetFilterDependancy";
import AdvancedDateFilterOptDescVO from "../../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import ObjectHandler from "../../../../../../../shared/tools/ObjectHandler";

export default class AdvancedDateFilterWidgetOptions implements IWidgetFilterDependancy {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "AdvancedDateFilterWidgetOptions.vo_field_ref.placeholder.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        const res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        const options: AdvancedDateFilterWidgetOptions = (page_widget && page_widget.json_options) ? ObjectHandler.try_get_json(page_widget.json_options) : null;
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

    public constructor(
        public is_vo_field_ref: boolean,
        public vo_field_ref: VOFieldRefVO,
        public custom_filter_name: string,
        public opts: AdvancedDateFilterOptDescVO[],
        public is_checkbox: boolean,
        public default_value: AdvancedDateFilterOptDescVO,
        public hide_opts: boolean,
        public refuse_left_open: boolean,
        public refuse_right_open: boolean,
        public is_relative_to_other_filter: boolean,
        public relative_to_other_filter_id: number,
        public hide_filter: boolean,
        public is_relative_to_today: boolean,
        public auto_select_relative_date_min: number,
        public auto_select_relative_date_max: number,
    ) { }
}