import Component from 'vue-class-component';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaLastThreadsComponent.scss';
import OseliaLastThreadComponent from '../OseliaLastThread/OseliaLastThreadComponent';
import { Prop } from 'vue-property-decorator';

@Component({
    template: require('./OseliaLastThreadsComponent.pug'),
    components: {
        Oselialastthreadcomponent: OseliaLastThreadComponent,
    }
})
export default class OseliaLastThreadsComponent extends VueComponentBase {

    @Prop({ default: null })
    private current_thread_id: number;

    public threads: GPTAssistantAPIThreadVO[] = [];

    private async mounted() {
        await this.register_vo_updates_on_list(
            GPTAssistantAPIThreadVO.API_TYPE_ID,
            reflect<OseliaLastThreadsComponent>().threads,
            [filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().user_id).by_num_eq(this.data_user.id)],
            [
                new SortByVO(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().oswedev_created_at, false)
            ]
        );
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }
}