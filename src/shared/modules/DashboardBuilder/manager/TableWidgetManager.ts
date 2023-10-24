import WeightHandler from '../../../tools/WeightHandler';
import ExportContextQueryToXLSXParamVO from '../../DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import FieldValueFilterWidgetOptionsVO from '../vos/FieldValueFilterWidgetOptionsVO';
import TableColumnDescVO from '../vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../vos/TableWidgetOptionsVO';
import ContextFilterVO from '../../ContextFilter/vos/ContextFilterVO';
import DashboardPageWidgetVO from '../vos/DashboardPageWidgetVO';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import ContextQueryVO, { query } from '../../ContextFilter/vos/ContextQueryVO';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import DashboardVO from '../vos/DashboardVO';
import ContextFilterVOManager from '../../ContextFilter/manager/ContextFilterVOManager';
import FieldFiltersVOManager from './FieldFiltersVOManager';
import DatatableField from '../../DAO/vos/datatable/DatatableField';
import VarConfVO from '../../Var/vos/VarConfVO';
import ContextQueryFieldVO from '../../ContextFilter/vos/ContextQueryFieldVO';
import ContextFilterVOHandler from '../../ContextFilter/handler/ContextFilterVOHandler';
import DashboardWidgetVO from '../vos/DashboardWidgetVO';
import CRUDActionsDatatableFieldVO from '../../DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import SelectBoxDatatableFieldVO from '../../DAO/vos/datatable/SelectBoxDatatableFieldVO';
import CRUD from '../../DAO/vos/CRUD';
import VarDatatableFieldVO from '../../DAO/vos/datatable/VarDatatableFieldVO';
import ComponentDatatableFieldVO from '../../DAO/vos/datatable/ComponentDatatableFieldVO';
import ModuleTable from '../../ModuleTable';
import DashboardBuilderBoardManager from './DashboardBuilderBoardManager';
import DashboardPageWidgetVOManager from './DashboardPageWidgetVOManager';
import WidgetOptionsVOManager from './WidgetOptionsVOManager';
import LocaleManager from '../../../tools/LocaleManager';
import ExportVarcolumnConf from '../../DataExport/vos/ExportVarcolumnConf';
import { cloneDeep } from 'lodash';
import VarWidgetManager from './VarWidgetManager';
import IExportOptions from '../../DataExport/interfaces/IExportOptions';
import DashboardPageVO from '../vos/DashboardPageVO';
import SimpleDatatableFieldVO from '../../DAO/vos/datatable/SimpleDatatableFieldVO';
import BulkActionVO from '../vos/BulkActionVO';
import VOFieldRefVOManager from './VOFieldRefVOManager';
import FieldFiltersVOHandler from '../handlers/FieldFiltersVOHandler';
import FieldFiltersVO from '../vos/FieldFiltersVO';
import slug from 'slug';

/**
 * @class TableWidgetManager
 */
export default class TableWidgetManager {

