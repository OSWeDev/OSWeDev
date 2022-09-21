import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import DataFilterOption from "../../../../../../../shared/modules/DataRender/vos/DataFilterOption";
import TSRange from "../../../../../../../shared/modules/DataRender/vos/TSRange";

export default class FieldValueFilterWidgetOptions {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "FieldValueFilterWidgetOptions.vo_field_ref.placeholder.";
    public static VO_FIELD_REF_ADVANCED_MODE_PLACEHOLDER_CODE_PREFIX: string = "FieldValueFilterWidgetOptions.vo_field_ref.advanced_mode_placeholder.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: FieldValueFilterWidgetOptions = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) : null;
        if ((!options) || (!options.vo_field_ref)) {
            return res;
        }

        if ((!options.vo_field_ref.api_type_id) || (!options.vo_field_ref.field_id)) {
            return res;
        }

        if (!res[options.vo_field_ref.api_type_id]) {
            res[options.vo_field_ref.api_type_id] = {};
        }

        res[options.vo_field_ref.api_type_id][options.vo_field_ref.field_id] = true;

        if (options.vo_field_sort && options.vo_field_sort.api_type_id && options.vo_field_sort.field_id) {
            if (!res[options.vo_field_sort.api_type_id]) {
                res[options.vo_field_sort.api_type_id] = {};
            }

            res[options.vo_field_sort.api_type_id][options.vo_field_sort.field_id] = true;
        }

        if (options.vo_field_ref_lvl2 && options.vo_field_ref_lvl2.api_type_id && options.vo_field_ref_lvl2.field_id) {
            if (!res[options.vo_field_ref_lvl2.api_type_id]) {
                res[options.vo_field_ref_lvl2.api_type_id] = {};
            }

            res[options.vo_field_ref_lvl2.api_type_id][options.vo_field_ref_lvl2.field_id] = true;

            if (options.vo_field_sort_lvl2 && options.vo_field_sort_lvl2.api_type_id && options.vo_field_sort_lvl2.field_id) {
                if (!res[options.vo_field_sort_lvl2.api_type_id]) {
                    res[options.vo_field_sort_lvl2.api_type_id] = {};
                }

                res[options.vo_field_sort_lvl2.api_type_id][options.vo_field_sort_lvl2.field_id] = true;
            }
        }

        if (options.vo_field_ref_multiple && (options.vo_field_ref_multiple.length > 0)) {
            for (let i in options.vo_field_ref_multiple) {
                let field_ref: VOFieldRefVO = options.vo_field_ref_multiple[i];

                if (field_ref.api_type_id && field_ref.field_id) {
                    if (!res[field_ref.api_type_id]) {
                        res[field_ref.api_type_id] = {};
                    }

                    res[field_ref.api_type_id][field_ref.field_id] = true;
                }
            }
        }

        return res;
    }

    public constructor(
        public vo_field_ref: VOFieldRefVO,
        public vo_field_ref_lvl2: VOFieldRefVO,
        public vo_field_sort: VOFieldRefVO,
        public can_select_multiple: boolean,
        public is_checkbox: boolean,
        public max_visible_options: number,
        public show_search_field: boolean,
        public hide_lvl2_if_lvl1_not_selected: boolean,
        public segmentation_type: number,
        public advanced_mode: boolean,
        public default_advanced_string_filter_type: number,
        public hide_btn_switch_advanced: boolean,
        public hide_advanced_string_filter_type: boolean,
        public vo_field_ref_multiple: VOFieldRefVO[],
        public default_filter_opt_values: DataFilterOption[],
        public default_ts_range_values: TSRange,
        public default_boolean_values: number[],
        public hide_filter: boolean,
        public no_inter_filter: boolean,
        public has_other_ref_api_type_id: boolean,
        public other_ref_api_type_id: string,
        public exclude_filter_opt_values: DataFilterOption[],
        public exclude_ts_range_values: TSRange,
        public placeholder_advanced_mode: string,
        public separation_active_filter: boolean,
        public vo_field_sort_lvl2: VOFieldRefVO,
    ) { }

    public get_placeholder_name_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id)) {
            return null;
        }
        return FieldValueFilterWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
    }

    public get_advanced_mode_placeholder_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id)) {
            return null;
        }
        return FieldValueFilterWidgetOptions.VO_FIELD_REF_ADVANCED_MODE_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
    }
}