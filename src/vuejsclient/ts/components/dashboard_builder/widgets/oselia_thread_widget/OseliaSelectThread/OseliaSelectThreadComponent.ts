import Component from 'vue-class-component';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaSelectThreadComponent.scss';
import OseliaLastThreadsComponent from '../OseliaLastThreads/OseliaLastThreadsComponent';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import ModuleOselia from '../../../../../../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../../../../../../shared/modules/Params/ModuleParams';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import { ModuleOseliaAction } from '../OseliaStore';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';

@Component({
    template: require('./OseliaSelectThreadComponent.pug'),
    components: {
        Oselialastthreadscomponent: OseliaLastThreadsComponent,
    }
})
export default class OseliaSelectThreadComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;

    private dashboard_threads_id: number = null;
    private wait_for_data: boolean = false;
    private data_received: any = null;
    private has_access: boolean = false;
    private throttle_test_access = ThrottleHelper.declare_throttle_without_args(this.get_access, 1)

    @Watch('data_received')
    private async onchange_data_receieved() {
        const files = [];
        if (this.data_received.length > 0) {
            for (let row of this.data_received) {
                if (row['gpt_assistant_thread___id']) {
                    this.set_active_field_filter({
                        field_id: field_names<GPTAssistantAPIThreadVO>().id,
                        vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
                        active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_id(row['gpt_assistant_thread___id'])
                    });
                    this.set_left_panel_open(false);
                }
            }
        }
    }

    get file_system_url() {
        const { protocol, hostname, port } = window.location;
        return `${protocol}//${hostname}${(port ? `:${port}` : '')}/admin#/dashboard/view/`;
    }

    private async get_access() {
        this.has_access = await ModuleAccessPolicy.getInstance().testAccess(ModuleOselia.POLICY_SELECT_THREAD_ACCESS);
    }

    private mounted() {
        this.throttle_test_access();
        window.addEventListener("message", (event: MessageEvent) => {
            const source = event.source as Window;
            if ((source.location.href !== this.file_system_url + this.dashboard_threads_id)) {
                return;
            } else {
                if (this.wait_for_data) {
                    this.data_received = event.data;
                }
            }
        });
    }
    private async listen_for_message(page_id: number, num_range: NumRange) {
        (window as any).instructions = { 'Export': num_range };

        const export_window = window.open(this.file_system_url + page_id);
        this.wait_for_data = true;
    }

    private async open_thread_select() {
        this.dashboard_threads_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleOselia.OSELIA_THREAD_DASHBOARD_ID_PARAM_NAME, null, 10000);
        const num_range: NumRange = NumRange.createNew(0, 1, true, true, 0);
        await this.listen_for_message(this.dashboard_threads_id, num_range);
    }

}