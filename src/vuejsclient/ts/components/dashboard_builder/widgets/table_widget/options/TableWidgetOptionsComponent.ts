import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import TableWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../../../../shared/tools/LocaleManager';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import './TableWidgetOptionsComponent.scss';
import TableWidgetColumnOptionsComponent from './column/TableWidgetColumnOptionsComponent';

@Component({
    template: require('./TableWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Tablewidgetcolumnoptionscomponent: TableWidgetColumnOptionsComponent,
        Vuenestable: VueNestable,
        Vuenestablehandle: VueNestableHandle,
    }
})
export default class TableWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    public set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    public crud_api_type_id_selected: string = null;
    public cb_bulk_actions: string[] = null;
    public vocus_button: boolean = false;
    public delete_button: boolean = true;
    public archive_button: boolean = false;
    public delete_all_button: boolean = false;
    public refresh_button: boolean = true;
    public export_button: boolean = true;
    public update_button: boolean = true;
    public create_button: boolean = true;
    public can_export_active_field_filters: boolean = false;
    public can_export_vars_indicator: boolean = false;
    public show_limit_selectable: boolean = false;
    public show_pagination_resumee: boolean = true;
    public show_pagination_slider: boolean = true;
    public show_pagination_form: boolean = true;
    public show_pagination_list: boolean = false;
    public hide_pagination_bottom: boolean = false;
    public can_apply_default_field_filters_without_validation: boolean = true;
    public has_table_total_footer: boolean = false;
    public use_for_count: boolean = false;
    public can_filter_by: boolean = true;
    public is_sticky: boolean = false;
    public limit: string = TableWidgetOptionsVO.DEFAULT_LIMIT.toString();
    public limit_selectable: string = TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE;
    public tmp_nbpages_pagination_list: number = TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST;
    public show_bulk_edit: boolean = false;
    public show_bulk_select_all: boolean = true;
    public do_not_use_page_widget_ids: number[] = null;
    public do_not_use_page_widgets: DashboardPageWidgetVO[] = [];
    public page_widget_options: DashboardPageWidgetVO[] = [];

    public tmp_default_export_option: DataFilterOption = null;
    public export_page_options: DataFilterOption[] = [
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label('table_widget.choose_export_type.page'), 1),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label('table_widget.choose_export_type.all'), 2),
    ];
    public tmp_has_default_export_option: boolean = false;
    public tmp_has_export_maintenance_alert: boolean = false;

    public editable_columns: TableColumnDescVO[] = null;
    public current_column: TableColumnDescVO = null;

    public use_kanban_by_default_if_exists: boolean = true;
    public use_kanban_column_weight_if_exists: boolean = true;
    public use_kanban_card_archive_if_exists: boolean = true;
    public tmp_legende_tableau: string = null;

    get crud_api_type_id_select_options(): string[] {
        return this.get_dashboard_api_type_ids;
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    get cb_bulk_actions_options(): string[] {
        if ((!this.page_widget) || (!this.widget_options)) {
            return [];
        }

        if (!this.widget_options.crud_api_type_id) {
            return [];
        }

        if (!TableWidgetManager.cb_bulk_actions_by_crud_api_type_id[this.widget_options.crud_api_type_id]) {
            return [];
        }

        const res = TableWidgetManager.cb_bulk_actions_by_crud_api_type_id[this.widget_options.crud_api_type_id];

        return res.map((c) => c.translatable_title);
    }

    get get_all_widgets(): DashboardWidgetVO[] {
        return this.vuexGet(reflect<this>().get_all_widgets);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }

    get segmentation_type_options(): DataFilterOption[] {
        const res: DataFilterOption[] = [];

        for (const segmentation_type in TimeSegment.TYPE_NAMES_ENUM) {
            const new_opt: DataFilterOption = new DataFilterOption(
                DataFilterOption.STATE_SELECTABLE,
                this.t(TimeSegment.TYPE_NAMES_ENUM[segmentation_type]),
                parseInt(segmentation_type)
            );

            res.push(new_opt);
        }

        return res;
    }


    get is_archived_api_type_id(): boolean {
        if (!this.widget_options?.crud_api_type_id) {
            return false;
        }

        return ModuleTableController.module_tables_by_vo_type[this.widget_options.crud_api_type_id].is_archived;
    }

    get columns(): TableColumnDescVO[] {
        const options: TableWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.columns)) {
            this.editable_columns = null;
            return null;
        }

        const res: TableColumnDescVO[] = [];
        for (const i in options.columns) {

            const column = options.columns[i];
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

    get default_title_translation(): string {
        return 'Table#' + this.page_widget.id;
    }

    get widget_options(): TableWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptionsVO;
                options = options ? new TableWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get component_options(): string[] {
        if ((!this.page_widget) || (!this.widget_options)) {
            return [];
        }

        if (!this.widget_options.crud_api_type_id) {
            return [];
        }

        const res: string[] = [];

        for (const api_type_id in TableWidgetManager.components_by_crud_api_type_id) {
            for (const i in TableWidgetManager.components_by_crud_api_type_id[api_type_id]) {
                res.push(TableWidgetManager.components_by_crud_api_type_id[api_type_id][i].translatable_title);
            }
        }

        return res;
    }

    get vars_options(): string[] {
        return Object.keys(VarsController.var_conf_by_name);
    }

    @Watch(reflect<TableWidgetOptionsComponent>().page_widget, { immediate: true })
    public async onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (this.crud_api_type_id_selected) {
                this.crud_api_type_id_selected = null;
            }
            if (this.cb_bulk_actions) {
                this.cb_bulk_actions = null;
            }
            if (this.vocus_button) {
                this.vocus_button = false;
            }
            if (!this.delete_button) {
                this.delete_button = true;
            }
            if (this.archive_button) {
                this.archive_button = false;
            }
            if (this.delete_all_button) {
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
            if (this.tmp_legende_tableau) {
                this.tmp_legende_tableau = null;
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
            if (!!this.do_not_use_page_widget_ids) {
                this.do_not_use_page_widget_ids = null;
            }
            if (!!this.do_not_use_page_widgets) {
                this.do_not_use_page_widgets = [];
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
        if (this.tmp_legende_tableau != this.widget_options.legende_tableau) {
            this.tmp_legende_tableau = this.widget_options.legende_tableau;
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
        if (this.do_not_use_page_widget_ids != this.widget_options.do_not_use_page_widget_ids) {
            this.do_not_use_page_widget_ids = this.widget_options.do_not_use_page_widget_ids;
        }

        this.page_widget_options = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().dashboard_id, this.page_widget.dashboard_id)
            .filter_by_num_not_eq(field_names<DashboardPageWidgetVO>().id, this.page_widget.id)
            .filter_is_true(field_names<DashboardWidgetVO>().is_filter, DashboardWidgetVO.API_TYPE_ID)
            .select_vos();

        if (this.do_not_use_page_widget_ids?.length) {
            this.do_not_use_page_widgets = this.page_widget_options.filter((page_widget) => {
                return this.do_not_use_page_widget_ids.includes(page_widget.id);
            });
        }

        this.can_apply_default_field_filters_without_validation = this.widget_options.can_apply_default_field_filters_without_validation ?? true;

        this.limit = (this.widget_options.limit == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT.toString() : this.widget_options.limit.toString();
        this.limit_selectable = (this.widget_options.limit_selectable == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE : this.widget_options.limit_selectable;
        this.tmp_nbpages_pagination_list = (this.widget_options.nbpages_pagination_list == null) ? TableWidgetOptionsVO.DEFAULT_NBPAGES_PAGINATION_LIST : this.widget_options.nbpages_pagination_list;
    }

    @Watch(reflect<TableWidgetOptionsComponent>().show_bulk_edit)
    public async onchange_show_bulk_edit() {


        if (this.show_bulk_edit != this.widget_options.show_bulk_edit) {
            this.widget_options.show_bulk_edit = this.show_bulk_edit;

            await this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().show_bulk_select_all)
    public async onchange_show_bulk_select_all() {


        if (this.show_bulk_select_all != this.widget_options.show_bulk_select_all) {
            this.widget_options.show_bulk_select_all = this.show_bulk_select_all;

            await this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().do_not_use_page_widgets)
    public async onchange_do_not_use_page_widgets() {


        if (this.do_not_use_page_widgets?.length != this.widget_options.do_not_use_page_widget_ids?.length) {
            this.widget_options.do_not_use_page_widget_ids = this.do_not_use_page_widgets ? this.do_not_use_page_widgets.map((e) => e.id) : null;

            await this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().tmp_nbpages_pagination_list)
    public async onchange_nbpages_pagination_list() {
        if (!this.widget_options) {
            return;
        }

        const nbpages_pagination_list = (this.tmp_nbpages_pagination_list == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT : this.tmp_nbpages_pagination_list;
        if (this.widget_options.nbpages_pagination_list != nbpages_pagination_list) {
            this.widget_options.nbpages_pagination_list = nbpages_pagination_list;

            this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().limit)
    public async onchange_limit() {
        if (!this.widget_options) {
            return;
        }

        const limit = (this.limit == null) ? TableWidgetOptionsVO.DEFAULT_LIMIT : parseInt(this.limit);
        if (this.widget_options.limit != limit) {
            this.widget_options.limit = limit;

            this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().crud_api_type_id_selected)
    public async onchange_crud_api_type_id_selected() {


        if (this.widget_options.crud_api_type_id != this.crud_api_type_id_selected) {
            this.widget_options.crud_api_type_id = this.crud_api_type_id_selected;

            /**
             * Si on configure un crud_api_type_id_selected et qu'on a pas de colonne pour traiter les crud actions, on rajoute la colonne
             */

            if ((!!this.crud_api_type_id_selected) && ((!this.widget_options.columns) || (!this.widget_options.columns.find((column: TableColumnDescVO) => column.type == TableColumnDescVO.TYPE_crud_actions)))) {
                const crud_actions_column = new TableColumnDescVO();
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
            } else if (this.crud_api_type_id_selected) {
                // On check qu'on a le bon type
                const existing_column = this.widget_options.columns.find((column: TableColumnDescVO) => column.type == TableColumnDescVO.TYPE_crud_actions);
                if (existing_column.api_type_id != this.crud_api_type_id_selected) {
                    existing_column.api_type_id = this.crud_api_type_id_selected;
                }
            }

            this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().cb_bulk_actions)
    public async onchange_cb_bulk_actions() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.cb_bulk_actions != this.cb_bulk_actions) {
            this.widget_options.cb_bulk_actions = this.cb_bulk_actions;

            await this.update_options();
        }
    }

    @Watch(reflect<TableWidgetOptionsComponent>().tmp_default_export_option)
    public async onchange_tmp_default_export_option() {
        if (!this.widget_options) {
            return;
        }


        if (!this.tmp_default_export_option) {
            this.widget_options.default_export_option = null;
        } else if (this.widget_options.default_export_option != this.tmp_default_export_option.id) {
            this.widget_options.default_export_option = this.tmp_default_export_option.id;
        }

        this.update_options();
    }

    @Watch(reflect<TableWidgetOptionsComponent>().tmp_legende_tableau)
    public async onchange_tmp_legende_tableau() {
        if (!this.widget_options) {
            return;
        }


        if (!this.tmp_legende_tableau) {
            this.widget_options.legende_tableau = null;
        } else if (this.widget_options.legende_tableau != this.tmp_legende_tableau) {
            this.widget_options.legende_tableau = this.tmp_legende_tableau;
        }

        this.update_options();
    }

    @Watch(reflect<TableWidgetOptionsComponent>().limit_selectable)
    public async onchange_limit_selectable() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.limit_selectable != this.limit_selectable) {
            this.widget_options.limit_selectable = this.limit_selectable;

            this.update_options();
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public filter_visible_label(dfo: DataFilterOption): string {
        return dfo.label;
    }

    public get_new_column_id() {
        if (!this.widget_options) {
            ConsoleHandler.error('get_new_column_id:failed');
            return null;
        }

        if ((!this.widget_options.columns) || (!this.widget_options.columns.length)) {
            return 0;
        }

        const ids = this.widget_options.columns.map((c) => c.id ? c.id : 0);
        let max = -1;
        for (const i in ids) {
            if (max < ids[i]) {
                max = ids[i];
            }
        }

        return max + 1;
    }

    public async changed_columns() {

        /**
         * On applique les nouveaux poids
         */
        for (const i in this.editable_columns) {
            const column = this.editable_columns[i];

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const j in column.children) {
                    const child = column.children[j];

                    child.weight = parseInt(j);
                }
            } else {
                column.weight = parseInt(i);
            }
        }

        this.widget_options.columns = this.editable_columns;
        this.update_options();
    }

    /**
     * update_column
     *  - Update column configuration in widget_options
     *
     * @param {TableColumnDescVO} update_column
     * @returns
     */
    public async update_column(update_column: TableColumnDescVO) {


        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.columns) {
            return null;
        }

        let old_column: TableColumnDescVO = null;

        let k: number;
        const i = this.widget_options.columns.findIndex((column) => {

            if (column.id == update_column.id) {
                old_column = column;
                return true;
            }

            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const u in column.children) {
                    const child = column.children[u];
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
            for (const i_col in this.widget_options.columns) {
                if (this.widget_options.columns[i_col].id == old_column.id) {
                    continue;
                }

                if (this.widget_options.columns[i_col].default_sort_field != null) {
                    this.widget_options.columns[i_col].default_sort_field = null;
                }
            }
        }
        if (typeof (k) != 'undefined') {
            if (isEqual(this.widget_options.columns[i].children[k], update_column)) {
                return;
            }

            this.widget_options.columns[i].children[k] = update_column;
        } else {
            if (isEqual(this.widget_options.columns[i], update_column)) {
                return;
            }

            this.widget_options.columns[i] = update_column;
        }

        this.update_options();
    }

    public async remove_column(del_column: TableColumnDescVO) {

        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.columns) {
            return null;
        }

        let k: number;
        const i = this.widget_options.columns.findIndex((column) => {

            if (column.id == del_column.id) {
                return column.id == del_column.id;
            }
            if (column.type == TableColumnDescVO.TYPE_header) {
                for (const u in column.children) {
                    const child = column.children[u];
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
            this.widget_options.columns[i].children.splice(k);
        } else {
            this.widget_options.columns.splice(i, 1);
        }

        this.update_options();
    }

    public async add_column(add_column: TableColumnDescVO) {


        let i = -1;
        let found = false;

        if ((!!add_column) && (!!this.widget_options.columns)) {
            i = this.widget_options.columns.findIndex((ref_elt) => {
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
            if (!this.widget_options.columns) {
                this.widget_options.columns = [];
            }
            this.widget_options.columns.push(add_column);
        }

        this.update_options();
    }

    public beforeMove({ dragItem, pathFrom, pathTo }) {
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


    public read_label(label: string): string {
        const translation = LocaleManager.ALL_FLAT_LOCALE_TRANSLATIONS;
        const text = translation[label + '.___LABEL___'];

        return text;
    }

    // @Watch(reflect<TableWidgetOptionsComponent>().vocus_button)
    // @Watch(reflect<TableWidgetOptionsComponent>().delete_button)
    // public async onchange_switches() {
    //     if (this.widget_options && (
    //         (this.delete_button != this.widget_options.delete_button) ||
    //         (this.vocus_button != this.widget_options.vocus_button))) {


    //         if (!this.widget_options) {
    //             this.widget_options = new TableWidgetOptionsVO(null, this.page_widget.id, null, false, true);
    //         }

    //         this.widget_options.vocus_button = this.vocus_button;
    //         this.widget_options.delete_button = this.delete_button;
    //         this.update_options();
    //         }
    //     }

    public async switch_vocus_button() {
        this.vocus_button = !this.vocus_button;



        if (this.widget_options.vocus_button != this.vocus_button) {
            this.widget_options.vocus_button = this.vocus_button;
            this.update_options();
        }
    }

    public async switch_delete_button() {
        this.delete_button = !this.delete_button;



        if (this.widget_options.delete_button != this.delete_button) {
            this.widget_options.delete_button = this.delete_button;
            this.update_options();
        }
    }

    public async switch_archive_button() {
        this.archive_button = !this.archive_button;



        if (this.widget_options.archive_button != this.archive_button) {
            this.widget_options.archive_button = this.archive_button;
            this.update_options();
        }
    }

    public async switch_can_filter_by() {
        this.can_filter_by = !this.can_filter_by;



        if (this.widget_options.can_filter_by != this.can_filter_by) {
            this.widget_options.can_filter_by = this.can_filter_by;
            this.update_options();
        }
    }

    public async switch_delete_all_button() {
        this.delete_all_button = !this.delete_all_button;



        if (this.widget_options.delete_all_button != this.delete_all_button) {
            this.widget_options.delete_all_button = this.delete_all_button;
            this.update_options();
        }
    }

    public async switch_refresh_button() {
        this.refresh_button = !this.refresh_button;



        if (this.widget_options.refresh_button != this.refresh_button) {
            this.widget_options.refresh_button = this.refresh_button;
            this.update_options();
        }
    }

    public async switch_tmp_has_default_export_option() {
        this.tmp_has_default_export_option = !this.tmp_has_default_export_option;



        if (this.widget_options.has_default_export_option != this.tmp_has_default_export_option) {
            this.widget_options.has_default_export_option = this.tmp_has_default_export_option;
            this.update_options();
        }
    }

    public async switch_tmp_has_export_maintenance_alert() {
        this.tmp_has_export_maintenance_alert = !this.tmp_has_export_maintenance_alert;



        if (this.widget_options.has_export_maintenance_alert != this.tmp_has_export_maintenance_alert) {
            this.widget_options.has_export_maintenance_alert = this.tmp_has_export_maintenance_alert;
            await this.update_options();
        }
    }

    public async switch_export_button() {
        this.export_button = !this.export_button;



        if (this.widget_options.export_button != this.export_button) {
            this.widget_options.export_button = this.export_button;
            this.update_options();
        }
    }

    public async toggle_can_apply_default_field_filters_without_validation() {
        this.can_apply_default_field_filters_without_validation = !this.can_apply_default_field_filters_without_validation;



        this.widget_options.can_apply_default_field_filters_without_validation = this.can_apply_default_field_filters_without_validation;

        this.update_options();
    }

    public async toggle_can_export_active_field_filters() {
        this.can_export_active_field_filters = !this.can_export_active_field_filters;



        if (this.widget_options.can_export_active_field_filters != this.can_export_active_field_filters) {
            this.widget_options.can_export_active_field_filters = this.can_export_active_field_filters;

            this.update_options();
        }
    }

    public async toggle_can_export_vars_indicator() {
        this.can_export_vars_indicator = !this.can_export_vars_indicator;



        if (this.widget_options.can_export_vars_indicator != this.can_export_vars_indicator) {
            this.widget_options.can_export_vars_indicator = this.can_export_vars_indicator;

            this.update_options();
        }
    }

    public async switch_update_button() {
        this.update_button = !this.update_button;



        if (this.widget_options.update_button != this.update_button) {
            this.widget_options.update_button = this.update_button;
            this.update_options();
        }
    }

    public async switch_create_button() {
        this.create_button = !this.create_button;



        if (this.widget_options.create_button != this.create_button) {
            this.widget_options.create_button = this.create_button;
            this.update_options();
        }
    }

    public async switch_show_limit_selectable() {
        this.show_limit_selectable = !this.show_limit_selectable;

        if (this.show_limit_selectable) {
            this.limit_selectable = TableWidgetOptionsVO.DEFAULT_LIMIT_SELECTABLE;
        }



        if (this.widget_options.show_limit_selectable != this.show_limit_selectable) {
            this.widget_options.show_limit_selectable = this.show_limit_selectable;
            this.update_options();
        }
    }

    public async switch_show_pagination_resumee() {
        this.show_pagination_resumee = !this.show_pagination_resumee;



        if (this.widget_options.show_pagination_resumee != this.show_pagination_resumee) {
            this.widget_options.show_pagination_resumee = this.show_pagination_resumee;
            this.update_options();
        }
    }

    public async switch_show_pagination_slider() {
        this.show_pagination_slider = !this.show_pagination_slider;



        if (this.widget_options.show_pagination_slider != this.show_pagination_slider) {
            this.widget_options.show_pagination_slider = this.show_pagination_slider;
            this.update_options();
        }
    }

    public async switch_show_pagination_form() {
        this.show_pagination_form = !this.show_pagination_form;



        if (this.widget_options.show_pagination_form != this.show_pagination_form) {
            this.widget_options.show_pagination_form = this.show_pagination_form;
            this.update_options();
        }
    }

    public async switch_show_pagination_list() {
        this.show_pagination_list = !this.show_pagination_list;

        if (this.widget_options.show_pagination_list != this.show_pagination_list) {
            this.widget_options.show_pagination_list = this.show_pagination_list;
            this.update_options();
        }
    }

    public async switch_hide_pagination_bottom() {
        this.hide_pagination_bottom = !this.hide_pagination_bottom;

        if (this.widget_options.hide_pagination_bottom != this.hide_pagination_bottom) {
            this.widget_options.hide_pagination_bottom = this.hide_pagination_bottom;
            this.update_options();
        }
    }

    public async switch_has_table_total_footer() {
        this.has_table_total_footer = !this.has_table_total_footer;

        if (this.widget_options.has_table_total_footer != this.has_table_total_footer) {
            this.widget_options.has_table_total_footer = this.has_table_total_footer;
            this.update_options();
        }
    }

    public async switch_use_for_count() {
        this.use_for_count = !this.use_for_count;

        if (this.widget_options.use_for_count != this.use_for_count) {
            this.widget_options.use_for_count = this.use_for_count;
            this.update_options();
        }
    }

    public async switch_show_bulk_edit() {
        this.show_bulk_edit = !this.show_bulk_edit;

        if (this.widget_options.show_bulk_edit != this.show_bulk_edit) {
            this.widget_options.show_bulk_edit = this.show_bulk_edit;
            await this.update_options();
        }
    }

    public async switch_show_bulk_select_all() {
        this.show_bulk_select_all = !this.show_bulk_select_all;

        if (this.widget_options.show_bulk_select_all != this.show_bulk_select_all) {
            this.widget_options.show_bulk_select_all = this.show_bulk_select_all;
            await this.update_options();
        }
    }

    public cb_bulk_actions_label(cb_bulk_action: string): string {
        return this.t(cb_bulk_action);
    }

    public page_widget_label(p_widget: DashboardPageWidgetVO): string {
        return "Widget ID: " + p_widget.id.toString();
    }

    public component_label(translatable_title: string): string {
        return this.t(translatable_title);
    }

    public async switch_use_kanban_card_archive_if_exists() {
        this.use_kanban_card_archive_if_exists = !this.use_kanban_card_archive_if_exists;

        if (this.use_kanban_card_archive_if_exists != this.widget_options.use_kanban_card_archive_if_exists) {
            this.widget_options.use_kanban_card_archive_if_exists = this.use_kanban_card_archive_if_exists;

            await this.update_options();
        }
    }

    public async switch_use_kanban_column_weight_if_exists() {
        this.use_kanban_column_weight_if_exists = !this.use_kanban_column_weight_if_exists;

        if (this.use_kanban_column_weight_if_exists != this.widget_options.use_kanban_column_weight_if_exists) {
            this.widget_options.use_kanban_column_weight_if_exists = this.use_kanban_column_weight_if_exists;

            await this.update_options();
        }
    }

    public async switch_use_kanban_by_default_if_exists() {
        this.use_kanban_by_default_if_exists = !this.use_kanban_by_default_if_exists;

        if (this.use_kanban_by_default_if_exists != this.widget_options.use_kanban_by_default_if_exists) {
            this.widget_options.use_kanban_by_default_if_exists = this.use_kanban_by_default_if_exists;

            await this.update_options();
        }
    }

    public crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(ModuleTableController.module_tables_by_vo_type[api_type_id].label.code_text);
    }

    public async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.widget_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        const name = this.get_widgets_by_id[this.page_widget.widget_id].name;
        const get_selected_fields = WidgetOptionsVOManager.widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }
}