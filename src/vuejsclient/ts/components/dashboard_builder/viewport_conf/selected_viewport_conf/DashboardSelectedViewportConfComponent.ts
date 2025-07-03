import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardViewportPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import { SyncVOs } from '../../../../tools/annotations/SyncVOs';
import { TestAccess } from '../../../../tools/annotations/TestAccess';
import VueComponentBase from '../../../VueComponentBase';
import './DashboardSelectedViewportConfComponent.scss';

@Component({
    template: require('./DashboardSelectedViewportConfComponent.pug'),
    components: {
    }
})
export default class DashboardSelectedViewportConfComponent extends VueComponentBase {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop()
    public dashboard: DashboardVO;

    @SyncVOs(DashboardPageVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardSelectedViewportConfComponent>().dashboard],
        filters_factory: (self) => self.dashboard?.id ? [filter(DashboardPageVO.API_TYPE_ID, field_names<DashboardPageVO>().dashboard_id).by_num_eq(self.dashboard.id)] : null,
    })
    public all_pages: DashboardPageVO[] = [];

    @SyncVOs(DashboardPageWidgetVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardSelectedViewportConfComponent>().all_pages],
        filters_factory: (self) => {
            if (!self.dashboard || !self.all_pages || self.all_pages.length <= 0) {
                return null;
            }

            return [filter(DashboardPageWidgetVO.API_TYPE_ID, field_names<DashboardPageWidgetVO>().page_id).by_num_has(self.all_pages.map(page => page.id))];
        },
    })
    public all_dashboard_page_widgets: DashboardPageWidgetVO[] = [];

    @SyncVOs(DashboardViewportPageWidgetVO.API_TYPE_ID, {
        watch_fields: [reflect<DashboardSelectedViewportConfComponent>().all_dashboard_page_widgets, reflect<DashboardSelectedViewportConfComponent>().get_selected_viewport],
        filters_factory: (self) => {
            if (!self.dashboard || !self.all_dashboard_page_widgets || self.all_dashboard_page_widgets.length <= 0 || !self.get_selected_viewport) {
                return null;
            }

            return [
                filter(DashboardViewportPageWidgetVO.API_TYPE_ID, field_names<DashboardViewportPageWidgetVO>().page_widget_id).by_num_has(self.all_dashboard_page_widgets.map(pwidget => pwidget.id)),
                filter(DashboardViewportPageWidgetVO.API_TYPE_ID, field_names<DashboardViewportPageWidgetVO>().viewport_id).by_num_eq(self.get_selected_viewport.id),
            ];
        },
    })
    public viewport_page_widgets: DashboardViewportPageWidgetVO[] = [];

    @TestAccess(DAOController.getAccessPolicyName(DashboardPageWidgetVO.API_TYPE_ID, ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE))
    public can_edit: boolean = false;

    get viewport_page_widgets_by_page_widget_id(): { [id: number]: DashboardViewportPageWidgetVO } {
        const res: { [id: number]: DashboardViewportPageWidgetVO } = {};

        if (!this.viewport_page_widgets || this.viewport_page_widgets.length <= 0) {
            return res;
        }

        for (const viewport_page_widget of this.viewport_page_widgets) {
            res[viewport_page_widget.page_widget_id] = viewport_page_widget;
        }
        return res;
    }

    get get_selected_viewport(): DashboardViewportVO {
        return this.vuexGet<DashboardViewportVO>(reflect<this>().get_selected_viewport);
    }

    get get_selected_widget(): DashboardViewportPageWidgetVO {
        return this.vuexGet<DashboardViewportPageWidgetVO>(reflect<this>().get_selected_widget);
    }

    get dashboard_page() {
        if (!this.dashboard) {
            return null;
        }

        if (!this.all_pages || this.all_pages.length <= 0) {
            return null;
        }

        // On renvoie toujours la première page pour le moment ça suffit bien à prévisualiser
        return this.all_pages[0];
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_selected_widget(page_widget: DashboardViewportPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }

    public async switch_page_widget_activation(viewport_page_widget: DashboardViewportPageWidgetVO) {
        if (!this.dashboard || !this.get_selected_viewport || !viewport_page_widget) {
            return;
        }

        // On active ou désactive le widget dans le viewport
        viewport_page_widget.activated = !viewport_page_widget.activated;

        // On enregistre le changement
        await ModuleDAO.getInstance().insertOrUpdateVO(viewport_page_widget);
    }

}