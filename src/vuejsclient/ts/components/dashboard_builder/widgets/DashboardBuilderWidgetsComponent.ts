import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../VueComponentBase';
import './DashboardBuilderWidgetsComponent.scss';
import DashboardBuilderWidgetsController from './DashboardBuilderWidgetsController';
import { reflect } from '../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./DashboardBuilderWidgetsComponent.pug'),
    components: {
    }
})
export default class DashboardBuilderWidgetsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop()
    private dashboard: DashboardVO;

    @Prop()
    private dashboard_page: DashboardPageVO;

    @Prop()
    private dashboard_pages: DashboardPageVO[];

    private widgets: DashboardWidgetVO[] = null;
    private selected_widget_type: DashboardWidgetVO = null;

    private loading: boolean = true;

    get widgets_name(): string[] {
        const res: string[] = [];

        for (const i in this.widgets) {
            const widget = this.widgets[i];

            res.push(this.t(widget.label ?? null));
        }

        return res;
    }

    get selected_widget_type_label(): string {
        if (!this.selected_widget_type) {
            return null;
        }

        return this.t(this.selected_widget_type.label ?? null);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet<DashboardPageWidgetVO>(reflect<this>().get_selected_widget);
    }

    @Watch(reflect<DashboardBuilderWidgetsComponent>().get_selected_widget, { immediate: true })
    private async onchange_selected_widget() {
        if (!this.get_selected_widget) {
            this.selected_widget_type = null;
            return;
        }

        if (!this.widgets) {
            return;
        }

        this.selected_widget_type = this.widgets.find((w) => w.id == this.get_selected_widget.widget_id);
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
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
        const page_widget = await DashboardBuilderWidgetsController.getInstance().add_widget_to_page_handler(widget);
        this.$emit('added_widget_to_page', page_widget);
    }

    private close_widget_options() {
        this.$emit('close_widget_options');
    }
}