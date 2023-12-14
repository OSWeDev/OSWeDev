import AdvancedDateFilterOptDescVO from "../../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class AdvancedDateFilterWidgetOptions implements IExportableWidgetOptions {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "AdvancedDateFilterWidgetOptions.vo_field_ref.placeholder.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: AdvancedDateFilterWidgetOptions = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) : null;
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
    ) { }

    public get_placeholder_name_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id) || (!this.is_vo_field_ref)) {
            return null;
        }
        return AdvancedDateFilterWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {

        if ((!this.vo_field_ref) || (!page_widget_id) || (!this.is_vo_field_ref)) {
            return null;
        }

        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_placeholder_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                AdvancedDateFilterWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
        }
        return res;
    }
}