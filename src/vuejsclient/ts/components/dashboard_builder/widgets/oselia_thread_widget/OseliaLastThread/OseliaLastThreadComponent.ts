import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleOseliaAction } from '../OseliaStore';
import './OseliaLastThreadComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./OseliaLastThreadComponent.pug'),
    components: {
    }
})
export default class OseliaLastThreadComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private current_thread_id: number;

    @Prop({ default: null })
    private thread: GPTAssistantAPIThreadVO;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;

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


    public set_active_field_filter(param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, param);
    }

    private async select_thread() {
        if (!this.thread) {
            return;
        }

        this.set_active_field_filter({
            field_id: field_names<GPTAssistantAPIThreadVO>().id,
            vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
            active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_id(this.thread.id)
        });

        this.set_left_panel_open(false);
    }
}