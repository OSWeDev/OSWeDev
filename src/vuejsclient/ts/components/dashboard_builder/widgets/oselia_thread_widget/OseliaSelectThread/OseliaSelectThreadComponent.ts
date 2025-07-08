import Component from 'vue-class-component';
import { Inject, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterVO, { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleOselia from '../../../../../../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../../../../../../shared/modules/Params/ModuleParams';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import TableWidgetExternalSelectorController from '../../table_widget/external_selector/TableWidgetExternalSelectorController';
import OseliaLastThreadsComponent from '../OseliaLastThreads/OseliaLastThreadsComponent';
import { ModuleOseliaAction } from '../OseliaStore';
import './OseliaSelectThreadComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./OseliaSelectThreadComponent.pug'),
    components: {
        Oselialastthreadscomponent: OseliaLastThreadsComponent,
    }
})
export default class OseliaSelectThreadComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleOseliaAction
    private set_left_panel_open: (left_panel_open: boolean) => void;

    private dashboard_threads_id: number = null;
    private data_received: any = null;
    private has_access: boolean = false;
    private throttle_test_access = ThrottleHelper.declare_throttle_without_args(
        'OseliaSelectThreadComponent.throttle_test_access',
        this.get_access, 1);

    @Watch('data_received')
    private async onchange_data_receieved() {
        const files = [];
        if (this.data_received.length > 0) {
            for (let row of this.data_received) {
                if (row['__crud_actions']) {
                    this.set_active_field_filter({
                        field_id: field_names<GPTAssistantAPIThreadVO>().id,
                        vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
                        active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_id(row['__crud_actions'])
                    });
                    this.set_left_panel_open(false);
                }
            }
        }
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

    public set_active_field_filter(param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, param);
    }

    private async get_access() {
        this.has_access = await ModuleAccessPolicy.getInstance().testAccess(ModuleOselia.POLICY_SELECT_THREAD_ACCESS);
    }

    private async mounted() {
        this.throttle_test_access();

        this.dashboard_threads_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleOselia.OSELIA_THREAD_DASHBOARD_ID_PARAM_NAME, null, 10000);

        if (!!this.dashboard_threads_id) {
            TableWidgetExternalSelectorController.init_external_selector(this, this.dashboard_threads_id, (data: any) => {
                this.data_received = data;
            });
        }
    }

    private async open_thread_select() {
        await TableWidgetExternalSelectorController.open_external_selector(this);
    }
}