import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IDashboardFavoritesFiltersProps from '../../../../../../shared/modules/DashboardBuilder/interfaces/IDashboardFavoritesFiltersProps';
import ExportContextQueryToXLSXParamVO from '../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import DashboardFavoritesFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardFavoritesFiltersVO';
import CRUDActionsDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import SelectBoxDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SelectBoxDatatableFieldVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VarDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/VarDatatableFieldVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import { ExportVarIndicator } from '../../../../../../shared/modules/DataExport/vos/ExportVarIndicator';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import { IExportOptions } from '../../../../../../shared/modules/DataExport/interfaces/IExportOptions';
import ExportVarcolumnConf from '../../../../../../shared/modules/DataExport/vos/ExportVarcolumnConf';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import WeightHandler from '../../../../../../shared/tools/WeightHandler';
import ModuleTable from '../../../../../../shared/modules/ModuleTable';
import VueComponentBase from '../../../VueComponentBase';
import { SaveFavoritesFiltersWidgetOptions } from './options/SaveFavoritesFiltersWidgetOptions';
import { SaveFavoritesFiltersWidgetController } from './SaveFavoritesFiltersWidgetController';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './SaveFavoritesFiltersWidgetComponent.scss';
import ReloadFiltersWidgetController from '../reload_filters_widget/RealoadFiltersWidgetController';
import SaveFavoritesFiltersModalComponent from './modal/SaveFavoritesFiltersModalComponent';
import VarWidgetOptions from '../var_widget/options/VarWidgetOptions';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import TableWidgetOptions from '../table_widget/options/TableWidgetOptions';
import TableWidgetController from '../table_widget/TableWidgetController';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import FieldValueFilterWidgetOptions from '../field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import ContextQueryFieldVO from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import VarConfVO from '../../../../../../shared/modules/Var/vos/VarConfVO';
import { cloneDeep } from 'lodash';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';

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

    private modal_initialized: boolean = false;

    private start_update: boolean = false;

    private is_modal_open: boolean = false;

    /**
     * On mounted
     *  - Happen on component mount
     */
    private mounted() {
        this.$nextTick(async () => {
            if (!this.modal_initialized) {
                this.modal_initialized = true;
                $("#save_favorites_filters_modal").on("hidden.bs.modal", () => {
                    this.is_modal_open = false;
                });
            }
        });
    }

    /**
     * Watch on is_modal_open
     *  - Happen on component each time is_modal_open changes
     * @returns void
     */
    @Watch('is_modal_open')
    private is_modal_open_watcher() {
        this.handle_modal_state();
    }

    /**
     * Handle Open Modal
     *
     * @return {Promise<void>}
     */
    private async handle_open_modal(): Promise<void> {
        this.get_Savefavoritesfiltersmodalcomponent.open_modal(
            { exportable_data: this.get_exportable_xlsx_params() },
            this.handle_save.bind(this)
        );
    }

    /**
     * Handle Save V1
     *  - Save active dashboard filters for the current user
     *
     * @param {IDashboardFavoritesFiltersProps} [props]
     * @returns {Promise<void>}
     */
    private async handle_save(props: IDashboardFavoritesFiltersProps): Promise<void> {
        if (!props) { return; }

        if (this.start_update) { return; }

        this.start_update = true;

        const favorites_filters = new DashboardFavoritesFiltersVO().from({
            dashboard_id: this.dashboard_page.dashboard_id,
            owner_id: this.data_user.id,
            ...props,
        });

        this.save_favorites_filters(favorites_filters);

        this.start_update = false;
    }

    /**
     * Handle Save V1
     *  - Save active dashboard filters for the current user
     *
     * @return {Promise<void>}
     */
    private async handle_save_v1(): Promise<void> {
        let self = this;

        if (self.start_update) {
            return;
        }

        self.start_update = true;

        let page_filters = null;

        try {
            page_filters = JSON.stringify(self.get_active_field_filters);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        const props = new DashboardFavoritesFiltersVO().from({
            dashboard_id: self.dashboard_page.dashboard_id,
            owner_id: self.data_user.id,
            page_filters,
        });

        self.snotify.prompt(
            self.label('dashboard_viewer.save_favorites_filters.enter_name'),
            self.label('dashboard_viewer.save_favorites_filters.save_favorites'),
            {
                buttons: [
                    {
                        text: self.label('crud.update.modal.save'),
                        action: (toast) => {
                            props.name = toast.value;
                            self.save_favorites_filters(props);

                            return self.snotify.remove(toast.id);
                        },
                    },
                    {
                        text: self.label('crud.update.modal.cancel'),
                        action: (toast) => self.snotify.remove(toast.id)
                    },
                ],
                placeholder: 'Nom', // Max-length = 40,
                showProgressBar: true,
                timeout: 10000,
            });

        self.start_update = false;
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
     * Toggle Modal Open
     *  - Swich modal from show to hide (vice versa)
     */
    private toggle_modal_open() {
        this.is_modal_open = !this.is_modal_open;
    }

    /**
     * Handle Modal State
     *  - Manage modal depending on its state
     */
    private handle_modal_state() {
        if (!this.is_modal_open) {
            $('#save_favorites_filters_modal').modal('hide');
        }
        if (this.is_modal_open) {
            $('#save_favorites_filters_modal').modal('show');
        }
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
     * Get Context Query By Table Widget
     *
     * @param {TableWidgetOptions} [widget_options]
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
            .add_filters(ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters)
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

            // let column: TableColumnDescVO = this.columns_by_field_id[field.datatable_field_uid];
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

            context_query.filters = ContextFilterHandler.getInstance().add_context_filters_exclude_values(
                options.exclude_filter_opt_values,
                options.vo_field_ref,
                context_query.filters,
                true,
            );
        }

        context_query.query_distinct = true;

        return context_query;

    }

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
     * Get Export Options By Table Widget
     *
     * @param {TableWidgetOptions} [widget_options]
     * @return {IExportOptions}
     */
    private get_export_options_by_table_widget(widget_options: TableWidgetOptions): IExportOptions {
        return {
            export_active_field_filters: widget_options.can_export_active_field_filters,
            export_vars_indicator: widget_options.can_export_vars_indicator
        };
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
     * Get Exportable Valuetable Widgets Options
     *
     * @return { { [title_name_code: string]: TableWidgetOptions }}
     */
    get valuetables_widgets_options(): { [title_name_code: string]: { widget_options: TableWidgetOptions, page_widget_id: number } } {

        const res: { [title_name_code: string]: { widget_options: TableWidgetOptions, page_widget_id: number } } = {};

        // Find id of widget that have type "valuetable"
        const valuetable_widget_id = Object.values(this.widgets_by_id)?.find((e) => e.name == 'valuetable').id;

        // valuetable_widget_id required to continue
        if (!valuetable_widget_id) { return; }

        // Find all valuetable widgets of actual page
        const valuetable_page_widgets = Object.values(this.all_page_widget)?.filter(
            (pw) => pw.widget_id == valuetable_widget_id
        );

        for (const key in valuetable_page_widgets) {
            const valuetable_page_widget = valuetable_page_widgets[key];

            const options = JSON.parse(valuetable_page_widget?.json_options ?? '{}');

            const valuetable_widget_options = new TableWidgetOptions().from(options);
            const name = valuetable_widget_options.get_title_name_code_text(valuetable_page_widget.id);

            res[name] = {
                widget_options: valuetable_widget_options,
                page_widget_id: valuetable_page_widget.id,
            };
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