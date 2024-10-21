import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import { ModuleOseliaAction } from '../OseliaStore';
import './OseliaLastThreadComponent.scss';

@Component({
    template: require('./OseliaLastThreadComponent.pug'),
    components: {
    }
})
export default class OseliaLastThreadComponent extends VueComponentBase {

    @Prop({ default: null })
    private current_thread_id: number;

    @Prop({ default: null })
    private thread: GPTAssistantAPIThreadVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;

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