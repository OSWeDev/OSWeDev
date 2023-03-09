import Component from 'vue-class-component';
import { VueNestable, VueNestableHandle } from 'vue-nestable';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import TableWidgetColumnOptionsComponent from './column/TableWidgetColumnOptionsComponent';
import TableWidgetOptions from './TableWidgetOptions';
import './TableWidgetOptionsComponent.scss';

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

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: TableWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private crud_api_type_id_selected: string = null;
    private vocus_button: boolean = false;
    private delete_button: boolean = true;
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
    private has_table_total_footer: boolean = false;
    private use_for_count: boolean = false;
    private can_filter_by: boolean = true;
    private is_sticky: boolean = false;
    private limit: string = TableWidgetOptions.DEFAULT_LIMIT.toString();
    private limit_selectable: string = TableWidgetOptions.DEFAULT_LIMIT_SELECTABLE;
    private tmp_nbpages_pagination_list: number = TableWidgetOptions.DEFAULT_NBPAGES_PAGINATION_LIST;

    private tmp_default_export_option: DataFilterOption = null;
    private export_page_options: DataFilterOption[] = [
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label('table_widget.choose_export_type.page'), 1),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label('table_widget.choose_export_type.all'), 2),
    ];
    private tmp_has_default_export_option: boolean = false;

    private editable_columns: TableColumnDescVO[] = null;
    private current_column: TableColumnDescVO = null;

    private use_kanban_by_default_if_exists: boolean = true;
    private use_kanban_column_weight_if_exists: boolean = true;

    private async switch_use_kanban_column_weight_if_exists() {
        this.use_kanban_column_weight_if_exists = !this.use_kanban_column_weight_if_exists;
        this.widget_options.use_kanban_column_weight_if_exists = this.use_kanban_column_weight_if_exists;
        this.update_options();
    }
    private async switch_use_kanban_by_default_if_exists() {
        this.use_kanban_by_default_if_exists = !this.use_kanban_by_default_if_exists;
        this.widget_options.use_kanban_by_default_if_exists = this.use_kanban_by_default_if_exists;
        this.update_options();
    }

    get crud_api_type_id_select_options(): string[] {
        return this.dashboard.api_type_ids;
    }

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(VOsTypesManager.moduleTables_by_voType[api_type_id].label.code_text);
    }

    @Watch('page_widget', { immediate: true })
    private onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.crud_api_type_id_selected) {
                this.crud_api_type_id_selected = null;
            }
            if (!!this.vocus_button) {
                this.vocus_button = false;
            }
            if (!this.delete_button) {
                this.delete_button = true;
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
            if (!!this.tmp_default_export_option) {
                this.tmp_default_export_option = null;
            }
            if (!this.refresh_button) {
                this.refresh_button = true;
            }
            if (!this.can_filter_by) {
                this.can_filter_by = true;
            }
            this.limit = TableWidgetOptions.DEFAULT_LIMIT.toString();
            this.limit_selectable = TableWidgetOptions.DEFAULT_LIMIT_SELECTABLE;
            this.tmp_nbpages_pagination_list = TableWidgetOptions.DEFAULT_NBPAGES_PAGINATION_LIST;
            return;
        }

        if (this.crud_api_type_id_selected != this.widget_options.crud_api_type_id) {
            this.crud_api_type_id_selected = this.widget_options.crud_api_type_id;
        }

        if (this.vocus_button != this.widget_options.vocus_button) {
            this.vocus_button = this.widget_options.vocus_button;
        }
        if (this.delete_button != this.widget_options.delete_button) {
            this.delete_button = this.widget_options.delete_button;
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

        this.limit = (this.widget_options.limit == null) ? TableWidgetOptions.DEFAULT_LIMIT.toString() : this.widget_options.limit.toString();
        this.limit_selectable = (this.widget_options.limit_selectable == null) ? TableWidgetOptions.DEFAULT_LIMIT_SELECTABLE : this.widget_options.limit_selectable;
        this.tmp_nbpages_pagination_list = (this.widget_options.nbpages_pagination_list == null) ? TableWidgetOptions.DEFAULT_NBPAGES_PAGINATION_LIST : this.widget_options.nbpages_pagination_list;
    }

    @Watch('tmp_nbpages_pagination_list')
    private async onchange_nbpages_pagination_list() {
        if (!this.widget_options) {
            return;
        }

        let nbpages_pagination_list = (this.tmp_nbpages_pagination_list == null) ? TableWidgetOptions.DEFAULT_LIMIT : this.tmp_nbpages_pagination_list;
        if (this.widget_options.nbpages_pagination_list != nbpages_pagination_list) {
            this.next_update_options = this.widget_options;
            this.next_update_options.nbpages_pagination_list = nbpages_pagination_list;

            await this.throttled_update_options();
        }
    }

    @Watch('limit')
    private async onchange_limit() {
        if (!this.widget_options) {
            return;
        }

        let limit = (this.limit == null) ? TableWidgetOptions.DEFAULT_LIMIT : parseInt(this.limit);
        if (this.widget_options.limit != limit) {
            this.next_update_options = this.widget_options;
            this.next_update_options.limit = limit;

            await this.throttled_update_options();
        }
    }

    @Watch('tmp_default_export_option')
    private async onchange_tmp_default_export_option() {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;

        if (!this.tmp_default_export_option) {
            this.next_update_options.default_export_option = null;
        } else if (this.widget_options.default_export_option != this.tmp_default_export_option.id) {
            this.next_update_options.default_export_option = this.tmp_default_export_option.id;
        }

        await this.throttled_update_options();
    }

    @Watch('limit_selectable')
    private async onchange_limit_selectable() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.limit_selectable != this.limit_selectable) {
            this.next_update_options = this.widget_options;
            this.next_update_options.limit_selectable = this.limit_selectable;

            await this.throttled_update_options();
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
        this.next_update_options = this.widget_options;

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
                crud_actions_column.filter_by_access = null;
                crud_actions_column.enum_bg_colors = null;
                crud_actions_column.enum_fg_colors = null;
                crud_actions_column.bg_color_header = null;
                crud_actions_column.font_color_header = null;
                crud_actions_column.can_filter_by = true;
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

        this.next_update_options = this.widget_options;
        this.next_update_options.columns = this.editable_columns;
        await this.throttled_update_options();
    }

    private async update_column(update_column: TableColumnDescVO) {

        this.next_update_options = this.widget_options;

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
            this.next_update_options.columns[i].children[k] = update_column;
        } else {
            this.next_update_options.columns[i] = update_column;
        }

        await this.throttled_update_options();
    }

    private async remove_column(del_column: TableColumnDescVO) {
        this.next_update_options = this.widget_options;

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

        await this.throttled_update_options();
    }

    private get_default_options(): TableWidgetOptions {
        return new TableWidgetOptions(null, false, 100, null, false, true, false, true, true, true, true, true, true, true, true, false, null, false, 5, false, false, null, false, true, true, false);
    }
    private async add_column(add_column: TableColumnDescVO) {

        this.next_update_options = this.widget_options;
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

        await this.throttled_update_options();
    }
    get columns(): TableColumnDescVO[] {
        let options: TableWidgetOptions = this.widget_options;

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

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        return 'Table#' + this.page_widget.id;
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
                    options.use_kanban_by_default_if_exists,
                    options.use_kanban_column_weight_if_exists,
                    options.use_for_count,
                    options.can_export_active_field_filters,
                    options.can_export_vars_indicator,
                ) : null;
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

    //         this.next_update_options = this.widget_options;

    //         if (!this.next_update_options) {
    //             this.next_update_options = new TableWidgetOptions(null, this.page_widget.id, null, false, true);
    //         }

    //         this.next_update_options.vocus_button = this.vocus_button;
    //         this.next_update_options.delete_button = this.delete_button;
    //         await this.throttled_update_options();
    //         }
    //     }

    private async switch_vocus_button() {
        this.vocus_button = !this.vocus_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.vocus_button != this.vocus_button) {
            this.next_update_options.vocus_button = this.vocus_button;
            await this.throttled_update_options();
        }
    }

    private async switch_delete_button() {
        this.delete_button = !this.delete_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.delete_button != this.delete_button) {
            this.next_update_options.delete_button = this.delete_button;
            await this.throttled_update_options();
        }
    }

    private async switch_can_filter_by() {
        this.can_filter_by = !this.can_filter_by;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.can_filter_by != this.can_filter_by) {
            this.next_update_options.can_filter_by = this.can_filter_by;
            await this.throttled_update_options();
        }
    }

    private async switch_delete_all_button() {
        this.delete_all_button = !this.delete_all_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.delete_all_button != this.delete_all_button) {
            this.next_update_options.delete_all_button = this.delete_all_button;
            await this.throttled_update_options();
        }
    }

    private async switch_refresh_button() {
        this.refresh_button = !this.refresh_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.refresh_button != this.refresh_button) {
            this.next_update_options.refresh_button = this.refresh_button;
            await this.throttled_update_options();
        }
    }

    private async switch_tmp_has_default_export_option() {
        this.tmp_has_default_export_option = !this.tmp_has_default_export_option;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.has_default_export_option != this.tmp_has_default_export_option) {
            this.next_update_options.has_default_export_option = this.tmp_has_default_export_option;
            await this.throttled_update_options();
        }
    }

    private async switch_export_button() {
        this.export_button = !this.export_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.export_button != this.export_button) {
            this.next_update_options.export_button = this.export_button;
            await this.throttled_update_options();
        }
    }

    private async toggle_can_export_active_field_filters() {
        this.can_export_active_field_filters = !this.can_export_active_field_filters;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.can_export_active_field_filters != this.can_export_active_field_filters) {
            this.next_update_options.can_export_active_field_filters = this.can_export_active_field_filters;

            await this.throttled_update_options();
        }
    }

    private async toggle_can_export_vars_indicator() {
        this.can_export_vars_indicator = !this.can_export_vars_indicator;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.can_export_vars_indicator != this.can_export_vars_indicator) {
            this.next_update_options.can_export_vars_indicator = this.can_export_vars_indicator;

            await this.throttled_update_options();
        }
    }

    private async switch_update_button() {
        this.update_button = !this.update_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.update_button != this.update_button) {
            this.next_update_options.update_button = this.update_button;
            await this.throttled_update_options();
        }
    }

    private async switch_create_button() {
        this.create_button = !this.create_button;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.create_button != this.create_button) {
            this.next_update_options.create_button = this.create_button;
            await this.throttled_update_options();
        }
    }

    private async switch_show_limit_selectable() {
        this.show_limit_selectable = !this.show_limit_selectable;

        if (this.show_limit_selectable) {
            this.limit_selectable = TableWidgetOptions.DEFAULT_LIMIT_SELECTABLE;
        }

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_limit_selectable != this.show_limit_selectable) {
            this.next_update_options.show_limit_selectable = this.show_limit_selectable;
            await this.throttled_update_options();
        }
    }

    private async switch_show_pagination_resumee() {
        this.show_pagination_resumee = !this.show_pagination_resumee;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_resumee != this.show_pagination_resumee) {
            this.next_update_options.show_pagination_resumee = this.show_pagination_resumee;
            await this.throttled_update_options();
        }
    }

    private async switch_show_pagination_slider() {
        this.show_pagination_slider = !this.show_pagination_slider;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_slider != this.show_pagination_slider) {
            this.next_update_options.show_pagination_slider = this.show_pagination_slider;
            await this.throttled_update_options();
        }
    }

    private async switch_show_pagination_form() {
        this.show_pagination_form = !this.show_pagination_form;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_form != this.show_pagination_form) {
            this.next_update_options.show_pagination_form = this.show_pagination_form;
            await this.throttled_update_options();
        }
    }

    private async switch_show_pagination_list() {
        this.show_pagination_list = !this.show_pagination_list;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.show_pagination_list != this.show_pagination_list) {
            this.next_update_options.show_pagination_list = this.show_pagination_list;
            await this.throttled_update_options();
        }
    }

    private async switch_hide_pagination_bottom() {
        this.hide_pagination_bottom = !this.hide_pagination_bottom;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.hide_pagination_bottom != this.hide_pagination_bottom) {
            this.next_update_options.hide_pagination_bottom = this.hide_pagination_bottom;
            await this.throttled_update_options();
        }
    }

    private async switch_has_table_total_footer() {
        this.has_table_total_footer = !this.has_table_total_footer;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.has_table_total_footer != this.has_table_total_footer) {
            this.next_update_options.has_table_total_footer = this.has_table_total_footer;
            await this.throttled_update_options();
        }
    }

    private async switch_use_for_count() {
        this.use_for_count = !this.use_for_count;

        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.use_for_count != this.use_for_count) {
            this.next_update_options.use_for_count = this.use_for_count;
            await this.throttled_update_options();
        }
    }
}