import { cloneDeep, debounce, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterHandler from '../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryFieldVO from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import CRUDActionsDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/CRUDActionsDatatableField';
import Datatable from '../../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SelectBoxDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SelectBoxDatatableField';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import VarDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/VarDatatableField';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardGraphVORefVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import ModuleDataExport from '../../../../../../shared/modules/DataExport/ModuleDataExport';
import ExportContextQueryToXLSXParamVO from '../../../../../../shared/modules/DataExport/vos/apis/ExportContextQueryToXLSXParamVO';
import ExportVarcolumnConf from '../../../../../../shared/modules/DataExport/vos/ExportVarcolumnConf';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VarConfVO from '../../../../../../shared/modules/Var/vos/VarConfVO';
import ModuleVocus from '../../../../../../shared/modules/Vocus/ModuleVocus';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../shared/tools/WeightHandler';
import VueAppBase from '../../../../../VueAppBase';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import CRUDComponentField from '../../../crud/component/field/CRUDComponentField';
import CRUDComponentManager from '../../../crud/CRUDComponentManager';
import DatatableRowController from '../../../datatable/component/DatatableRowController';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from '../field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';
import CRUDCreateModalComponent from './crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from './crud_modals/update/CRUDUpdateModalComponent';
import TableWidgetOptions from './options/TableWidgetOptions';
import TablePaginationComponent from './pagination/TablePaginationComponent';
import './TableWidgetComponent.scss';
import TableWidgetController from './TableWidgetController';

//TODO Faire en sorte que les champs qui n'existent plus car supprimés du dashboard ne se conservent pas lors de la création d'un tableau

@Component({
    template: require('./TableWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Crudupdatemodalcomponent: CRUDUpdateModalComponent,
        Crudcreatemodalcomponent: CRUDCreateModalComponent
    }
})
export default class TableWidgetComponent extends VueComponentBase {


    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageAction
    private set_discarded_field_paths: (discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;
    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent: CRUDCreateModalComponent;


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

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });
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

    private actual_rows_query: ContextQueryVO = null;

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

    private old_widget_options: TableWidgetOptions = null;

    /**
     * On doit avoir accepté sur la tableau, sur le champs, etre readonly
     */
    private can_filter_by(column: TableColumnDescVO): boolean {
        return this.widget_options && this.widget_options.can_filter_by && column && column.can_filter_by && column.readonly && (column.datatable_field_uid != '__crud_actions');
    }

    private is_filtering_by_col(column: TableColumnDescVO): boolean {
        return this.is_filtering_by &&
            this.filtering_by_active_field_filter && (
                (this.filtering_by_active_field_filter.field_id == column.field_id) ||
                ((!column.field_id) && (this.filtering_by_active_field_filter.field_id == 'id'))
            ) && (this.filtering_by_active_field_filter.vo_type == column.api_type_id);
    }

    private filter_by(column: TableColumnDescVO, datatable_field_uid: string, vo: any) {

        /**
         * On vide le filtre
         */
        if (!vo) {
            this.is_filtering_by = false;
            this.filtering_by_active_field_filter = null;
            this.remove_active_field_filter({ vo_type: column.api_type_id, field_id: (column.field_id ? column.field_id : 'id') });
            return;
        }

        let filtered_value = vo ? vo[datatable_field_uid] : null;

        this.is_filtering_by = true;
        let filtering_by_active_field_filter: ContextFilterVO = new ContextFilterVO();
        filtering_by_active_field_filter.vo_type = column.api_type_id;
        filtering_by_active_field_filter.field_id = column.field_id;

        // cas de l'id
        if ((!column.field_id) || (column.field_id == 'id') || (column.datatable_field_uid == "__crud_actions")) {

            if (!filtered_value) {
                filtering_by_active_field_filter.has_null();
            } else {
                filtering_by_active_field_filter.by_id(filtered_value);
            }
        } else {
            let field = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id].getFieldFromId(column.field_id);
            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_html:
                case ModuleTableField.FIELD_TYPE_password:
                case ModuleTableField.FIELD_TYPE_textarea:
                case ModuleTableField.FIELD_TYPE_email:
                case ModuleTableField.FIELD_TYPE_string:
                    if (!filtered_value) {
                        filtering_by_active_field_filter.has_null();
                    } else {
                        filtering_by_active_field_filter.by_text_has(filtered_value);
                    }
                    break;

                case ModuleTableField.FIELD_TYPE_enum:
                case ModuleTableField.FIELD_TYPE_int:
                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_foreign_key:
                case ModuleTableField.FIELD_TYPE_amount:
                case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_prct:
                    if (!filtered_value) {
                        filtering_by_active_field_filter.has_null();
                    } else {
                        filtering_by_active_field_filter.by_num_eq(filtered_value);
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
            active_field_filter: filtering_by_active_field_filter,
        });

        this.filtering_by_active_field_filter = filtering_by_active_field_filter;
    }

    private is_row_filter_ok(row: any): boolean {
        if (!row) {
            return true;
        }

        if (!this.filter_by) {
            return true;
        }

        if (!this.filtering_by_active_field_filter) {
            return true;
        }

        if (!this.columns) {
            return true;
        }

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
            let field = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id].getFieldFromId(column.field_id);
            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_html:
                case ModuleTableField.FIELD_TYPE_password:
                case ModuleTableField.FIELD_TYPE_textarea:
                case ModuleTableField.FIELD_TYPE_email:
                case ModuleTableField.FIELD_TYPE_string:
                    if (this.filtering_by_active_field_filter.filter_type == ContextFilterVO.TYPE_NULL_ANY) {
                        return row[column.datatable_field_uid] == null;
                    }
                    return row[column.datatable_field_uid] == this.filtering_by_active_field_filter.param_text;

                case ModuleTableField.FIELD_TYPE_enum:
                case ModuleTableField.FIELD_TYPE_int:
                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_foreign_key:
                case ModuleTableField.FIELD_TYPE_amount:
                case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_prct:
                    if (this.filtering_by_active_field_filter.filter_type == ContextFilterVO.TYPE_NULL_ANY) {
                        return row[column.datatable_field_uid] == null;
                    }
                    return row[column.datatable_field_uid] == this.filtering_by_active_field_filter.param_numeric;

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

    get can_refresh(): boolean {
        return this.widget_options && this.widget_options.refresh_button;
    }

    get can_export(): boolean {
        return this.widget_options && this.widget_options.export_button;
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

    private mounted() {
        ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page,
            this.page_widget,
            this.do_update_visible_options.bind(this),
        );
        this.stopLoading();
    }

    @Watch('dashboard_page', { immediate: true })
    private async onchange_dashboard_page() {
        if (!this.dashboard_page) {
            return;
        }
    }

    @Watch('dashboard_vo_action', { immediate: true })
    @Watch('dashboard_vo_id', { immediate: true })
    @Watch('api_type_id_action', { immediate: true })
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
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, this.crud_activated_api_type));
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
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.crud_activated_api_type));
        }

        if (this.can_create_right == null) {
            this.can_create_right = await ModuleAccessPolicy.getInstance().testAccess(
                ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.crud_activated_api_type));
        }
    }

    private async open_update(type: string, id: number) {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([type]);
        let update_vo = await ModuleDAO.getInstance().getVoById(type, id);

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

    private async sort_by(column: TableColumnDescVO) {
        if (!column) {
            this.order_asc_on_id = null;
            this.order_desc_on_id = null;
            await this.update_visible_options();
            return;
        }

        // Si colonne de type crud actions, on ne fait rien
        if (column.type == TableColumnDescVO.TYPE_crud_actions) {
            return;
        }

        if ((this.order_asc_on_id != column.id) && (this.order_desc_on_id != column.id)) {
            this.order_asc_on_id = column.id;
            this.order_desc_on_id = null;
            await this.update_visible_options();
            return;
        }

        if (this.order_asc_on_id != column.id) {
            this.order_asc_on_id = column.id;
            this.order_desc_on_id = null;
            await this.update_visible_options();
            return;
        }

        this.order_desc_on_id = column.id;
        this.order_asc_on_id = null;
        await this.update_visible_options();
        return;
    }

    private async change_offset(new_offset: number) {
        if (new_offset != this.pagination_offset) {
            this.pagination_offset = new_offset;
            await this.do_update_visible_options();
        }
    }

    private async change_tmp_nbpages_pagination_list(new_tmp_nbpages_pagination_list: number) {
        if (new_tmp_nbpages_pagination_list != this.pagination_offset) {
            this.tmp_nbpages_pagination_list = new_tmp_nbpages_pagination_list;
            await this.do_update_visible_options();
        }
    }

    private async change_limit(new_limit: number) {
        if (new_limit != this.pagination_offset) {
            this.limit = new_limit;
            await this.do_update_visible_options();
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
        let options: TableWidgetOptions = this.widget_options;

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

            /**
             * Gestion du check des droits
             */
            if (column.filter_by_access && !this.filter_by_access_cache[column.filter_by_access]) {
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
            if (column.type == TableColumnDescVO.TYPE_header || column.children.length > 0) {
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
        crudComponentField: CRUDComponentField) {

        let self = this;
        self.snotify.async(self.label('TableWidgetComponent.onchange_column.start'), () =>
            new Promise(async (resolve, reject) => {

                try {

                    // on récupère l'id de l'objet à modifier
                    // comme on force sur le crud_api_type_id, on peut juste récupérer cet id
                    let vo_id = row['__crud_actions'];
                    let vo = await ModuleDAO.getInstance().getVoById(field.moduleTable.vo_type, vo_id);

                    switch (field.type) {
                        case DatatableField.SIMPLE_FIELD_TYPE:
                            let simpleField = (field as SimpleDatatableField<any, any>);
                            vo[simpleField.module_table_field_id] = value;
                            let data_row_index = this.data_rows.findIndex((e) => e.__crud_actions == row.__crud_actions);
                            this.data_rows[data_row_index][simpleField.module_table_field_id] = value;
                            await ModuleDAO.getInstance().insertOrUpdateVO(vo);
                            break;
                        default:
                            throw new Error('Not Implemented');
                    }
                    await self.do_update_visible_options();

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
                    ConsoleHandler.getInstance().error(error);
                    await self.do_update_visible_options();
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

            if (column.type != TableColumnDescVO.TYPE_header) {
                moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id];
            }

            switch (column.type) {
                case TableColumnDescVO.TYPE_component:
                    res[column.id] = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
                    break;
                case TableColumnDescVO.TYPE_var_ref:
                    let var_data_field: VarDatatableField<any, any> = new VarDatatableField(
                        column.id.toString(), column.var_id, column.filter_type, column.filter_additional_params,
                        this.dashboard.id, column.get_translatable_name_code_text(this.page_widget.id)).auto_update_datatable_field_uid_with_vo_type();
                    res[column.id] = var_data_field;
                    break;
                case TableColumnDescVO.TYPE_vo_field_ref:
                    let field = moduleTable.get_field_by_id(column.field_id);
                    // let field_type = field ? field.field_type : moduletablfiel
                    // switch (field.field_type) {

                    // let data_field: SimpleDatatableField<any, any> = new SimpleDatatableField(field.field_id, field.field_label.code_text);
                    // data_field.setModuleTable(moduleTable);
                    // res[column.id] = data_field;
                    // break;
                    // default:

                    // if (!field) {
                    //     res[column.id] = new SimpleDatatableField(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type().set_translatable_title();
                    //     break;
                    // }

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
                    res[column.id] = new CRUDActionsDatatableField().setModuleTable(moduleTable);
                    break;
                case TableColumnDescVO.TYPE_select_box:
                    res[column.id] = new SelectBoxDatatableField().setModuleTable(moduleTable);
                    break;
            }
        }
        // for (let i in this.widget_options.columns) {
        //     let column: TableColumnDescVO = this.widget_options.columns[i];
        //     let moduleTable: ModuleTable<any>;

        //     if (column.type != TableColumnDescVO.TYPE_header) {
        //         moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id];
        //     }

        //     switch (column.type) {
        //         case TableColumnDescVO.TYPE_component:
        //             res[column.id] = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
        //             break;
        //         case TableColumnDescVO.TYPE_var_ref:
        //             let var_data_field: VarDatatableField<any, any> = new VarDatatableField(
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
        //                     moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[children.api_type_id];
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

        //             // let data_field: SimpleDatatableField<any, any> = new SimpleDatatableField(field.field_id, field.field_label.code_text);
        //             // data_field.setModuleTable(moduleTable);
        //             // res[column.id] = data_field;
        //             // break;
        //             // default:

        //             // if (!field) {
        //             //     res[column.id] = new SimpleDatatableField(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type().set_translatable_title();
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
        //             res[column.id] = new CRUDActionsDatatableField().setModuleTable(moduleTable);
        //             break;
        //         case TableColumnDescVO.TYPE_select_box:
        //             res[column.id] = new SelectBoxDatatableField().setModuleTable(moduleTable);
        //             break;
        //     }
        // }
        return res;
    }
    private switch_for_type_header(column: TableColumnDescVO, moduleTable: ModuleTable<any>) {
        let res: DatatableField<any, any>;
        switch (column.type) {
            case TableColumnDescVO.TYPE_component:
                res = TableWidgetController.getInstance().components_by_translatable_title[column.component_name].auto_update_datatable_field_uid_with_vo_type();
                break;
            case TableColumnDescVO.TYPE_var_ref:
                let var_data_field: VarDatatableField<any, any> = new VarDatatableField(
                    column.id.toString(), column.var_id, column.filter_type, column.filter_additional_params,
                    this.dashboard.id, column.get_translatable_name_code_text(this.page_widget.id)).auto_update_datatable_field_uid_with_vo_type();
                res = var_data_field;
                break;
            case TableColumnDescVO.TYPE_vo_field_ref:
                let field = moduleTable.get_field_by_id(column.field_id);
                // let field_type = field ? field.field_type : moduletablfiel
                // switch (field.field_type) {

                // let data_field: SimpleDatatableField<any, any> = new SimpleDatatableField(field.field_id, field.field_label.code_text);
                // data_field.setModuleTable(moduleTable);
                // res[column.id] = data_field;
                // break;
                // default:

                // if (!field) {
                //     res[column.id] = new SimpleDatatableField(column.field_id).setModuleTable(moduleTable).auto_update_datatable_field_uid_with_vo_type().set_translatable_title();
                //     break;
                // }

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
                res = new CRUDActionsDatatableField().setModuleTable(moduleTable);
                break;
            case TableColumnDescVO.TYPE_select_box:
                res = new SelectBoxDatatableField().setModuleTable(moduleTable);
                break;
        }
        return res;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {
        // Si je suis sur un init, je force l'update
        if (this.is_init_widget_validation_filtres()) {
            await this.do_update_visible_options();
            return;
        }

        // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
        if (this.has_widget_validation_filtres()) {
            return;
        }

        await this.do_update_visible_options();
    }

    private async do_update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        this.update_cpt_live++;
        this.is_busy = true;

        if (!this.widget_options) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            this.update_cpt_live--;
            this.pagination_count = null;
            return;
        }

        if ((!this.widget_options.columns) || (!this.widget_options.columns.length)) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            this.update_cpt_live--;
            this.pagination_count = null;
            return;
        }

        if (!this.fields) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            this.update_cpt_live--;
            this.pagination_count = null;
            return;
        }

        if (!this.dashboard.api_type_ids) {
            this.data_rows = [];
            this.loaded_once = true;
            this.is_busy = false;
            this.update_cpt_live--;
            this.pagination_count = null;
            return;
        }

        /**
         * On checke si le param de is_filtering_by devrait pas être invalidé (suite changement de filtrage manuel par ailleurs typiquement)
         */
        if (this.is_filtering_by && this.filtering_by_active_field_filter) {

            if ((!this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type]) ||
                (!this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id]) ||
                (this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id].filter_type != this.filtering_by_active_field_filter.filter_type) ||
                (this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id].vo_type != this.filtering_by_active_field_filter.vo_type) ||
                (this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id].field_id != this.filtering_by_active_field_filter.field_id) ||
                (this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id].param_numeric != this.filtering_by_active_field_filter.param_numeric) ||
                (this.get_active_field_filters[this.filtering_by_active_field_filter.vo_type][this.filtering_by_active_field_filter.field_id].param_text != this.filtering_by_active_field_filter.param_text)) {
                this.is_filtering_by = false;
                this.filtering_by_active_field_filter = null;
            }
        }

        let crud_api_type_id = this.widget_options.crud_api_type_id ? this.widget_options.crud_api_type_id : null;
        if (!crud_api_type_id) {
            for (let column_id in this.fields) {
                let field = this.fields[column_id];

                if (!field.moduleTable.vo_type) {
                    continue;
                }

                crud_api_type_id = field.moduleTable.vo_type;
                break;
            }
        }

        if (!crud_api_type_id) {
            ConsoleHandler.getInstance().error('Pas de crud_api_type_id pour le table widget impossible de générer la requête');
            return;
        }

        let query_: ContextQueryVO = query(crud_api_type_id)
            .set_limit(this.limit, this.pagination_offset)
            .using(this.dashboard.api_type_ids)
            .add_filters(ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters)
            ));

        let db_cells_source = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_num_eq('dashboard_id', this.dashboard.id)
            .select_vos<DashboardGraphVORefVO>();

        // let db_cell_source_by_vo_type: { [vo_type: string]: DashboardGraphVORefVO } = {};
        let discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = {};

        for (let i in db_cells_source) {
            // db_cell_source_by_vo_type[db_cells_source[i].vo_type] = db_cells_source[i];
            let vo_type = db_cells_source[i].vo_type;
            let db_cell_source = db_cells_source[i];

            if (!db_cell_source.values_to_exclude) {
                continue;
            }

            for (let index_field_id in db_cell_source.values_to_exclude) {
                let field_id: string = db_cell_source.values_to_exclude[index_field_id];

                if (!discarded_field_paths[vo_type]) {
                    discarded_field_paths[vo_type] = {};
                }
                discarded_field_paths[vo_type][field_id] = true;
            }
        }
        this.set_discarded_field_paths(discarded_field_paths);

        //On évite les jointures supprimées.
        for (let index_vo_type in query_.active_api_type_ids) {
            let vo_type: string = query_.active_api_type_ids[index_vo_type];

            if (!discarded_field_paths[vo_type]) {
                continue;
            }

            for (let field_id in discarded_field_paths[vo_type]) {
                query_.discard_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
            }
        }
        // discard_field_path(vo_type: string, field_id: string)
        /**
         * Si on a un filtre actif sur la table on veut ignorer le filtre généré par la table à ce stade et charger toutes les valeurs, et mettre en avant simplement celles qui sont filtrées
         */
        if (this.is_filtering_by && this.filtering_by_active_field_filter) {
            query_.filters = query_.filters.filter((f) =>
                (f.filter_type != this.filtering_by_active_field_filter.filter_type) ||
                (f.vo_type != this.filtering_by_active_field_filter.vo_type) ||
                (f.field_id != this.filtering_by_active_field_filter.field_id) ||
                (f.param_numeric != this.filtering_by_active_field_filter.param_numeric) ||
                (f.param_text != this.filtering_by_active_field_filter.param_text));
        }

        if (this.fields && (
            ((this.order_asc_on_id != null) && this.fields[this.order_asc_on_id]) ||
            ((this.order_desc_on_id != null) && this.fields[this.order_desc_on_id]))) {

            let field = (this.order_asc_on_id != null) ? this.fields[this.order_asc_on_id] : this.fields[this.order_desc_on_id];

            query_.set_sort(new SortByVO(field.moduleTable.vo_type, field.module_table_field_id, (this.order_asc_on_id != null)));
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
        for (let column_id in this.fields) {
            let field = this.fields[column_id];

            if ((field.type == DatatableField.VAR_FIELD_TYPE) ||
                (field.type == DatatableField.SELECT_BOX_FIELD_TYPE)) {
                continue;
            }

            if (this.dashboard.api_type_ids.indexOf(field.moduleTable.vo_type) < 0) {
                ConsoleHandler.getInstance().warn('select_datatable_rows: asking for datas from types not included in request:' +
                    field.datatable_field_uid + ':' + field.moduleTable.vo_type);
                this.data_rows = [];
                this.loaded_once = true;
                this.is_busy = false;
                this.update_cpt_live--;
                this.pagination_count = null;
                return;
            }

            // let column: TableColumnDescVO = this.columns_by_field_id[field.datatable_field_uid];
            let column: TableColumnDescVO = clone[field.datatable_field_uid];

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

            query_.add_fields([new ContextQueryFieldVO(field.moduleTable.vo_type, field.module_table_field_id, field.datatable_field_uid, aggregator)]);
        }

        // Si je suis sur une table segmentée, je vais voir si j'ai un filtre sur mon field qui segmente
        // Si ce n'est pas le cas, je n'envoie pas la requête
        let base_table: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[query_.base_api_type_id];

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
                this.update_cpt_live--;
                this.data_rows = [];
                this.loaded_once = true;
                this.is_busy = false;
                this.pagination_count = null;
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
                this.update_cpt_live--;
                this.data_rows = [];
                this.loaded_once = true;
                this.is_busy = false;
                this.pagination_count = null;
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
                ConsoleHandler.getInstance().error(error);
                continue;
            }

            if (!options) {
                continue;
            }

            query_.filters = ContextFilterHandler.getInstance().add_context_filters_exclude_values(
                options.exclude_filter_opt_values,
                options.vo_field_ref,
                query_.filters,
                true,
            );
        }

        let rows = await ModuleContextFilter.getInstance().select_datatable_rows(query_);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            this.update_cpt_live--;
            return;
        }

        this.actual_rows_query = cloneDeep(query_);

        let data_rows = [];
        let promises = [];
        for (let i in rows) {
            let row = rows[i];

            let resData: IDistantVOBase = {
                id: row.id,
                _type: row._type
            };
            for (let j in this.fields) {
                let field = this.fields[j];

                // si on est en édition on laisse la data raw
                if ((!this.columns_by_field_id[field.datatable_field_uid]) || this.columns_by_field_id[field.datatable_field_uid].readonly) {
                    promises.push(DatatableRowController.getInstance().get_datatable_row_field_data_async(row, resData, field, null));
                } else {
                    resData[field.datatable_field_uid] = row[field.datatable_field_uid];
                    resData[field.datatable_field_uid + '__raw'] = row[field.datatable_field_uid];
                }
            }
            data_rows.push(resData);
        }

        await all_promises(promises);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            this.update_cpt_live--;
            return;
        }

        this.data_rows = data_rows;

        let context_query = cloneDeep(query_);
        context_query.set_limit(0, 0);
        context_query.set_sort(null);
        this.pagination_count = await ModuleContextFilter.getInstance().select_count(context_query);

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
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_datatable_rows));
        AjaxCacheClientController.getInstance().invalidateUsingURLRegexp(new RegExp('.*' + ModuleContextFilter.APINAME_select_count));
        await this.do_update_visible_options();
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        if (!!this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

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

        this.limit = (!this.widget_options || (this.widget_options.limit == null)) ? TableWidgetOptions.DEFAULT_LIMIT : this.widget_options.limit;
        this.tmp_nbpages_pagination_list = (!this.widget_options || (this.widget_options.nbpages_pagination_list == null)) ? TableWidgetOptions.DEFAULT_NBPAGES_PAGINATION_LIST : this.widget_options.nbpages_pagination_list;

        let promises = [
            this.do_update_visible_options(),
            this.update_filter_by_access_cache()
        ];
        await all_promises(promises);
    }

    private async update_filter_by_access_cache() {

        let promises = [];
        let self = this;
        for (let i in this.widget_options.columns) {
            let column = this.widget_options.columns[i];

            if (!!column.filter_by_access) {
                promises.push((async () => {
                    VueAppBase.getInstance().vueInstance.$set(self.filter_by_access_cache, column.filter_by_access, await ModuleAccessPolicy.getInstance().checkAccess(column.filter_by_access));
                    ConsoleHandler.getInstance().log(column.filter_by_access + ':' + self.filter_by_access_cache[column.filter_by_access]);
                })());
            }
        }
        await all_promises(promises);
    }

    get has_group_headers() {
        if (!this.columns) {
            return false;
        }

        return !!this.columns.find((column) => column.type == TableColumnDescVO.TYPE_header);
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get widget_options(): TableWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;
                options = options ? new TableWidgetOptions(
                    options.columns,
                    options.is_focus_api_type_id,
                    options.limit,
                    options.crud_api_type_id,
                    options.vocus_button,
                    options.delete_button,
                    options.delete_all_button,
                    options.create_button,
                    options.update_button,
                    options.refresh_button,
                    options.export_button,
                    options.can_filter_by,
                    options.show_pagination_resumee,
                    options.show_pagination_slider,
                    options.show_pagination_form,
                    options.show_limit_selectable,
                    options.limit_selectable,
                    options.show_pagination_list,
                    options.nbpages_pagination_list,
                    options.has_table_total_footer,
                    options.hide_pagination_bottom,
                    options.default_export_option,
                    options.has_default_export_option,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
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
                        await this.do_update_visible_options();
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
                        await self.do_update_visible_options();
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






    // private get_export_params_for_xlsx(): ExportDataToXLSXParamVO {

    //     let exportable_datatable_data = this.get_exportable_datatable_data();
    //     return new ExportDataToXLSXParamVO(
    //         "Export-" + Dates.now() + ".xlsx",
    //         exportable_datatable_data,
    //         this.exportable_datatable_columns,
    //         this.datatable_columns_labels,
    //         this.crud_activated_api_type,
    //     );
    // }

    /**
     * On fabrique / récupère la query pour l'export + les params
     * @param limit_to_page limiter à la page actuellement visible. false => exporter toutes les datas
     */
    private get_export_params_for_context_query_xlsx(limit_to_page: boolean = true): ExportContextQueryToXLSXParamVO {

        if (!this.actual_rows_query) {
            return null;
        }

        let context_query = cloneDeep(this.actual_rows_query);
        if (!limit_to_page) {
            context_query.set_limit(0, 0);
        }

        let export_name = this.dashboard_page.translatable_name_code_text ?
            "Export-" + this.t(this.dashboard_page.translatable_name_code_text) + "-" + Dates.now() + ".xlsx" :
            "Export-" + Dates.now() + ".xlsx";

        return new ExportContextQueryToXLSXParamVO(
            export_name,
            context_query,
            this.exportable_datatable_columns,
            this.datatable_columns_labels,
            this.exportable_datatable_custom_field_columns,
            this.varcolumn_conf,
            this.get_active_field_filters,
            this.columns_custom_filters,
            this.dashboard.api_type_ids,
            this.get_discarded_field_paths
        );
    }

    get columns_custom_filters(): { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } {
        let res: { [datatable_field_uid: string]: { [var_param_field_name: string]: ContextFilterVO } } = {};

        for (let i in this.columns) {
            let column = this.columns[i];

            if (column.type !== TableColumnDescVO.TYPE_var_ref) {
                continue;
            }

            res[column.datatable_field_uid] = VarWidgetComponent.get_var_custom_filters(
                ObjectHandler.getInstance().hasAtLeastOneAttribute(column.filter_custom_field_filters) ? column.filter_custom_field_filters : null,
                this.get_active_field_filters);
        }

        return res;
    }

    get varcolumn_conf(): { [datatable_field_uid: string]: ExportVarcolumnConf } {
        let res: { [datatable_field_uid: string]: ExportVarcolumnConf } = {};

        for (let i in this.columns) {
            let column = this.columns[i];

            if (column.type !== TableColumnDescVO.TYPE_var_ref) {
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

    get datatable_columns_labels(): any {
        let res: any = {};

        for (let i in this.columns) {
            let column = this.columns[i];

            if (column.type == TableColumnDescVO.TYPE_header) {
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

        for (let i in this.columns) {
            let column: TableColumnDescVO = this.columns[i];

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

    private get_exportable_datatable_data(): any[] {
        let exportable_datatable_data = [];

        for (let i in this.data_rows) {

            let cloned_data = DatatableRowController.getInstance().get_exportable_datatable_row_data(this.data_rows[i], this.export_datatable, this.exportable_datatable_columns);
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

    /**
     * Export de toutes les données (en appliquant les filtrages)
     * @param limit_to_page se limiter à la page vue, ou renvoyer toutes les datas suivant les filtres actifs
     */
    private async do_export_to_xlsx(limit_to_page: boolean = true) {
        let param: ExportContextQueryToXLSXParamVO = this.get_export_params_for_context_query_xlsx(limit_to_page);

        if (!!param) {

            await ModuleDataExport.getInstance().exportContextQueryToXLSX(
                param.filename,
                param.context_query,
                param.ordered_column_list,
                param.column_labels,
                param.exportable_datatable_custom_field_columns,
                param.varcolumn_conf,
                param.custom_filters,
                param.is_secured,
                param.file_access_policy_name
            );
        }
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

        if (column.type != TableColumnDescVO.TYPE_vo_field_ref) {
            return res;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id].getFieldFromId(column.field_id);
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

            let field = VOsTypesManager.getInstance().moduleTables_by_voType[column.api_type_id].getFieldFromId(column.field_id);
            if (!field) {
                continue;
            }

            if (!this.column_total[column.api_type_id]) {
                this.column_total[column.api_type_id] = {};
            }

            let alias_field: string = column.field_id + "_" + column.api_type_id;

            let query_: ContextQueryVO = query(column.api_type_id)
                .field(column.field_id, alias_field, column.api_type_id, VarConfVO.SUM_AGGREGATOR)
                .add_filters(ContextFilterHandler.getInstance().get_filters_from_active_field_filters(
                    ContextFilterHandler.getInstance().clean_context_filters_for_request(this.get_active_field_filters)
                ));
            // .set_limit(this.limit, this.pagination_offset) =;> à ajouter pour le sous - total(juste le contenu de la page)
            // .set_sort(new SortByVO(column.api_type_id, column.field_id, (this.order_asc_on_id != null)));

            promises.push((async () => {
                let res = await ModuleContextFilter.getInstance().select(query_);

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
        return VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    private is_init_widget_validation_filtres(): boolean {
        if (!this.all_page_widget) {
            return false;
        }

        for (let i in this.all_page_widget) {
            let widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_filter) {
                if (
                    ValidationFiltersWidgetController.getInstance().is_init[this.dashboard_page.dashboard_id] &&
                    ValidationFiltersWidgetController.getInstance().is_init[this.dashboard_page.dashboard_id][this.dashboard_page.id] &&
                    ValidationFiltersWidgetController.getInstance().is_init[this.dashboard_page.dashboard_id][this.dashboard_page.id][this.all_page_widget[i].id]
                ) {
                    ValidationFiltersWidgetController.getInstance().set_is_init(
                        this.dashboard_page,
                        this.all_page_widget[i],
                        false
                    );

                    return true;
                }
            }
        }

        return false;
    }

    private has_widget_validation_filtres(): boolean {

        if (!this.all_page_widget) {
            return false;
        }

        for (let i in this.all_page_widget) {
            let widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_validation_filters) {
                return true;
            }
        }

        return false;
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
}