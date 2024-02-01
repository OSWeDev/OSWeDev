import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import './BlocTextWidgetOptionsComponent.scss';
import { Prop, Watch } from 'vue-property-decorator';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import BlocTextWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/BlocTextWidgetOptionsVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import WidgetOptionsVOManager from '../../../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';

@Component({
    template: require('./BlocTextWidgetOptionsComponent.pug')
})
export default class BlocTextWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: BlocTextWidgetOptionsVO = null;
    private bloc_text: string = null;
    private last_calculation_cpt: number = 0;

    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.bloc_text = null;

            return;
        }
        this.bloc_text = this.widget_options.bloc_text;
    }

    @Watch('bloc_text')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.bloc_text != this.bloc_text) {
            this.next_update_options = this.widget_options;
            this.next_update_options.bloc_text = this.bloc_text;

            await this.throttled_update_options();
        }
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        // this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        const all_widgets_types: DashboardWidgetVO[] = WidgetOptionsVOManager.getInstance().sorted_widgets_types;
        const widget_type: DashboardWidgetVO = all_widgets_types.find((e) => e.id == this.page_widget.widget_id);

        let name = widget_type?.name;

        const get_selected_fields = WidgetOptionsVOManager.getInstance().widgets_get_selected_fields[name];

        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    get widget_options(): BlocTextWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: BlocTextWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as BlocTextWidgetOptionsVO;
                options = options ? new BlocTextWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

}