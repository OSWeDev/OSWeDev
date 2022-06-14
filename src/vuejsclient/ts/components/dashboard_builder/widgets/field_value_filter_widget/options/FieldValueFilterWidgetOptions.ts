import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";

export default class FieldValueFilterWidgetOptions {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "FieldValueFilterWidgetOptions.vo_field_ref.placeholder.";

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
    ) { }

    public get_placeholder_name_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id)) {
            return null;
        }
        return FieldValueFilterWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
    }
}