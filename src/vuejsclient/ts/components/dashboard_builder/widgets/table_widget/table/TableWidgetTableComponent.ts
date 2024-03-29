import 'jquery-contextmenu';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';

import { cloneDeep, debounce, isEqual } from 'lodash';
import slug from 'slug';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleContextFilter from '../../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVOHandler from '../../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import DAOController from '../../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../../shared/modules/DAO/vos/CRUD';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import CRUDActionsDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/CRUDActionsDatatableFieldVO';
import Datatable from '../../../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SelectBoxDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/SelectBoxDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import VarDatatableFieldVO from '../../../../../../../shared/modules/DAO/vos/datatable/VarDatatableFieldVO';
import DashboardBuilderController from '../../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import FieldFiltersVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/FieldFiltersVOHandler';
import FieldFiltersVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import TableWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import VOFieldRefVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/VOFieldRefVOManager';
import BulkActionVO from '../../../../../../../shared/modules/DashboardBuilder/vos/BulkActionVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import ModuleDataExport from '../../../../../../../shared/modules/DataExport/ModuleDataExport';
import ExportVarIndicatorVO from '../../../../../../../shared/modules/DataExport/vos/ExportVarIndicatorVO';
import ExportVarcolumnConfVO from '../../../../../../../shared/modules/DataExport/vos/ExportVarcolumnConfVO';
import ExportContextQueryToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IArchivedVOBase from '../../../../../../../shared/modules/IArchivedVOBase';
import ModuleTable from '../../../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarConfVO from '../../../../../../../shared/modules/Var/vos/VarConfVO';
import ModuleVocus from '../../../../../../../shared/modules/Vocus/ModuleVocus';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import SemaphoreHandler from '../../../../../../../shared/tools/SemaphoreHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../../shared/tools/WeightHandler';
import VueAppBase from '../../../../../../VueAppBase';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import CRUDComponentManager from '../../../../crud/CRUDComponentManager';
import CRUDComponentField from '../../../../crud/component/field/CRUDComponentField';
import DatatableRowController from '../../../../datatable/component/DatatableRowController';
import DatatableComponentField from '../../../../datatable/component/fields/DatatableComponentField';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from '../../field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import ValidationFiltersWidgetController from '../../validation_filters_widget/ValidationFiltersWidgetController';
import VarWidgetComponent from '../../var_widget/VarWidgetComponent';
import VarWidgetOptions from '../../var_widget/options/VarWidgetOptions';
import TableWidgetController from './../TableWidgetController';
import CRUDCreateModalComponent from './../crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from './../crud_modals/update/CRUDUpdateModalComponent';
import TablePaginationComponent from './../pagination/TablePaginationComponent';
import './TableWidgetTableComponent.scss';
import ValidationFiltersWidgetOptions from '../../validation_filters_widget/options/ValidationFiltersWidgetOptions';

//TODO Faire en sorte que les champs qui n'existent plus car supprimés du dashboard ne se conservent pas lors de la création d'un tableau

