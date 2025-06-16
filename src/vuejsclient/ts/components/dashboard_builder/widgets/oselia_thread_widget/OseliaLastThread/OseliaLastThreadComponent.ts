import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleOseliaAction } from '../OseliaStore';
import './OseliaLastThreadComponent.scss';

@Component({
    template: require('./OseliaLastThreadComponent.pug'),
    components: {
    }
})
export default class OseliaLastThreadComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private current_thread_id: number;

    @Prop({ default: null })
    private thread: GPTAssistantAPIThreadVO;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
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