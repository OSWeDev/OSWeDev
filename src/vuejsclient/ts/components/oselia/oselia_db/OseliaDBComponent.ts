import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { filter } from '../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadVO from '../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleOselia from '../../../../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../dashboard_builder/page/DashboardPageStore';
import './OseliaDBComponent.scss';

@Component({
    template: require('./OseliaDBComponent.pug'),
    components: {
        Dashboardviewercomponent: () => import('../../dashboard_builder/viewer/DashboardViewerComponent')
    }
})
export default class OseliaDBComponent extends VueComponentBase {

    @Prop({ default: null })
    private thread_vo_id: number;

    @ModuleDashboardPageAction
    private set_active_field_filters: (active_field_filters: FieldFiltersVO) => void;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    private oselia_db_id: number = null;

    private async mounted() {
        // this.oselia_db_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleOselia.OSELIA_DB_ID_PARAM_NAME);
        // console.dir(this.oselia_db_id)
        this.oselia_db_id = 1;
        if (!this.oselia_db_id) {
            this.$router.push({
                name: 'oselia_referrer_not_found'
            });
            return;
        }

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