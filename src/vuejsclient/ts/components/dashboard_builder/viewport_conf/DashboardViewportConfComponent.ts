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
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';

@Component({
    template: require('./DashboardViewportConfComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent,
        DashboardAllViewportsConfComponent: DashboardAllViewportsConfComponent,
        DashboardSelectedViewportConfComponent: DashboardSelectedViewportConfComponent,
        DashboardViewerComponent: DashboardViewerComponent,
    }
})
export default class DashboardViewportConfComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    get get_selected_viewport(): DashboardViewportVO {
        return this.vuexGet(reflect<this>().get_selected_viewport);
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
}