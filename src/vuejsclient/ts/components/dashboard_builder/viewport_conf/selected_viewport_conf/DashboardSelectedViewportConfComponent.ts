import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardViewportPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { TestAccess } from '../../../../tools/annotations/TestAccess';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../VueComponentBase';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';
import './DashboardSelectedViewportConfComponent.scss';

@Component({
    template: require('./DashboardSelectedViewportConfComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class DashboardSelectedViewportConfComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @TestAccess(DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DashboardPageWidgetVO.API_TYPE_ID))
    public can_edit: boolean = false;

    get viewport_page_widgets_by_page_widget_id(): { [id: number]: DashboardViewportPageWidgetVO } {
        const res: { [id: number]: DashboardViewportPageWidgetVO } = {};

        if (!this.get_dashboard_viewport_page_widgets || this.get_dashboard_viewport_page_widgets.length <= 0) {
            return res;
        }

        for (const viewport_page_widget of this.get_dashboard_viewport_page_widgets) {
            res[viewport_page_widget.page_widget_id] = viewport_page_widget;
        }
        return res;
    }

    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_pages);
    }

    get get_dashboard_viewport_page_widgets(): DashboardViewportPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_viewport_page_widgets);
    }

    get get_page_widgets(): DashboardPageWidgetVO[] {
        return this.vuexGet(reflect<this>().get_page_widgets);
    }

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet(reflect<this>().get_dashboard_current_viewport);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet(reflect<this>().get_selected_widget);
    }

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet(reflect<this>().get_dashboard_page);
    }

    get get_dashboard(): DashboardVO {
        return this.vuexGet(reflect<this>().get_dashboard);
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

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }

    public async switch_page_widget_activation(viewport_page_widget: DashboardViewportPageWidgetVO) {
        if (!this.get_dashboard || !this.get_dashboard_current_viewport || !viewport_page_widget) {
            return;
        }

        // On active ou désactive le widget dans le viewport
        viewport_page_widget.activated = !viewport_page_widget.activated;

        // On enregistre le changement
        await ModuleDAO.getInstance().insertOrUpdateVO(viewport_page_widget);
    }

    public select_widget(page_widget: DashboardPageWidgetVO) {

        if (!this.get_dashboard || !this.get_dashboard_current_viewport || !page_widget) {
            return;
        }

        if (page_widget == this.get_selected_widget) {
            return;
        }

        // On sélectionne le widget
        this.set_selected_widget(page_widget);
    }
}