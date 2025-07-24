import { cloneDeep } from 'lodash';
import slug from 'slug';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import LocaleManager from '../../../tools/LocaleManager';
import { field_names } from '../../../tools/ObjectHandler';
import WeightHandler from '../../../tools/WeightHandler';
import ContextFilterVOHandler from '../../ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../DAO/ModuleTableController';
import ModuleTableFieldController from '../../DAO/ModuleTableFieldController';
import CRUD from '../../DAO/vos/CRUD';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import CRUDActionsDatatableFieldVO from '../../DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import ComponentDatatableFieldVO from '../../DAO/vos/datatable/ComponentDatatableFieldVO';
import DatatableField from '../../DAO/vos/datatable/DatatableField';
import SelectBoxDatatableFieldVO from '../../DAO/vos/datatable/SelectBoxDatatableFieldVO';
import SimpleDatatableFieldVO from '../../DAO/vos/datatable/SimpleDatatableFieldVO';
import VarDatatableFieldVO from '../../DAO/vos/datatable/VarDatatableFieldVO';
import ExportVarcolumnConfVO from '../../DataExport/vos/ExportVarcolumnConfVO';
import ExportContextQueryToXLSXParamVO from '../../DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import VarConfVO from '../../Var/vos/VarConfVO';
import FieldFiltersVOHandler from '../handlers/FieldFiltersVOHandler';
import BulkActionVO from '../vos/BulkActionVO';
import DashboardPageVO from '../vos/DashboardPageVO';
import DashboardPageWidgetVO from '../vos/DashboardPageWidgetVO';
import DashboardVO from '../vos/DashboardVO';
import DashboardWidgetVO from '../vos/DashboardWidgetVO';
import FieldFiltersVO from '../vos/FieldFiltersVO';
import FieldValueFilterWidgetOptionsVO from '../vos/FieldValueFilterWidgetOptionsVO';
import TableColumnDescVO from '../vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../vos/TableWidgetOptionsVO';
import WidgetOptionsMetadataVO from '../vos/WidgetOptionsMetadataVO';
import DashboardPageWidgetVOManager from './DashboardPageWidgetVOManager';
import FieldFiltersVOManager from './FieldFiltersVOManager';
import VOFieldRefVOManager from './VOFieldRefVOManager';
import VarWidgetManager from './VarWidgetManager';
import WidgetOptionsVOManager from './WidgetOptionsVOManager';

/**
 * @class TableWidgetManager
 */
export default class TableWidgetManager {

    public static components_by_crud_api_type_id: { [api_type_id: string]: Array<ComponentDatatableFieldVO<any, any>> } = {};
    public static components_by_translatable_title: { [translatable_title: string]: ComponentDatatableFieldVO<any, any> } = {};
    public static custom_components_export_cb_by_translatable_title: { [translatable_title: string]: (vo: any, active_field_filters: FieldFiltersVO, dashboard_api_type_ids: string[], column: TableColumnDescVO) => Promise<any> } = {};

    public static cb_bulk_actions_by_crud_api_type_id: { [api_type_id: string]: BulkActionVO[] } = {};
    public static cb_bulk_actions_by_translatable_title: { [translatable_title: string]: BulkActionVO } = {};

