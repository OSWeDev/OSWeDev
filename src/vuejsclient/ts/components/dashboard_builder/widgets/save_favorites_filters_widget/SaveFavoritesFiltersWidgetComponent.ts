import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import CRUDActionsDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SelectBoxDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SelectBoxDatatableFieldVO';
import VarDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/VarDatatableFieldVO';
import DashboardFavoritesFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardFavoritesFiltersVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import YearFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import { IExportOptions } from '../../../../../../shared/modules/DataExport/interfaces/IExportOptions';
import ExportContextQueryToXLSXParamVO from '../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import ExportVarcolumnConf from '../../../../../../shared/modules/DataExport/vos/ExportVarcolumnConf';
import { ExportVarIndicator } from '../../../../../../shared/modules/DataExport/vos/ExportVarIndicator';
import ModuleTable from '../../../../../../shared/modules/ModuleTable';
import VarConfVO from '../../../../../../shared/modules/Var/vos/VarConfVO';
import { VOsTypesManager } from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../../../shared/tools/WeightHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from '../field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import MonthFilterWidgetOptions from '../month_filter_widget/options/MonthFilterWidgetOptions';
import ReloadFiltersWidgetController from '../reload_filters_widget/RealoadFiltersWidgetController';
import TableWidgetOptions from '../table_widget/options/TableWidgetOptions';
import TableWidgetController from '../table_widget/TableWidgetController';
import VarWidgetOptions from '../var_widget/options/VarWidgetOptions';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';
import SaveFavoritesFiltersModalComponent from './modal/SaveFavoritesFiltersModalComponent';
import { SaveFavoritesFiltersWidgetOptions } from './options/SaveFavoritesFiltersWidgetOptions';
import './SaveFavoritesFiltersWidgetComponent.scss';
import { SaveFavoritesFiltersWidgetController } from './SaveFavoritesFiltersWidgetController';

