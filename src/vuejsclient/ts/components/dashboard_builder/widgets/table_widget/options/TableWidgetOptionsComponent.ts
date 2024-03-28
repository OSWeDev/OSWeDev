import Component from 'vue-class-component';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import TableWidgetColumnOptionsComponent from './column/TableWidgetColumnOptionsComponent';
import './TableWidgetOptionsComponent.scss';
import TableWidgetController from '../TableWidgetController';
import { cloneDeep, isEqual } from 'lodash';
import VueAppController from '../../../../../../VueAppController';
import VOFieldRefVOHandler from '../../../../../../../shared/modules/DashboardBuilder/handlers/VOFieldRefVOHandler';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';

@Component({
    template: require('./TableWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablewidgetcolumnoptionscomponent: TableWidgetColumnOptionsComponent,
        Vuenestable: VueNestable,
        Vuenestablehandle: VueNestableHandle,
    }
})
export default class TableWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: TableWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private crud_api_type_id_selected: string = null;
    private cb_bulk_actions: string[] = null;
    private vocus_button: boolean = false;
    private delete_button: boolean = true;
    private archive_button: boolean = false;
    private delete_all_button: boolean = false;
    private refresh_button: boolean = true;
    private export_button: boolean = true;
    private update_button: boolean = true;
    private create_button: boolean = true;
    private can_export_active_field_filters: boolean = false;
    private can_export_vars_indicator: boolean = false;
    private show_limit_selectable: boolean = false;
    private show_pagination_resumee: boolean = true;
    private show_pagination_slider: boolean = true;
    private show_pagination_form: boolean = true;
    private show_pagination_list: boolean = false;
    private hide_pagination_bottom: boolean = false;
    private can_apply_default_field_filters_without_validation: boolean = true;
    private has_table_total_footer: boolean = false;
    private use_for_count: boolean = false;
    private can_filter_by: boolean = true;
    private is_sticky: boolean = false;
    private limit: string = TableWidgetOptionsVO.DEFAULT_LIMIT.toString();
    private limit_selectable: string = TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE;
    private tmp_nbpages_pagination_list: number = TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST;
    private show_bulk_edit: boolean = false;
    private has_column_dynamic: boolean = false;
    private show_bulk_select_all: boolean = true;
    private column_dynamic_page_widget_id: number = null;
    private do_not_use_page_widget_ids: number[] = null;
    private column_dynamic_component: string = null;
    private column_dynamic_page_widget: DashboardPageWidgetVO = null;
    private do_not_use_page_widgets: DashboardPageWidgetVO[] = [];
    private page_widget_options: DashboardPageWidgetVO[] = [];
    private tmp_column_dynamic_time_segment: DataFilterOption = null;

    private tmp_default_export_option: DataFilterOption = null;
    private export_page_options: DataFilterOption[] = [
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label('table_widget.choose_export_type.page'), 1),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label('table_widget.choose_export_type.all'), 2),
    ];
    private tmp_has_default_export_option: boolean = false;
    private tmp_has_export_maintenance_alert: boolean = false;

    private editable_columns: TableColumnDescVO[] = null;
    private current_column: TableColumnDescVO = null;

    private use_kanban_by_default_if_exists: boolean = true;
    private use_kanban_column_weight_if_exists: boolean = true;
    private use_kanban_card_archive_if_exists: boolean = true;

    private async switch_use_kanban_card_archive_if_exists() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.use_kanban_card_archive_if_exists = !this.use_kanban_card_archive_if_exists;

        if (this.use_kanban_card_archive_if_exists != this.next_update_options.use_kanban_card_archive_if_exists) {
            this.next_update_options.use_kanban_card_archive_if_exists = this.use_kanban_card_archive_if_exists;

            await this.throttled_update_options();
        }
    }

    private async switch_use_kanban_column_weight_if_exists() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.use_kanban_column_weight_if_exists = !this.use_kanban_column_weight_if_exists;

        if (this.use_kanban_column_weight_if_exists != this.next_update_options.use_kanban_column_weight_if_exists) {
            this.next_update_options.use_kanban_column_weight_if_exists = this.use_kanban_column_weight_if_exists;

            await this.throttled_update_options();
        }
    }

    private async switch_use_kanban_by_default_if_exists() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.use_kanban_by_default_if_exists = !this.use_kanban_by_default_if_exists;

        if (this.use_kanban_by_default_if_exists != this.next_update_options.use_kanban_by_default_if_exists) {
            this.next_update_options.use_kanban_by_default_if_exists = this.use_kanban_by_default_if_exists;

            await this.throttled_update_options();
        }
    }

    get crud_api_type_id_select_options(): string[] {
        return this.get_dashboard_api_type_ids;
    }

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(VOsTypesManager.moduleTables_by_voType[api_type_id].label.code_text);
    }

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.crud_api_type_id_selected) {
                this.crud_api_type_id_selected = null;
            }
            if (!!this.cb_bulk_actions) {
                this.cb_bulk_actions = null;
            }
            if (!!this.vocus_button) {
                this.vocus_button = false;
            }
            if (!this.delete_button) {
                this.delete_button = true;
            }
            if (this.archive_button) {
                this.archive_button = false;
            }
            if (!!this.delete_all_button) {
                this.delete_all_button = false;
            }
            if (!this.update_button) {
                this.delete_button = true;
            }
            if (!this.create_button) {
                this.delete_button = true;
            }
            if (!this.export_button) {
                this.export_button = true;
            }
            if (!this.tmp_has_default_export_option) {
                this.tmp_has_default_export_option = false;
            }
            if (!this.tmp_has_export_maintenance_alert) {
                this.tmp_has_export_maintenance_alert = false;
            }
            if (!!this.tmp_default_export_option) {
                this.tmp_default_export_option = null;
            }
            if (!this.refresh_button) {
                this.refresh_button = true;
            }
            if (this.can_filter_by) {
                this.can_filter_by = false;
            }
            if (!this.show_bulk_edit) {
                this.show_bulk_edit = false;
            }
            if (!this.has_column_dynamic) {
                this.has_column_dynamic = false;
            }
            if (!this.show_bulk_select_all) {
                this.show_bulk_select_all = true;
            }
            if (!this.use_kanban_by_default_if_exists) {
                this.use_kanban_by_default_if_exists = true;
            }
            if (!this.use_kanban_column_weight_if_exists) {
                this.use_kanban_column_weight_if_exists = true;
            }
            if (!this.use_kanban_card_archive_if_exists) {
                this.use_kanban_card_archive_if_exists = true;
            }
            if (!!this.column_dynamic_page_widget_id) {
                this.column_dynamic_page_widget_id = null;
            }
            if (!!this.do_not_use_page_widget_ids) {
                this.do_not_use_page_widget_ids = null;
            }
            if (!!this.column_dynamic_component) {
                this.column_dynamic_component = null;
            }
            if (!!this.column_dynamic_page_widget) {
                this.column_dynamic_page_widget = null;
            }
            if (!!this.do_not_use_page_widgets) {
                this.do_not_use_page_widgets = [];
            }
            if (!!this.tmp_column_dynamic_time_segment) {
                this.tmp_column_dynamic_time_segment = null;
            }
            this.limit = TableWidgetOptionsVO.DEFAULT_LIMIT.toString();
            this.limit_selectable = TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE;
            this.tmp_nbpages_pagination_list = TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST;
            this.limit = TableWidgetOptionsVO.DEFAULT_LIMIT.toString();
            this.limit_selectable = TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE;
            this.tmp_nbpages_pagination_list = TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST;
            return;
        }

        if (this.crud_api_type_id_selected != this.widget_options.crud_api_type_id) {
            this.crud_api_type_id_selected = this.widget_options.crud_api_type_id;
        }

        if (this.cb_bulk_actions != this.widget_options.cb_bulk_actions) {
            this.cb_bulk_actions = this.widget_options.cb_bulk_actions;
        }

        if (this.vocus_button != this.widget_options.vocus_button) {
            this.vocus_button = this.widget_options.vocus_button;
        }
        if (this.delete_button != this.widget_options.delete_button) {
            this.delete_button = this.widget_options.delete_button;
        }
        if (this.archive_button != this.widget_options.archive_button) {
            this.archive_button = this.widget_options.archive_button;
        }
        if (this.create_button != this.widget_options.create_button) {
            this.create_button = this.widget_options.create_button;
        }
        if ((this.widget_options.show_limit_selectable != null) && (this.show_limit_selectable != this.widget_options.show_limit_selectable)) {
            this.show_limit_selectable = this.widget_options.show_limit_selectable;
        }
        if ((this.widget_options.show_pagination_resumee != null) && (this.show_pagination_resumee != this.widget_options.show_pagination_resumee)) {
            this.show_pagination_resumee = this.widget_options.show_pagination_resumee;
        }
        if ((this.widget_options.show_pagination_slider != null) && (this.show_pagination_slider != this.widget_options.show_pagination_slider)) {
            this.show_pagination_slider = this.widget_options.show_pagination_slider;
        }
        if ((this.widget_options.show_pagination_form != null) && (this.show_pagination_form != this.widget_options.show_pagination_form)) {
            this.show_pagination_form = this.widget_options.show_pagination_form;
        }
        if (this.export_button != this.widget_options.export_button) {
            this.export_button = this.widget_options.export_button;
        }
        if (this.can_export_active_field_filters != this.widget_options.can_export_active_field_filters) {
            this.can_export_active_field_filters = this.widget_options.can_export_active_field_filters;
        }
        if (this.can_export_vars_indicator != this.widget_options.can_export_vars_indicator) {
            this.can_export_vars_indicator = this.widget_options.can_export_vars_indicator;
        }
        if (this.tmp_has_default_export_option != this.widget_options.has_default_export_option) {
            this.tmp_has_default_export_option = this.widget_options.has_default_export_option;
        }
        if (this.tmp_has_export_maintenance_alert != this.widget_options.has_export_maintenance_alert) {
            this.tmp_has_export_maintenance_alert = this.widget_options.has_export_maintenance_alert;
        }
        if ((this.widget_options.default_export_option != null) && (!this.tmp_default_export_option || (this.tmp_default_export_option.id != this.widget_options.default_export_option))) {
            this.tmp_default_export_option = this.export_page_options.find((e) => e.id == this.widget_options.default_export_option);
        }
        if (this.hide_pagination_bottom != this.widget_options.hide_pagination_bottom) {
            this.hide_pagination_bottom = this.widget_options.hide_pagination_bottom;
        }
        if (this.show_pagination_list != this.widget_options.show_pagination_list) {
            this.show_pagination_list = this.widget_options.show_pagination_list;
        }
        if (this.refresh_button != this.widget_options.refresh_button) {
            this.refresh_button = this.widget_options.refresh_button;
        }
        if (this.delete_all_button != this.widget_options.delete_all_button) {
            this.delete_all_button = this.widget_options.delete_all_button;
        }
        if (this.update_button != this.widget_options.update_button) {
            this.update_button = this.widget_options.update_button;
        }
        if (this.can_filter_by != this.widget_options.can_filter_by) {
            this.can_filter_by = this.widget_options.can_filter_by;
        }
        if (this.show_bulk_edit != this.widget_options.show_bulk_edit) {
            this.show_bulk_edit = this.widget_options.show_bulk_edit;
        }
        if (this.has_column_dynamic != this.widget_options.has_column_dynamic) {
            this.has_column_dynamic = this.widget_options.has_column_dynamic;
        }
        if (this.show_bulk_select_all != this.widget_options.show_bulk_select_all) {
            this.show_bulk_select_all = this.widget_options.show_bulk_select_all;
        }
        if (this.use_kanban_by_default_if_exists != this.widget_options.use_kanban_by_default_if_exists) {
            this.use_kanban_by_default_if_exists = this.widget_options.use_kanban_by_default_if_exists;
        }
        if (this.use_kanban_column_weight_if_exists != this.widget_options.use_kanban_column_weight_if_exists) {
            this.use_kanban_column_weight_if_exists = this.widget_options.use_kanban_column_weight_if_exists;
        }
        if (this.use_kanban_card_archive_if_exists != this.widget_options.use_kanban_card_archive_if_exists) {
            this.use_kanban_card_archive_if_exists = this.widget_options.use_kanban_card_archive_if_exists;
        }
        if (this.column_dynamic_page_widget_id != this.widget_options.column_dynamic_page_widget_id) {
            this.column_dynamic_page_widget_id = this.widget_options.column_dynamic_page_widget_id;
        }
        if (this.do_not_use_page_widget_ids != this.widget_options.do_not_use_page_widget_ids) {
            this.do_not_use_page_widget_ids = this.widget_options.do_not_use_page_widget_ids;
        }
        if (this.column_dynamic_component != this.widget_options.column_dynamic_component) {
            this.column_dynamic_component = this.widget_options.column_dynamic_component;
        }

        this.page_widget_options = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().page_id, this.page_widget.page_id)
            .filter_by_num_not_eq(field_names<DashboardPageWidgetVO>().id, this.page_widget.id)
            .filter_is_true(field_names<DashboardWidgetVO>().is_filter, DashboardWidgetVO.API_TYPE_ID)
            .select_vos();

        if (this.column_dynamic_page_widget_id) {
            this.column_dynamic_page_widget = this.page_widget_options.find((page_widget) => {
                return (page_widget.id == this.column_dynamic_page_widget_id);
            });
        }
        if (this.do_not_use_page_widget_ids?.length) {
            this.do_not_use_page_widgets = this.page_widget_options.filter((page_widget) => {
                return this.do_not_use_page_widget_ids.includes(page_widget.id);
            });
        }

        if (this.tmp_column_dynamic_time_segment?.id != this.widget_options.column_dynamic_time_segment) {
            this.tmp_column_dynamic_time_segment = !!this.widget_options.column_dynamic_time_segment ? this.segmentation_type_options.find((e) => e.id == this.widget_options.column_dynamic_time_segment) : null;
        }

        this.can_apply_default_field_filters_without_validation = this.widget_options.can_apply_default_field_filters_without_validation ?? true;

        this.limit = (this.widget_options.limit == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT.toString() : this.widget_options.limit.toString();
        this.limit_selectable = (this.widget_options.limit_selectable == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE : this.widget_options.limit_selectable;
        this.tmp_nbpages_pagination_list = (this.widget_options.nbpages_pagination_list == null) ? TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST : this.widget_options.nbpages_pagination_list;
    }

    @Watch('show_bulk_edit')
    private async onchange_show_bulk_edit() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.show_bulk_edit != this.next_update_options.show_bulk_edit) {
            this.next_update_options.show_bulk_edit = this.show_bulk_edit;

            await this.throttled_update_options();
        }
    }
    @Watch('has_column_dynamic')
    private async onchange_has_column_dynamic() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.has_column_dynamic != this.next_update_options.has_column_dynamic) {
            this.next_update_options.has_column_dynamic = this.has_column_dynamic;

            await this.throttled_update_options();
        }
    }

    @Watch('show_bulk_select_all')
    private async onchange_show_bulk_select_all() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.show_bulk_select_all != this.next_update_options.show_bulk_select_all) {
            this.next_update_options.show_bulk_select_all = this.show_bulk_select_all;

            await this.throttled_update_options();
        }
    }

    @Watch('column_dynamic_page_widget')
    private async onchange_column_dynamic_page_widget() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.column_dynamic_page_widget?.id != this.next_update_options.column_dynamic_page_widget_id) {
            this.next_update_options.column_dynamic_page_widget_id = this.column_dynamic_page_widget?.id;

            await this.throttled_update_options();
        }
    }

    @Watch('do_not_use_page_widgets')
    private async onchange_do_not_use_page_widgets() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.do_not_use_page_widgets?.length != this.next_update_options.do_not_use_page_widget_ids?.length) {
            this.next_update_options.do_not_use_page_widget_ids = this.do_not_use_page_widgets ? this.do_not_use_page_widgets.map((e) => e.id) : null;

            await this.throttled_update_options();
        }
    }

    @Watch('column_dynamic_component')
    private async onchange_column_dynamic_component() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.column_dynamic_component != this.next_update_options.column_dynamic_component) {
            this.next_update_options.column_dynamic_component = this.column_dynamic_component;

            await this.throttled_update_options();
        }
    }

    @Watch('tmp_column_dynamic_time_segment')
    private async onchange_tmp_column_dynamic_time_segment() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_column_dynamic_time_segment || (this.widget_options.column_dynamic_time_segment != this.tmp_column_dynamic_time_segment.id)) {
            this.next_update_options = this.widget_options;
            this.next_update_options.column_dynamic_time_segment = this.tmp_column_dynamic_time_segment ? this.tmp_column_dynamic_time_segment.id : null;

            await this.throttled_update_options();
        }
    }

    @Watch('tmp_nbpages_pagination_list')
    private async onchange_nbpages_pagination_list() {
        if (!this.widget_options) {
            return;
        }

        let nbpages_pagination_list = (this.tmp_nbpages_pagination_list == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT : this.tmp_nbpages_pagination_list;
        if (this.widget_options.nbpages_pagination_list != nbpages_pagination_list) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.nbpages_pagination_list = nbpages_pagination_list;

            this.throttled_update_options();
        }
    }

    @Watch('limit')
    private async onchange_limit() {
        if (!this.widget_options) {
            return;
        }

        let limit = (this.limit == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT : parseInt(this.limit);
        if (this.widget_options.limit != limit) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.limit = limit;

            this.throttled_update_options();
        }
    }

    @Watch('tmp_default_export_option')
    private async onchange_tmp_default_export_option() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.tmp_default_export_option) {
            this.next_update_options.default_export_option = null;
        } else if (this.widget_options.default_export_option != this.tmp_default_export_option.id) {
            this.next_update_options.default_export_option = this.tmp_default_export_option.id;
        }

        this.throttled_update_options();
    }

    @Watch('limit_selectable')
    private async onchange_limit_selectable() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.limit_selectable != this.limit_selectable) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.limit_selectable = this.limit_selectable;

            this.throttled_update_options();
        }
    }

    private filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }

    private get_new_column_id() {
        if (!this.widget_options) {
            ConsoleHandler.error('get_new_column_id:failed');
            return null;
        }

        if ((!this.widget_options.columns) || (!this.widget_options.columns.length)) {
            return 0;
        }

        let ids = this.widget_options.columns.map((c) => c.id ? c.id : 0);
        let max = -1;
        for (let i in ids) {
            if (max < ids[i]) {
                max = ids[i];
            }
        }

        return max + 1;
    }

    @Watch('crud_api_type_id_selected')
    private async onchange_crud_api_type_id_selected() {
        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.crud_api_type_id != this.crud_api_type_id_selected) {
            this.next_update_options.crud_api_type_id = this.crud_api_type_id_selected;

            /**
             * Si on configure un crud_api_type_id_selected et qu'on a pas de colonne pour traiter les crud actions, on rajoute la colonne
             */

            if ((!!this.crud_api_type_id_selected) && ((!this.next_update_options.columns) || (!this.next_update_options.columns.find((column: TableColumnDescVO) => column.type == TableColumnDescVO.TYPE_crud_actions)))) {
                let crud_actions_column = new TableColumnDescVO();
                crud_actions_column.api_type_id = this.crud_api_type_id_selected;
                crud_actions_column.type = TableColumnDescVO.TYPE_crud_actions;
                crud_actions_column.weight = -1;
                crud_actions_column.id = this.get_new_column_id();
                crud_actions_column.readonly = true;
                crud_actions_column.exportable = false;
                crud_actions_column.hide_from_table = false;
                crud_actions_column.sortable = true;
                crud_actions_column.filter_by_access = null;
                crud_actions_column.enum_bg_colors = null;
                crud_actions_column.enum_fg_colors = null;
                crud_actions_column.bg_color_header = null;
                crud_actions_column.font_color_header = null;
                crud_actions_column.can_filter_by = false;
                crud_actions_column.column_width = 0;
                crud_actions_column.kanban_column = false;
                await this.add_column(crud_actions_column);
                return;
            } else if (!!this.crud_api_type_id_selected) {
                // On check qu'on a le bon type
                let existing_column = this.next_update_options.columns.find((column: TableColumnDescVO) => column.type == TableColumnDescVO.TYPE_crud_actions);
                if (existing_column.api_type_id != this.crud_api_type_id_selected) {
                    existing_column.api_type_id = this.crud_api_type_id_selected;
                }
            }

            this.throttled_update_options();
        }
    }

    @Watch('cb_bulk_actions')
    private async onchange_cb_bulk_actions() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.cb_bulk_actions != this.cb_bulk_actions) {
            this.next_update_options = this.widget_options;
            this.next_update_options.cb_bulk_actions = this.cb_bulk_actions;

            await this.throttled_update_options();
        }
    }

    private async changed_columns() {

        /**
         * On applique les nouveaux poids
         */
        for (let i in this.editable_columns) {
            let column = this.editable_columns[i];

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (let j in column.children) {
                    let child = column.children[j];

                    child.weight = parseInt(j);
                }
            } else {
                column.weight = parseInt(i);
            }
        }

        this.next_update_options = cloneDeep(this.widget_options);
        this.next_update_options.columns = this.editable_columns;
        this.throttled_update_options();
    }

    /**
     * update_column
     *  - Update column configuration in widget_options
     *
     * @param {TableColumnDescVO} update_column
     * @returns
     */
    private async update_column(update_column: TableColumnDescVO) {

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.columns) {
            return null;
        }

        let old_column: TableColumnDescVO = null;

        let k: number;
        let i = this.next_update_options.columns.findIndex((column) => {

            if (column.id == update_column.id) {
                old_column = column;
                return true;
            }

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (let u in column.children) {
                    let child = column.children[u];
                    if (child.id == update_column.id) {
                        old_column = child;
                        k = parseInt(u);
                        return true;
                    }
                }
            }
            return false;
        });

        if (i < 0) {
            ConsoleHandler.error('update_column failed');
            return null;
        }

        // Si on essaye de mettre à jour le tri par defaut, on réinitialise tous les autres pour en avoir qu'un seul actif
        if (old_column.default_sort_field != update_column.default_sort_field) {
            for (let i_col in this.next_update_options.columns) {
                if (this.next_update_options.columns[i_col].id == old_column.id) {
                    continue;
                }

                if (this.next_update_options.columns[i_col].default_sort_field != null) {
                    this.next_update_options.columns[i_col].default_sort_field = null;
                }
            }
        }
        if (typeof (k) != 'undefined') {
            if (isEqual(this.next_update_options.columns[i].children[k], update_column)) {
                return;
            }

            this.next_update_options.columns[i].children[k] = update_column;
        } else {
            if (isEqual(this.next_update_options.columns[i], update_column)) {
                return;
            }

            this.next_update_options.columns[i] = update_column;
        }

        this.throttled_update_options();
    }

    private async remove_column(del_column: TableColumnDescVO) {
        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.columns) {
            return null;
        }

        let k: number;
        let i = this.next_update_options.columns.findIndex((column) => {

            if (column.id == del_column.id) {
                return column.id == del_column.id;
            }
            if (column.type == TableColumnDescVO.TYPE_header) {
                for (let u in column.children) {
                    let child = column.children[u];
                    if (child.id == del_column.id) {
                        k = parseInt(u);
                        return child.id == del_column.id;
                    }
                }
            }
        });

        if (i < 0) {
            ConsoleHandler.error('remove_column failed');
            return null;
        }

        if (typeof (k) != 'undefined') {
            this.next_update_options.columns[i].children.splice(k);
        } else {
            this.next_update_options.columns.splice(i, 1);
        }

        this.throttled_update_options();
    }

    private get_default_options(): TableWidgetOptionsVO {
        return new TableWidgetOptionsVO(
            null,
            false,
            100,
            null,
            false,
            true,
            false,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            false,
            null,
            false,
            5,
            false,
            false,
            null,
            false,
            true,
            true,
            true,
            false,
            false
        );
    }

    private async add_column(add_column: TableColumnDescVO) {

        this.next_update_options = cloneDeep(this.widget_options);
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        let i = -1;
        let found = false;

        if ((!!add_column) && (!!this.next_update_options.columns)) {
            i = this.next_update_options.columns.findIndex((ref_elt) => {
                return ref_elt.id == add_column.id;
            });
        }

        if (i < 0) {
            i = 0;
            add_column.weight = 0;
        } else {
            found = true;
        }

        if (!found) {
            if (!this.next_update_options.columns) {
                this.next_update_options.columns = [];
            }
            this.next_update_options.columns.push(add_column);
        }

        this.throttled_update_options();
    }

    get columns(): TableColumnDescVO[] {
        let options: TableWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.columns)) {
            this.editable_columns = null;
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
            if (column.exportable == null) {
                column.exportable = (column.type != TableColumnDescVO.TYPE_crud_actions);
            }
            if (column.hide_from_table == null) {
                column.hide_from_table = false;
            }
            if (column.sortable == null) {
                column.sortable = true;
            }
            if (column.can_filter_by == null) {
                column.can_filter_by = column.readonly && (
                    (column.type != TableColumnDescVO.TYPE_crud_actions) ||
                    (column.type != TableColumnDescVO.TYPE_vo_field_ref));
            }

            res.push(Object.assign(new TableColumnDescVO(), column));
        }
        WeightHandler.getInstance().sortByWeight(res);

        this.editable_columns = res.map((e) => Object.assign(new TableColumnDescVO(), e));

        return res;
    }

    private beforeMove({ dragItem, pathFrom, pathTo }) {
        // Si on essaye de faire un 3eme niveau, on refuse
        if (pathTo.length > 2) {
            return false;
        }

        // On ne peut mettre les type header que sur le 1er niveau
        if (dragItem.type == TableColumnDescVO.TYPE_header) {
            return pathTo.length === 1;
        }

        // Si on essaye de créer un 2nd niveau sur une colonne qui n'est pas header, on refuse
        if ((pathFrom.length === 1) && (pathTo.length == 2) && this.columns[pathTo[0]].type == TableColumnDescVO.TYPE_vo_field_ref) {
            return false;
        }

        return true;
    }


    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            this.tmp_default_export_option = null;
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    private read_label(label: string): string {
        const translation = VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS;
        const text = translation[label + '.___LABEL___'];

        return text;
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        return 'Table#' + this.page_widget.id;
    }

    get widget_options(): TableWidgetOptionsVO {
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

    // @Watch('vocus_button')
    // @Watch('delete_button')
    // private async onchange_switches() {
    //     if (this.widget_options && (
    //         (this.delete_button != this.widget_options.delete_button) ||
    //         (this.vocus_button != this.widget_options.vocus_button))) {

    //         this.next_update_options = cloneDeep(this.widget_options);

    //         if (!this.next_update_options) {
    //             this.next_update_options = new TableWidgetOptionsVO(null, this.page_widget.id, null, false, true);
    //         }

    //         this.next_update_options.vocus_button = this.vocus_button;
    //         this.next_update_options.delete_button = this.delete_button;
    //         this.throttled_update_options();
    //         }
    //     }

    private async switch_vocus_button() {
        this.vocus_button = !this.vocus_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.vocus_button != this.vocus_button) {
            this.next_update_options.vocus_button = this.vocus_button;
            this.throttled_update_options();
        }
    }

    private async switch_delete_button() {
        this.delete_button = !this.delete_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.delete_button != this.delete_button) {
            this.next_update_options.delete_button = this.delete_button;
            this.throttled_update_options();
        }
    }

    private async switch_archive_button() {
        this.archive_button = !this.archive_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.archive_button != this.archive_button) {
            this.next_update_options.archive_button = this.archive_button;
            this.throttled_update_options();
        }
    }

    private async switch_can_filter_by() {
        this.can_filter_by = !this.can_filter_by;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.can_filter_by != this.can_filter_by) {
            this.next_update_options.can_filter_by = this.can_filter_by;
            this.throttled_update_options();
        }
    }

    private async switch_delete_all_button() {
        this.delete_all_button = !this.delete_all_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.delete_all_button != this.delete_all_button) {
            this.next_update_options.delete_all_button = this.delete_all_button;
            this.throttled_update_options();
        }
    }

    private async switch_refresh_button() {
        this.refresh_button = !this.refresh_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refresh_button != this.refresh_button) {
            this.next_update_options.refresh_button = this.refresh_button;
            this.throttled_update_options();
        }
    }

    private async switch_tmp_has_default_export_option() {
        this.tmp_has_default_export_option = !this.tmp_has_default_export_option;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.has_default_export_option != this.tmp_has_default_export_option) {
            this.next_update_options.has_default_export_option = this.tmp_has_default_export_option;
            this.throttled_update_options();
        }
    }

    private async switch_tmp_has_export_maintenance_alert() {
        this.tmp_has_export_maintenance_alert = !this.tmp_has_export_maintenance_alert;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.has_export_maintenance_alert != this.tmp_has_export_maintenance_alert) {
            this.next_update_options.has_export_maintenance_alert = this.tmp_has_export_maintenance_alert;
            await this.throttled_update_options();
        }
    }

    private async switch_export_button() {
        this.export_button = !this.export_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.export_button != this.export_button) {
            this.next_update_options.export_button = this.export_button;
            this.throttled_update_options();
        }
    }

    private async toggle_can_apply_default_field_filters_without_validation() {
        this.can_apply_default_field_filters_without_validation = !this.can_apply_default_field_filters_without_validation;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.can_apply_default_field_filters_without_validation = this.can_apply_default_field_filters_without_validation;

        this.throttled_update_options();
    }

    private async toggle_can_export_active_field_filters() {
        this.can_export_active_field_filters = !this.can_export_active_field_filters;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.can_export_active_field_filters != this.can_export_active_field_filters) {
            this.next_update_options.can_export_active_field_filters = this.can_export_active_field_filters;

            this.throttled_update_options();
        }
    }

    private async toggle_can_export_vars_indicator() {
        this.can_export_vars_indicator = !this.can_export_vars_indicator;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.can_export_vars_indicator != this.can_export_vars_indicator) {
            this.next_update_options.can_export_vars_indicator = this.can_export_vars_indicator;

            this.throttled_update_options();
        }
    }

    private async switch_update_button() {
        this.update_button = !this.update_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.update_button != this.update_button) {
            this.next_update_options.update_button = this.update_button;
            this.throttled_update_options();
        }
    }

    private async switch_create_button() {
        this.create_button = !this.create_button;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.create_button != this.create_button) {
            this.next_update_options.create_button = this.create_button;
            this.throttled_update_options();
        }
    }

    private async switch_show_limit_selectable() {
        this.show_limit_selectable = !this.show_limit_selectable;

        if (this.show_limit_selectable) {
            this.limit_selectable = TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE;
        }

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_limit_selectable != this.show_limit_selectable) {
            this.next_update_options.show_limit_selectable = this.show_limit_selectable;
            this.throttled_update_options();
        }
    }

    private async switch_show_pagination_resumee() {
        this.show_pagination_resumee = !this.show_pagination_resumee;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_resumee != this.show_pagination_resumee) {
            this.next_update_options.show_pagination_resumee = this.show_pagination_resumee;
            this.throttled_update_options();
        }
    }

    private async switch_show_pagination_slider() {
        this.show_pagination_slider = !this.show_pagination_slider;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_slider != this.show_pagination_slider) {
            this.next_update_options.show_pagination_slider = this.show_pagination_slider;
            this.throttled_update_options();
        }
    }

    private async switch_show_pagination_form() {
        this.show_pagination_form = !this.show_pagination_form;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_form != this.show_pagination_form) {
            this.next_update_options.show_pagination_form = this.show_pagination_form;
            this.throttled_update_options();
        }
    }

    private async switch_show_pagination_list() {
        this.show_pagination_list = !this.show_pagination_list;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_list != this.show_pagination_list) {
            this.next_update_options.show_pagination_list = this.show_pagination_list;
            this.throttled_update_options();
        }
    }

    private async switch_hide_pagination_bottom() {
        this.hide_pagination_bottom = !this.hide_pagination_bottom;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.hide_pagination_bottom != this.hide_pagination_bottom) {
            this.next_update_options.hide_pagination_bottom = this.hide_pagination_bottom;
            this.throttled_update_options();
        }
    }

    private async switch_has_table_total_footer() {
        this.has_table_total_footer = !this.has_table_total_footer;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.has_table_total_footer != this.has_table_total_footer) {
            this.next_update_options.has_table_total_footer = this.has_table_total_footer;
            this.throttled_update_options();
        }
    }

    private async switch_use_for_count() {
        this.use_for_count = !this.use_for_count;

        this.next_update_options = cloneDeep(this.widget_options);

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.use_for_count != this.use_for_count) {
            this.next_update_options.use_for_count = this.use_for_count;
            this.throttled_update_options();
        }
    }

    get is_archived_api_type_id(): boolean {
        if (!this.widget_options?.crud_api_type_id) {
            return false;
        }

        return VOsTypesManager.moduleTables_by_voType[this.widget_options.crud_api_type_id].is_archived;
    }

    private async switch_show_bulk_edit() {
        this.show_bulk_edit = !this.show_bulk_edit;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_bulk_edit != this.show_bulk_edit) {
            this.next_update_options.show_bulk_edit = this.show_bulk_edit;
            await this.throttled_update_options();
        }
    }
    private async switch_has_column_dynamic() {
        this.has_column_dynamic = !this.has_column_dynamic;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.has_column_dynamic != this.has_column_dynamic) {
            this.next_update_options.has_column_dynamic = this.has_column_dynamic;
            await this.throttled_update_options();
        }
    }

    private async switch_show_bulk_select_all() {
        this.show_bulk_select_all = !this.show_bulk_select_all;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_bulk_select_all != this.show_bulk_select_all) {
            this.next_update_options.show_bulk_select_all = this.show_bulk_select_all;
            await this.throttled_update_options();
        }
    }

    private cb_bulk_actions_label(cb_bulk_action: string): string {
        return this.t(cb_bulk_action);
    }

    private page_widget_label(p_widget: DashboardPageWidgetVO): string {
        return "Widget ID: " + p_widget.id.toString();
    }

    private component_label(translatable_title: string): string {
        return this.t(translatable_title);
    }

    get cb_bulk_actions_options(): string[] {
        if ((!this.page_widget) || (!this.widget_options)) {
            return [];
        }

        if (!this.widget_options.crud_api_type_id) {
            return [];
        }

        if (!TableWidgetController.getInstance().cb_bulk_actions_by_crud_api_type_id[this.widget_options.crud_api_type_id]) {
            return [];
        }

        let res = TableWidgetController.getInstance().cb_bulk_actions_by_crud_api_type_id[this.widget_options.crud_api_type_id];

        return res.map((c) => c.translatable_title);
    }

    get column_dynamic_page_widget_is_type_date(): boolean {
        if (!this.column_dynamic_page_widget) {
            return false;
        }

        let options = JSON.parse(this.column_dynamic_page_widget.json_options);

        if (!options?.vo_field_ref) {
            return false;
        }

        return VOFieldRefVOHandler.is_type_date(options.vo_field_ref);
    }

    get segmentation_type_options(): DataFilterOption[] {
        let res: DataFilterOption[] = [];

        for (let segmentation_type in TimeSegment.TYPE_NAMES_ENUM) {
            let new_opt: DataFilterOption = new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.t(TimeSegment.TYPE_NAMES_ENUM[segmentation_type]),
                parseInt(segmentation_type)
            );

            res.push(new_opt);
        }

        return res;
    }

    get component_options(): string[] {
        if ((!this.page_widget) || (!this.widget_options)) {
            return [];
        }

        if (!this.widget_options.crud_api_type_id) {
            return [];
        }

        let res: string[] = [];

        for (let api_type_id in TableWidgetController.getInstance().components_by_crud_api_type_id) {
            for (let i in TableWidgetController.getInstance().components_by_crud_api_type_id[api_type_id]) {
                res.push(TableWidgetController.getInstance().components_by_crud_api_type_id[api_type_id][i].translatable_title);
            }
        }

        return res;
    }
}