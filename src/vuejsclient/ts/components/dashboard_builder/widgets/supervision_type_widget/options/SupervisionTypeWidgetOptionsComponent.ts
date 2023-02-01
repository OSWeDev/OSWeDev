import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import SupervisionController from '../../../../../../../shared/modules/Supervision/SupervisionController';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import SupervisionTypeWidgetOptions from './SupervisionTypeWidgetOptions';
import './SupervisionTypeWidgetOptionsComponent.scss';

@Component({
    template: require('./SupervisionTypeWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class SupervisionTypeWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: SupervisionTypeWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private supervision_api_type_ids: string[] = [];
    private supervision_select_options: string[] = [];

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {

        this.supervision_select_options = [];

        if (SupervisionController.getInstance().registered_controllers) {
            let supervision_select_options: string[] = [];

            for (let api_type_id in SupervisionController.getInstance().registered_controllers) {
                if (SupervisionController.getInstance().registered_controllers[api_type_id].is_actif()) {
                    supervision_select_options.push(api_type_id);
                }
            }

            this.supervision_select_options = supervision_select_options;
        }

        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.supervision_api_type_ids) {
                this.supervision_api_type_ids = [];
            }
            return;
        }

        if (this.supervision_api_type_ids != this.widget_options.supervision_api_type_ids) {
            this.supervision_api_type_ids = this.widget_options.supervision_api_type_ids;
        }
    }

    @Watch('supervision_api_type_ids')
    private async onchange_supervision_api_type_ids() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.supervision_api_type_ids != this.next_update_options.supervision_api_type_ids) {
            this.next_update_options.supervision_api_type_ids = this.supervision_api_type_ids;

            await this.throttled_update_options();
        }
    }

    private supervision_select_label(api_type_id: string): string {
        return this.label('supervision_widget_component.' + api_type_id);
    }

    private get_default_options(): SupervisionTypeWidgetOptions {
        return new SupervisionTypeWidgetOptions([]);
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

    get widget_options(): SupervisionTypeWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionTypeWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionTypeWidgetOptions;
                options = options ? new SupervisionTypeWidgetOptions(
                    options.supervision_api_type_ids,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}