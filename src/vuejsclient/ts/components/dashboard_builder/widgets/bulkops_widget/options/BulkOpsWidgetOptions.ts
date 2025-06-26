import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";

export default class BulkOpsWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "BulkOpsWidgetOptions.title.";

    public constructor(
        public api_type_id: string,
        public limit: number
    ) { }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }
}