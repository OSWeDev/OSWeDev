import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../shared/annotations/Throttle';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import EventifyEventListenerConfVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../VueComponentBase';
import DashboardCopyWidgetComponent from '../../copy_widget/DashboardCopyWidgetComponent';
import DashboardPageWidgetController from '../../DashboardPageWidgetController';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';
import './DashboardBuilderBoardItemComponent.scss';

@Component({
    template: require('./DashboardBuilderBoardItemComponent.pug'),
    components: {}
})

export default class DashboardBuilderBoardItemComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public all_page_widget: DashboardPageWidgetVO[];

    @Prop()
    public dashboard_page: DashboardPageVO;

    @Prop()
    public dashboard_pages: DashboardPageVO[];

    @Prop()
    public dashboard: DashboardVO;

    @Prop()
    public page_widget: DashboardPageWidgetVO;

    @Prop({ default: true })
    public is_edit_mode: boolean;

    @Prop({ default: false })
    public is_selected: boolean;

    get widget(): DashboardWidgetVO {

        if (!this.get_widgets_by_id) {
            return null;
        }

        if (!this.page_widget || !this.page_widget.widget_id) {
            return null;
        }

        return this.get_widgets_by_id[this.page_widget.widget_id] || null;
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
    }

    get get_Dashboardcopywidgetcomponent(): DashboardCopyWidgetComponent {
        return this.vuexGet(reflect<this>().get_Dashboardcopywidgetcomponent);
    }


    @Watch(reflect<DashboardBuilderBoardItemComponent>().page_widget, { immediate: true })
    @Watch(reflect<DashboardBuilderBoardItemComponent>().dashboard_page)
    public async on_prop_updates() {
        this.onchange_widget();
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
    })
    public async onchange_widget() {
        if (!this.page_widget) { // || (this.page_widget.page_id != this.dashboard_page?.id)) {
            return;
        }

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


    public mounted() {
        if (!this.page_widget?.id) { // || (this.page_widget.page_id != this.dashboard_page?.id)) {
            return;
        }

        if (this.$refs['widget_component_ref']) {

            this.set_page_widget_component_by_pwid({
                pwid: this.page_widget.id,
                page_widget_component: this.$refs['widget_component_ref'] as VueComponentBase
            });
        }
    }

    public delete_widget() {
        DashboardPageWidgetController.delete_widget(
            this.page_widget,
            this.set_selected_widget.bind(this),
            this.snotify,
        );
    }

    public async copy_widget() {
        await this.get_Dashboardcopywidgetcomponent.open_copy_modal(
            this.page_widget,
            this.dashboard_pages,
            null
        );

        // this.$emit('copy_widget', this.page_widget);
    }
}