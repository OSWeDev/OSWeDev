import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import TableColumnDescVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import VOsTypesManager from '../../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../../VueComponentBase';
import VoFieldWidgetRefComponent from '../../../../vo_field_widget_ref/VoFieldWidgetRefComponent';
import './TableWidgetColumnOptionsComponent.scss';
import TableWidgetOptions from '../TableWidgetOptions';
import TableWidgetController from '../../TableWidgetController';

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

    private new_column_select_type_component: string = null;
    private new_column_select_type_var_ref: string = null;

    get vars_options(): string[] {
        return Object.keys(VarsController.getInstance().var_conf_by_name);
    }

    get component_options(): string[] {
        if ((!this.page_widget) || (this.widget_options)) {
            return null;
        }

        if (!this.widget_options.crud_api_type_id) {
            return null;
        }

        if (!TableWidgetController.getInstance().components_by_crud_api_type_id[this.widget_options.crud_api_type_id]) {
            return null;
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
        new_column.var_id = VarsController.getInstance().var_conf_by_name[this.new_column_select_type_component].id;

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

        // Reste le weight à configurer, enregistrer la colonne en base, et recharger les colonnes sur le client pour mettre à jour l'affichage du widget
        this.$emit('add_column', new_column);
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