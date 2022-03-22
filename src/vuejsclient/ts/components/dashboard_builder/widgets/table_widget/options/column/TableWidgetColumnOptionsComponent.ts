import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import ModuleDAO from '../../../../../../../../shared/modules/DAO/ModuleDAO';
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

    @Watch('column', { immediate: true })
    private onchange_column() {
        this.column_width = this.column ? this.column.column_width : 0;
    }

    @Watch('column_width', { immediate: true })
    private onchange_column_width() {
        this.throttled_update_column_width();
    }

    private async update_column_width() {

        if (this.column && (this.column_width != this.column.column_width)) {
            this.column.column_width = this.column_width;
            this.$emit('update_column', this.column);
        }
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
                    options.columns, options.page_widget_id, options.is_focus_api_type_id, options.limit, options.crud_api_type_id,
                    options.vocus_button, options.delete_button, options.delete_all_button, options.create_button, options.update_button,
                    options.refresh_button, options.export_button) : null;
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
        new_column.page_widget_id = this.page_widget.id;
        new_column.type = TableColumnDescVO.TYPE_component;
        new_column.component_name = this.new_column_select_type_component;
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.column_width = 0;

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
        new_column.page_widget_id = this.page_widget.id;
        new_column.type = TableColumnDescVO.TYPE_var_ref;
        new_column.var_id = VarsController.getInstance().var_conf_by_name[this.new_column_select_type_var_ref].id;
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.column_width = 0;

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
        new_column.page_widget_id = this.page_widget.id;
        new_column.type = TableColumnDescVO.TYPE_vo_field_ref;
        new_column.api_type_id = api_type_id;
        new_column.field_id = field_id;
        new_column.id = this.get_new_column_id();
        new_column.readonly = true;
        new_column.exportable = true;
        new_column.hide_from_table = false;
        new_column.column_width = 0;

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

        return this.object_column.translatable_name_code_text;
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
                    return null;
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
}