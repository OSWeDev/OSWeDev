import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class BulkOpsWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "BulkOpsWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        return {};
    }

    public constructor(
        public api_type_id: string,
        public limit: number
    ) { }
}