import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../../shared/modules/DAO/ModuleDAO';
import BulkActionVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/BulkActionVO';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOsTypesManager from '../../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../../DashboardBuilderWidgetsController';
import TableWidgetController from '../../TableWidgetController';
import TableWidgetOptions from '../TableWidgetOptions';
import './TableWidgetBulkActionsOptionsComponent.scss';

@Component({
    template: require('./TableWidgetBulkActionsOptionsComponent.pug'),
    components: {
    }
})
export default class TableWidgetBulkActionsOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private new_bulk_action_label: string = null;

    private next_update_options: TableWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    @Watch('new_bulk_action_label')
    private async onchange_new_bulk_action_label() {
        if (!this.new_bulk_action_label) {
            return;
        }

        let new_bulk_action = new BulkActionVO();
        new_bulk_action.label = this.new_bulk_action_label;

        // Reste le weight à configurer
        this.$emit('add_bulk_action', new_bulk_action);
    }

    private async add_bulk_action(add_bulk_action: BulkActionVO) {

        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        let i = -1;
        let found = false;

        if ((!!add_bulk_action) && (!!this.next_update_options.columns)) {
            i = this.next_update_options.columns.findIndex((ref_elt) => {
                return ref_elt.id == add_bulk_action.id;
            });
        }

        if (i < 0) {
            i = 0;
            add_bulk_action.weight = 0;
        } else {
            found = true;
        }

        if (!found) {
            if (!this.next_update_options.columns) {
                this.next_update_options.columns = [];
            }
            this.next_update_options.bulk_actions.push(add_bulk_action);
        }

        await this.throttled_update_options();
    }

    private get_default_options(): TableWidgetOptions {
        return new TableWidgetOptions(null, false, 100, null, false, true, false, true, true, true, true, true, true, true, true, false, null, false, 5, false, false, null, false, true, true, false, false, null);
    }

    private bulk_action_label(label: string): string {
        return this.t(label);
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    get bulk_action_options(): string[] {
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
                    options.show_bulk_edit,
                    options.bulk_actions,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get show_bulk_edit(): boolean {
        return this.widget_options && this.widget_options.show_bulk_edit;
    }
}