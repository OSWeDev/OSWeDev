import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class BulkOpsWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "BulkOpsWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public page_widget_id: number,
        public api_type_id: string,
        public limit: number
    ) { }

    get title_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        return BulkOpsWidgetOptions.TITLE_CODE_PREFIX + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}