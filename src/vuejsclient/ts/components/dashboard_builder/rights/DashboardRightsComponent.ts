import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { reflect } from '../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../VueComponentBase';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';
import './DashboardRightsComponent.scss';

@Component({
    template: require('./DashboardRightsComponent.pug'),
    components: {
    }
})
export default class DashboardRightsComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

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