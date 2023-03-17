import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import TableColumnDescVO from "../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO";
import DefaultTranslation from "../../../../../../../shared/modules/Translation/vos/DefaultTranslation";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export interface ITableWidgetOptionsProps {
    columns: TableColumnDescVO[];
    is_focus_api_type_id: boolean;
    limit: number;
    crud_api_type_id: string;
    vocus_button: boolean;
    delete_button: boolean;
    delete_all_button: boolean;
    create_button: boolean;
    update_button: boolean;
    refresh_button: boolean;
    export_button: boolean;
    can_filter_by: boolean;
    show_pagination_resumee: boolean;
    show_pagination_slider: boolean;
    show_pagination_form: boolean;
    show_limit_selectable: boolean;
    limit_selectable: string;
    show_pagination_list: boolean;
    nbpages_pagination_list: number;
    has_table_total_footer: boolean;
    hide_pagination_bottom: boolean;
    default_export_option: number;
    has_default_export_option: boolean;
    use_kanban_by_default_if_exists: boolean;
    use_kanban_column_weight_if_exists: boolean;
    use_for_count: boolean; // Seulement pour enum pour l'instant
    can_export_active_field_filters?: boolean;
    can_export_vars_indicator?: boolean;
}

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
        public columns?: TableColumnDescVO[],
        public is_focus_api_type_id?: boolean,
        public limit?: number,
        public crud_api_type_id?: string,
        public vocus_button?: boolean,
        public delete_button?: boolean,
        public delete_all_button?: boolean,
        public create_button?: boolean,
        public update_button?: boolean,
        public refresh_button?: boolean,
        public export_button?: boolean,
        public can_filter_by?: boolean,
        public show_pagination_resumee?: boolean,
        public show_pagination_slider?: boolean,
        public show_pagination_form?: boolean,
        public show_limit_selectable?: boolean,
        public limit_selectable?: string,
        public show_pagination_list?: boolean,
        public nbpages_pagination_list?: number,
        public has_table_total_footer?: boolean,
        public hide_pagination_bottom?: boolean,
        public default_export_option?: number,
        public has_default_export_option?: boolean,
        public use_kanban_by_default_if_exists?: boolean,
        public use_kanban_column_weight_if_exists?: boolean,
        public use_for_count?: boolean, // Seulement pour enum pour l'instant
        public can_export_active_field_filters?: boolean,
        public can_export_vars_indicator?: boolean,
    ) { }

    /**
     * Fill this TableWidgetOptionsProps with the given properties
     *  - Hydrate from JSON Options
     *
     * @param {ITableWidgetOptionsProps} [props]
     * @returns {VarWidgetOptions}
     */
    public from(props: ITableWidgetOptionsProps): TableWidgetOptions {

        this.columns = props.columns ?? this.columns;
        this.is_focus_api_type_id = props.is_focus_api_type_id ?? this.is_focus_api_type_id;
        this.limit = props.limit ?? this.limit;
        this.crud_api_type_id = props.crud_api_type_id ?? this.crud_api_type_id;
        this.vocus_button = props.vocus_button ?? this.vocus_button;
        this.delete_button = props.delete_button ?? this.delete_button;
        this.delete_all_button = props.delete_all_button ?? this.delete_all_button;
        this.create_button = props.create_button ?? this.create_button;
        this.update_button = props.update_button ?? this.update_button;
        this.refresh_button = props.refresh_button ?? this.refresh_button;
        this.export_button = props.export_button ?? this.export_button;
        this.can_filter_by = props.can_filter_by ?? this.can_filter_by;
        this.show_pagination_resumee = props.show_pagination_resumee ?? this.show_pagination_resumee;
        this.show_pagination_slider = props.show_pagination_slider ?? this.show_pagination_slider;
        this.show_pagination_form = props.show_pagination_form ?? this.show_pagination_form;
        this.show_limit_selectable = props.show_limit_selectable ?? this.show_limit_selectable;
        this.limit_selectable = props.limit_selectable ?? this.limit_selectable;
        this.show_pagination_list = props.show_pagination_list ?? this.show_pagination_list;
        this.nbpages_pagination_list = props.nbpages_pagination_list ?? this.nbpages_pagination_list;
        this.has_table_total_footer = props.has_table_total_footer ?? this.has_table_total_footer;
        this.hide_pagination_bottom = props.hide_pagination_bottom ?? this.hide_pagination_bottom;
        this.default_export_option = props.default_export_option ?? this.default_export_option;
        this.has_default_export_option = props.has_default_export_option ?? this.has_default_export_option;
        this.use_kanban_by_default_if_exists = props.use_kanban_by_default_if_exists ?? this.use_kanban_by_default_if_exists;
        this.use_kanban_column_weight_if_exists = props.use_kanban_column_weight_if_exists ?? this.use_kanban_column_weight_if_exists;
        this.use_for_count = props.use_for_count ?? this.use_for_count; // Seulement pour enum pour l'instant
        this.can_export_active_field_filters = props.can_export_active_field_filters ?? this.can_export_active_field_filters;
        this.can_export_vars_indicator = props.can_export_vars_indicator ?? this.can_export_vars_indicator;

        return this;
    }

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