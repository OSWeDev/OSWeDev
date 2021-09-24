import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class VarWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public var_id: number,
        public page_widget_id: number,
        public filter_type: string,
        public filter_custom_field_filters: { [field_id: string]: string },
        public filter_additional_params: string
    ) { }

    get title_name_code_text(): string {

        if ((!this.page_widget_id) || (!this.var_id)) {
            return null;
        }
        return VarWidgetOptions.TITLE_CODE_PREFIX + this.var_id + '.' + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}