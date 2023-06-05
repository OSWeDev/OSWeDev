import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import VOsTypesManager from '../../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../../shared/tools/ConsoleHandler';
import ModuleTableField from '../../../../../../../../shared/modules/ModuleTableField';
import InlineTranslatableText from '../../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../../VueComponentBase';
import VoFieldWidgetRefComponent from '../../../../vo_field_widget_ref/VoFieldWidgetRefComponent';
import './TableWidgetColumnOptionsComponent.scss';
import TableWidgetOptions from '../TableWidgetOptions';
import TableWidgetController from '../../TableWidgetController';
import ThrottleHelper from '../../../../../../../../shared/tools/ThrottleHelper';
import { query } from '../../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import AccessPolicyVO from '../../../../../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import NumRange from '../../../../../../../../shared/modules/DataRender/vos/NumRange';
import ModuleTable from '../../../../../../../../shared/modules/ModuleTable';
import ObjectHandler from '../../../../../../../../shared/tools/ObjectHandler';
import { ModuleDashboardPageGetter } from '../../../../page/DashboardPageStore';
import { cloneDeep } from 'lodash';
import Dates from '../../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import WidgetFilterOptionsComponent from '../../../var_widget/options/filters/WidgetFilterOptionsComponent';
import { all_promises } from '../../../../../../../../shared/tools/PromiseTools';
import DashboardWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldValueFilterWidgetOptions from '../../../field_value_filter_widget/options/FieldValueFilterWidgetOptions';