@Component({
    template: require('./SaveFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageGetter
    private get_Savefavoritesfiltersmodalcomponent: SaveFavoritesFiltersModalComponent;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    private start_update: boolean = false;

    /**
     * On mounted
     *  - Happen on component mount
     */
    private mounted() { }

    /**
     * Handle Open Modal
     *
     * @return {Promise<void>}
     */
    private async handle_open_modal(): Promise<void> {
        this.get_Savefavoritesfiltersmodalcomponent.open_modal(
            {
                selectionnable_active_field_filters: this.get_selectionnable_active_field_filters(),
                exportable_data: this.get_exportable_xlsx_params(),
            },
            this.handle_save.bind(this)
        );
    }

    /**
     * Handle Save V1
     *  - Save active dashboard filters for the current user
     *
     * @param {Partial<DashboardFavoritesFiltersVO>} [props]
     * @returns {Promise<void>}
     */
    private async handle_save(props: Partial<DashboardFavoritesFiltersVO>): Promise<void> {
        if (!props) { return; }

        if (this.start_update) { return; }

        this.start_update = true;

        const favorites_filters = new DashboardFavoritesFiltersVO().from({
            page_id: this.dashboard_page.id,
            owner_id: this.data_user.id,
            ...props,
        });

        this.save_favorites_filters(favorites_filters);

        this.start_update = false;
    }

    /**
     * Save Favorites Filters
     *
     * @param props {DashboardFavoritesFiltersVO}
     * @return {Promise<void>}
     */
    private async save_favorites_filters(props: DashboardFavoritesFiltersVO): Promise<void> {
        let self = this;

        self.snotify.async(self.label('dashboard_viewer.save_favorites_filters.start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await SaveFavoritesFiltersWidgetController.getInstance().throttle_save_favorites_filters(
                    props,
                );

                if (success) {
                    self.reload_all_visible_active_filters();
                    resolve({
                        body: self.label('dashboard_viewer.save_favorites_filters.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_viewer.save_favorites_filters.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    /**
     * Reload All Visible Active Filters
     *
     * @return {void}
     */
    private reload_all_visible_active_filters(): void {
        for (const db_id in ReloadFiltersWidgetController.getInstance().reloaders) {
            const db_reloaders = ReloadFiltersWidgetController.getInstance().reloaders[db_id];

            for (const p_id in db_reloaders) {
                const p_reloaders = db_reloaders[p_id];

                for (const w_id in p_reloaders) {
                    const reload = p_reloaders[w_id];

                    reload();
                }
            }
        }
    }

    /**
     * Get Exportable XLSX Params
     *
     * @param {boolean} [limit_to_page]
     */
    private get_exportable_xlsx_params(limit_to_page: boolean = true): { [title_name_code: string]: ExportContextQueryToXLSXParamVO } {

        const valuetables_widgets_options = this.valuetables_widgets_options;
        const res: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = {};

        let export_name = this.dashboard_page.translatable_name_code_text ?
            `Export-${this.t(this.dashboard_page.translatable_name_code_text)}-{#Date}.xlsx` :
            `Export-{#Date}.xlsx`;

        for (const name in valuetables_widgets_options) {

            const page_widget_id = valuetables_widgets_options[name].page_widget_id;
            const widget_options = valuetables_widgets_options[name].widget_options;

            const widget_options_fields = this.get_datatable_fields_by_widget_options(widget_options);

            // The actual fields to be exported
            let fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};

            for (let i in widget_options_fields) {
                let field = widget_options_fields[i];
                fields[field.datatable_field_uid] = field;
            }

            res[name] = new ExportContextQueryToXLSXParamVO(
                export_name,
                this.get_context_query_by_widget_options(widget_options),
                this.get_exportable_datatable_columns_by_widget_options(widget_options),
                this.get_datatable_columns_labels_by_widget_options({ widget_options, page_widget_id }),
                this.get_exportable_datatable_custom_field_columns_by_widget_options(widget_options),
                this.get_datatable_columns_by_widget_options(widget_options),
                fields,
                this.get_datatable_varcolumn_conf_by_widget_options(widget_options),
                this.get_active_field_filters,
                this.get_columns_custom_filters_by_widget_options(widget_options),
                this.dashboard.api_type_ids,
                this.get_discarded_field_paths,
                false,
                null,
                null,
                null,
                this.get_export_options_by_widget_options(widget_options),
                this.vars_indicator ?? null,
            );
        }

        return res;
    }

    /**
     * Get Selectionnable Active Field Filters
     *
     * @return {{ [api_type_id: string]: { [field_id: string]: ContextFilterVO }}
     */
    private get_selectionnable_active_field_filters(): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {

        const res: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(this.get_active_field_filters);

        const field_value_filters_widgets_options = this.field_value_filters_widgets_options;
        const month_filters_widgets_options = this.month_filters_widgets_options;
        const year_filters_widgets_options = this.year_filters_widgets_options;

        for (const name in field_value_filters_widgets_options) {
            const widget_options = field_value_filters_widgets_options[name].widget_options;

            const vo_field_ref = this.get_vo_field_ref_by_widget_options(widget_options);

            if (widget_options.hide_filter) {
                if (res[vo_field_ref.api_type_id] && res[vo_field_ref.api_type_id][vo_field_ref.field_id]) {
                    delete res[vo_field_ref.api_type_id][vo_field_ref.field_id];
                }
            }
        }

        for (const name in month_filters_widgets_options) {
            const widget_options = month_filters_widgets_options[name].widget_options;

            const vo_field_ref = widget_options.is_vo_field_ref ? this.get_vo_field_ref_by_widget_options(widget_options) : {
                api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE,
                field_id: widget_options.custom_filter_name,
            };

            if (widget_options.hide_filter) {
                if (res[vo_field_ref.api_type_id] && res[vo_field_ref.api_type_id][vo_field_ref.field_id]) {
                    delete res[vo_field_ref.api_type_id][vo_field_ref.field_id];
                }
            }
        }

        for (const name in year_filters_widgets_options) {
            const widget_options = year_filters_widgets_options[name].widget_options;

            const vo_field_ref = widget_options.is_vo_field_ref ? this.get_vo_field_ref_by_widget_options(widget_options) : {
                api_type_id: ContextFilterVO.CUSTOM_FILTERS_TYPE,
                field_id: widget_options.custom_filter_name,
            };

            if (widget_options.hide_filter) {
                if (res[vo_field_ref.api_type_id] && res[vo_field_ref.api_type_id][vo_field_ref.field_id]) {
                    delete res[vo_field_ref.api_type_id][vo_field_ref.field_id];
                }
            }
        }

        return res;
    }

    /**
     * Get Context Query By Table Widget
     *
     * @param {TableWidgetOptions} [widget_options]
     * @return {ContextQueryVO}
     */
    private get_context_query_by_widget_options(widget_options: TableWidgetOptions): ContextQueryVO {

        const fields = this.get_datatable_fields_by_widget_options(widget_options);
        const limit = (widget_options?.limit == null) ? TableWidgetOptions.DEFAULT_LIMIT : widget_options.limit;
        const pagination_offset = 0;

        let crud_api_type_id = widget_options.crud_api_type_id ? widget_options.crud_api_type_id : null;
        if (!crud_api_type_id) {
            for (let column_id in fields) {
                let field = fields[column_id];

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

        let context_query: ContextQueryVO = query(crud_api_type_id)
            .set_limit(limit, pagination_offset)
            .using(this.dashboard.api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                ContextFilterVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        //On évite les jointures supprimées.
        for (let vo_type in this.get_discarded_field_paths) {
            let discarded_field_paths_vo_type = this.get_discarded_field_paths[vo_type];

            for (let field_id in discarded_field_paths_vo_type) {
                context_query.discard_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }

        let columns_by_field_id = cloneDeep(this.get_datatable_columns_by_field_id_by_widget_options(widget_options));
        for (let field_id in columns_by_field_id) {
            let field = columns_by_field_id[field_id];
            if (field.type == TableColumnDescVO.TYPE_header) {
                for (const key in field.children) {
                    let child = field.children[key];
                    columns_by_field_id[child.datatable_field_uid] = child;
                }
            }
        }

        for (let column_id in fields) {
            let field = fields[column_id];

            if ((field.type == DatatableField.VAR_FIELD_TYPE) ||
                (field.type == DatatableField.COMPONENT_FIELD_TYPE) ||
                (field.type == DatatableField.SELECT_BOX_FIELD_TYPE)) {

                continue;
            }

            let column: TableColumnDescVO = columns_by_field_id[field.datatable_field_uid];

            let aggregator: number = VarConfVO.NO_AGGREGATOR;

            if (column) {
                if (column.many_to_many_aggregate) {
                    if (column.is_nullable) {
                        aggregator = VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR;
                    } else {
                        aggregator = VarConfVO.ARRAY_AGG_AGGREGATOR;
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
        for (let i in this.all_page_widget) {
            let page_widget: DashboardPageWidgetVO = this.all_page_widget[i];
            let widget: DashboardWidgetVO = this.widgets_by_id[page_widget.widget_id];

            if (!widget) {
                continue;
            }

            if (!widget.is_filter) {
                continue;
            }

            let options: FieldValueFilterWidgetOptions = null;
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

            context_query.filters = ContextFilterVOHandler.getInstance().add_context_filters_exclude_values(
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
     * Get Columns Custom Filters By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } }}
     */
    private get_columns_custom_filters_by_widget_options(widget_options: TableWidgetOptions): { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } {
        let res: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = {};

        const active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = cloneDeep(this.get_active_field_filters);
        const columns = this.get_datatable_columns_by_widget_options(widget_options);

        for (let i in columns) {
            let column = columns[i];

            if (column.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            // On supprime les filtres à ne pas prendre en compte pour créer le bon param
            if (column.do_not_user_filter_active_ids && column.do_not_user_filter_active_ids.length) {
                let all_page_widget_by_id: { [id: number]: DashboardPageWidgetVO } = VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);

                for (let j in column.do_not_user_filter_active_ids) {
                    let page_filter_id = column.do_not_user_filter_active_ids[j];

                    let page_widget: DashboardPageWidgetVO = all_page_widget_by_id[page_filter_id];
                    if (!page_widget) {
                        continue;
                    }

                    let page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;

                    if (page_widget_options?.vo_field_ref) {
                        if (active_field_filters && active_field_filters[page_widget_options.vo_field_ref.api_type_id]) {
                            delete active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id];
                        }
                    }
                }
            }

            res[column.datatable_field_uid] = VarWidgetComponent.get_var_custom_filters(
                ObjectHandler.getInstance().hasAtLeastOneAttribute(column.filter_custom_field_filters) ? column.filter_custom_field_filters : null,
                active_field_filters
            );
        }

        return res;
    }

    /**
     * Get Columns By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {TableColumnDescVO[]}
     */
    private get_datatable_columns_by_widget_options(widget_options: TableWidgetOptions): TableColumnDescVO[] {
        let options: TableWidgetOptions = widget_options;

        if (!(options?.columns?.length > 0)) {
            return null;
        }

        let res: TableColumnDescVO[] = [];

        for (let i in options.columns) {

            let column = options.columns[i];

            if (column.readonly == null) {
                column.readonly = true;
            }

            if (column.column_width == null) {
                column.column_width = 0;
            }

            if (column.show_if_any_filter_active?.length > 0) {

                let activated = false;
                for (let j in column.show_if_any_filter_active) {
                    let page_filter_id = column.show_if_any_filter_active[j];

                    let page_widget = this.all_page_widget_by_id[page_filter_id];
                    if (!page_widget) {
                        column.show_if_any_filter_active = [];
                        continue;
                    }
                    let page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;
                    if ((!this.get_active_field_filters) ||
                        (!this.get_active_field_filters[page_widget_options.vo_field_ref.api_type_id]) ||
                        (!this.get_active_field_filters[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id])) {
                        continue;
                    }

                    activated = true;
                }

                if (!activated) {
                    continue;
                }
            }

            res.push(Object.assign(new TableColumnDescVO(), column));
        }

        WeightHandler.getInstance().sortByWeight(res);

        return res;
    }

    /**
     * Get Datatable Fields By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [column_id: number]: DatatableField<any, any> }}
     */
    private get_datatable_fields_by_widget_options(widget_options: TableWidgetOptions): { [column_id: number]: DatatableField<any, any> } {
        let res: { [column_id: number]: DatatableField<any, any> } = {};

        const columns = this.get_datatable_columns_by_widget_options(widget_options);

        for (let i in columns) {
            let column: TableColumnDescVO = columns[i];
            let moduleTable: ModuleTable<any>;

            if (column?.type != TableColumnDescVO.TYPE_header) {
                moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
            }

            switch (column?.type) {
                case TableColumnDescVO.TYPE_component:
                    res[column.id] = TableWidgetController.getInstance()
                        .components_by_translatable_title[column.component_name]
                        .auto_update_datatable_field_uid_with_vo_type();
                    break;
                case TableColumnDescVO.TYPE_var_ref:
                    let var_data_field: VarDatatableFieldVO<any, any> = VarDatatableFieldVO.createNew(
                        column.id.toString(),
                        column.var_id,
                        column.filter_type,
                        column.filter_additional_params,
                        this.dashboard.id
                    ).auto_update_datatable_field_uid_with_vo_type(); //, column.get_translatable_name_code_text(this.page_widget.id)
                    res[column.id] = var_data_field;
                    break;
                case TableColumnDescVO.TYPE_vo_field_ref:
                    let field = moduleTable.get_field_by_id(column.field_id);

                    let data_field: DatatableField<any, any> = CRUD.get_dt_field(field);

                    // sur un simple on set le label
                    if (data_field['set_translatable_title']) {
                        data_field['set_translatable_title'](field.field_label.code_text);
                    }

                    data_field.setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                    res[column.id] = data_field;
                    //         break;
                    // }
                    break;
                case TableColumnDescVO.TYPE_crud_actions:
                    res[column.id] = CRUDActionsDatatableFieldVO.createNew().setModuleTable(moduleTable);
                    break;
                case TableColumnDescVO.TYPE_select_box:
                    res[column.id] = SelectBoxDatatableFieldVO.createNew().setModuleTable(moduleTable);
                    break;
            }
        }

        return res;
    }

    /**
     * Get Datatable Columns Labels By Widget Options
     *
     * @param {TableWidgetOptions} [props.widget_options]
     * @param {number} [props.page_widget_id]
     *
     * @returns {any}
     */
    private get_datatable_columns_labels_by_widget_options(props: { widget_options: TableWidgetOptions, page_widget_id: number }): any {
        let res: any = {};

        const columns = this.get_datatable_columns_by_widget_options(props.widget_options);

        for (let i in columns) {
            let column = columns[i];

            if (column?.type == TableColumnDescVO.TYPE_header) {
                for (const key in column.children) {
                    let child = column.children[key];
                    res[child.datatable_field_uid] = this.t(child.get_translatable_name_code_text(props.page_widget_id));
                }
            } else {
                res[column.datatable_field_uid] = this.t(column.get_translatable_name_code_text(props.page_widget_id));
            }
        }

        return res;
    }

    /**
     * Get Datatable Columns By Field Id By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: TableColumnDescVO }}
     */
    private get_datatable_columns_by_field_id_by_widget_options(widget_options: TableWidgetOptions): { [datatable_field_uid: string]: TableColumnDescVO } {
        let res: { [datatable_field_uid: string]: TableColumnDescVO } = {};

        const columns = this.get_datatable_columns_by_widget_options(widget_options);

        for (let i in columns) {
            let column = columns[i];

            res[column.datatable_field_uid] = column;
        }
        return res;
    }

    /**
     * Get Exportable Datatable Custom Field Columns By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: string }}
     */
    private get_exportable_datatable_custom_field_columns_by_widget_options(widget_options: TableWidgetOptions): { [datatable_field_uid: string]: string } {
        let res: { [datatable_field_uid: string]: string } = {};

        const columns = this.get_datatable_columns_by_widget_options(widget_options);

        for (let i in columns) {
            let column: TableColumnDescVO = columns[i];

            if (!column.exportable) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_component) {
                continue;
            }

            res[column.datatable_field_uid] = column.component_name;
        }

        return res;
    }

    /**
     * Get Datatable Varcolumn Conf By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {{ [datatable_field_uid: string]: ExportVarcolumnConf }}
     */
    private get_datatable_varcolumn_conf_by_widget_options(widget_options: TableWidgetOptions): { [datatable_field_uid: string]: ExportVarcolumnConf } {
        let res: { [datatable_field_uid: string]: ExportVarcolumnConf } = {};

        const columns = this.get_datatable_columns_by_widget_options(widget_options);

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
     * Get Exportable Datatable Columns By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @returns {string[]}
     */
    private get_exportable_datatable_columns_by_widget_options(widget_options: TableWidgetOptions): string[] {
        let res: string[] = [];

        const columns = this.get_datatable_columns_by_widget_options(widget_options);

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
     * Get Export Options By Widget Options
     *
     * @param {TableWidgetOptions} [widget_options]
     * @return {IExportOptions}
     */
    private get_export_options_by_widget_options(widget_options: TableWidgetOptions): IExportOptions {

        return {
            export_active_field_filters: widget_options.can_export_active_field_filters,
            export_vars_indicator: widget_options.can_export_vars_indicator
        };
    }

    /**
     * Get Vo Field Ref By Widget Options
     *
     * @param {FieldValueFilterWidgetOptions} widget_options
     * @returns {VOFieldRefVO}
     */
    private get_vo_field_ref_by_widget_options(
        widget_options: FieldValueFilterWidgetOptions | MonthFilterWidgetOptions | YearFilterWidgetOptionsVO
    ): VOFieldRefVO {

        if (!widget_options?.vo_field_ref) {
            return null;
        }

        return new VOFieldRefVO().from(widget_options.vo_field_ref);
    }

    /**
     * Get Filter Widgets Options By Widget Name
     *
     * @param {string} widget_name
     * @returns {{ [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } }}
     */
    private get_filter_widgets_options_by_widget_name(
        widget_name: string
    ): { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } {
        const res: { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } = {};

        // Find id of widget that have type "yearfilter"
        const filter_widget_id = Object.values(this.widgets_by_id)?.find((e) => e.name == widget_name).id;

        // filter_widget_id required to continue
        if (!filter_widget_id) { return; }

        // Find all yearfilter widgets of actual page
        const filter_page_widgets = Object.values(this.all_page_widget)?.filter(
            (pw) => pw.widget_id == filter_widget_id
        );

        for (const key in filter_page_widgets) {
            const filter_page_widget = filter_page_widgets[key];

            const options = JSON.parse(filter_page_widget?.json_options ?? '{}');

            const page_widget_id = filter_page_widget.id;
            const filter_widget_options = options;

            res[page_widget_id] = {
                widget_options: filter_widget_options,
                page_widget_id: filter_page_widget.id,
                widget_name,
            };
        }

        return res;
    }

    /**
     * Get Widgets By Id
     *
     * @return { [id: number]: DashboardWidgetVO }
     */
    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    /**
     * Var Indicator
     *  - All vars indicator on the actual page to be exported
     *
     * @return {ExportVarIndicator}
     */
    get vars_indicator(): ExportVarIndicator {

        const varcolumn_conf: { [xlsx_sheet_row_code_name: string]: ExportVarcolumnConf } = {};

        // Find id of widget that have type "var"
        const var_widget_id = Object.values(this.widgets_by_id)?.find((e) => e.name == 'var').id;

        // var_widget_id required to continue
        if (!var_widget_id) { return; }

        // Find all var widgets of actual page
        const var_page_widgets = Object.values(this.all_page_widget)?.filter(
            (pw) => pw.widget_id == var_widget_id
        );

        for (let key in var_page_widgets) {
            const var_page_widget = var_page_widgets[key];

            const options = JSON.parse(var_page_widget.json_options);

            const var_widget_options = new VarWidgetOptions().from(options);
            const name = var_widget_options.get_title_name_code_text(var_page_widget.id);

            let conf: ExportVarcolumnConf = {
                custom_field_filters: var_widget_options.filter_custom_field_filters,
                filter_additional_params: var_widget_options.filter_additional_params,
                filter_type: var_widget_options.filter_type,
                var_id: options.var_id
            };

            varcolumn_conf[name] = conf;
        }

        // returns ordered_column_list, column_labels and varcolumn_conf
        return new ExportVarIndicator(
            ['name', 'value'],
            { name: 'Nom', value: 'Valeur' },
            varcolumn_conf
        );
    }

    /**
     * Get widget_options
     *
     * @return {SaveFavoritesFiltersWidgetOptions}
     */
    get widget_options(): SaveFavoritesFiltersWidgetOptions {

        if (!this.page_widget) {
            return null;
        }

        let options: SaveFavoritesFiltersWidgetOptions = null;

        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SaveFavoritesFiltersWidgetOptions;
                options = options ? new SaveFavoritesFiltersWidgetOptions().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Get Valuetable Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: TableWidgetOptions, widget_name: string, page_widget_id: number } }}
     */
    get valuetables_widgets_options(): { [title_name_code: string]: { widget_options: TableWidgetOptions, widget_name: string, page_widget_id: number } } {

        const options: { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } =
            this.get_filter_widgets_options_by_widget_name('valuetable');

        const res: { [title_name_code: string]: { widget_options: TableWidgetOptions, widget_name: string, page_widget_id: number } } = {};

        for (const key in options) {

            const widget_options = new TableWidgetOptions().from(options[key].widget_options);
            const name = widget_options.get_title_name_code_text(options[key].page_widget_id);

            res[name] = {} as any;
            res[name].page_widget_id = options[key].page_widget_id;
            res[name].widget_name = options[key].widget_name;
            res[name].widget_options = widget_options;
        }

        return res;
    }

    /**
     * Get Field Value Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptions, widget_name: string, page_widget_id: number } }}
     */
    get field_value_filters_widgets_options(): { [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptions, widget_name: string, page_widget_id: number } } {

        const options: { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } =
            this.get_filter_widgets_options_by_widget_name('fieldvaluefilter');

        const res: { [title_name_code: string]: { widget_options: FieldValueFilterWidgetOptions, widget_name: string, page_widget_id: number } } = {};

        for (const key in options) {

            const widget_options = new FieldValueFilterWidgetOptions().from(options[key].widget_options);
            const name = widget_options.get_placeholder_name_code_text(options[key].page_widget_id);

            res[name] = {} as any;
            res[name].page_widget_id = options[key].page_widget_id;
            res[name].widget_name = options[key].widget_name;
            res[name].widget_options = widget_options;
        }

        return res;
    }

    /**
     * Get Month Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: MonthFilterWidgetOptions, widget_name: string, page_widget_id: number } }}
     */
    get month_filters_widgets_options(): { [title_name_code: string]: { widget_options: MonthFilterWidgetOptions, widget_name: string, page_widget_id: number } } {

        const options: { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } =
            this.get_filter_widgets_options_by_widget_name('monthfilter');

        const res: { [title_name_code: string]: { widget_options: MonthFilterWidgetOptions, widget_name: string, page_widget_id: number } } = {};

        for (const key in options) {

            const widget_options = new MonthFilterWidgetOptions().from(options[key].widget_options);
            const name = widget_options.get_placeholder_name_code_text(options[key].page_widget_id);

            res[name] = {} as any;
            res[name].page_widget_id = options[key].page_widget_id;
            res[name].widget_name = options[key].widget_name;
            res[name].widget_options = widget_options;
        }

        return res;
    }

    /**
     * Get Year Filters Widgets Options
     *
     * @return {{ [title_name_code: string]: { widget_options: YearFilterWidgetOptionsVO, widget_name: string, page_widget_id: number } }}
     */
    get year_filters_widgets_options(): { [title_name_code: string]: { widget_options: YearFilterWidgetOptionsVO, widget_name: string, page_widget_id: number } } {

        const options: { [page_widget_id: string]: { widget_options: any, widget_name: string, page_widget_id: number } } =
            this.get_filter_widgets_options_by_widget_name('yearfilter');

        const res: { [title_name_code: string]: { widget_options: YearFilterWidgetOptionsVO, widget_name: string, page_widget_id: number } } = {};

        for (const key in options) {

            const widget_options = new YearFilterWidgetOptionsVO().from(options[key].widget_options);
            const name = widget_options.get_placeholder_name_code_text(options[key].page_widget_id);

            res[name] = {} as any;
            res[name].page_widget_id = options[key].page_widget_id;
            res[name].widget_name = options[key].widget_name;
            res[name].widget_options = widget_options;
        }

        return res;
    }

    /**
     * Get All Page Widget By Id
     * @return {{ [id: number]: DashboardPageWidgetVO }}
     */
    get all_page_widget_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);
    }
}