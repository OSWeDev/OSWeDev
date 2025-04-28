import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterVO, { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import VueComponentBase from '../../VueComponentBase';
import './DashboardBuilderWidgetsComponent.scss';
import WidgetOptionsVOManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';

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

    @Prop()
    private viewports: DashboardViewportVO[];

    @Prop()
    private selected_viewport: DashboardViewportVO;

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

        await WidgetOptionsVOManager.getInstance().initialize();
        if (this.dashboard?.is_cms_compatible) {

            let sorted_widgets: DashboardWidgetVO[] = null;
            if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleDashboardBuilder.POLICY_DBB_FILTERS_VISIBLE_ON_CMS)) {

                sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
                    .add_filters([
                        ContextFilterVO.or([
                            filter(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().is_cms_compatible).is_true(),
                            filter(DashboardWidgetVO.API_TYPE_ID, field_names<DashboardWidgetVO>().is_filter).is_true(),
                        ]),
                    ])
                    .select_vos<DashboardWidgetVO>();
            } else {

                sorted_widgets = await query(DashboardWidgetVO.API_TYPE_ID)
                    .filter_is_true(field_names<DashboardWidgetVO>().is_cms_compatible)
                    .select_vos<DashboardWidgetVO>();
            }

            if (sorted_widgets) {
                WeightHandler.getInstance().sortByWeight(
                    sorted_widgets
                );
                this.widgets = sorted_widgets;
            }

        } else {

            this.widgets = WidgetOptionsVOManager.getInstance().sorted_widgets;
        }

        await this.onchange_selected_widget();

        this.loading = false;
    }

    private update_layout_widget(widget: DashboardPageWidgetVO) {
        this.$emit('update_layout_widget', widget);
    }

    private async add_widget_to_page(widget: DashboardWidgetVO) {

        if (!WidgetOptionsVOManager.getInstance().add_widget_to_page_handler) {
            ConsoleHandler.error("!add_widget_to_page_handler");
            return;
        }
        const page_widget = await WidgetOptionsVOManager.getInstance().add_widget_to_page_handler(widget);
        this.$emit('added_widget_to_page', page_widget);
    }

    private close_widget_options() {
        this.$emit('close_widget_options');
    }
}