@Component({
    template: require('./TableWidgetColumnOptionsComponent.pug'),
    components: {
        Vofieldwidgetrefcomponent: VoFieldWidgetRefComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent
    }
})
export default class TableWidgetColumnOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @ModuleDashboardPageGetter
    private get_page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    @ModuleDashboardPageGetter
    private get_page_widgets: DashboardPageWidgetVO[];


    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private column: TableColumnDescVO;

    @Prop()
    private get_new_column_id: () => number;

    private new_column_select_type_component: string = null;
    private new_column_select_type_var_ref: string = null;
    private new_header_columns: string = null;

    private column_width: number = 0;
    private throttled_update_column_width = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_column_width.bind(this), 800, { leading: false, trailing: true });

    private default_sort_field: number = 0;
    private throttled_update_default_sort_field = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_default_sort_field.bind(this), 800, { leading: false, trailing: true });

    private throttled_update_enum_colors = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_enum_colors.bind(this), 800, { leading: false, trailing: true });
    private throttled_update_custom_filter = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_custom_filter.bind(this), 800, { leading: false, trailing: true });

    private filter_by_access_options: string[] = [];

    private enum_options: { [value: number]: string } = {};
    private enum_bg_colors: { [value: number]: string } = {};
    private enum_fg_colors: { [value: number]: string } = {};

    private tmp_bg_color_header: string = null;
    private tmp_font_color_header: string = null;

    private show_options: boolean = false;
    private error: boolean = false;
    private custom_filter_names: { [field_id: string]: string } = {};

    private all_filter_widgets_ids: number[] = [];

    private kanban_use_weight: boolean = false;
    private kanban_column: boolean = false;

    private async switch_kanban_use_weight() {
        this.kanban_use_weight = !this.kanban_use_weight;
        this.column.kanban_use_weight = this.kanban_use_weight;
        this.$emit('update_column', this.column);
    }

    private async switch_kanban_column() {
        if (!this.kanban_column) {
            // On doit vérifier et retirer le param des autres colonnes si une autre était déjà active
            for (let i in this.widget_options.columns) {
                let column: TableColumnDescVO = this.widget_options.columns[i];
                if (column.kanban_column) {
                    column.kanban_column = false;
                    this.$emit('update_column', column);
                    break;
                }
            }
        }
        this.kanban_column = !this.kanban_column;
        this.column.kanban_column = this.kanban_column;
        this.$emit('update_column', this.column);
    }

    get column_type_has_weight(): boolean {
        if (!this.column) {
            return false;
        }

        let table = VOsTypesManager.moduleTables_by_voType[this.column.api_type_id];
        if (!table) {
            return false;
        }

        return table.getFieldFromId('weight') != null;
    }

    get page_widget_by_id(): { [pwid: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.get_page_widgets);
    }

    get show_if_any_filter_active_options(): number[] {
        let self = this;
        return this.get_page_widgets.filter((page_widget: DashboardPageWidgetVO) => {

            let options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;

            return options && options.vo_field_ref && options.vo_field_ref.api_type_id && options.vo_field_ref.field_id && (self.all_filter_widgets_ids.indexOf(page_widget.widget_id) > -1);
        }).map((page_widget: DashboardPageWidgetVO) => page_widget.id);
    }

    get do_not_user_filter_active_ids_options(): number[] {
        let self = this;
        return this.get_page_widgets.filter((page_widget: DashboardPageWidgetVO) => {

            let options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;

            return options && options.vo_field_ref && options.vo_field_ref.api_type_id && options.vo_field_ref.field_id && (self.all_filter_widgets_ids.indexOf(page_widget.widget_id) > -1);
        }).map((page_widget: DashboardPageWidgetVO) => page_widget.id);
    }

    private show_if_any_filter_active_label(page_widget_id: number): string {
        let page_widget = this.page_widget_by_id[page_widget_id];
        if (!page_widget) {
            return "[" + page_widget_id + "] " + "???";
        }
        let options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;
        if (!options || !options.vo_field_ref || !options.vo_field_ref.api_type_id || !options.vo_field_ref.field_id) {
            return "[" + page_widget.id + "] " + "???";
        }
        return "[" + page_widget.id + "] " + options.vo_field_ref.api_type_id + " > " + options.vo_field_ref.field_id;
    }

    private do_not_user_filter_active_ids_label(page_widget_id: number): string {
        let page_widget = this.page_widget_by_id[page_widget_id];
        if (!page_widget) {
            return "[" + page_widget_id + "] " + "???";
        }
        let options = JSON.parse(page_widget.json_options) as FieldValueFilterWidgetOptions;
        if (!options || !options.vo_field_ref || !options.vo_field_ref.api_type_id || !options.vo_field_ref.field_id) {
            return "[" + page_widget.id + "] " + "???";
        }
        return "[" + page_widget.id + "] " + options.vo_field_ref.api_type_id + " > " + options.vo_field_ref.field_id;
    }

    private async update_additional_options(additional_options: string) {
        if (!this.column) {
            return;
        }

        this.column.filter_additional_params = additional_options;
        this.$emit('update_column', this.column);
    }

    private async update_filter_type(filter_type: string) {
        if (!this.column) {
            return;
        }

        this.column.filter_type = filter_type;
        this.$emit('update_column', this.column);
    }

    private async change_custom_filter(field_id: string, custom_filter: string) {
        if (!this.object_column) {
            return;
        }

        this.custom_filter_names[field_id] = custom_filter;
        await this.throttled_update_custom_filter();
    }

    get fields_that_could_get_custom_filter(): string[] {
        let res: string[] = [];

        if (!this.object_column || !this.object_column.var_id) {
            return null;
        }

        let var_param_type = VarsController.getInstance().var_conf_by_id[this.object_column.var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names) {
            this.custom_filter_names = {};
        }

        let fields = VOsTypesManager.moduleTables_by_voType[var_param_type].get_fields();
        for (let i in fields) {
            let field = fields[i];

            if ((field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names[field.field_id] === "undefined") {
                    this.custom_filter_names[field.field_id] = null;
                }
            }
        }

        return res;
    }

    private async update_custom_filter() {
        if ((!this.object_column) || (!this.object_column.var_id)) {
            return;
        }

        if (ObjectHandler.are_equal(this.object_column.filter_custom_field_filters, this.custom_filter_names)) {
            return;
        }

        this.object_column.filter_custom_field_filters = this.custom_filter_names;
        this.$emit('update_column', this.object_column);
    }

    get vo_ref_tooltip(): string {
        if (!this.field || !this.table) {
            if (this.column?.var_id) {
                return 'VAR :var_id:' + this.column.var_id + ' :name: ' + this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.column.var_id));
            }
            return null;
        }

        return this.t(this.table.label.code_text) +
            ' > ' +
            this.t(this.field.field_label.code_text);
    }

    get table(): ModuleTable<any> {
        if (!this.column) {
            return null;
        }

        return VOsTypesManager.moduleTables_by_voType[this.column.api_type_id];
    }

    get field(): ModuleTableField<any> {
        if (!this.column) {
            return null;
        }

        if (!this.table) {
            return null;
        }

        return this.table.get_field_by_id(this.column.field_id);
    }

    get default_sort_field_tooltip(): string {
        if (!this.table || !this.field) {
            return null;
        }

        let res: string[] = [
            this.t(this.table.label.code_text),
            this.t(this.field.field_label.code_text)
        ];

        if (this.default_sort_field == TableColumnDescVO.SORT_asc) {
            res.push(this.label('column.sort.asc'));
        } else if (this.default_sort_field == TableColumnDescVO.SORT_desc) {
            res.push(this.label('column.sort.desc'));
        } else {
            res.push(this.label('column.sort.no'));
        }

        return res.join(' > ');
    }

    private async update_enum_colors() {
        if ((!this.object_column) || (!this.object_column.is_enum)) {
            return;
        }

        /**
         * Si on a pas de différence entre les confs, on update rien
         */
        let has_diff = false;
        for (let i in this.enum_bg_colors) {
            if (this.object_column.enum_bg_colors && (this.enum_bg_colors[i] == this.object_column.enum_bg_colors[i])) {
                continue;
            }
            has_diff = true;
            break;
        }
        for (let i in this.enum_fg_colors) {
            if (this.object_column.enum_fg_colors && (this.enum_fg_colors[i] == this.object_column.enum_fg_colors[i])) {
                continue;
            }
            has_diff = true;
            break;
        }

        if (!has_diff) {
            return;
        }

        this.object_column.enum_fg_colors = this.enum_fg_colors;
        this.object_column.enum_bg_colors = this.enum_bg_colors;
        this.$emit('update_column', this.object_column);
    }

    private unhide_options() {
        this.show_options = true;
    }

    private hide_options() {
        this.show_options = false;
    }

    private async mounted() {
        let promises = [];
        let self = this;

        promises.push(((async () => {
            let all_ids = await query(DashboardWidgetVO.API_TYPE_ID).field('id').set_query_distinct().filter_is_true('is_filter').select_vos<DashboardWidgetVO>();
            self.all_filter_widgets_ids = all_ids ? all_ids.map((e) => e.id) : [];
        })()));
        promises.push(((async () => {
            let policies = await query(AccessPolicyVO.API_TYPE_ID).field('translatable_name').select_vos<AccessPolicyVO>();

            self.filter_by_access_options = policies ? policies.map((e) => e.translatable_name) : [];
        })()));

        await all_promises(promises);
    }

    private filter_by_access_label(translatable_name: string): string {
        return this.label(translatable_name);
    }

    @Watch('column.filter_by_access')
    @Watch('column.show_if_any_filter_active')
    @Watch('column.do_not_user_filter_active_ids')
    private async onchange_filter_by_access() {
        if (!this.object_column) {
            return;
        }

        this.$emit('update_column', this.object_column);
    }

    @Watch('tmp_bg_color_header')
    private async onchange_tmp_bg_color_header() {
        if (!this.object_column) {
            return;
        }

        if (this.object_column.bg_color_header == this.tmp_bg_color_header) {
            return;
        }

        this.object_column.bg_color_header = this.tmp_bg_color_header;

        this.$emit('update_column', this.object_column);
    }

    @Watch('tmp_font_color_header')
    private async onchange_tmp_font_color_header() {
        if (!this.object_column) {
            return;
        }

        if (this.object_column.font_color_header == this.tmp_font_color_header) {
            return;
        }

        this.object_column.font_color_header = this.tmp_font_color_header;

        this.$emit('update_column', this.object_column);
    }

    @Watch('column', { immediate: true })
    private onchange_column() {
        this.column_width = this.object_column ? this.object_column.column_width : 0;
        this.default_sort_field = this.object_column ? this.object_column.default_sort_field : null;

        if (this.object_column && this.object_column.is_enum) {
            let field = VOsTypesManager.moduleTables_by_voType[this.object_column.api_type_id].getFieldFromId(this.object_column.field_id);
            this.enum_options = field.enum_values;
            this.enum_bg_colors = Object.assign({}, this.object_column.enum_bg_colors);
            this.enum_fg_colors = Object.assign({}, this.object_column.enum_fg_colors);

            if ((!this.enum_bg_colors) || (Object.keys(this.enum_bg_colors).length != Object.keys(field.enum_values).length)) {
                this.enum_bg_colors = Object.assign({}, field.enum_values);
                for (let i in this.enum_bg_colors) {
                    this.enum_bg_colors[i] = '#555';
                }
            }

            if ((!this.enum_fg_colors) || (Object.keys(this.enum_fg_colors).length != Object.keys(field.enum_values).length)) {
                this.enum_fg_colors = Object.assign({}, field.enum_values);
                for (let i in this.enum_fg_colors) {
                    this.enum_fg_colors[i] = '#FFF';
                }
            }
        }
        this.tmp_bg_color_header = this.object_column ? this.object_column.bg_color_header : null;
        this.tmp_font_color_header = this.object_column ? this.object_column.font_color_header : null;
        this.kanban_column = this.object_column ? this.object_column.kanban_column : false;
        this.kanban_use_weight = this.object_column ? this.object_column.kanban_use_weight : false;
    }

    @Watch('column_width', { immediate: true })
    private onchange_column_width() {
        this.throttled_update_column_width();
    }

    @Watch('default_sort_field', { immediate: true })
    private onchange_default_sort_field() {
        this.throttled_update_default_sort_field();
    }

    private async update_column_width() {

        if (this.object_column && (this.column_width != this.object_column.column_width)) {
            this.object_column.column_width = this.column_width;
            this.$emit('update_column', this.object_column);
        }
    }

    private async update_default_sort_field() {

        if (this.object_column && (this.default_sort_field != this.object_column.default_sort_field)) {
            this.object_column.default_sort_field = this.default_sort_field;
            this.$emit('update_column', this.object_column);
        }
    }

    private clear_tmp_bg_color_header() {
        this.tmp_bg_color_header = null;
    }

    private clear_tmp_font_color_header() {
        this.tmp_font_color_header = null;
    }

    get vars_options(): string[] {
        return Object.keys(VarsController.getInstance().var_conf_by_name);
    }

    get component_options(): string[] {
        if ((!this.page_widget) || (!this.widget_options)) {
            return [];
        }

        if (!this.widget_options.crud_api_type_id) {
            return [];
        }

        if (!TableWidgetController.getInstance().components_by_crud_api_type_id[this.widget_options.crud_api_type_id]) {
            return [];
        }

        let res = TableWidgetController.getInstance().components_by_crud_api_type_id[this.widget_options.crud_api_type_id];

        return res.map((c) => c.translatable_title);
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
                    options.archive_button,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    private var_label(var_name: string): string {
        return VarsController.getInstance().var_conf_by_name[var_name].id + ' | ' + this.t(VarsController.getInstance().get_translatable_name_code(var_name));
    }

    private component_label(translatable_title: string): string {
        return this.t(translatable_title);
    }

    @Watch('new_column_select_type_component')
    private async onchange_new_column_select_type_component() {
        if (!this.new_column_select_type_component) {
            return;
        }

        if (this.object_column) {
            return;
        }

        let new_column = new TableColumnDescVO();
        new_column.type = TableColumnDescVO.TYPE_component;
        new_column.component_name = this.new_column_select_type_component;
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.filter_by_access = null;
        new_column.show_if_any_filter_active = [];
        new_column.do_not_user_filter_active_ids = [];
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = false;
        new_column.column_width = 0;
        new_column.default_sort_field = null;
        new_column.filter_custom_field_filters = {};
        new_column.kanban_column = false;

        // Reste le weight à configurer, enregistrer la colonne en base, et recharger les colonnes sur le client pour mettre à jour l'affichage du widget
        this.$emit('add_column', new_column);
    }

    @Watch('new_column_select_type_var_ref')
    private async onchange_new_column_select_type_var_ref() {
        if (!this.new_column_select_type_var_ref) {
            return;
        }

        if (this.object_column) {
            return;
        }

        let new_column = new TableColumnDescVO();
        new_column.type = TableColumnDescVO.TYPE_var_ref;
        new_column.var_id = VarsController.getInstance().var_conf_by_name[this.new_column_select_type_var_ref].id;
        new_column.var_unicity_id = Dates.now();
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.filter_by_access = null;
        new_column.show_if_any_filter_active = [];
        new_column.do_not_user_filter_active_ids = [];
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = false;
        new_column.column_width = 0;
        new_column.default_sort_field = null;
        new_column.filter_custom_field_filters = {};
        new_column.kanban_column = false;

        // Reste le weight à configurer, enregistrer la colonne en base, et recharger les colonnes sur le client pour mettre à jour l'affichage du widget
        this.$emit('add_column', new_column);


    }

    private allowDrop(event) {
        event.preventDefault();

        if ((!event) || (!event.dataTransfer)) {
            return false;
        }

        let api_type_id: string = event.dataTransfer.getData("api_type_id");
        let field_id: string = event.dataTransfer.getData("field_id");
        if ((!api_type_id) || (!field_id)) {
            return false;
        }

        return true;
    }

    private drop(event) {
        event.preventDefault();

        let api_type_id: string = event.dataTransfer.getData("api_type_id");
        let field_id: string = event.dataTransfer.getData("field_id");

        if (this.object_column) {
            return;
        }

        let new_column = new TableColumnDescVO();
        new_column.type = TableColumnDescVO.TYPE_vo_field_ref;
        new_column.api_type_id = api_type_id;
        new_column.field_id = field_id;
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.filter_by_access = null;
        new_column.show_if_any_filter_active = [];
        new_column.do_not_user_filter_active_ids = [];
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = true;
        new_column.column_width = 0;
        new_column.default_sort_field = null;
        new_column.filter_custom_field_filters = {};
        new_column.kanban_column = false;

        // Reste le weight à configurer, enregistrer la colonne en base, et recharger les colonnes sur le client pour mettre à jour l'affichage du widget
        this.$emit('add_column', new_column);
    }
    // creation de la column
    private add_header(event) {
        this.error = false;
        this.new_header_columns = event.target.previousElementSibling._value;

        for (const key in this.widget_options.columns) {
            let col = this.widget_options.columns[key];
            if (col.type == TableColumnDescVO.TYPE_header) {
                if (col.header_name === this.new_header_columns) {
                    this.error = true;
                    return;
                }
            }
        }

        if (!this.new_header_columns) {
            return;
        }
        let header_name: string = this.new_header_columns;

        if (this.object_column) {
            return;
        }

        let new_column = new TableColumnDescVO();
        new_column.type = TableColumnDescVO.TYPE_header;
        new_column.header_name = header_name;
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.filter_by_access = null;
        new_column.show_if_any_filter_active = [];
        new_column.do_not_user_filter_active_ids = [];
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = false;
        new_column.column_width = 0;
        new_column.default_sort_field = null;
        new_column.filter_custom_field_filters = {};
        new_column.kanban_column = false;

        // Reste le weight à configurer, enregistrer la colonne en base, et recharger les colonnes sur le client pour mettre à jour l'affichage du widget
        this.$emit('add_column', new_column);
    }

    private async switch_readonly() {
        if (!this.column) {
            return;
        }

        this.column.readonly = !this.column.readonly;
        this.$emit('update_column', this.column);
    }

    private async switch_exportable() {
        if (!this.column) {
            return;
        }

        this.column.exportable = !this.column.exportable;
        this.$emit('update_column', this.column);
    }

    private async switch_can_filter_by() {
        if (!this.column) {
            return;
        }

        this.column.can_filter_by = !this.column.can_filter_by;
        this.$emit('update_column', this.column);
    }

    private async switch_is_sticky() {
        if (!this.column) {
            return;
        }

        this.column.is_sticky = !this.column.is_sticky;
        this.$emit('update_column', this.column);
    }

    private async switch_many_to_many_aggregate() {
        if (!this.column) {
            return;
        }

        this.column.many_to_many_aggregate = !this.column.many_to_many_aggregate;
        this.$emit('update_column', this.column);
    }

    private async switch_disabled_many_to_one_link() {
        if (!this.column) {
            return;
        }

        this.column.disabled_many_to_one_link = !this.column.disabled_many_to_one_link;
        this.$emit('update_column', this.column);
    }

    private async switch_is_nullable() {
        if (!this.column) {
            return;
        }

        this.column.is_nullable = !this.column.is_nullable;
        this.$emit('update_column', this.column);
    }

    private async switch_show_tooltip() {
        if (!this.column) {
            return;
        }

        this.column.show_tooltip = !this.column.show_tooltip;
        this.$emit('update_column', this.column);
    }

    private async switch_hide_from_table() {
        if (!this.column) {
            return;
        }

        this.column.hide_from_table = !this.column.hide_from_table;
        this.$emit('update_column', this.column);
    }

    private async is_sticky_table() {
        if (!this.column) {
            return;
        }

        this.column.is_sticky = !this.column.is_sticky;
        this.$emit('update_column', this.column);
    }

    /**
     * On peut éditer si c'est un certain type de champs et directement sur le VO du crud type paramétré
     */
    get can_be_editable(): boolean {
        // Si la colonne est de type VAR, on accepte la modif
        if (this.column.type == TableColumnDescVO.TYPE_var_ref) {
            return true;
        }

        if (!this.column) {
            return false;
        }

        if (this.column.type != TableColumnDescVO.TYPE_vo_field_ref) {
            return false;
        }

        if (this.column.api_type_id != this.widget_options.crud_api_type_id) {
            return false;
        }

        if (!this.field) {
            return false;
        }

        switch (this.field.field_type) {
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_string:
                return true;
        }

        return false;
    }

    get is_fkey(): boolean {
        return this.field && (this.field.field_type == ModuleTableField.FIELD_TYPE_foreign_key);
    }

    get object_column() {
        if (!this.column) {
            this.custom_filter_names = {};
            return null;
        }

        this.custom_filter_names = this.column.filter_custom_field_filters ? cloneDeep(this.column.filter_custom_field_filters) : {};
        return Object.assign(new TableColumnDescVO(), this.column);
    }

    get translatable_name_code_text() {
        if (!this.object_column) {
            return null;
        }

        return this.object_column.get_translatable_name_code_text(this.page_widget.id);
    }

    get can_filter_by_table(): boolean {
        if (!this.widget_options) {
            return false;
        }

        return this.widget_options.can_filter_by;
    }

    get default_column_label(): string {
        if (!this.object_column) {
            return null;
        }

        switch (this.object_column.type) {
            case TableColumnDescVO.TYPE_component:
                if (!this.object_column.component_name) {
                    return null;
                }

                return this.t(TableWidgetController.getInstance().components_by_translatable_title[this.object_column.component_name].translatable_title);
            case TableColumnDescVO.TYPE_vo_field_ref:
                if ((!this.object_column.api_type_id) || (!this.object_column.field_id)) {
                    return null;
                }

                let field = VOsTypesManager.moduleTables_by_voType[this.object_column.api_type_id].get_field_by_id(this.object_column.field_id);

                if (!field) {
                    return this.object_column.field_id;
                }

                return this.t(field.field_label.code_text);
            case TableColumnDescVO.TYPE_var_ref:
                if (!this.object_column.var_id) {
                    return null;
                }

                return this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.object_column.var_id));
            case TableColumnDescVO.TYPE_header:
                if (!this.object_column.header_name) {
                    return null;
                }
                return this.t(this.object_column.header_name);
        }

        return null;
    }

    private remove_column() {
        this.$emit('remove_column', this.object_column);
    }

    private change_default_sort_field() {
        if (this.default_sort_field == null) {
            this.default_sort_field = this.sort_asc;
        } else if (this.default_sort_field == this.sort_asc) {
            this.default_sort_field = this.sort_desc;
        } else if (this.default_sort_field == this.sort_desc) {
            this.default_sort_field = null;
        }
    }

    get sort_asc(): number {
        return TableColumnDescVO.SORT_asc;
    }

    get sort_desc(): number {
        return TableColumnDescVO.SORT_desc;
    }

    get is_type_var_ref(): boolean {
        return this.object_column.type == TableColumnDescVO.TYPE_var_ref;
    }
}