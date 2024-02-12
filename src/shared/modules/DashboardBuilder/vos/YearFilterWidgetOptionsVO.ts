import ObjectHandler from "../../../tools/ObjectHandler";
import ContextFilterVO from "../../ContextFilter/vos/ContextFilterVO";
import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import VOFieldRefVO from "./VOFieldRefVO";

/**
 * YearFilterWidgetOptionsVO
 */
export default class YearFilterWidgetOptionsVO {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "YearFilterWidgetOptions.vo_field_ref.placeholder.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: YearFilterWidgetOptionsVO = (page_widget && page_widget.json_options) ? ObjectHandler.try_get_json(page_widget.json_options) : null;
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
        public is_vo_field_ref?: boolean,
        public vo_field_ref?: VOFieldRefVO,
        public custom_filter_name?: string,
        public year_relative_mode?: boolean,
        public min_year?: number,
        public max_year?: number,
        public auto_select_year?: boolean,
        public auto_select_year_relative_mode?: boolean,
        public auto_select_year_min?: number,
        public auto_select_year_max?: number,
        public is_relative_to_other_filter?: boolean,
        public relative_to_other_filter_id?: number,
        public hide_filter?: boolean,
        public can_select_all?: boolean,
        public is_all_years_selected?: boolean,
    ) { }

    /**
     * Hydrate from the given properties
     *
     * @param props {YearFilterWidgetOptionsVO}
     * @returns {YearFilterWidgetOptionsVO}
     */
    public from(props: Partial<YearFilterWidgetOptionsVO>): YearFilterWidgetOptionsVO {

        Object.assign(this, props);

        return this;
    }

    public get_placeholder_name_code_text(page_widget_id: number): string {

        const vo_field_ref = this.is_vo_field_ref ? this.vo_field_ref : {
            api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE,
            field_id: this.custom_filter_name,
        };

        if ((!vo_field_ref) || (!page_widget_id) || (!this.is_vo_field_ref)) {
            return null;
        }

        return YearFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + vo_field_ref.api_type_id + '.' + vo_field_ref.field_id;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {

        if ((!this.vo_field_ref) || (!page_widget_id) || (!this.is_vo_field_ref)) {
            return null;
        }

        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_placeholder_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                YearFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
        }
        return res;
    }
}