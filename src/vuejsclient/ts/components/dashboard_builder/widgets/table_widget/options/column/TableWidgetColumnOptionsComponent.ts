import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import VOsTypesManager from '../../../../../../../../shared/modules/VOsTypesManager';
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

@Component({
    template: require('./TableWidgetColumnOptionsComponent.pug'),
    components: {
        Vofieldwidgetrefcomponent: VoFieldWidgetRefComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class TableWidgetColumnOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private column: TableColumnDescVO;

    @Prop()
    private get_new_column_id: () => number;

    private new_column_select_type_component: string = null;
    private new_column_select_type_var_ref: string = null;

    private column_width: number = 0;
    private throttled_update_column_width = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_column_width, 800, { leading: false, trailing: true });

    private default_sort_field: number = 0;
    private throttled_update_default_sort_field = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_default_sort_field, 800, { leading: false, trailing: true });

    private throttled_update_enum_colors = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_enum_colors, 800, { leading: false, trailing: true });

    private filter_by_access_options: string[] = [];

    private enum_options: { [value: number]: string } = {};
    private enum_bg_colors: { [value: number]: string } = {};
    private enum_fg_colors: { [value: number]: string } = {};

    private tmp_bg_color_header: string = null;
    private tmp_font_color_header: string = null;

    private show_options: boolean = false;

    get vo_ref_tooltip(): string {
        if (!this.column) {
            return null;
        }

        let table = VOsTypesManager.getInstance().moduleTables_by_voType[this.column.api_type_id];
        if (!table) {
            return null;
        }
        let field = table.get_field_by_id(this.column.field_id);
        if (!field) {
            return null;
        }

        return this.t(table.label.code_text) +
            ' > ' +
            this.t(field.field_label.code_text);
    }

    get default_sort_field_tooltip(): string {
        if (!this.column) {
            return null;
        }

        let table = VOsTypesManager.getInstance().moduleTables_by_voType[this.column.api_type_id];
        if (!table) {
            return null;
        }
        let field = table.get_field_by_id(this.column.field_id);
        if (!field) {
            return null;
        }

        let res: string[] = [
            this.t(table.label.code_text),
            this.t(field.field_label.code_text)
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
        let policies = await query(AccessPolicyVO.API_TYPE_ID).field('translatable_name').select_vos<AccessPolicyVO>();

        this.filter_by_access_options = policies ? policies.map((e) => e.translatable_name) : [];
    }

    private filter_by_access_label(translatable_name: string): string {
        return this.label(translatable_name);
    }

    @Watch('filter_by_access')
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

        this.object_column.bg_color_header = this.tmp_bg_color_header;

        this.$emit('update_column', this.object_column);
    }

    @Watch('tmp_font_color_header')
    private async onchange_tmp_font_color_header() {
        if (!this.object_column) {
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
            let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.object_column.api_type_id].getFieldFromId(this.object_column.field_id);
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
                    options.show_pagination_list
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
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
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = false;
        new_column.column_width = 0;
        new_column.default_sort_field = null;

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
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.filter_by_access = null;
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = false;
        new_column.column_width = 0;
        new_column.default_sort_field = null;

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
        new_column.enum_bg_colors = null;
        new_column.enum_fg_colors = null;
        new_column.can_filter_by = true;
        new_column.column_width = 0;
        new_column.default_sort_field = null;

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

    private async switch_many_to_many_aggregate() {
        if (!this.column) {
            return;
        }

        this.column.many_to_many_aggregate = !this.column.many_to_many_aggregate;
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


    /**
     * On peut éditer si c'est un certain type de champs et directement sur le VO du crud type paramétré
     */
    get can_be_editable(): boolean {
        if (!this.column) {
            return false;
        }

        if (this.column.type != TableColumnDescVO.TYPE_vo_field_ref) {
            return false;
        }

        if (this.column.api_type_id != this.widget_options.crud_api_type_id) {
            return false;
        }

        let table = VOsTypesManager.getInstance().moduleTables_by_voType[this.column.api_type_id];
        if (!table) {
            return false;
        }

        let field = table.getFieldFromId(this.column.field_id);
        if (!field) {
            return false;
        }

        switch (field.field_type) {
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

    get object_column() {
        if (!this.column) {
            return null;
        }

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

                let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.object_column.api_type_id].get_field_by_id(this.object_column.field_id);

                if (!field) {
                    return this.object_column.field_id;
                }

                return this.t(field.field_label.code_text);
            case TableColumnDescVO.TYPE_var_ref:
                if (!this.object_column.var_id) {
                    return null;
                }

                return this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.object_column.var_id));
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
}