import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";

export default class FieldValueFilterWidgetOptions {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "FieldValueFilterWidgetOptions.vo_field_ref.placeholder.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: FieldValueFilterWidgetOptions = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) : null;
        if (!options) {
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
        public vo_field_ref: VOFieldRefVO,
        public can_select_multiple: boolean,
        public max_visible_options: number
    ) { }

    get placeholder_name_code_text(): string {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.id)) {
            return null;
        }
        return FieldValueFilterWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + this.vo_field_ref.id;
    }
}