    /**
     * create_exportable_valuetables_xlsx_params
     * - All valuetables on the actual page to be exported
     * - All vars indicator on the actual page to be exported
     *
     * @param {DashboardVO} dashboard
     * @param {DashboardPageWidgetVO} dashboard_page
     * @param {{ [title_name_code: string]: { widget_options: TableWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }} valuetables_widgets_options
     * @param {FieldFiltersVO} active_field_filters
     * @returns {{ [title_name_code: string]: ExportContextQueryToXLSXParamVO }}
     */
    public static async create_exportable_valuetables_xlsx_params(
        dashboard: DashboardVO,
        dashboard_page: DashboardPageVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): Promise<{ [title_name_code: string]: ExportContextQueryToXLSXParamVO }> {

        const res: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = {};

        let export_name: string = 'Export-';

        if (!!dashboard?.translatable_name_code_text) {
            export_name += 'Dashboard-' + LocaleManager.getInstance().t(dashboard.translatable_name_code_text) + '-';
        }

        if (!!dashboard_page?.translatable_name_code_text) {
            export_name += 'Page-' + LocaleManager.getInstance().t(dashboard_page.translatable_name_code_text) + '-';
        }

        export_name = slug(export_name, { lower: false }) + "{#Date}.xlsx";

        const valuetables_widgets_options = await TableWidgetManager.get_valuetables_widgets_options(dashboard_page.id);

        const { api_type_ids, discarded_field_paths } = await DashboardBuilderBoardManager.get_api_type_ids_and_discarded_field_paths(dashboard.id);

        for (const name in valuetables_widgets_options) {

            const {
                dashboard_page_id,
                page_widget_id,
                widget_options,
            } = valuetables_widgets_options[name];

            const widget_options_fields = TableWidgetManager.get_table_fields_by_widget_options(
                dashboard,
                widget_options,
                active_field_filters,
                all_page_widgets_by_id,
                true
            );

            // The actual fields to be exported
            const fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};

            for (let i in widget_options_fields) {
                const field = widget_options_fields[i];
                fields[field.datatable_field_uid] = field;
            }

            res[name] = new ExportContextQueryToXLSXParamVO(
                export_name,
                TableWidgetManager.get_table_context_query_by_widget_options(
                    dashboard,
                    widget_options,
                    active_field_filters,
                    api_type_ids,
                    discarded_field_paths,
                    all_page_widgets_by_id),
                TableWidgetManager.get_exportable_table_columns_by_widget_options(
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                TableWidgetManager.get_table_columns_labels_by_widget_options(
                    widget_options,
                    page_widget_id,
                    active_field_filters,
                    all_page_widgets_by_id),
                TableWidgetManager.get_exportable_table_custom_field_columns_by_widget_options(
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                TableWidgetManager.get_table_columns_by_widget_options(
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id,
                ),
                fields,
                TableWidgetManager.get_table_varcolumn_conf_by_widget_options(
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                active_field_filters,
                TableWidgetManager.get_table_columns_custom_filters_by_widget_options(
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                api_type_ids,
                discarded_field_paths,
                false,
                null,
                null, // get user id
                null,
                TableWidgetManager.get_export_options_by_widget_options(widget_options),
                await VarWidgetManager.get_exportable_vars_indicator(dashboard_page_id),
            );
        }

        return res;
    }

    /**
     * Get Valuetable Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: TableWidgetOptions, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_valuetables_widgets_options(
        dashboard_page_id: number
    ): Promise<
        {
            [title_name_code: string]: { widget_options: TableWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        }
    > {

        const valuetable_page_widgets: {
            [page_widget_id: string]: { widget_options: any, widget_name: string, dashboard_page_id: number, page_widget_id: number }
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name([dashboard_page_id], 'valuetable');

        const res: { [title_name_code: string]: { widget_options: TableWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } } = {};

        for (const key in valuetable_page_widgets) {
            const options = valuetable_page_widgets[key];

            const widget_options = new TableWidgetOptionsVO().from(options.widget_options);
            const name = widget_options.get_title_name_code_text(options.page_widget_id);

            res[name] = {
                dashboard_page_id: options.dashboard_page_id,
                page_widget_id: options.page_widget_id,
                widget_name: options.widget_name,
                widget_options: widget_options
            };
        }

        return res;
    }

    /**
     * Get Table Context Query By Table Widget
     *
     * @param {TableWidgetOptionsVO} [widget_options]
     * @return {ContextQueryVO}
     */
    public static get_table_context_query_by_widget_options(
        dashboard: DashboardVO,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): ContextQueryVO {
        // Get sorted_widgets from dashboard (or sorted_widgets_types)
        const { sorted_widgets } = WidgetOptionsVOManager.getInstance();
        // Get page_widgets (or all_page_widgets from dashboard)
        const { page_widgets } = DashboardPageWidgetVOManager.getInstance();

        const table_fields = TableWidgetManager.get_table_fields_by_widget_options(
            dashboard,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        const limit = (widget_options?.limit == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT : widget_options.limit;
        const pagination_offset = 0;

        let crud_api_type_id = widget_options.crud_api_type_id ? widget_options.crud_api_type_id : null;
        if (!crud_api_type_id) {
            for (const column_id in table_fields) {
                const field = table_fields[column_id];

                if (!field.vo_type_id) {
                    continue;
                }

                crud_api_type_id = field.vo_type_id;
                break;
            }
        }

        if (!crud_api_type_id) {
            ConsoleHandler.error('Pas de crud_api_type_id pour le table widget impossible de générer la requête');
            return;
        }

        const context_filter = ContextFilterVOManager.get_context_filters_from_active_field_filters(
            FieldFiltersVOManager.clean_field_filters_for_request(active_field_filters)
        );

        const context_query: ContextQueryVO = query(crud_api_type_id)
            .set_limit(limit, pagination_offset)
            .using(api_type_ids)
            .add_filters(context_filter);

        //On évite les jointures supprimées.
        for (const vo_type in discarded_field_paths) {
            const discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (const field_id in discarded_field_paths_vo_type) {
                context_query.set_discarded_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        let columns_by_field_id = TableWidgetManager.get_table_columns_by_field_id_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const field_id in columns_by_field_id) {
            const field = columns_by_field_id[field_id];
            if (field.type == TableColumnDescVO.TYPE_header) {
                for (const key in field.children) {
                    const child = field.children[key];
                    columns_by_field_id[child.datatable_field_uid] = child;
                }
            }
        }

        for (const column_id in table_fields) {
            const field = table_fields[column_id];

            if ((field.type == DatatableField.VAR_FIELD_TYPE) ||
                (field.type == DatatableField.COMPONENT_FIELD_TYPE) ||
                (field.type == DatatableField.SELECT_BOX_FIELD_TYPE)) {

                continue;
            }

            const column: TableColumnDescVO = columns_by_field_id[field.datatable_field_uid];

            let aggregator: number = VarConfVO.NO_AGGREGATOR;

            if (column) {
                if (column.many_to_many_aggregate) {
                    if (column.is_nullable) {
                        aggregator = VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR_DISTINCT;
                    } else {
                        aggregator = VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT;
                    }
                } else if (column.is_nullable) {
                    aggregator = VarConfVO.IS_NULLABLE_AGGREGATOR;
                }
            }

            context_query.add_fields([
                new ContextQueryFieldVO(
                    field.vo_type_id,
                    field.module_table_field_id,
                    field.datatable_field_uid,
                    aggregator
                )
            ]);
        }

        // Si on a des widgets, on va ajouter les exclude values si y'en a
        for (const i in page_widgets) {
            const page_widget: DashboardPageWidgetVO = page_widgets[i];
            const widget_type: DashboardWidgetVO = sorted_widgets.find(
                (wtype) => wtype.id == page_widget.widget_id
            );

            if (!widget_type?.is_filter) {
                continue;
            }

            let options: FieldValueFilterWidgetOptionsVO = null;
            try {
                if (!!page_widget.json_options) {
                    options = JSON.parse(page_widget.json_options);
                }
            } catch (error) {
                ConsoleHandler.error(error);
                continue;
            }

            if (!options) {
                continue;
            }

            context_query.filters = ContextFilterVOHandler.add_context_filters_exclude_values(
                options.exclude_filter_opt_values,
                options.vo_field_ref,
                context_query.filters,
                true,
            );
        }

        context_query.query_distinct = true;

        return context_query;
    }

    /**
     * Get Table Columns By Widget Options
     *
     * @param {TableWidgetOptionsVO} [widget_options]
     * @returns {TableColumnDescVO[]}
     */
    public static get_table_columns_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO },
        from_default: boolean = false
    ): TableColumnDescVO[] {

        // We should not modify the widget_options
        widget_options = cloneDeep(widget_options);

        if (!(widget_options?.columns?.length > 0)) {
            return null;
        }

        const table_columns: TableColumnDescVO[] = [];

        for (const i in widget_options.columns) {

            const column = widget_options.columns[i];

            if (column.readonly == null) {
                column.readonly = true;
            }

            if (column.column_width == null) {
                column.column_width = 0;
            }
            // if (column.is_sticky) {
            //     this.sticky_left_by_col_id[column.id] = sticky_left;
            //     sticky_left += parseInt(column.column_width.toString());
            //     this.has_sticky_cols = true;
            //     this.last_sticky_col_id = column.id;
            // }

            // TODO: Check by access rights
            // if (column.filter_by_access && !this.filter_by_access_cache[column.filter_by_access]) {
            //     continue;
            // }

            if (from_default) {
                table_columns.push(new TableColumnDescVO().from(column));
                continue;
            }

            if (column.show_if_any_filter_active?.length > 0) {

                let activated = false;

                for (const j in column.show_if_any_filter_active) {
                    const page_filter_id = column.show_if_any_filter_active[j];
                    const page_widget = all_page_widgets_by_id[page_filter_id];

                    if (!page_widget) {
                        column.show_if_any_filter_active = [];
                        continue;
                    }

                    const page_widget_options = JSON.parse(page_widget.json_options);

                    const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                        page_widget_options,
                    );

                    const is_active_field_filters_empty = FieldFiltersVOHandler.is_field_filters_empty(
                        vo_field_ref,
                        active_field_filters
                    );

                    if (is_active_field_filters_empty) {
                        continue;
                    }

                    activated = true;
                }

                if (!activated) {
                    continue;
                }
            }

            table_columns.push(new TableColumnDescVO().from(column));
        }

        WeightHandler.getInstance().sortByWeight(table_columns);

        // vue que je ne peut pas effacer un element en garentissant
        // que j effacer le bonne element j'ajoute dans un nouveau
        // tableau pour l'affichage final dans le dashboardboardbuilder
        for (const u in table_columns) {
            const column = table_columns[u];
            const final_res = [];
            if (column?.type == TableColumnDescVO.TYPE_header || column.children.length > 0) {
                // pour mettre a plat les colonne pour l affichage
                for (const r in column.children) {
                    let children = column.children[r];
                    let index = column.children.indexOf(children);
                    // column.children.push(Object.assign(new TableColumnDescVO(), children));
                    final_res.push(new TableColumnDescVO().from(children));
                    // res.push(Object.assign(new TableColumnDescVO(), children));
                    // column.children.splice(index, 1);
                }
                column.children = final_res;
            }
            // else {
            //     final_res.push(Object.assign(new TableColumnDescVO(), column));
            //     continue;
            // }
        }

        return table_columns;
    }

    /**
     * Get Exportable Table Columns By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {string[]}
     */
    public static get_exportable_table_columns_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): string[] {
        let res: string[] = [];

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (let i in columns) {
            let column: TableColumnDescVO = columns[i];

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const key in column.children) {
                    let child = column.children[key];
                    if (!child.exportable) {
                        continue;
                    }
                    res.push(child.datatable_field_uid);
                }
            }

            if (!column.exportable) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_header) {
                res.push(column.datatable_field_uid);
            }
        }

