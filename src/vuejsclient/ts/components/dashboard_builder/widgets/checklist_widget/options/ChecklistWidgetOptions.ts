import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";

export default class ChecklistWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "ChecklistWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public limit: number,
        public checklist_id: number,
        public delete_all_button: boolean,
        public create_button: boolean,
        public refresh_button: boolean,
        public export_button: boolean,
    ) { }
}