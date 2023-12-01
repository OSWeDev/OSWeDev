import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import DefaultTranslation from '../../../../../../../shared/modules/Translation/vos/DefaultTranslation';

/**
 * @deprecated use TableWidgetOptionsVO instead
 */
export default class TableWidgetOptions extends TableWidgetOptionsVO {

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

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return TableWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}