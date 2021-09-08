import TableColumnDescVO from "../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";

export default class TableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "TableWidgetOptions.title.";

    public constructor(
        public columns: TableColumnDescVO[],
        public page_widget_id: number,
        public crud_api_type_id: string,
        public vocus_button: boolean,
        public delete_button: boolean,
        public delete_all_button: boolean,
        public create_button: boolean,
        public update_button: boolean,
        public refresh_button: boolean,
        public export_button: boolean,
    ) { }

    get title_name_code_text(): string {

        if (!this.page_widget_id) {
            return null;
        }
        return TableWidgetOptions.TITLE_CODE_PREFIX + this.page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}