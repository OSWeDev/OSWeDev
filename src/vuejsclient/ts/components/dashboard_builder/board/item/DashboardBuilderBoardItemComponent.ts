import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../shared/annotations/Throttle';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import EventifyEventListenerConfVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../VueComponentBase';
import DashboardCopyWidgetComponent from '../../copy_widget/DashboardCopyWidgetComponent';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';
import './DashboardBuilderBoardItemComponent.scss';

@Component({
    template: require('./DashboardBuilderBoardItemComponent.pug'),
    components: {}
})

export default class DashboardBuilderBoardItemComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop()
    private dashboard_page: DashboardPageVO;

    @Prop()
    private dashboard_pages: DashboardPageVO[];

    @Prop()
    private dashboard: DashboardVO;

    @Prop()
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: true })
    private is_edit_mode: boolean;

    @Prop({ default: false })
    private is_selected: boolean;

    private widget: DashboardWidgetVO = null;

    get get_Dashboardcopywidgetcomponent(): DashboardCopyWidgetComponent {
        return this.vuexGet(reflect<this>().get_Dashboardcopywidgetcomponent);
    }


    @Watch('page_widget', { immediate: true })
    @Watch('dashboard_page')
    private async on_prop_updates() {
        this.onchange_widget();
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
    })
    private async onchange_widget() {
        if ((!this.page_widget) || (this.page_widget.page_id != this.dashboard_page?.id)) {
            return;
        }

        this.widget = await query(DashboardWidgetVO.API_TYPE_ID)
            .filter_by_id(this.page_widget.widget_id)
            .select_vo<DashboardWidgetVO>();

        if (!this.page_widget.id) {
            return;
        }

        if (this.$refs['widget_component_ref']) {

            this.set_page_widget_component_by_pwid({
                pwid: this.page_widget.id,
                page_widget_component: this.$refs['widget_component_ref'] as VueComponentBase
            });
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public set_page_widget_component_by_pwid(param: { pwid: number, page_widget_component: VueComponentBase }) {
        return this.vuexAct(reflect<this>().set_page_widget_component_by_pwid, param);
    }

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }


    private mounted() {
        if ((!this.page_widget?.id) || (this.page_widget.page_id != this.dashboard_page?.id)) {
            return;
        }

        if (this.$refs['widget_component_ref']) {

            this.set_page_widget_component_by_pwid({
                pwid: this.page_widget.id,
                page_widget_component: this.$refs['widget_component_ref'] as VueComponentBase
            });
        }
    }

    private delete_widget() {
        this.$emit('delete_widget', this.page_widget);
    }

    private select_page(page) {
        this.$emit('select_page', page);
    }

    private async copy_widget() {
        await this.get_Dashboardcopywidgetcomponent.open_copy_modal(
            this.page_widget,
            this.dashboard_pages,
            null
        );

        // this.$emit('copy_widget', this.page_widget);
    }
}