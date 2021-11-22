import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class ChecklistWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ChecklistWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public page_widget_id: number,
        public limit: number,
        public checklist_id: number,
        public delete_all_button: boolean,
        public create_button: boolean,
        public refresh_button: boolean,
        public export_button: boolean,
    ) { }

    get title_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        return ChecklistWidgetOptions.TITLE_CODE_PREFIX + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}