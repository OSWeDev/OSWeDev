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

@Component({
    template: require('./SaveFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersWidgetComponent extends VueComponentBase {

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

        const datatables_widgets_options = this.datatables_widgets_options;
        const res: { [title_name_code: string]: ExportContextQueryToXLSXParamVO } = {};

        let export_name = this.dashboard_page.translatable_name_code_text ?
            `Export-${this.t(this.dashboard_page.translatable_name_code_text)}-{#Date}.xlsx"` :
            `Export-{#Date}.xlsx`;

        for (const name in datatables_widgets_options) {

            const widget_options = datatables_widgets_options[name];

            const widget_options_fields = this.get_datatable_fields_by_widget_options(widget_options);

            // The actual fields to be exported
            let fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};

            for (let i in widget_options_fields) {
                let field = widget_options_fields[i];
                fields[field.datatable_field_uid] = field;
            }

            res[name] = new ExportContextQueryToXLSXParamVO(
                export_name,
                null, // shall be the favorites filters
                this.get_exportable_datatable_columns_by_widget_options(widget_options),
                this.get_datatable_columns_labels_by_widget_options(widget_options),
                this.get_exportable_datatable_custom_field_columns_by_widget_options(widget_options),
                this.get_datatable_columns_by_widget_options(widget_options),
                fields,
                this.get_datatable_varcolumn_conf_by_widget_options(widget_options),
                this.get_active_field_filters, // TODO: to ask
                null, // TODO: to ask
                this.dashboard.api_type_ids,
                null,
                false,
                null,
                null,
                null,
                this.get_export_options_by_widget_options(widget_options),
                this.vars_indicator,
            );
        }

        return res;
    }

    /**
     * Get Export Options By Table Widget
     *
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

            if (column.type != TableColumnDescVO.TYPE_header) {
                moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
            }

            switch (column.type) {
                case TableColumnDescVO.TYPE_component:
                    res[column.id] = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
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
     * @param {TableWidgetOptions} [widget_options]
     * @returns {any}
     */
    private get_datatable_columns_labels_by_widget_options(widget_options: TableWidgetOptions): any {
        let res: any = {};

        const columns = this.get_datatable_columns_by_widget_options(widget_options);

        for (let i in columns) {
            let column = columns[i];

            if (column?.type == TableColumnDescVO.TYPE_header) {
                for (const key in column.children) {
                    let child = column.children[key];
                    res[child.datatable_field_uid] = this.t(child.get_translatable_name_code_text(this.page_widget.id));
                }
            } else {
                res[column.datatable_field_uid] = this.t(column.get_translatable_name_code_text(this.page_widget.id));
            }
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

        if (!this.widget_options) { return; }

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
    get datatables_widgets_options(): { [title_name_code: string]: TableWidgetOptions } {

        const res: { [title_name_code: string]: TableWidgetOptions } = {};

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

            res[name] = valuetable_widget_options;
        }

        return res;
    }
}