    /**
     * create_exportable_datatables_xlsx_params
     * - All datatables on the actual page to be exported
     * - All vars indicator on the actual page to be exported
     *
     * @param {DashboardVO} dashboard
     * @param {DashboardPageWidgetVO} dashboard_page
     * @param {{ [title_name_code: string]: { widget_options: TableWidgetOptionsVO, widget_name: string, dashboard_page_id: number, page_widget_id: number } }} datatables_widgets_options
     * @param {FieldFiltersVO} active_field_filters
     * @returns {{ [title_name_code: string]: ExportContextQueryToXLSXParamVO }}
     */
    public static async create_exportable_datatables_xlsx_params(
        dashboard: DashboardVO,
        dashboard_page: DashboardPageVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO },
        dashboard_api_type_ids: string[],
        dashboard_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
    ): Promise<{ [title_name_code: string]: ExportContextQueryToXLSXParamVO }> {

        const res: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = {};

        let export_name: string = 'Export-';

        if (dashboard?.title) {
            export_name += 'Dashboard-' + LocaleManager.t(dashboard.title) + '-';
        }

        if (dashboard_page?.titre_page) {
            export_name += 'Page-' + LocaleManager.t(dashboard_page.titre_page) + '-';
        }

        export_name = slug(export_name, { lower: false }) + "{#Date}.xlsx";

        const datatables_widgets_options = await TableWidgetManager.get_datatables_widgets_options(Object.values(all_page_widgets_by_id));

        for (const name in datatables_widgets_options) {

            const {
                page_widget_id,
                widget_options,
            } = datatables_widgets_options[name];
            const page_widget: DashboardPageWidgetVO = all_page_widgets_by_id[page_widget_id];

            const widget_options_fields = TableWidgetManager.get_table_fields_by_widget_options(
                page_widget.widget_id,
                dashboard,
                widget_options,
                active_field_filters,
                all_page_widgets_by_id,
                true
            );

            // The actual fields to be exported
            const fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};

            for (const i in widget_options_fields) {
                const field = widget_options_fields[i];
                fields[field.datatable_field_uid] = field;
            }

            res[name] = new ExportContextQueryToXLSXParamVO(
                dashboard.id,
                export_name,
                await TableWidgetManager.get_table_context_query_by_widget_options(
                    page_widget.widget_id,
                    dashboard,
                    widget_options,
                    active_field_filters,
                    dashboard_api_type_ids,
                    dashboard_discarded_field_paths,
                    all_page_widgets_by_id,
                ),
                TableWidgetManager.get_exportable_table_columns_by_widget_options(
                    page_widget.widget_id,
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                TableWidgetManager.get_table_columns_labels_by_widget_options(
                    page_widget.widget_id,
                    widget_options,
                    page_widget_id,
                    active_field_filters,
                    all_page_widgets_by_id),
                TableWidgetManager.get_exportable_table_custom_field_columns_by_widget_options(
                    page_widget.widget_id,
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                TableWidgetManager.get_table_columns_by_widget_options(
                    page_widget.widget_id,
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id,
                ),
                fields,
                TableWidgetManager.get_table_varcolumn_conf_by_widget_options(
                    page_widget.widget_id,
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                active_field_filters,
                await TableWidgetManager.get_table_columns_custom_filters_by_widget_options(
                    page_widget.widget_id,
                    dashboard.id,
                    widget_options,
                    active_field_filters,
                    all_page_widgets_by_id),
                dashboard_api_type_ids,
                dashboard_discarded_field_paths,
                false,
                null,
                null, // get user id
                null,
                widget_options.can_export_active_field_filters,
                widget_options.can_export_vars_indicator,
                false,
                await VarWidgetManager.get_exportable_vars_indicator(Object.values(all_page_widgets_by_id)),
            );
        }

        return res;
    }

    /**
     * Get datatable Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: TableWidgetOptions, widget_name: string, dashboard_page_id: number, page_widget_id: number } }}
     */
    public static async get_datatables_widgets_options(
        dashboard_page_widgets: DashboardPageWidgetVO[],
    ): Promise<{ [title_name_code: string]: { widget_options: TableWidgetOptionsVO, widget_name: string, page_widget_id: number } }> {

        const datatable_page_widgets: {
            [page_widget_id: string]: WidgetOptionsMetadataVO
        } = await DashboardPageWidgetVOManager.filter_all_page_widgets_options_by_widget_name(
            dashboard_page_widgets,
            DashboardWidgetVO.WIDGET_NAME_datatable,
        );

        const res: { [title_name_code: string]: WidgetOptionsMetadataVO } = {};

        for (const key in datatable_page_widgets) {
            const options = datatable_page_widgets[key];

            const widget_options = new TableWidgetOptionsVO().from(options.widget_options);

            options.widget_options = widget_options;

            res[options.page_widget.titre] = options;
        }

        return res;
    }

    /**
     * Get Table Context Query By Table Widget
     *
     * @param {TableWidgetOptionsVO} [widget_options]
     * @return {ContextQueryVO}
     */
    public static async get_table_context_query_by_widget_options(
        widget_id: number,
        dashboard: DashboardVO,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        api_type_ids: string[],
        discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO },
    ): Promise<ContextQueryVO> {
        // Get sorted_widgets from dashboard (or sorted_widgets_types)
        const sorted_widgets = await WidgetOptionsVOManager.get_all_sorted_widgets_types();

        const table_fields = TableWidgetManager.get_table_fields_by_widget_options(
            widget_id,
            dashboard,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        // const limit = (widget_options?.limit == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT : widget_options.limit;
        // const pagination_offset = 0;

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

        const context_filter = ContextFilterVOManager.get_context_filters_from_field_filters(
            FieldFiltersVOManager.clean_field_filters_for_request(active_field_filters)
        );

        const context_query: ContextQueryVO = query(crud_api_type_id)
            .set_limit(0, 0) // On exporte toujours tous les résultats en filtres favoris
            .using(api_type_ids)
            .add_filters(context_filter);

        //On évite les jointures supprimées.
        for (const vo_type in discarded_field_paths) {
            const discarded_field_paths_vo_type = discarded_field_paths[vo_type];

            for (const field_id in discarded_field_paths_vo_type) {
                context_query.set_discarded_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        const columns_by_field_id = TableWidgetManager.get_table_columns_by_field_id_by_widget_options(
            widget_id,
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
        for (const i in all_page_widgets_by_id) {
            const page_widget: DashboardPageWidgetVO = all_page_widgets_by_id[i];
            const widget_type: DashboardWidgetVO = sorted_widgets.find(
                (wtype) => wtype.id == page_widget.widget_id
            );

            if (!widget_type?.is_filter) {
                continue;
            }

            let options: FieldValueFilterWidgetOptionsVO = null;
            try {
                if (page_widget.json_options) {
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
     * widget_id = Type de widget, pas page_widget
     * @param {TableWidgetOptionsVO} [widget_options]
     * @returns {TableColumnDescVO[]}
     */
    public static get_table_columns_by_widget_options(
        widget_id: number,
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

            // if (from_default) {
            //     table_columns.push(new TableColumnDescVO().from(column));
            //     continue;
            // }

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
                        widget_id,
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

            if (column.hide_if_any_filter_active?.length > 0) {

                let activated = false;

                for (const j in column.hide_if_any_filter_active) {
                    const page_filter_id = column.hide_if_any_filter_active[j];
                    const page_widget = all_page_widgets_by_id[page_filter_id];

                    if (!page_widget) {
                        column.hide_if_any_filter_active = [];
                        continue;
                    }

                    const page_widget_options = JSON.parse(page_widget.json_options);

                    const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                        page_widget_options,
                    );

                    const is_active_field_filters_empty = FieldFiltersVOHandler.is_field_filters_empty(
                        vo_field_ref,
                        widget_id,
                        active_field_filters
                    );

                    if (is_active_field_filters_empty) {
                        continue;
                    }

                    activated = true;
                }

                if (activated) {
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
                    const children = column.children[r];
                    const index = column.children.indexOf(children);
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
        widget_id: number,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): string[] {
        const res: string[] = [];

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column: TableColumnDescVO = columns[i];

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const key in column.children) {
                    const child = column.children[key];
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
        widget_id: number,
        widget_options: TableWidgetOptionsVO,
        page_widget_id: number,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): any {
        const label_by_field_uid: { [field_uid: string]: string } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column = columns[i];

            if (column?.type == TableColumnDescVO.TYPE_header) {
                for (const key in column.children) {
                    const child = column.children[key];

                    label_by_field_uid[child.datatable_field_uid] = child.custom_label ?? LocaleManager.t(child.titre);
                }
            } else {
                label_by_field_uid[column.datatable_field_uid] = column.custom_label ?? LocaleManager.t(column.titre);
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
        widget_id: number,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: string } {

        const custom_field_columns_by_field_uid: { [datatable_field_uid: string]: string } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column: TableColumnDescVO = columns[i];

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
     * @returns {{ [datatable_field_uid: string]: ExportVarcolumnConfVO }}
     */
    public static get_table_varcolumn_conf_by_widget_options(
        widget_id: number,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: ExportVarcolumnConfVO } {

        const res: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column = columns[i];

            if (column?.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            const varcolumn_conf: ExportVarcolumnConfVO = ExportVarcolumnConfVO.create_new(
                column.var_id,
                column.filter_custom_field_filters,
            );

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
    public static async get_table_columns_custom_filters_by_widget_options(
        widget_id: number,
        dashboard_id: number,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): Promise<FieldFiltersVO> {

        // Get page_widgets (or all_page_widgets from dashboard)
        const page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().dashboard_id, dashboard_id)
            .select_vos<DashboardPageWidgetVO>();

        const columns_custom_filters_by_field_uid: FieldFiltersVO = {};

        active_field_filters = cloneDeep(active_field_filters);

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id
        );

        for (const i in columns) {
            const column = columns[i];

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
                widget_id,
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
        widget_id: number,
        dashboard: DashboardVO,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO },
        from_default: boolean = false
    ): { [column_id: number]: DatatableField<any, any> } {
        const field_by_column_id: { [column_id: number]: DatatableField<any, any> } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
            widget_options,
            active_field_filters,
            all_page_widgets_by_id,
            from_default
        );

        for (const i in columns) {
            const column: TableColumnDescVO = columns[i];
            let moduleTable: ModuleTableVO;

            if (column?.type != TableColumnDescVO.TYPE_header) {
                moduleTable = ModuleTableController.module_tables_by_vo_type[column.api_type_id];
            }

            switch (column?.type) {
                case TableColumnDescVO.TYPE_component:
                    field_by_column_id[column.id] = TableWidgetManager.components_by_translatable_title[column.component_name]
                        .auto_update_datatable_field_uid_with_vo_type();

                    break;
                case TableColumnDescVO.TYPE_var_ref: {
                    const var_data_field: VarDatatableFieldVO<any, any> = VarDatatableFieldVO.createNew(
                        column.id.toString(),
                        column.var_id,
                        column.filter_type,
                        column.filter_additional_params,
                        dashboard.id
                    ).auto_update_datatable_field_uid_with_vo_type();

                    field_by_column_id[column.id] = var_data_field;

                    break;
                }
                case TableColumnDescVO.TYPE_vo_field_ref: {
                    const field = moduleTable.get_field_by_id(column.field_id);

                    if (!field) {
                        field_by_column_id[column.id] = SimpleDatatableFieldVO.createNew(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                        break;
                    }

                    const data_field: DatatableField<any, any> = CRUD.get_dt_field(field);

                    // sur un simple on set le label
                    // FIXME TODO : set_translatable_title a été supprimé pour éviter des trads appliquées côté front par des widgets et qui ne seraient pas valides en export côté serveur
                    if (data_field['set_translatable_title'] &&
                        ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[field.module_table_vo_type] &&
                        ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[field.module_table_vo_type][field.field_name]) {
                        data_field['set_translatable_title'](
                            ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[field.module_table_vo_type][field.field_name].code_text);
                    }

                    data_field.setModuleTable(moduleTable)
                        .auto_update_datatable_field_uid_with_vo_type();

                    field_by_column_id[column.id] = data_field;

                    break;
                }
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
        widget_id: number,
        widget_options: TableWidgetOptionsVO,
        active_field_filters: FieldFiltersVO,
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO }
    ): { [datatable_field_uid: string]: TableColumnDescVO } {

        const columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO } = {};

        const columns = TableWidgetManager.get_table_columns_by_widget_options(
            widget_id,
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

    public static get_active_field_filters(
        actual_active_field_filters: FieldFiltersVO,
        do_not_use_page_widget_ids: number[],
        all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO },
        widgets_by_id: { [id: number]: DashboardWidgetVO },
    ): FieldFiltersVO {
        if (!do_not_use_page_widget_ids?.length || !all_page_widgets_by_id || !actual_active_field_filters) {
            return actual_active_field_filters;
        }

        const new_active_field_filters: FieldFiltersVO = cloneDeep(actual_active_field_filters);

        for (const i in do_not_use_page_widget_ids) {
            const page_widget: DashboardPageWidgetVO = all_page_widgets_by_id[do_not_use_page_widget_ids[i]];

            if (!page_widget) {
                continue;
            }

            const widget: DashboardWidgetVO = widgets_by_id[page_widget.widget_id];

            if (!widget || (widget.name != DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter)) {
                continue;
            }

            const page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptionsVO;

            if (page_widget_options?.vo_field_ref) {
                if (new_active_field_filters && new_active_field_filters[page_widget_options.vo_field_ref.api_type_id]) {
                    delete new_active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id];
                }
            }
        }

        return new_active_field_filters;
    }

    public static register_component(component: ComponentDatatableFieldVO<any, any>, cb: (data: any, active_field_filters: FieldFiltersVO, dashboard_api_type_ids: string[], column: TableColumnDescVO) => Promise<any> = null) {
        if (!this.components_by_crud_api_type_id[component.vo_type_id]) {
            this.components_by_crud_api_type_id[component.vo_type_id] = [];
        }
        this.components_by_crud_api_type_id[component.vo_type_id].push(component);

        this.components_by_translatable_title[component.translatable_title] = component;

        if (!!cb) {
            this.custom_components_export_cb_by_translatable_title[component.translatable_title] = cb;
        }
    }

    public static register_bulk_action(bulk_action: BulkActionVO) {

        if (!this.cb_bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id]) {
            this.cb_bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id] = [];
        }
        this.cb_bulk_actions_by_crud_api_type_id[bulk_action.vo_type_id].push(bulk_action);

        this.cb_bulk_actions_by_translatable_title[bulk_action.translatable_title] = bulk_action;
    }
}