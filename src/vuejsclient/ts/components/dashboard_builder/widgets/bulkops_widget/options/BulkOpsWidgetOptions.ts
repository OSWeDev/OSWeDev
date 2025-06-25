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

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};


        return res;
    }
}