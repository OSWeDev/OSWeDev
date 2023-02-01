import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import TableColumnDescVO from "../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class TableWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "TableWidgetOptions.title.";
    public static DEFAULT_LIMIT: number = 100;
    public static DEFAULT_LIMIT_SELECTABLE: string = "10,20,50,100";
    public static DEFAULT_NBPAGES_PAGINATION_LIST: number = 5;

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        let res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        let options: TableWidgetOptions = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) : null;
        if (!options) {
            return res;
        }

        for (let i in options.columns) {
            let column = options.columns[i];

            if (column.type == TableColumnDescVO.TYPE_header && column.children.length > 0) {
                for (const key in column.children) {
                    const child = column.children[key];
                    if ((!child.api_type_id) || (!child.field_id)) {
                        continue;
                    }
                    if (!res[child.api_type_id]) {
                        res[child.api_type_id] = {};
                    }
                    res[child.api_type_id][child.field_id] = true;
                }
            }

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
        public is_focus_api_type_id: boolean,
        public limit: number,
        public crud_api_type_id: string,
        public vocus_button: boolean,
        public delete_button: boolean,
        public delete_all_button: boolean,
        public create_button: boolean,
        public update_button: boolean,
        public refresh_button: boolean,
        public export_button: boolean,
        public can_filter_by: boolean,
        public show_pagination_resumee: boolean,
        public show_pagination_slider: boolean,
        public show_pagination_form: boolean,
        public show_limit_selectable: boolean,
        public limit_selectable: string,
        public show_pagination_list: boolean,
        public nbpages_pagination_list: number,
        public has_table_total_footer: boolean,
        public hide_pagination_bottom: boolean,
        public default_export_option: number,
        public has_default_export_option: boolean,
        public use_kanban_by_default_if_exists: boolean,
        public use_for_count: boolean, // Seulement pour enum pour l'instant
    ) { }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return TableWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        let res: { [exportable_code_text: string]: string } = {};

        let placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                TableWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}