        return res;
    }

    /**
     * Get Table Columns Labels By Widget Options
     *
     * @param {TableWidgetOptions} [props.widget_options]
     * @param {number} [props.page_widget_id]
     *
     * @returns {{ [field_uid: string]: string }}
     */
    public static get_table_columns_labels_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        page_widget_id: number,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): any {
        let label_by_field_uid: { [field_uid: string]: string } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column = columns[i];

            if (column?.type == TableColumnDescVO.TYPE_header) {
                for (const key in column.children) {
                    const child = column.children[key];

                    label_by_field_uid[child.datatable_field_uid] = LocaleManager.getInstance().t(
                        child.get_translatable_name_code_text(page_widget_id)
                    );
                }
            } else {
                label_by_field_uid[column.datatable_field_uid] = LocaleManager.getInstance().t(
                    column.get_translatable_name_code_text(page_widget_id)
                );
            }
        }

        return label_by_field_uid;
    }

    /**
     * Get Exportable Table Custom Field Columns By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: string }}
     */
    public static get_exportable_table_custom_field_columns_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: string } {

        let custom_field_columns_by_field_uid: { [datatable_field_uid: string]: string } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (let i in columns) {
            let column: TableColumnDescVO = columns[i];

            if (!column.exportable) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_component) {
                continue;
            }

            custom_field_columns_by_field_uid[column.datatable_field_uid] = column.component_name;
        }

        return custom_field_columns_by_field_uid;
    }

    /**
     * Get Datatable Varcolumn Conf By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: ExportVarcolumnConf }}
     */
    public static get_table_varcolumn_conf_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: ExportVarcolumnConf } {

        let res: { [datatable_field_uid: string]: ExportVarcolumnConf } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (let i in columns) {
            let column = columns[i];

            if (column?.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            let varcolumn_conf: ExportVarcolumnConf = {
                custom_field_filters: column.filter_custom_field_filters,
                var_id: column.var_id
            };

            res[column.datatable_field_uid] = varcolumn_conf;
        }

        return res;
    }

    /**
     * Get Columns Custom Filters By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } }}
     */
    public static get_table_columns_custom_filters_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } {

        // Get page_widgets (or all_page_widgets from dashboard)
        const { page_widgets } = DashboardPageWidgetVOManager.getInstance();

        let columns_custom_filters_by_field_uid: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = {};

        active_field_filters = cloneDeep(active_field_filters);

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (let i in columns) {
            let column = columns[i];

            if (column.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            // On supprime les filtres à ne pas prendre en compte pour créer le bon param
            if (column.do_not_user_filter_active_ids && column.do_not_user_filter_active_ids.length) {

                for (const j in column.do_not_user_filter_active_ids) {
                    const page_filter_id = column.do_not_user_filter_active_ids[j];

                    const page_widget: DashboardPageWidgetVO = page_widgets.find((pw) => pw.id == page_filter_id);

                    if (!page_widget) {
                        continue;
                    }

                    const page_widget_options = new FieldValueFilterWidgetOptionsVO().from(JSON.parse(page_widget.json_options));

                    if (page_widget_options?.vo_field_ref) {
                        if (active_field_filters && active_field_filters[page_widget_options.vo_field_ref.api_type_id]) {
                            delete active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id];
                        }
                    }
                }
            }

            columns_custom_filters_by_field_uid[column.datatable_field_uid] = VarWidgetManager.get_var_custom_filters(
                Object.keys(column.filter_custom_field_filters)?.length > 0 ? column.filter_custom_field_filters : null,
                active_field_filters
            );
        }

        return columns_custom_filters_by_field_uid;
    }

    /**
     * Get Datatable Fields By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [column_id: number]: DatatableField<any, any> }}
     */
    public static get_table_fields_by_widget_options(
        dashboard: DashboardVO,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO },
        from_default: boolean = false
    ): { [column_id: number]: DatatableField<any, any> } {
        const field_by_column_id: { [column_id: number]: DatatableField<any, any> } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id,
            from_default
        );

        for (const i in columns) {
            const column: TableColumnDescVO = columns[i];
            let moduleTable: ModuleTable<any>;

            if (column?.type != TableColumnDescVO.TYPE_header) {
                moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
            }

            switch (column?.type) {
                case TableColumnDescVO.TYPE_component:
                    field_by_column_id[column.id] = TableWidgetManager.getInstance()
                        .components_by_translatable_title[column.component_name]
                        .auto_update_datatable_field_uid_with_vo_type();

                    break;
                case TableColumnDescVO.TYPE_var_ref:
                    const var_data_field: VarDatatableFieldVO<any, any> = VarDatatableFieldVO.createNew(
                        column.id.toString(),
                        column.var_id,
                        column.filter_type,
                        column.filter_additional_params,
                        dashboard.id
                    ).auto_update_datatable_field_uid_with_vo_type();

                    field_by_column_id[column.id] = var_data_field;

                    break;
                case TableColumnDescVO.TYPE_vo_field_ref:
                    let field = moduleTable.get_field_by_id(column.field_id);

                    if (!field) {
                        field_by_column_id[column.id] = SimpleDatatableFieldVO.createNew(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                        break;
                    }

                    let data_field: DatatableField<any, any> = CRUD.get_dt_field(field);

                    // sur un simple on set le label
                    // FIXME TODO : set_translatable_title a été supprimé pour éviter des trads appliquées côté front par des widgets et qui ne seraient pas valides en export côté serveur
                    if (data_field['set_translatable_title']) {
                        data_field['set_translatable_title'](field.field_label.code_text);
                    }

                    data_field.setModuleTable(moduleTable)
                        .auto_update_datatable_field_uid_with_vo_type();

                    field_by_column_id[column.id] = data_field;

                    break;
                case TableColumnDescVO.TYPE_crud_actions:
                    field_by_column_id[column.id] = CRUDActionsDatatableFieldVO.createNew().setModuleTable(moduleTable);
                    break;
                case TableColumnDescVO.TYPE_select_box:
                    field_by_column_id[column.id] = SelectBoxDatatableFieldVO.createNew().setModuleTable(moduleTable);
                    break;
            }
        }

        return field_by_column_id;
    }

    /**
     * Get Datatable Columns By Field Id By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: TableColumnDescVO }}
     */
    public static get_table_columns_by_field_id_by_widget_options(
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: TableColumnDescVO } {

        let columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column = columns[i];

            columns_by_field_id[column.datatable_field_uid] = column;
        }

        return columns_by_field_id;
    }

    /**
     * Get Export Options By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @return {IExportOptions}
     */
    public static get_export_options_by_widget_options(widget_options: TableWidgetOptionsVO): IExportOptions {

        return {
            export_active_field_filters: widget_options.can_export_active_field_filters,
            export_vars_indicator: widget_options.can_export_vars_indicator
        };
    }

    public static getInstance(): TableWidgetManager {
        if (!TableWidgetManager.instance) {
            TableWidgetManager.instance = new TableWidgetManager();
        }
        return TableWidgetManager.instance;
    }

    protected static instance: TableWidgetManager = null;

    public components_by_crud_api_type_id: { [api_type_id: string]: Array<ComponentDatatableFieldVO<any, any>> } = {};
    public components_by_translatable_title: { [translatable_title: string]: ComponentDatatableFieldVO<any, any> } = {};

    public cb_bulk_actions_by_crud_api_type_id: { [api_type_id: string]: BulkActionVO[] } = {};
    public cb_bulk_actions_by_translatable_title: { [translatable_title: string]: BulkActionVO } = {};

    protected constructor() { }

    public register_component(component: ComponentDatatableFieldVO<any, any>) {
        if (!this.components_by_crud_api_type_id[component.vo_type_id]) {
            this.components_by_crud_api_type_id[component.vo_type_id] = [];
        }
        this.components_by_crud_api_type_id[component.vo_type_id].push(component);

        this.components_by_translatable_title[component.translatable_title] = component;
    }

    public register_bulk_action(bulk_action: BulkActionVO) {

        if (!this.cb_bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id]) {
            this.cb_bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id] = [];
        }
        this.cb_bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id].push(bulk_action);

        this.cb_bulk_actions_by_translatable_title[bulk_action.translatable_title] = bulk_action;
    }
}