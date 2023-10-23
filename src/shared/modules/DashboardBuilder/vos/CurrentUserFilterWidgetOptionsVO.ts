import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VOFieldRefVO from "./VOFieldRefVO";

/**
 * CurrentUserFilterWidgetOptionsVO
 */
export default class CurrentUserFilterWidgetOptionsVO extends AbstractVO {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "CurrentUserFilterWidgetOptions.vo_field_ref.placeholder.";
    public static VO_FIELD_REF_ADVANCED_MODE_PLACEHOLDER_CODE_PREFIX: string = "CurrentUserFilterWidgetOptions.vo_field_ref.advanced_mode_placeholder.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: CurrentUserFilterWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) : null;
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

        return res;
    }

    public constructor(
        public vo_field_ref?: VOFieldRefVO,
        public hide_filter?: boolean,
    ) {
        super();
    }

    public get_placeholder_name_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id)) {
            return null;
        }

        return CurrentUserFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX +
            `${page_widget_id}.` +
            `${this.vo_field_ref.api_type_id}.` +
            this.vo_field_ref.field_id;
    }

    public get_advanced_mode_placeholder_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id)) {
            return null;
        }

        return CurrentUserFilterWidgetOptionsVO.VO_FIELD_REF_ADVANCED_MODE_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_placeholder_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                CurrentUserFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
        }

        let advanced_mode_placeholder_code_text: string = this.get_advanced_mode_placeholder_code_text(page_widget_id);
        if (advanced_mode_placeholder_code_text) {

            res[advanced_mode_placeholder_code_text] =
                CurrentUserFilterWidgetOptionsVO.VO_FIELD_REF_ADVANCED_MODE_PLACEHOLDER_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
        }
        return res;
    }

}