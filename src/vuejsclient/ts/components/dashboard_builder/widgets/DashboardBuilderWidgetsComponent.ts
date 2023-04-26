import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../VueComponentBase';
import './DashboardBuilderWidgetsComponent.scss';
import DashboardBuilderWidgetsController from './DashboardBuilderWidgetsController';

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
        this.widgets = DashboardBuilderWidgetsController.getInstance().sorted_widgets;

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
        let page_widget = await DashboardBuilderWidgetsController.getInstance().add_widget_to_page_handler(widget);
        this.$emit('added_widget_to_page', page_widget);
    }

    get widgets_name(): string[] {
        let res: string[] = [];

        for (let i in this.widgets) {
            let widget = this.widgets[i];

            res.push(this.t(widget.translatable_name_code_text ?? null));
        }

        return res;
    }
}