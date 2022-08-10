import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class ValidationFiltersWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ValidationFiltersWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public api_type_id: string,
        public limit: number
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return ValidationFiltersWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}