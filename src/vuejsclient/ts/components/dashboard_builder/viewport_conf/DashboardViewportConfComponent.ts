import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { reflect } from '../../../../../shared/tools/ObjectHandler';
import MenuOrganizerComponent from '../../menu/organizer/MenuOrganizerComponent';
import VueComponentBase from '../../VueComponentBase';
import DashboardViewerComponent from '../viewer/DashboardViewerComponent';
import DashboardAllViewportsConfComponent from './all_viewports_conf/DashboardAllViewportsConfComponent';
import './DashboardViewportConfComponent.scss';
import DashboardSelectedViewportConfComponent from './selected_viewport_conf/DashboardSelectedViewportConfComponent';

@Component({
    template: require('./DashboardViewportConfComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent,
        DashboardAllViewportsConfComponent: DashboardAllViewportsConfComponent,
        DashboardSelectedViewportConfComponent: DashboardSelectedViewportConfComponent,
        DashboardViewerComponent: DashboardViewerComponent,
    }
})
export default class DashboardViewportConfComponent extends VueComponentBase {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    get get_selected_viewport(): DashboardViewportVO {
        return this.vuexGet<DashboardViewportVO>(reflect<this>().get_selected_viewport);
    }

    get get_dashboard(): DashboardVO {
        return this.vuexGet<DashboardVO>(reflect<this>().get_dashboard);
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }
}