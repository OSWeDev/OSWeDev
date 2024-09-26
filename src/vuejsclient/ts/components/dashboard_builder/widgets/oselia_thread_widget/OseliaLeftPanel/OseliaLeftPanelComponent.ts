import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleOseliaAction } from '../OseliaStore';
import './OseliaLeftPanelComponent.scss';
import OseliaLastThreadsComponent from '../OseliaLastThreads/OseliaLastThreadsComponent';
import { Prop } from 'vue-property-decorator';
import OseliaSelectThreadComponent from '../OseliaSelectThread/OseliaSelectThreadComponent';

@Component({
    template: require('./OseliaLeftPanelComponent.pug'),
    components: {
        Oselialastthreadscomponent: OseliaLastThreadsComponent,
        Oseliaselectthreadcomponent: OseliaSelectThreadComponent
    }
})
export default class OseliaLeftPanelComponent extends VueComponentBase {

    @Prop({ default: null })
    private current_thread_id: number;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;

    private closeLeftPanel() {
        this.set_left_panel_open(false);
    }
}