@Component({
    template: require('./TableWidgetTableComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Crudupdatemodalcomponent: CRUDUpdateModalComponent,
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
    }
})
export default class TableWidgetTableComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleDashboardPageAction
    private set_query_api_type_ids: (query_api_type_ids: string[]) => void;

    @ModuleDashboardPageAction
    private clear_active_field_filters: () => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @Prop({ default: false })
    private is_edit_mode: boolean;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private data_rows: any[] = [];

    private selected_rows: any[] = [];

    private throttle_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);
    private debounced_onchange_dashboard_vo_route_param = debounce(this.onchange_dashboard_vo_route_param, 100);

    private pagination_count: number = 0;
    private pagination_offset: number = 0;

    private order_asc_on_id: number = null;
    private order_desc_on_id: number = null;

    private can_open_vocus_right: boolean = null;
    private can_delete_all_right: boolean = null;
    private can_delete_right: boolean = null;
    private can_update_right: boolean = null;
    private can_create_right: boolean = null;

    private loaded_once: boolean = false;
    private is_busy: boolean = false;

    private actual_page_rows_datas_query: ContextQueryVO = null;
    private actual_all_rows_datas_query: ContextQueryVO = null;
    private actual_rows_count_query: ContextQueryVO = null;

    private rows_count_query_string: string = null;
    private page_rows_datas_query_string: string = null;
    private all_rows_datas_query_string: string = null;

    private filter_by_access_cache: { [translatable_policy_name: string]: boolean } = {};

    private is_filtering_by: boolean = false;
    private filtering_by_active_field_filter: ContextFilterVO = null;

    private limit: number = null;
    private tmp_nbpages_pagination_list: number = null;
    private update_cpt_live: number = 0;
    private array_of_headers: TableColumnDescVO[] = [];

    private sticky_left_by_col_id: { [col_id: number]: number } = {};
    private has_sticky_cols: boolean = false;
    private last_sticky_col_id: number = null;

    private column_total: { [api_type_id: string]: { [field_id: string]: number } } = {};

    private last_calculation_cpt: number = 0;

    private old_widget_options: TableWidgetOptionsVO = null;
    private widget_options: TableWidgetOptionsVO = null;
    private old_columns: TableColumnDescVO[] = null;

    private table_columns: TableColumnDescVO[] = [];

    private selected_vos: { [id: number]: boolean } = {};
    private vos_by_id: { [id: number]: any } = {};

    private show_export_alert: boolean = false;

    private throttle_update_query_strings = ThrottleHelper.declare_throttle_without_args(this.update_query_strings.bind(this), 100);

    get all_page_widgets_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);
    }

    get can_getquerystr() {
        return this.is_edit_mode;
    }

    @Watch('columns', { immediate: true })
    private async onchange_columns() {
        if (isEqual(this.columns, this.old_columns)) {
            return;
        }

        this.old_columns = cloneDeep(this.columns);

        await this.throttle_update_visible_options();
    }

    /**
     * On doit avoir accepté sur la tableau, sur le champs, etre readonly
     * Can Filter By
     * Defining if column can be filtered depending on its properties
     *  - column shall provide can_filter_by
     *  - column shall be readonly
     *  - column shall not provide crud actions
     */
    private can_filter_by(column: TableColumnDescVO): boolean {
        return this.widget_options &&
            this.widget_options.can_filter_by &&
            column &&
            column.can_filter_by &&
            column.readonly &&
            (column.datatable_field_uid != '__crud_actions');
    }

    /**
     * Is Filtering By Col
     * Defining if this datatable widget is currently filtering
     *  - By the given column field_id
     */
    private is_filtering_by_col(column: TableColumnDescVO): boolean {
        return this.is_filtering_by &&
            this.filtering_by_active_field_filter && (
                (this.filtering_by_active_field_filter.field_id == column.field_id) ||
                ((!column.field_id) && (this.filtering_by_active_field_filter.field_id == 'id'))
            ) && (this.filtering_by_active_field_filter.vo_type == column.api_type_id);
    }

    /**
     * Handle Filter By
     *  - Happen each time we want toggle filter (on click row filter)
     */
    private handle_filter_by(column: TableColumnDescVO, datatable_field_uid: string, vo: any) {

        // case when no Value Object
        // - empty the active filter
        if (!vo) {
            this.is_filtering_by = false;
            this.filtering_by_active_field_filter = null;
            this.remove_active_field_filter({ vo_type: column.api_type_id, field_id: (column.field_id ?? 'id') });
            return;
        }

        let raw_value = vo[datatable_field_uid + '__raw'];
        // let field_value = vo ? vo[datatable_field_uid] : null;

        this.is_filtering_by = true;

        let context_filter: ContextFilterVO = new ContextFilterVO();
        context_filter.vo_type = column.api_type_id;
        context_filter.field_id = column.field_id;

        // case when field_id is "id" or datatable_field_uid is crud action
        if ((!column.field_id) || (column.field_id == 'id') || (column.datatable_field_uid == "__crud_actions")) {

            if (!raw_value) {
                context_filter.has_null();
            } else {
                context_filter.by_id(raw_value);
            }
        } else {
            let moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
            let field = moduleTable.get_field_by_id(column.field_id);

            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_html:
                case ModuleTableField.FIELD_TYPE_password:
                case ModuleTableField.FIELD_TYPE_textarea:
                case ModuleTableField.FIELD_TYPE_email:
                case ModuleTableField.FIELD_TYPE_string:
                    if (raw_value == null) {
                        context_filter.has_null();
                    } else {
                        context_filter.by_text_has(raw_value);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_enum:
                    if (raw_value == null) {
                        context_filter.has_null();
                    } else {
                        context_filter.by_num_eq(raw_value);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_int:
                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_foreign_key:
                case ModuleTableField.FIELD_TYPE_amount:
                case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_prct:
                    if (raw_value == null) {
                        context_filter.has_null();
                    } else {
                        context_filter.by_num_eq(raw_value);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_file_ref:
                case ModuleTableField.FIELD_TYPE_image_field:
                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_image_ref:
                case ModuleTableField.FIELD_TYPE_html_array:
                case ModuleTableField.FIELD_TYPE_boolean:
                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                case ModuleTableField.FIELD_TYPE_geopoint:
                case ModuleTableField.FIELD_TYPE_numrange:
                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_file_field:
                case ModuleTableField.FIELD_TYPE_float_array:
                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_string_array:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_daterange:
                case ModuleTableField.FIELD_TYPE_tstz:
                case ModuleTableField.FIELD_TYPE_tstz_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                case ModuleTableField.FIELD_TYPE_tsrange:
                case ModuleTableField.FIELD_TYPE_hour:
                case ModuleTableField.FIELD_TYPE_hourrange:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_day:
                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                case ModuleTableField.FIELD_TYPE_month:
                case ModuleTableField.FIELD_TYPE_translatable_text:
                default:
                    throw new Error('Not implemented');
            }

        }

        this.set_active_field_filter({
            field_id: column.field_id,
            vo_type: column.api_type_id,
            active_field_filter: context_filter,
        });

        this.filtering_by_active_field_filter = context_filter;
    }

    private get_column_filter(column: TableColumnDescVO): any {
        if (!column) {
            return null;
        }

        if (!column.filter_type) {
            return null;
        }

        if (!this.const_filters[column.filter_type]) {
            return null;
        }

        return this.const_filters[column.filter_type].read;
    }

    private get_column_filter_additional_params(column: TableColumnDescVO): any {
        if (!column) {
            return null;
        }

        return column.filter_additional_params ? ObjectHandler.try_get_json(column.filter_additional_params) : undefined;
    }

    /**
     * Is Row Filter Active
     *  - Say that if the current row is filtered
     * @param row
     * @returns boolean
     */
    private is_row_filter_active(row: any): boolean {
        if (!row) {
            return true;
        }

        if (!this.filtering_by_active_field_filter) {
            return true;
        }

        if (!this.columns) {
            return true;
        }

        // Search for column with the active filter field_id
        // must return with length 1
        let columns = this.columns.filter((c) => (c.api_type_id == this.filtering_by_active_field_filter.vo_type) && (
            (c.field_id == this.filtering_by_active_field_filter.field_id) ||
            ((!c.field_id) && (this.filtering_by_active_field_filter.field_id == 'id')) ||
            ((c.datatable_field_uid == "__crud_actions") && (this.filtering_by_active_field_filter.field_id == 'id'))
        ));

        let column = columns ? columns[0] : null;
        if (!column) {
            return true;
        }

        // cas de l'id
        if ((!column.field_id) || (column.field_id == 'id') || (column.datatable_field_uid == "__crud_actions")) {

            if (this.filtering_by_active_field_filter.filter_type == ContextFilterVO.TYPE_NULL_ANY) {
                return row['__crud_actions'] == null;
            }
            return row['__crud_actions'] == this.filtering_by_active_field_filter.param_numeric;
        } else {

            let moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
            let field = moduleTable.get_field_by_id(column.field_id);

            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_html:
                case ModuleTableField.FIELD_TYPE_password:
                case ModuleTableField.FIELD_TYPE_textarea:
                case ModuleTableField.FIELD_TYPE_email:
                case ModuleTableField.FIELD_TYPE_string:
                    if (this.filtering_by_active_field_filter.filter_type == ContextFilterVO.TYPE_NULL_ANY) {
                        return row[column.datatable_field_uid + '__raw'] == null;
                    }
                    return row[column.datatable_field_uid + '__raw'] == this.filtering_by_active_field_filter.param_text;

                case ModuleTableField.FIELD_TYPE_enum:
                case ModuleTableField.FIELD_TYPE_int:
                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_foreign_key:
                case ModuleTableField.FIELD_TYPE_amount:
                case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_prct:
                    if (this.filtering_by_active_field_filter.filter_type == ContextFilterVO.TYPE_NULL_ANY) {
                        return row[column.datatable_field_uid + '__raw'] == null;
                    }
                    return row[column.datatable_field_uid + '__raw'] == this.filtering_by_active_field_filter.param_numeric;

                case ModuleTableField.FIELD_TYPE_file_ref:
                case ModuleTableField.FIELD_TYPE_image_field:
                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_image_ref:
                case ModuleTableField.FIELD_TYPE_html_array:
                case ModuleTableField.FIELD_TYPE_boolean:
                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                case ModuleTableField.FIELD_TYPE_geopoint:
                case ModuleTableField.FIELD_TYPE_numrange:
                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_file_field:
                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_float_array:
                case ModuleTableField.FIELD_TYPE_string_array:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_daterange:
                case ModuleTableField.FIELD_TYPE_tstz:
                case ModuleTableField.FIELD_TYPE_tstz_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                case ModuleTableField.FIELD_TYPE_tsrange:
                case ModuleTableField.FIELD_TYPE_hour:
                case ModuleTableField.FIELD_TYPE_hourrange:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_day:
                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                case ModuleTableField.FIELD_TYPE_month:
                case ModuleTableField.FIELD_TYPE_translatable_text:
                default:
                    throw new Error('Not implemented');
            }
        }
    }

    /**
     * Get Active Filter Params By Translatable Name Code Text
     *  - Shall provide parameters (from active filter) for dynamique translated text
     *
     * @param {string} code
     * @returns {[param_key: string]: string | number}
     */
    private get_active_filter_translation_params_by_translatable_name_code_text(code: string): { [param_key: string]: string | number } {
        if (!(code?.length > 0)) {
            return;
        }

        const active_field_filters = this.get_active_field_filters;

        // We must have active fields filters
        if (!(Object.keys(active_field_filters)?.length > 0)) {
            return;
        }

        let res: { [param_key: string]: string | number } = null;

        const translated_text: string = this.get_flat_locale_translations[code];

        // Active filter checker + get page_widget_id e.g. {#active_filter:500}
        const rgx = /\{[\"|\']?(?<checker_name>\#active_filter\:)(?<page_widget_id>\w+)[\"|\']?\}/;

        // Check if translated text contains active filter checker
        const is_active_filter_type = rgx.test(translated_text);

        if (is_active_filter_type) {
            res = {};

            // exec regex on translated text
            const rgx_result = rgx.exec(translated_text);

            const { page_widget_id } = rgx_result?.groups;

            // TODO: find field_filter by page_widget_id instead of filter_name
            const page_widget = this.all_page_widget.find((pw: DashboardPageWidgetVO) => {
                return pw.id == parseInt(page_widget_id);
            });

            // Case when page_widget does not exist
            if (!page_widget) {
                return;
            }

            const widget_options = JSON.parse(page_widget.json_options);

            // Case when widget_options is not a vo_field_ref
            const vo_field_ref = VOFieldRefVOManager.create_vo_field_ref_vo_from_widget_options(
                widget_options,
            );

            // Find the actual field filters key (required by translated text) from active_field_filters
            const field_filters_key: string = Object.keys(active_field_filters)
                .find((key_a) => Object.keys(active_field_filters[key_a])
                    .find((key_b) => key_b === vo_field_ref.field_id)
                );

            // Case when active filter does not exist
            if (!(field_filters_key?.length > 0)) {
                return;
            }

            // The actual required filter
            // - At this step it must be found
            const context_filter: ContextFilterVO = active_field_filters[field_filters_key][vo_field_ref.field_id];

            // filter to HMI readable
            const filter_readable = ContextFilterVOHandler.context_filter_to_readable_ihm(context_filter);

            // The params_key to be used in translated text
            const params_key = `#active_filter:${page_widget_id}`;

            res[params_key] = filter_readable;
        }

        return res;
    }

    private get_identifier(vo: any): number {
        return vo.__crud_actions;
    }

    private async callback_action(action: BulkActionVO) {
        if (!action) {
            return;
        }

        await action.callback(this.selected_vos_true);

        this.refresh();
    }

    get can_refresh(): boolean {
        return this.widget_options && this.widget_options.refresh_button;
    }

    get show_export_maintenance_alert(): boolean {
        return this.widget_options && this.widget_options.has_export_maintenance_alert;
    }

    get can_export(): boolean {
        return this.widget_options && this.widget_options.export_button;
    }

    get show_bulk_edit(): boolean {
        return this.widget_options && this.widget_options.show_bulk_edit;
    }

    get default_export_option(): number {
        return this.widget_options && this.widget_options.export_button && this.widget_options.has_default_export_option && this.widget_options.default_export_option ? this.widget_options.default_export_option : null;
    }

    get show_limit_selectable(): boolean {
        return this.widget_options && this.widget_options.show_limit_selectable;
    }

    get show_pagination_resumee(): boolean {
        return this.widget_options && this.widget_options.show_pagination_resumee;
    }

    get show_pagination_slider(): boolean {
        return this.widget_options && this.widget_options.show_pagination_slider;
    }

    get show_pagination_form(): boolean {
        return this.widget_options && this.widget_options.show_pagination_form;
    }

    get show_pagination_list(): boolean {
        return this.widget_options && this.widget_options.show_pagination_list;
    }

    get has_table_total_footer(): boolean {
        return this.widget_options && this.widget_options.has_table_total_footer;
    }

    get limit_selectable(): string[] {
        return (this.widget_options && this.widget_options.limit_selectable) ? this.widget_options.limit_selectable.split(",") : null;
    }

    get can_create(): boolean {
        if (!this.crud_activated_api_type) {
            return false;
        }

        return this.can_create_right && this.widget_options.create_button;
    }

    get can_update(): boolean {
        if (!this.crud_activated_api_type) {
            return false;
        }

        return this.can_update_right && this.widget_options.update_button;
    }

    get can_delete(): boolean {
        if (!this.crud_activated_api_type) {
            return false;
        }

        return this.can_delete_right && this.widget_options.delete_button;
    }

    get can_delete_all(): boolean {
        if (!this.crud_activated_api_type) {
            return false;
        }

        return this.can_delete_all_right && this.widget_options.delete_all_button;
    }

    get can_open_vocus(): boolean {
        if (!this.crud_activated_api_type) {
            return false;
        }

        return this.can_open_vocus_right && this.widget_options.vocus_button;
    }

    private async mounted() {
        const validation_page_widgets = this.get_validation_page_widgets();

        if (validation_page_widgets?.length > 0) {
            // Updater to update visible options when call_updater is called
            // - throttle_call_updaters is called by the validation_filters_widget for example
            await ValidationFiltersWidgetController.getInstance().register_updater(
                this.dashboard_page.dashboard_id,
                this.dashboard_page.id,
                this.page_widget.id,
                this.throttle_do_update_visible_options.bind(this),
                validation_page_widgets[0].id,
            );
        }

        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );

        this.stopLoading();

        if (this.can_getquerystr) {

            /**
             * On ajoute le contextmenu
             */
            SemaphoreHandler.do_only_once("TableWidgetTableComponent.contextmenu", () => {
                $['contextMenu']({
                    selector: ".table_widget_component .table_wrapper table",
                    items: this.contextmenu_items
                });
            });
        }
    }

    @Watch('dashboard_vo_action')
    @Watch('dashboard_vo_id', { immediate: true })
    @Watch('api_type_id_action')
    private async onchange_dashboard_vo_props() {
        await this.debounced_onchange_dashboard_vo_route_param();
    }

    @Watch('crud_activated_api_type', { immediate: true })
    private async onchange_crud_activated_api_type() {
        if (!this.crud_activated_api_type) {
            return;
        }

        if (this.can_open_vocus_right == null) {
            this.can_open_vocus_right = await ModuleAccessPolicy.getInstance().testAccess(ModuleVocus.POLICY_BO_ACCESS);
        }

        if (this.can_delete_right == null) {
            this.can_delete_right = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, this.crud_activated_api_type));
        }

        if (this.can_delete_all_right == null) {
            let crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.crud_activated_api_type];
            if (!crud) {
                this.can_delete_all_right = this.can_delete_right;
            } else {
                this.can_delete_all_right = this.can_delete_right && await ModuleAccessPolicy.getInstance().testAccess(crud.delete_all_access_right);
            }
        }

        if (this.can_update_right == null) {
            this.can_update_right = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.crud_activated_api_type));
        }

        if (this.can_create_right == null) {
            this.can_create_right = await ModuleAccessPolicy.getInstance().testAccess(
                DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.crud_activated_api_type));
        }
    }

    private async open_update(type: string, id: number) {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([type]);
        let update_vo = await query(type).filter_by_id(id).select_vo();

        if (update_vo && update_vo.id) {
            await this.get_Crudupdatemodalcomponent.open_modal(update_vo, this.onclose_modal.bind(this));
        }
    }

    private async onclose_modal() {
        let route_name: string = this.$route.name.replace(DashboardBuilderController.ROUTE_NAME_CRUD, '').replace(DashboardBuilderController.ROUTE_NAME_CRUD_ALL, '');

        let route_params = cloneDeep(this.$route.params);

        delete route_params.dashboard_vo_action;
        delete route_params.dashboard_vo_id;
        delete route_params.api_type_id_action;

        this.$router.push({
            name: route_name,
            params: route_params,
        });

        await this.update_visible_options();
    }

    private async open_create() {
        await this.get_Crudcreatemodalcomponent.open_modal(this.crud_activated_api_type, this.update_visible_options.bind(this));
    }

    private async onchange_dashboard_vo_route_param() {
        if (this.dashboard_vo_action == DashboardBuilderController.DASHBOARD_VO_ACTION_ADD) {
            await this.open_create();
            return;
        }

        if ((this.dashboard_vo_action == DashboardBuilderController.DASHBOARD_VO_ACTION_EDIT) && (!!this.dashboard_vo_id)) {
            let api_type_id: string = this.api_type_id_action ? this.api_type_id_action : (this.widget_options ? this.widget_options.crud_api_type_id : null);

            if (api_type_id) {
                await this.open_update(api_type_id, parseInt(this.dashboard_vo_id));
            }

            return;
        }

        if ((this.dashboard_vo_action == DashboardBuilderController.DASHBOARD_VO_ACTION_DELETE) && (!!this.dashboard_vo_id)) {
            let api_type_id: string = this.api_type_id_action ? this.api_type_id_action : (this.widget_options ? this.widget_options.crud_api_type_id : null);

            if (api_type_id) {
                await this.confirm_delete(api_type_id, parseInt(this.dashboard_vo_id));
            }

            return;
        }

        if ((this.dashboard_vo_action == DashboardBuilderController.DASHBOARD_VO_ACTION_VOCUS) && (!!this.dashboard_vo_id)) {
            let api_type_id: string = this.api_type_id_action ? this.api_type_id_action : (this.widget_options ? this.widget_options.crud_api_type_id : null);

            if (api_type_id) {
                this.open_vocus(api_type_id, parseInt(this.dashboard_vo_id));
            }

            return;
        }
    }

    get vocus_button(): boolean {
        return (this.widget_options && this.widget_options.vocus_button);
    }

    get show_select(): boolean {
        return (!!this.crud_activated_api_type);
    }

    get show_crud_actions(): boolean {
        return (!!this.crud_activated_api_type);
    }

    get crud_activated_api_type(): string {
        if (!this.widget_options) {
            return null;
        }

        if (this.api_type_id_action) {
            return this.api_type_id_action;
        }

        return this.widget_options.crud_api_type_id;
    }

    get hide_pagination_bottom(): boolean {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.hide_pagination_bottom;
    }

    get update_button(): boolean {
        return (this.widget_options && this.widget_options.update_button);
    }

    get delete_button(): boolean {
        return (this.widget_options && this.widget_options.delete_button);
    }

    get archive_button(): boolean {
        return (this.widget_options && this.widget_options.archive_button);
    }

    private async sort_by(column: TableColumnDescVO) {
        if (!column) {
            this.order_asc_on_id = null;
            this.order_desc_on_id = null;
            await this.update_visible_options();
            return;
        }

        // Si colonne de type !vo_field_ref, on ne fait rien
        if (column?.type !== TableColumnDescVO.TYPE_vo_field_ref) {
            return;
        }

        if ((this.order_asc_on_id != column.id) && (this.order_desc_on_id != column.id)) {
            this.order_asc_on_id = column.id;
            this.order_desc_on_id = null;
            await this.update_visible_options(true);
            return;
        }

        if (this.order_asc_on_id != column.id) {
            this.order_asc_on_id = column.id;
            this.order_desc_on_id = null;
            await this.update_visible_options(true);
            return;
        }

        this.order_desc_on_id = column.id;
        this.order_asc_on_id = null;
        await this.update_visible_options(true);
        return;
    }

    private async change_offset(new_offset: number) {
        if (new_offset != this.pagination_offset) {
            this.pagination_offset = new_offset;

            this.selected_vos = {};

            await this.throttle_do_update_visible_options();
        }
    }

    private async change_tmp_nbpages_pagination_list(new_tmp_nbpages_pagination_list: number) {
        if (new_tmp_nbpages_pagination_list != this.pagination_offset) {
            this.tmp_nbpages_pagination_list = new_tmp_nbpages_pagination_list;
            await this.throttle_do_update_visible_options();
        }
    }

    private async change_limit(new_limit: number) {
        if (new_limit != this.pagination_offset) {
            this.limit = new_limit;
            await this.throttle_do_update_visible_options();
        }
    }

    get columns_by_field_id(): { [datatable_field_uid: string]: TableColumnDescVO } {
        let res: { [datatable_field_uid: string]: TableColumnDescVO } = {};

        for (let i in this.columns) {
            let column = this.columns[i];

            res[column.datatable_field_uid] = column;
        }
        return res;
    }

    get table_header_title(): string {
        if ((!this.widget_options) || (!this.page_widget)) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_title_name_code_text(this.page_widget.id)];
    }

    get columns(): TableColumnDescVO[] {
        let options: TableWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.columns)) {
            return null;
        }

        let res: TableColumnDescVO[] = [];
        let sticky_left: number = 0;
        for (let i in options.columns) {

            let column = options.columns[i];

            if (column.readonly == null) {
                column.readonly = true;
            }
            if (column.column_width == null) {
                column.column_width = 0;
            }
            if (column.is_sticky) {
                this.sticky_left_by_col_id[column.id] = sticky_left;
                sticky_left += parseInt(column.column_width.toString());
                this.has_sticky_cols = true;
                this.last_sticky_col_id = column.id;
            }

            if (FieldFiltersVOManager.is_column_filtered(column, this.filter_by_access_cache, this.get_active_field_filters, this.all_page_widgets_by_id)) {
                continue;
            }

            res.push(Object.assign(new TableColumnDescVO(), column));
        }
        WeightHandler.getInstance().sortByWeight(res);
        //je crée un clone de res pour pouvoir l'utiliser sans qu'il se mettent a jour
        // let array_of_header = cloneDeep(res);
        // let index_for_push: number[] = [];
        // //je releve les index des colonnes qui sont pas de type header
        // for (const key in array_of_header) {
        //     let header = array_of_header[key];
        //     if (header.type == TableColumnDescVO.TYPE_header) {
        //         index_for_push.push(array_of_header.indexOf(header));
        //     }
        // }
        // vue que je ne peut pas effacer un element en garentissant que j effacer le bonne element j'ajoute dans un nouveau tableau
        // let final_array_of_header = [];
        // for (let j = 0; j < index_for_push.length; j++) {
        //     const index = index_for_push[j];
        //     final_array_of_header.push(array_of_header[index]);
        // }
        // //j'ajoute le array des header nettoyer dans la variable d'iteration du pug
        // this.array_of_headers = res;
        // this.array_of_headers = final_array_of_header;
        // vue que je ne peut pas effacer un element en garentissant que j effacer le bonne element j'ajoute dans un nouveau tableau pour l'affichage final dans le dashboardboardbuilder
        for (const u in res) {
            let column = res[u];
            let final_res = [];
            if (column?.type == TableColumnDescVO.TYPE_header || column.children.length > 0) {
                //pour mettre a plat les colonne pour l affichage
                for (const r in column.children) {
                    let children = column.children[r];
                    let index = column.children.indexOf(children);
                    // column.children.push(Object.assign(new TableColumnDescVO(), children));
                    final_res.push(Object.assign(new TableColumnDescVO(), children));
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
        // res = final_res;
        return res;
    }

    get default_widget_options_columns(): TableColumnDescVO[] {
        let options: TableWidgetOptionsVO = this.widget_options;

        if (!(options?.columns?.length > 0)) {
            return null;
        }

        let res: TableColumnDescVO[] = [];
        let sticky_left: number = 0;
        for (let i in options.columns) {

            let column = options.columns[i];

            if (column.readonly == null) {
                column.readonly = true;
            }
            if (column.column_width == null) {
                column.column_width = 0;
            }
            if (column.is_sticky) {
                this.sticky_left_by_col_id[column.id] = sticky_left;
                sticky_left += parseInt(column.column_width.toString());
                this.has_sticky_cols = true;
                this.last_sticky_col_id = column.id;
            }

            /**
             * Gestion du check des droits
             */
            if (column.filter_by_access && !this.filter_by_access_cache[column.filter_by_access]) {
                continue;
            }

            res.push(Object.assign(new TableColumnDescVO(), column));
        }

        WeightHandler.getInstance().sortByWeight(res);

        return res;
    }

    get colspan_total(): number {
        if (!this.columns || !this.columns.length) {
            return null;
        }

        let res: number = 0;

        for (let i in this.columns) {
            if (this.columns[i].hide_from_table) {
                continue;
            }

            if (!this.is_column_type_number(this.columns[i])) {
                res++;
                continue;
            }

            return res;
        }
    }

    get colspan_total_with_hidden(): number {
        if (!this.columns || !this.columns.length) {
            return null;
        }

        let res: number = 0;

        for (let i in this.columns) {
            if (!this.is_column_type_number(this.columns[i])) {
                res++;
                continue;
            }

            return res;
        }
    }

    private async onchange_column(
        row: any,
        field: DatatableField<any, any>,
        value: any,
        crudComponentField: CRUDComponentField
    ) {

        let self = this;
        self.snotify.async(self.label('TableWidgetComponent.onchange_column.start'), () =>
            new Promise(async (resolve, reject) => {

                try {

                    // on récupère l'id de l'objet à modifier
                    // comme on force sur le crud_api_type_id, on peut juste récupérer cet id
                    let vo_id = row['__crud_actions'];
                    let vo = await query(field.vo_type_id).filter_by_id(vo_id).select_vo();

                    switch (field?.type) {
                        case DatatableField.SIMPLE_FIELD_TYPE:
                            let simpleField = (field as SimpleDatatableFieldVO<any, any>);
                            vo[simpleField.module_table_field_id] = value;
                            let data_row_index = this.data_rows.findIndex((e) => e.__crud_actions == row.__crud_actions);
                            this.data_rows[data_row_index][simpleField.module_table_field_id] = value;
                            await ModuleDAO.getInstance().insertOrUpdateVO(vo);
                            break;
                        default:
                            throw new Error('Not Implemented');
                    }
                    await self.throttle_do_update_visible_options();

                    resolve({
                        body: self.label('TableWidgetComponent.onchange_column.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                } catch (error) {
                    ConsoleHandler.error(error);
                    await self.throttle_do_update_visible_options();
                    reject({
                        body: self.label('TableWidgetComponent.onchange_column.failed'),
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

    get fields(): { [column_id: number]: DatatableField<any, any> } {
        let res: { [column_id: number]: DatatableField<any, any> } = {};

        if (!this.widget_options) {
            return res;
        }

        for (let i in this.columns) {
            let column: TableColumnDescVO = this.columns[i];
            let moduleTable: ModuleTable<any>;

            if (column?.type != TableColumnDescVO.TYPE_header) {
                moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
            }

            switch (column?.type) {
                case TableColumnDescVO.TYPE_component:
                    res[column.id] = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
                    break;
                case TableColumnDescVO.TYPE_var_ref:

                    const var_data_field: VarDatatableFieldVO<any, any> = VarDatatableFieldVO.createNew(
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
                    // let field_type = field ? field.field_type : moduletablfiel
                    // switch (field.field_type) {

                    // let data_field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field.field_id, field.field_label.code_text);
                    // data_field.setModuleTable(moduleTable);²
                    // res[column.id] = data_field;
                    // break;
                    // default:

                    // Cas de l'id
                    if (!field) {
                        res[column.id] = SimpleDatatableFieldVO.createNew(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                        break;
                    }

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
        // for (let i in this.widget_options.columns) {
        //     let column: TableColumnDescVO = this.widget_options.columns[i];
        //     let moduleTable: ModuleTable<any>;

        //     if (column.type != TableColumnDescVO.TYPE_header) {
        //         moduleTable = VOsTypesManager.moduleTables_by_voType[column.api_type_id];
        //     }

        //     switch (column.type) {
        //         case TableColumnDescVO.TYPE_component:
        //             res[column.id] = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
        //             break;
        //         case TableColumnDescVO.TYPE_var_ref:
        //             let var_data_field: VarDatatableFieldVO<any, any> = VarDatatableFieldVO.createNew(
        //                 column.id.toString(), column.var_id, column.filter_type, column.filter_additional_params,
        //                 this.dashboard.id, column.get_translatable_name_code_text(this.page_widget.id)).auto_update_datatable_field_uid_with_vo_type();
        //             res[column.id] = var_data_field;
        //             break;
        //         case TableColumnDescVO.TYPE_header:
        //             //to do surment a complete
        //             let semaphore: string;
        //             for (let f = 0; f < column.children.length; f++) {
        //                 let children = column.children[f];
        //                 if (!semaphore || children.field_id != semaphore) {
        //                     moduleTable = VOsTypesManager.moduleTables_by_voType[children.api_type_id];
        //                     let result = this.switch_for_type_header(children, moduleTable);
        //                     result.is_required = true;
        //                     res[children.id] = result;
        //                 }
        //                 semaphore = children.field_id;

        //             }

        //             break;
        //         case TableColumnDescVO.TYPE_vo_field_ref:
        //             let field = moduleTable.get_field_by_id(column.field_id);
        //             // let field_type = field ? field.field_type : moduletablfiel
        //             // switch (field.field_type) {

        //             // let data_field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field.field_id, field.field_label.code_text);
        //             // data_field.setModuleTable(moduleTable);
        //             // res[column.id] = data_field;
        //             // break;
        //             // default:

        //             // if (!field) {
        //             //     res[column.id] = SimpleDatatableFieldVO.createNew(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type().set_translatable_title();
        //             //     break;
        //             // }

        //             let data_field: DatatableField<any, any> = CRUD.get_dt_field(field);

        //             // sur un simple on set le label
        //             if (data_field['set_translatable_title']) {
        //                 data_field['set_translatable_title'](field.field_label.code_text);
        //             }

        //             data_field.setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
        //             res[column.id] = data_field;
        //             //         break;
        //             // }
        //             break;
        //         case TableColumnDescVO.TYPE_crud_actions:
        //             res[column.id] = CRUDActionsDatatableFieldVO.createNew().setModuleTable(moduleTable);
        //             break;
        //         case TableColumnDescVO.TYPE_select_box:
        //             res[column.id] = SelectBoxDatatableFieldVO.createNew().setModuleTable(moduleTable);
        //             break;
        //     }
        // }
        return res;
    }

    get default_widget_options_fields(): { [column_id: number]: DatatableField<any, any> } {
        let res: { [column_id: number]: DatatableField<any, any> } = {};

        if (!this.widget_options) {
            return res;
        }

        for (let i in this.default_widget_options_columns) {
            let column: TableColumnDescVO = this.default_widget_options_columns[i];
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

                    if (!field) {
                        res[column.id] = SimpleDatatableFieldVO.createNew(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                        break;
                    }

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


    private switch_for_type_header(column: TableColumnDescVO, moduleTable: ModuleTable<any>) {
        let res: DatatableField<any, any>;
        switch (column?.type) {
            case TableColumnDescVO.TYPE_component:
                res = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
                break;
            case TableColumnDescVO.TYPE_var_ref:
                let var_data_field: VarDatatableFieldVO<any, any> = VarDatatableFieldVO.createNew(
                    column.id.toString(),
                    column.var_id,
                    column.filter_type,
                    column.filter_additional_params,
                    this.dashboard.id
                ).auto_update_datatable_field_uid_with_vo_type(); //, column.get_translatable_name_code_text(this.page_widget.id)
                res = var_data_field;
                break;
            case TableColumnDescVO.TYPE_vo_field_ref:
                let field = moduleTable.get_field_by_id(column.field_id);
                // let field_type = field ? field.field_type : moduletablfiel
                // switch (field.field_type) {

                // let data_field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field.field_id, field.field_label.code_text);
                // data_field.setModuleTable(moduleTable);
                // res[column.id] = data_field;
                // break;
                // default:

                if (!field) {
                    res[column.id] = SimpleDatatableFieldVO.createNew(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                    break;
                }

                let data_field: DatatableField<any, any> = CRUD.get_dt_field(field);

                // sur un simple on set le label
                if (data_field['set_translatable_title']) {
                    data_field['set_translatable_title'](field.field_label.code_text);
                }

                data_field.setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type();
                res = data_field;
                //         break;
                // }
                break;
            case TableColumnDescVO.TYPE_crud_actions:
                res = CRUDActionsDatatableFieldVO.createNew().setModuleTable(moduleTable);
                break;
            case TableColumnDescVO.TYPE_select_box:
                res = SelectBoxDatatableFieldVO.createNew().setModuleTable(moduleTable);
                break;
        }
        return res;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {

        this.selected_vos = {};

        await this.throttle_update_visible_options();
    }

    /**
     * update_visible_options
     *  - We should wait for validation button to be clicked to update visible options
     *
     * @param {boolean} force
     * @returns
     */
    private async update_visible_options(force: boolean = false) {
        // Si j'ai mon bouton de validation des filtres qui est actif,
        // je vérifie s'il me permet de faire un update
        let validation_filters: DashboardPageWidgetVO[] = this.get_validation_page_widgets();
        let can_update: boolean = true;
        for (let i in validation_filters) {
            let validation_filter = validation_filters[i];

            // Si j'ai un seul widget de validation qui n'accepte pas l'update, je ne mettrais pas à jour mes widgets
            if (!validation_filter.json_options) {
                can_update = false;
                continue;
            }

            let options = JSON.parse(validation_filter.json_options) as ValidationFiltersWidgetOptions;
            options = options ? new ValidationFiltersWidgetOptions().from(options) : null;
            if (!options || !options.load_widgets_prevalidation) {
                can_update = false;
            }
        }

        // sinon j'attends que ce soit lui qui m'appelle
        if ((!force) && this.has_validation_page_widgets() && (!can_update)) {
            return;
        }

        await this.throttle_do_update_visible_options();
    }

    private async reset_visible_options() {
        // Reset des filtres
        this.clear_active_field_filters();

        // TODO FIXME JNE : A mon avis on devrait plutôt vider la table, revenir à l'état initial et utiliser throttle_update_visible_options pour pas charger sans filtre quand ya un bouton de validation des filtres...
        // On update le visuel de tout le monde suite au reset
        await this.throttle_do_update_visible_options();
    }

    private async do_update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.table_columns = cloneDeep(this.columns);
        this.last_calculation_cpt = launch_cpt;

        this.update_cpt_live++;
        this.is_busy = true;

        const table_fields = TableWidgetManager.get_table_fields_by_widget_options(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            this.all_page_widgets_by_id
        );

        if (
            (!(this.widget_options?.columns?.length > 0)) ||
            (!this.get_dashboard_api_type_ids) ||
            (!this.get_dashboard_api_type_ids.length) ||
            (!table_fields)
        ) {
            this.init_data_rows();
            return;
        }

        /**
         * On checke si le param de is_filtering_by devrait pas être invalidé (suite changement de filtrage manuel par ailleurs typiquement)
         */
        if (this.is_filtering_by && this.filtering_by_active_field_filter) {

            let context_filter: ContextFilterVO = null;

            const is_valid_filtering = this.filtering_by_active_field_filter.vo_type && this.filtering_by_active_field_filter.field_id;

            const is_field_filters_empty = is_valid_filtering ? FieldFiltersVOHandler.is_field_filters_empty(
                {
                    api_type_id: this.filtering_by_active_field_filter.vo_type,
                    field_id: this.filtering_by_active_field_filter.field_id
                },
                this.get_active_field_filters,
            ) : true;

            if (!is_field_filters_empty) {
                context_filter = this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id];
            }

            if ((is_field_filters_empty) ||
                (context_filter.filter_type != this.filtering_by_active_field_filter.filter_type) ||
                (context_filter.vo_type != this.filtering_by_active_field_filter.vo_type) ||
                (context_filter.field_id != this.filtering_by_active_field_filter.field_id) ||
                (context_filter.param_numeric != this.filtering_by_active_field_filter.param_numeric) ||
                (context_filter.param_text != this.filtering_by_active_field_filter.param_text)) {

                this.filtering_by_active_field_filter = null;
                this.is_filtering_by = false;
            }
        }

        let crud_api_type_id = this.widget_options.crud_api_type_id;
        if (!crud_api_type_id) {
            for (let column_id in table_fields) {
                let field = table_fields[column_id];

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

        let context_filters: ContextFilterVO[] = ContextFilterVOManager.get_context_filters_from_active_field_filters(
            FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
        );

        const context_query: ContextQueryVO = query(crud_api_type_id)
            .set_limit(this.limit, this.pagination_offset)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(context_filters);

        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, this.get_discarded_field_paths);

        /**
         * Si on a un filtre actif sur la table on veut ignorer le filtre généré par la table à ce stade et charger toutes les valeurs, et mettre en avant simplement celles qui sont filtrées
         */
        if (this.is_filtering_by && this.filtering_by_active_field_filter) {
            context_query.filters = context_query.filters.filter((f) =>
                (f.filter_type != this.filtering_by_active_field_filter.filter_type) ||
                (f.vo_type != this.filtering_by_active_field_filter.vo_type) ||
                (f.field_id != this.filtering_by_active_field_filter.field_id) ||
                (f.param_numeric != this.filtering_by_active_field_filter.param_numeric) ||
                (f.param_text != this.filtering_by_active_field_filter.param_text));
        }

        if (table_fields && (
            ((this.order_asc_on_id != null) && table_fields[this.order_asc_on_id]) ||
            ((this.order_desc_on_id != null) && table_fields[this.order_desc_on_id]))) {

            let field = (this.order_asc_on_id != null) ? table_fields[this.order_asc_on_id] : table_fields[this.order_desc_on_id];

            context_query.set_sort(
                new SortByVO(
                    field.vo_type_id,
                    field.module_table_field_id,
                    (this.order_asc_on_id != null)
                )
            );
        }

        let clone = cloneDeep(this.columns_by_field_id);
        for (let field_id in clone) {
            let field = clone[field_id];
            if (field.type == TableColumnDescVO.TYPE_header) {
                for (const key in field.children) {
                    let child = field.children[key];
                    clone[child.datatable_field_uid] = child;
                }
            }
        }

        for (let column_id in table_fields) {
            let field = table_fields[column_id];

            if (
                (field.type == DatatableField.VAR_FIELD_TYPE) ||
                (field.type == DatatableField.COMPONENT_FIELD_TYPE) ||
                (field.type == DatatableField.SELECT_BOX_FIELD_TYPE)
            ) {
                continue;
            }

            if (this.get_dashboard_api_type_ids.indexOf(field.vo_type_id) < 0) {
                ConsoleHandler.warn('select_datatable_rows: asking for datas from types not included in request:' +
                    field.datatable_field_uid + ':' + field.vo_type_id);
                this.init_data_rows();
                return;
            }

            // let column: TableColumnDescVO = this.columns_by_field_id[field.datatable_field_uid];
            let column: TableColumnDescVO = clone[field.datatable_field_uid];

            let aggregator: number = VarConfVO.NO_AGGREGATOR;

            if (column) {
                if (FieldFiltersVOManager.is_column_filtered(column, this.filter_by_access_cache, this.get_active_field_filters, this.all_page_widgets_by_id)) {
                    continue;
                }

                if (column.many_to_many_aggregate) {
                    if (column.is_nullable) {
                        aggregator = VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR_DISTINCT;
                    } else {
                        aggregator = VarConfVO.ARRAY_AGG_AGGREGATOR_DISTINCT;
                    }
                } else if (column.is_nullable) {
                    aggregator = VarConfVO.IS_NULLABLE_AGGREGATOR;
                } else if (column.sum_numeral_datas) {
                    aggregator = VarConfVO.SUM_AGGREGATOR;
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

        // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
        // Si ce n'est pas le cas, je n'envoie pas la requête
        let base_table: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[context_query.base_api_type_id];

        if (
            base_table &&
            base_table.is_segmented
        ) {
            if (
                !base_table.table_segmented_field ||
                !base_table.table_segmented_field.manyToOne_target_moduletable ||
                !this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type] ||
                !Object.keys(this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]).length
            ) {
                this.init_data_rows();
                return;
            }

            let has_filter: boolean = false;

            for (let field_id in this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type]) {
                if (this.get_active_field_filters[base_table.table_segmented_field.manyToOne_target_moduletable.vo_type][field_id]) {
                    has_filter = true;
                    break;
                }
            }

            if (!has_filter) {
                this.init_data_rows();
                return;
            }
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

            context_query.filters = ContextFilterVOHandler.add_context_filters_exclude_values(
                options.exclude_filter_opt_values,
                options.vo_field_ref,
                context_query.filters,
                true,
            );
        }

        const fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};
        for (let i in table_fields) {
            const field = table_fields[i];
            fields[field.datatable_field_uid] = field;
        }

        context_query.query_distinct = true;

        // On fait le count sans les vars
        let query_count: ContextQueryVO = cloneDeep(context_query);
        let rows = null;

        await all_promises([
            (async () => {
                ConsoleHandler.log('select_datatable_rows');
                await ModuleVar.getInstance().add_vars_params_columns_for_ref_ids(context_query, this.columns);
                rows = await ModuleContextFilter.getInstance().select_datatable_rows(context_query, this.columns_by_field_id, fields);
            })(),

            (async () => {
                query_count.set_limit(0, 0);
                query_count.set_sort(null);
                query_count.query_distinct = true;
                this.pagination_count = await ModuleContextFilter.getInstance().select_count(query_count);
            })()
        ]);

        let vos_by_id: { [id: number]: any } = {};
        for (let i in rows) {
            let row = rows[i];
            vos_by_id[this.get_identifier(row)] = row;
        }

        this.vos_by_id = vos_by_id;

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            this.update_cpt_live--;
            return;
        }

        this.actual_page_rows_datas_query = cloneDeep(context_query);
        this.actual_all_rows_datas_query = cloneDeep(context_query);
        this.actual_all_rows_datas_query.set_limit(0, 0);
        this.actual_all_rows_datas_query.set_sort(null);


        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            this.update_cpt_live--;
            return;
        }

        this.data_rows = rows;

        this.actual_rows_count_query = cloneDeep(query_count);
        this.actual_rows_count_query.do_count_results = true;

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            this.update_cpt_live--;
            return;
        }

        if (this.widget_options.has_table_total_footer) {
            await this.reload_column_total();
        }

        this.loaded_once = true;
        this.is_busy = false;
        this.update_cpt_live--;
    }

    private async refresh() {
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(
            new RegExp('.*' + ModuleContextFilter.APINAME_select_datatable_rows)
        );
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(
            new RegExp('.*' + ModuleContextFilter.APINAME_select_count)
        );

        await this.throttle_do_update_visible_options();
    }

    /**
     * Watch on page_widget
     *
     * @returns
     */
    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget_options() {
        this.widget_options = this.get_widget_options();
    }

    /**
     * Watch on widget_options
     *
     * @returns
     */
    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        if (this.widget_options.use_for_count) {
            this.set_query_api_type_ids([this.widget_options.crud_api_type_id]);
        }

        this.selected_vos = {};

        // Si j'ai un tri par defaut, je l'applique au tableau
        if (this.columns) {
            this.order_asc_on_id = null;
            this.order_desc_on_id = null;

            for (let i in this.columns) {
                if (this.columns[i].default_sort_field == TableColumnDescVO.SORT_asc) {
                    this.order_asc_on_id = this.columns[i].id;
                    break;
                } else if (this.columns[i].default_sort_field == TableColumnDescVO.SORT_desc) {
                    this.order_desc_on_id = this.columns[i].id;
                    break;
                }
            }
        }

        this.limit = (!this.widget_options || (this.widget_options.limit == null)) ? TableWidgetOptionsVO.DEFAULT_LIMIT : this.widget_options.limit;
        this.tmp_nbpages_pagination_list = (!this.widget_options || (this.widget_options.nbpages_pagination_list == null)) ? TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST : this.widget_options.nbpages_pagination_list;

        let promises = [
            this.throttle_update_visible_options(), // Pour éviter de forcer le chargement de la table sans avoir cliqué sur le bouton de validation des filtres
            this.update_filter_by_access_cache()
        ];

        await all_promises(promises);
    }

    private select_unselect_all(value: boolean) {
        for (let i in this.data_rows) {
            let vo = this.data_rows[i];

            let id: number = this.get_identifier(vo);

            Vue.set(this.selected_vos, id, value);
        }
    }

    private async update_filter_by_access_cache() {

        let promises = [];
        let self = this;
        for (let i in this.widget_options.columns) {
            let column = this.widget_options.columns[i];

            if (!!column.filter_by_access) {
                promises.push((async () => {
                    VueAppBase.getInstance().vueInstance.$set(self.filter_by_access_cache, column.filter_by_access, await ModuleAccessPolicy.getInstance().checkAccess(column.filter_by_access));
                    ConsoleHandler.log(column.filter_by_access + ':' + self.filter_by_access_cache[column.filter_by_access]);
                })());
            }
        }
        await all_promises(promises);
    }

    get has_group_headers() {
        if (!this.columns) {
            return false;
        }

        return !!this.columns.find((column) => column?.type == TableColumnDescVO.TYPE_header);
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    private get_widget_options(): TableWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptionsVO;
                options = options ? new TableWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * should_apply_active_field_filters
     *
     * @returns {boolean} true if the dashboard_page has a validation_filter_widget
     */
    private should_apply_active_field_filters(): boolean {
        let should_apply = true;

        if (!this.widget_options) {
            return should_apply;
        }

        if (!this.widget_options.can_apply_default_field_filters_without_validation) {
            const has_validation_filter_widget = this.has_validation_page_widgets();

            if (has_validation_filter_widget) {
                should_apply = this.loaded_once;
            } else {
                should_apply = true;
            }
        }

        return should_apply;
    }

    private open_vocus(api_type_id: string, id: number) {
        let routeData = this.$router.resolve({ path: this.getVocusLink(api_type_id, id) });
        window.open(routeData.href, '_blank');
    }

    private async confirm_delete(api_type_id: string, id: number) {
        let self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('TableWidgetComponent.confirm_delete.body'), self.label('TableWidgetComponent.confirm_delete.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('TableWidgetComponent.confirm_delete.start'));

                        let res: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOsByIds(api_type_id, [id]);
                        if ((!res) || (res.length != 1) || (!res[0].id)) {
                            self.snotify.error(self.label('TableWidgetComponent.confirm_delete.ko'));
                        } else {
                            self.snotify.success(self.label('TableWidgetComponent.confirm_delete.ok'));
                        }
                        await this.throttle_do_update_visible_options();
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async confirm_archive(api_type_id: string, id: number) {
        let self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('TableWidgetComponent.confirm_archive.body'), self.label('TableWidgetComponent.confirm_archive.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(self.label('TableWidgetComponent.confirm_archive.start'), () =>
                            new Promise(async (resolve, reject) => {
                                let vo: IArchivedVOBase = await query(api_type_id).filter_by_id(id).select_vo();
                                let res: InsertOrDeleteQueryResult = null;

                                if (vo) {
                                    vo.archived = true;
                                    res = await ModuleDAO.getInstance().insertOrUpdateVO(vo);
                                }

                                if (!res?.id) {
                                    reject({
                                        body: self.label('TableWidgetComponent.confirm_archive.ko'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                } else {
                                    resolve({
                                        body: self.label('TableWidgetComponent.confirm_archive.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                }
                                await this.throttle_do_update_visible_options();
                            })
                        );
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async confirm_delete_all() {
        let self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('crud.actions.delete_all.confirmation.body'), self.label('crud.actions.delete_all.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('crud.actions.delete_all.start'));

                        await ModuleDAO.getInstance().delete_all_vos_triggers_ok(self.crud_activated_api_type);
                        await self.throttle_do_update_visible_options();
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    /**
     * On fabrique / récupère la query pour l'export + les params
     * @param limit_to_page limiter à la page actuellement visible. false => exporter toutes les datas
     */
    private get_export_params_for_context_query_xlsx(limit_to_page: boolean = true): ExportContextQueryToXLSXParamVO {

        if (!this.actual_page_rows_datas_query) {
            return null;
        }

        let xlsx_context_query = cloneDeep(this.actual_page_rows_datas_query);
        if (!limit_to_page) {
            xlsx_context_query.set_limit(0, 0);

            // On doit aussi ajuster les sub_queries en jointure dans ce cas
            for (let i in xlsx_context_query.joined_context_queries) {
                let joined_context_query = xlsx_context_query.joined_context_queries[i];

                if (!joined_context_query) {
                    continue;
                }

                joined_context_query.joined_context_query.set_limit(0, 0);
            }
        }

        let export_name: string = 'Export-';

        if (!!this.dashboard?.translatable_name_code_text) {
            export_name += 'Dashboard-' + this.t(this.dashboard.translatable_name_code_text) + '-';
        }

        if (!!this.dashboard_page?.translatable_name_code_text) {
            export_name += 'Page-' + this.t(this.dashboard_page.translatable_name_code_text) + '-';
        }

        export_name += Dates.now();

        export_name = slug(export_name, { lower: false }) + ".xlsx";

        const widget_options_fields = TableWidgetManager.get_table_fields_by_widget_options(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            this.all_page_widgets_by_id,
            true,
        );

        // The actual fields to be exported
        const fields: { [datatable_field_uid: string]: DatatableField<any, any> } = {};

        for (let i in widget_options_fields) {
            const field = widget_options_fields[i];
            fields[field.datatable_field_uid] = field;
        }

        const exportable_xlsx_params = new ExportContextQueryToXLSXParamVO(
            export_name,
            xlsx_context_query,
            this.exportable_datatable_default_widget_options_columns,
            this.datatable_default_widget_options_columns_labels,
            this.exportable_datatable_custom_field_columns,
            this.columns,
            fields,
            this.varcolumn_conf,
            this.get_active_field_filters,
            this.columns_custom_filters,
            this.get_dashboard_api_type_ids,
            this.get_discarded_field_paths,
            false,
            null,
            null,
            this.do_not_use_filter_by_datatable_field_uid,
            this.widget_options?.can_export_active_field_filters,
            this.widget_options?.can_export_vars_indicator,
            false,
            this.vars_indicator,
        );

        return exportable_xlsx_params;
    }

    get columns_custom_filters(): { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } {
        let res: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = {};

        for (let i in this.default_widget_options_columns) {
            let column = this.default_widget_options_columns[i];

            if (column.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            let active_field_filters: FieldFiltersVO = cloneDeep(this.get_active_field_filters);

            // On supprime les filtres à ne pas prendre en compte pour créer le bon param
            if (column.do_not_user_filter_active_ids && column.do_not_user_filter_active_ids.length) {
                let all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO } = VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);

                for (let j in column.do_not_user_filter_active_ids) {
                    let page_filter_id = column.do_not_user_filter_active_ids[j];

                    let page_widget: DashboardPageWidgetVO = all_page_widgets_by_id[page_filter_id];
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
                ObjectHandler.hasAtLeastOneAttribute(column.filter_custom_field_filters) ? column.filter_custom_field_filters : null,
                active_field_filters
            );
        }

        return res;
    }

    get do_not_use_filter_by_datatable_field_uid(): { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } {
        let res: { [datatable_field_uid: string]: { [vo_type: string]: { [field_id: string]: boolean } } } = {};

        for (let i in this.default_widget_options_columns) {
            let column = this.default_widget_options_columns[i];

            if (column.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            let do_not_use: { [vo_type: string]: { [field_id: string]: boolean } } = {};

            // On supprime les filtres à ne pas prendre en compte pour créer le bon param
            if (column.do_not_user_filter_active_ids && column.do_not_user_filter_active_ids.length) {
                let all_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO } = VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);

                for (let j in column.do_not_user_filter_active_ids) {
                    let page_filter_id = column.do_not_user_filter_active_ids[j];

                    let page_widget: DashboardPageWidgetVO = all_page_widgets_by_id[page_filter_id];
                    if (!page_widget) {
                        continue;
                    }

                    let page_widget_options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;

                    if (page_widget_options?.vo_field_ref) {
                        if (!do_not_use[page_widget_options.vo_field_ref.api_type_id]) {
                            do_not_use[page_widget_options.vo_field_ref.api_type_id] = {};
                        }

                        do_not_use[page_widget_options.vo_field_ref.api_type_id][page_widget_options.vo_field_ref.field_id] = true;
                    }
                }
            }

            if (Object.keys(do_not_use).length > 0) {
                res[column.datatable_field_uid] = do_not_use;
            }
        }

        return res;
    }

    get varcolumn_conf(): { [datatable_field_uid: string]: ExportVarcolumnConfVO } {
        let res: { [datatable_field_uid: string]: ExportVarcolumnConfVO } = {};

        for (let i in this.default_widget_options_columns) {
            let column = this.default_widget_options_columns[i];

            if (column?.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            let varcolumn_conf: ExportVarcolumnConfVO = ExportVarcolumnConfVO.create_new(
                column.var_id,
                column.filter_custom_field_filters
            );

            res[column.datatable_field_uid] = varcolumn_conf;
        }

        return res;
    }

    get datatable_columns_labels(): any {
        let res: any = {};

        for (let i in this.columns) {
            let column = this.columns[i];

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

    get datatable_default_widget_options_columns_labels(): any {
        let res: any = {};

        for (let i in this.default_widget_options_columns) {
            let column = this.default_widget_options_columns[i];

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

    get exportable_datatable_custom_field_columns(): { [datatable_field_uid: string]: string } {
        let res: { [datatable_field_uid: string]: string } = {};

        for (let i in this.default_widget_options_columns) {
            let column: TableColumnDescVO = this.default_widget_options_columns[i];

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

    get exportable_datatable_columns(): string[] {
        let res: string[] = [];

        for (let i in this.columns) {
            let column: TableColumnDescVO = this.columns[i];
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

    get exportable_datatable_default_widget_options_columns(): string[] {
        let res: string[] = [];

        for (let i in this.default_widget_options_columns) {
            let column: TableColumnDescVO = this.default_widget_options_columns[i];

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

            if (FieldFiltersVOManager.is_column_filtered(column, this.filter_by_access_cache, this.get_active_field_filters, this.all_page_widgets_by_id)) {
                continue;
            }

            if (column.type != TableColumnDescVO.TYPE_header) {

                res.push(column.datatable_field_uid);
            }
        }

        return res;
    }

    private get_exportable_datatable_data(): any[] {
        let exportable_datatable_data = [];

        for (let i in this.data_rows) {

            let cloned_data = DatatableRowController.getInstance().get_exportable_datatable_row_data(
                this.data_rows[i],
                this.export_datatable,
                this.exportable_datatable_columns
            );

            if (!!cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID]) {
                delete cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID];
            }
            if (!!cloned_data[DatatableRowController.ACTIONS_COLUMN_ID]) {
                delete cloned_data[DatatableRowController.ACTIONS_COLUMN_ID];
            }

            exportable_datatable_data.push(cloned_data);
        }

        return exportable_datatable_data;
    }

    get export_datatable(): Datatable<any> {
        let res = new Datatable(this.crud_activated_api_type);

        for (let i in this.fields) {
            let field = this.fields[i];

            if (field.type == DatatableField.CRUD_ACTIONS_FIELD_TYPE) {
                continue;
            }

            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
                continue;
            }

            res.pushField(field);
        }
        return res;
    }

    /**
     * On demande si on veut exporter tout en juste la page actuellement lue
     */
    private async choose_export_type() {

        let self = this;

        if (this.default_export_option) {

            switch (this.default_export_option) {
                case 1: // 1 = Page courante du DBB
                    await self.do_export_to_xlsx(true);
                    break;
                case 2: // 2 = Tout le DBB
                    await self.do_export_to_xlsx(false);
                    break;
                default:
                    return;
            }
        } else {

            this.$snotify.confirm(self.label('table_widget.choose_export_type.body'), self.label('table_widget.choose_export_type.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.label('table_widget.choose_export_type.page'),
                        action: async (toast) => {
                            self.$snotify.remove(toast.id);
                            await self.do_export_to_xlsx(true);
                        },
                        bold: false
                    },
                    {
                        text: self.label('table_widget.choose_export_type.all'),
                        action: async (toast) => {
                            await self.do_export_to_xlsx(false);
                            self.$snotify.remove(toast.id);
                        }
                    }
                ]
            });
        }
    }

    private dismiss_export_alert() {
        this.show_export_alert = false;
    }

    /**
     * Export de toutes les données (en appliquant les filtrages)
     * @param limit_to_page se limiter à la page vue, ou renvoyer toutes les datas suivant les filtres actifs
     */
    private async do_export_to_xlsx(limit_to_page: boolean = true) {
        let param: ExportContextQueryToXLSXParamVO = this.get_export_params_for_context_query_xlsx(limit_to_page);

        if (!!param) {

            this.show_export_alert = false;

            if (this.show_export_maintenance_alert) {
                this.show_export_alert = true;
                return;
            }

            await ModuleDataExport.getInstance().exportContextQueryToXLSX(
                param.filename,
                param.context_query,
                param.ordered_column_list,
                param.column_labels,
                param.exportable_datatable_custom_field_columns,
                param.columns,
                param.fields,
                param.varcolumn_conf,
                param.active_field_filters,
                param.custom_filters,
                param.active_api_type_ids,
                param.discarded_field_paths,
                param.is_secured,
                param.file_access_policy_name,
                VueAppBase.getInstance().appController?.data_user?.id,
                param.do_not_use_filter_by_datatable_field_uid,
                param.export_active_field_filters,
                param.export_vars_indicator,
                param.send_email_with_export_notification,
                param.vars_indicator,
            );
        }
    }

    /**
     * init_data_rows
     *  - Re/Intialize the data_rows array
     */
    private init_data_rows() {
        this.data_rows = [];
        this.loaded_once = true;
        this.is_busy = false;
        this.update_cpt_live--;
        this.pagination_count = null;
    }

    private get_style_th(column: TableColumnDescVO) {
        let res = {};

        if (!column) {
            return res;
        }

        if (column.bg_color_header) {
            res['backgroundColor'] = column.bg_color_header;
        }

        if (column.font_color_header) {
            res['color'] = column.font_color_header;
        }

        if (column.is_sticky) {
            res['minWidth'] = (parseInt(column.column_width.toString()) + 0.4) + "rem"; // on ajoute le padding
            res['maxWidth'] = (parseInt(column.column_width.toString()) + 0.4) + "rem"; // on ajoute le padding
            res['left'] = this.sticky_left_by_col_id
                ? (this.sticky_left_by_col_id[column.id]
                    ? (this.sticky_left_by_col_id[column.id] + 0.4) + "rem"
                    : 0 + "rem")
                : null;

            if (this.last_sticky_col_id == column.id) {
                res['borderRight'] = 'solid 1px rgb(185, 185, 185)';
            }
        }

        return res;
    }

    private get_style_td(column: TableColumnDescVO) {
        let res = {};

        if (!column) {
            return res;
        }

        if (column.is_sticky) {
            res['minWidth'] = (parseInt(column.column_width.toString()) + 0.4) + "rem"; // on ajoute le padding
            res['maxWidth'] = (parseInt(column.column_width.toString()) + 0.4) + "rem"; // on ajoute le padding
            res['left'] = this.sticky_left_by_col_id
                ? (this.sticky_left_by_col_id[column.id]
                    ? (this.sticky_left_by_col_id[column.id] + 0.4) + "rem"
                    : 0 + "rem")
                : null;

            if (this.last_sticky_col_id == column.id) {
                res['borderRight'] = 'solid 1px rgb(185, 185, 185)';
            }
        }

        return res;
    }

    private is_column_type_number(column: TableColumnDescVO) {
        let res = false;

        if ((!column.api_type_id) || (!column.field_id)) {
            return res;
        }

        if (column?.type != TableColumnDescVO.TYPE_vo_field_ref) {
            return res;
        }

        let field = VOsTypesManager.moduleTables_by_voType[column.api_type_id].getFieldFromId(column.field_id);
        if (!field) {
            return res;
        }

        if ((field.field_type == ModuleTableField.FIELD_TYPE_int)
            || (field.field_type == ModuleTableField.FIELD_TYPE_float)
            || (field.field_type == ModuleTableField.FIELD_TYPE_prct)
            || (field.field_type == ModuleTableField.FIELD_TYPE_decimal_full_precision)
            || (field.field_type == ModuleTableField.FIELD_TYPE_amount)) {
            res = true;
        }

        return res;
    }

    private async reload_column_total() {
        this.column_total = {};

        if (!this.columns || !this.columns.length) {
            return;
        }

        let promises = [];

        for (let i in this.columns) {
            if (!this.is_column_type_number(this.columns[i])) {
                continue;
            }

            let column = this.columns[i];

            if (column.type != TableColumnDescVO.TYPE_vo_field_ref) {
                continue;
            }

            let field = VOsTypesManager.moduleTables_by_voType[column.api_type_id].getFieldFromId(column.field_id);
            if (!field) {
                continue;
            }

            if (!this.column_total[column.api_type_id]) {
                this.column_total[column.api_type_id] = {};
            }

            let alias_field: string = column.field_id + "_" + column.api_type_id;

            let context_query: ContextQueryVO = query(column.api_type_id)
                .field(column.field_id, alias_field, column.api_type_id, VarConfVO.SUM_AGGREGATOR)
                .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                    FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
                ));
            // .set_limit(this.limit, this.pagination_offset) =;> à ajouter pour le sous - total(juste le contenu de la page)
            // .set_sort(new SortByVO(column.api_type_id, column.field_id, (this.order_asc_on_id != null)));

            promises.push((async () => {
                let res = await ModuleContextFilter.getInstance().select(context_query);

                if (res && res[0]) {
                    let column_total: number = res[0][alias_field];

                    if (column_total) {
                        // Si pourcentage, on fait la somme des prct qu'on divise par le nbr de res
                        if ((field.field_type == ModuleTableField.FIELD_TYPE_prct) && this.pagination_count) {
                            column_total /= this.pagination_count;
                        }

                        this.column_total[column.api_type_id][column.field_id] = parseFloat(column_total.toFixed(2));
                    }
                }
            })());
        }

        await all_promises(promises);
    }

    get dashboard_vo_action() {
        return this.$route.params.dashboard_vo_action;
    }

    get dashboard_vo_id() {
        return this.$route.params.dashboard_vo_id;
    }

    get api_type_id_action() {
        return this.$route.params.api_type_id_action;
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    /**
     * Var Indicator
     *  - All vars indicator on the actual page to be exported
     *
     * @return {ExportVarIndicatorVO}
     */
    get vars_indicator(): ExportVarIndicatorVO {

        if (!this.widget_options) {
            return;
        }

        const varcolumn_conf: { [xlsx_sheet_row_code_name: string]: ExportVarcolumnConfVO } = {};

        // Find id of widget that have type "var"
        const var_widget_id = Object.values(this.widgets_by_id)?.find((e) => e.name == 'var').id;

        // var_widget_id required to continue
        if (!var_widget_id) {
            return;
        }

        // Find all var widgets of actual page
        const var_page_widgets = Object.values(this.all_page_widget)?.filter(
            (pw) => pw.widget_id == var_widget_id
        );

        for (let key in var_page_widgets) {
            const var_page_widget = var_page_widgets[key];

            const options = JSON.parse(var_page_widget.json_options);

            const var_widget_options = new VarWidgetOptions().from(options);
            const name = var_widget_options.get_title_name_code_text(var_page_widget.id);

            let conf: ExportVarcolumnConfVO = ExportVarcolumnConfVO.create_new(
                options.var_id,
                var_widget_options.filter_custom_field_filters,
                var_widget_options.filter_type,
                var_widget_options.filter_additional_params,
            );

            varcolumn_conf[name] = conf;
        }

        // returns ordered_column_list, column_labels and varcolumn_conf
        return ExportVarIndicatorVO.create_new(
            ['name', 'value'],
            { name: 'Nom', value: 'Valeur' },
            varcolumn_conf
        );
    }

    get show_bulk_select_all(): boolean {
        return this.widget_options && this.widget_options.show_bulk_select_all;
    }

    get cb_bulk_actions(): BulkActionVO[] {
        let res: BulkActionVO[] = [];

        if (this.show_bulk_select_all) {
            res.push(BulkActionVO.createNew(
                this.widget_options.crud_api_type_id,
                'table_widget_component.select_all',
                this.select_unselect_all.bind(this, true)
            ));
            res.push(BulkActionVO.createNew(
                this.widget_options.crud_api_type_id,
                'table_widget_component.unselect_all',
                this.select_unselect_all.bind(this, false)
            ));
        }

        for (let i in this.widget_options.cb_bulk_actions) {
            if (!TableWidgetController.getInstance().cb_bulk_actions_by_translatable_title[this.widget_options.cb_bulk_actions[i]]) {
                continue;
            }

            res.push(TableWidgetController.getInstance().cb_bulk_actions_by_translatable_title[this.widget_options.cb_bulk_actions[i]]);
        }

        return res;
    }

    get selected_vos_true(): number[] {
        let res: number[] = [];

        for (let vo_id in this.selected_vos) {
            if (this.selected_vos[vo_id]) {
                res.push(parseInt(vo_id));
            }
        }

        return res;
    }

    private has_validation_page_widgets(): boolean {
        return this.get_validation_page_widgets()?.length > 0;
    }

    /**
     * get_validation_page_widgets
     *  - Get all widget validation filters
     * @returns {DashboardPageWidgetVO[]}
     */
    private get_validation_page_widgets(): DashboardPageWidgetVO[] {
        const all_page_widget: DashboardPageWidgetVO[] = this.all_page_widget;
        const validation_page_widgets: DashboardPageWidgetVO[] = [];

        if (!all_page_widget) {
            return;
        }

        for (let i in all_page_widget) {
            const page_widget: DashboardPageWidgetVO = all_page_widget[i];

            const widget: DashboardWidgetVO = this.widgets_by_id[page_widget.widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_validation_filters) {
                validation_page_widgets.push(page_widget);
            }
        }

        return validation_page_widgets;
    }

    // /**
    //  * Export de la page lue
    //  */
    // private async do_export_page_to_xlsx() {
    //     let param: ExportDataToXLSXParamVO = this.get_export_params_for_xlsx();

    //     if (!!param) {

    //         await ModuleDataExport.getInstance().exportDataToXLSX(
    //             param.filename,
    //             param.datas,
    //             param.ordered_column_list,
    //             param.column_labels,
    //             param.api_type_id,
    //             param.is_secured,
    //             param.file_access_policy_name
    //         );
    //     }
    // }

    get contextmenu_items(): any {
        let contextmenu_items: any = {};

        contextmenu_items['get_page_rows_datas_query_string'] = {
            name: this.label('TableWidgetTableComponent.contextmenu.get_page_rows_datas_query_string'),
            disabled: function (key, opt) {
                let elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return elt.getAttribute('page_rows_datas_query_string') == null;
            },
            callback: async (key, opt) => {
                let elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                let q_str = elt.getAttribute('page_rows_datas_query_string');
                if (!q_str) {
                    return;
                }

                await navigator.clipboard.writeText(q_str.toString());
                await this.$snotify.success(this.label('copied_to_clipboard'));
            }
        };

        contextmenu_items['get_all_rows_datas_query_string'] = {
            name: this.label('TableWidgetTableComponent.contextmenu.get_all_rows_datas_query_string'),
            disabled: function (key, opt) {
                let elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return elt.getAttribute('all_rows_datas_query_string') == null;
            },
            callback: async (key, opt) => {
                let elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                let q_str = elt.getAttribute('all_rows_datas_query_string');
                if (!q_str) {
                    return;
                }

                await navigator.clipboard.writeText(q_str.toString());
                await this.$snotify.success(this.label('copied_to_clipboard'));
            }
        };

        contextmenu_items['sep1'] = "---------";

        contextmenu_items['get_rows_count_query_string'] = {
            name: this.label('TableWidgetTableComponent.contextmenu.get_rows_count_query_string'),
            disabled: function (key, opt) {
                let elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return elt.getAttribute('rows_count_query_string') == null;
            },
            callback: async (key, opt) => {
                let elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                let q_str = elt.getAttribute('rows_count_query_string');
                if (!q_str) {
                    return;
                }

                await navigator.clipboard.writeText(q_str.toString());
                await this.$snotify.success(this.label('copied_to_clipboard'));
            }
        };

        return contextmenu_items;
    }

    @Watch('actual_page_rows_datas_query', { immediate: true })
    @Watch('actual_all_rows_datas_query')
    @Watch('actual_rows_count_query')
    private onchange_queries() {

        if (!this.can_getquerystr) {
            return;
        }

        this.throttle_update_query_strings();
    }

    private async update_query_strings() {

        if (!this.can_getquerystr) {
            return;
        }

        if (!this.actual_rows_count_query) {
            return;
        }
        if (!this.actual_page_rows_datas_query) {
            return;
        }
        if (!this.actual_all_rows_datas_query) {
            return;
        }

        await all_promises([
            (async () => {
                this.rows_count_query_string = await this.actual_rows_count_query.get_select_query_str();
            })(),
            (async () => {
                this.page_rows_datas_query_string = await this.actual_page_rows_datas_query.get_select_query_str();
            })(),
            (async () => {
                this.all_rows_datas_query_string = await this.actual_all_rows_datas_query.get_select_query_str();
            })()
        ]);
    }
}