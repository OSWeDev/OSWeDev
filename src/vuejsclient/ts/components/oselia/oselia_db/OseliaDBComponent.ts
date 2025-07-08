import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadVO from '../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleOselia from '../../../../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import { reflect } from '../../../../../shared/tools/ObjectHandler';
import { ModuleOseliaAction, ModuleOseliaGetter } from '../../dashboard_builder/widgets/oselia_thread_widget/OseliaStore';
import VueComponentBase from '../../VueComponentBase';
import './OseliaDBComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../dashboard_builder/page/DashboardPageStore';

@Component({
    template: require('./OseliaDBComponent.pug'),
    components: {
        Dashboardviewercomponent: () => import('../../dashboard_builder/viewer/DashboardViewerComponent')
    }
})
export default class OseliaDBComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private thread_vo_id: number;

    @Prop({ default: null })
    private parent_client_tab_id: string;

    @ModuleOseliaGetter
    private get_oselia_first_loading_done: boolean;

    @ModuleOseliaAction
    private set_parent_client_tab_id: (parent_client_tab_id: string) => void;

    private oselia_db_id: number = null;

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
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

    public set_active_field_filters(active_field_filters: FieldFiltersVO) {
        return this.vuexAct(reflect<this>().set_active_field_filters, active_field_filters);
    }

    private async mounted() {

        this.set_parent_client_tab_id(this.parent_client_tab_id);

        this.oselia_db_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleOselia.OSELIA_DB_ID_PARAM_NAME, null, 10000);
        if (!this.oselia_db_id) {
            this.$router.push({
                name: 'oselia_referrer_not_found'
            });
            return;
        }

        if (this.thread_vo_id) {
            this.set_active_field_filters(
                Object.assign(
                    new FieldFiltersVO(),
                    {
                        [GPTAssistantAPIThreadVO.API_TYPE_ID]: {
                            'id': filter(GPTAssistantAPIThreadVO.API_TYPE_ID, 'id').by_id(this.thread_vo_id)
                        }
                    },
                    this.get_active_field_filters,
                )
            );
        }
    }
}