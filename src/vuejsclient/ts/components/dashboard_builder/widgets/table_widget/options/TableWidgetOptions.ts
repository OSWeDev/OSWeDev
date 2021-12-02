import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import TableColumnDescVO from "../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class TableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "TableWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: TableWidgetOptions = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) : null;
        if (!options) {
            return res;
        }

        for (let i in options.columns) {
            let column = options.columns[i];

            if ((!column.api_type_id) || (!column.field_id)) {
                continue;
            }

            if (!res[column.api_type_id]) {
                res[column.api_type_id] = {};
            }

            res[column.api_type_id][column.field_id] = true;
        }

        return res;
    }

    public constructor(
        public columns: TableColumnDescVO[],
        public page_widget_id: number,
        public is_focus_api_type_id: boolean,
        public limit: number,
        public crud_api_type_id: string,
        public vocus_button: boolean,
        public delete_button: boolean,
        public delete_all_button: boolean,
        public create_button: boolean,
        public update_button: boolean,
        public refresh_button: boolean,
        public export_button: boolean
    ) { }

    get title_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        return TableWidgetOptions.TITLE_CODE_PREFIX + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}