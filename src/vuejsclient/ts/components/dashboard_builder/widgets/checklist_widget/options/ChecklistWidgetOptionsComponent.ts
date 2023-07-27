import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CheckListVO from '../../../../../../../shared/modules/CheckList/vos/CheckListVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import ChecklistWidgetOptions from './ChecklistWidgetOptions';
import './ChecklistWidgetOptionsComponent.scss';

@Component({
    template: require('./ChecklistWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class ChecklistWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: ChecklistWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private checklist_selected: CheckListVO = null;
    private delete_all_button: boolean = false;
    private refresh_button: boolean = true;
    private export_button: boolean = true;
    private create_button: boolean = true;

    private checklists: CheckListVO[] = [];
    private checklists_by_ids: { [id: number]: CheckListVO } = {};

    get checklist_select_options(): CheckListVO[] {
        return this.checklists;
    }

    private checklist_select_label(checklist: CheckListVO): string {
        return checklist.name;
    }

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {

        if ((!this.checklists) || (!this.checklists.length)) {
            this.checklists = await query(CheckListVO.API_TYPE_ID).select_vos<CheckListVO>();
            this.checklists_by_ids = VOsTypesManager.vosArray_to_vosByIds(this.checklists);
        }

        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.checklist_selected) {
                this.checklist_selected = null;
            }
            if (!!this.delete_all_button) {
                this.delete_all_button = false;
            }
            if (!this.export_button) {
                this.export_button = true;
            }
            if (!this.refresh_button) {
                this.refresh_button = true;
            }
            return;
        }

        if (((!this.checklist_selected) != (!this.widget_options.checklist_id)) ||
            (this.checklist_selected && (this.checklist_selected.id != this.widget_options.checklist_id))) {
            this.checklist_selected = this.checklists_by_ids[this.widget_options.checklist_id];
        }

        if (this.create_button != this.widget_options.create_button) {
            this.create_button = this.widget_options.create_button;
        }
        if (this.export_button != this.widget_options.export_button) {
            this.export_button = this.widget_options.export_button;
        }
        if (this.refresh_button != this.widget_options.refresh_button) {
            this.refresh_button = this.widget_options.refresh_button;
        }
        if (this.delete_all_button != this.widget_options.delete_all_button) {
            this.delete_all_button = this.widget_options.delete_all_button;
        }
    }

    @Watch('checklist_selected')
    private async onchange_checklist_selected() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (((!this.checklist_selected) != (!this.next_update_options.checklist_id)) ||
            (this.checklist_selected.id != this.next_update_options.checklist_id)) {
            this.next_update_options.checklist_id = this.checklist_selected ? this.checklist_selected.id : null;

            await this.throttled_update_options();
        }
    }

    private get_default_options(): ChecklistWidgetOptions {
        return new ChecklistWidgetOptions(10, null, false, true, true, true);
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

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        return 'Checklist#' + this.page_widget.id;
    }

    get widget_options(): ChecklistWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: ChecklistWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ChecklistWidgetOptions;
                options = options ? new ChecklistWidgetOptions(
                    options.limit, options.checklist_id,
                    options.delete_all_button, options.create_button, options.refresh_button, options.export_button) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
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
}