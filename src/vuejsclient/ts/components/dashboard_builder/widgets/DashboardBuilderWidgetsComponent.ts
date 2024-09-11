import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderWidgetsController from './DashboardBuilderWidgetsController';
import './DashboardBuilderWidgetsComponent.scss';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import { field_names } from '../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./DashboardBuilderWidgetsComponent.pug'),
    components: {
    }
})
export default class DashboardBuilderWidgetsComponent extends VueComponentBase {

    @Prop()
    private dashboard: DashboardVO;

    @Prop()
    private dashboard_page: DashboardPageVO;

    @Prop()
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private selected_widget: DashboardPageWidgetVO;

    private widgets: DashboardWidgetVO[] = null;
    private selected_widget_type: DashboardWidgetVO = null;

    private loading: boolean = true;

    get widgets_name(): string[] {
        const res: string[] = [];

        for (const i in this.widgets) {
            const widget = this.widgets[i];

            res.push(this.t(widget.translatable_name_code_text ?? null));
        }

        return res;
    }

    get selected_widget_type_label(): string {
        if (!this.selected_widget_type) {
            return null;
        }

        return this.t(this.selected_widget_type.translatable_name_code_text ?? null);
    }

    @Watch('selected_widget', { immediate: true })
    private async onchange_selected_widget() {
        if (!this.selected_widget) {
            this.selected_widget_type = null;
            return;
        }

        if (!this.widgets) {
            return;
        }

        this.selected_widget_type = this.widgets.find((w) => w.id == this.selected_widget.widget_id);
    }

    private async mounted() {

        await DashboardBuilderWidgetsController.getInstance().initialize();
        if (this.dashboard?.is_cms_compatible) {

            const sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
                .filter_is_true(field_names<DashboardWidgetVO>().is_cms_compatible)
                .select_vos<DashboardWidgetVO>();

            if (sorted_widgets) {
                WeightHandler.getInstance().sortByWeight(
                    sorted_widgets
                );
                this.widgets = sorted_widgets;
            }

        } else {

            this.widgets = DashboardBuilderWidgetsController.getInstance().sorted_widgets;
        }

        await this.onchange_selected_widget();

        this.loading = false;
    }

    private update_layout_widget(widget: DashboardPageWidgetVO) {
        this.$emit('update_layout_widget', widget);
    }

    private async add_widget_to_page(widget: DashboardWidgetVO) {

        if (!DashboardBuilderWidgetsController.getInstance().add_widget_to_page_handler) {
            ConsoleHandler.error("!add_widget_to_page_handler");
            return;
        }
        const page_widget = await DashboardBuilderWidgetsController.getInstance().add_widget_to_page_handler(widget);
        this.$emit('added_widget_to_page', page_widget);
    }

    private close_widget_options() {
        this.$emit('close_widget_options');
    }
}