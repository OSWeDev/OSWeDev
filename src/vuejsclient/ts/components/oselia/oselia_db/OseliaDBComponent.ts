import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadVO from '../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleOselia from '../../../../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import { reflect } from '../../../../../shared/tools/ObjectHandler';
import { ModuleOseliaGetter } from '../../dashboard_builder/widgets/oselia_thread_widget/OseliaStore';
import VueComponentBase from '../../VueComponentBase';
import './OseliaDBComponent.scss';

@Component({
    template: require('./OseliaDBComponent.pug'),
    components: {
        Dashboardviewercomponent: () => import('../../dashboard_builder/viewer/DashboardViewerComponent')
    }
})
export default class OseliaDBComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private thread_vo_id: number;

    @ModuleOseliaGetter
    private get_oselia_first_loading_done: boolean;

    private oselia_db_id: number = null;

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_active_field_filters(active_field_filters: FieldFiltersVO) {
        return this.vuexAct(reflect<this>().set_active_field_filters, active_field_filters);
    }

    private async mounted() {
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