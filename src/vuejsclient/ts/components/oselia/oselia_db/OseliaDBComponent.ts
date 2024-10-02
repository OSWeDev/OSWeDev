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
import { ModuleOseliaGetter } from '../../dashboard_builder/widgets/oselia_thread_widget/OseliaStore';
import OseliaReferrerVO from '../../../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaUserReferrerOTTVO from '../../../../../shared/modules/Oselia/vos/OseliaUserReferrerOTTVO';

@Component({
    template: require('./OseliaDBComponent.pug'),
    components: {
        Dashboardviewercomponent: () => import('../../dashboard_builder/viewer/DashboardViewerComponent')
    }
})
export default class OseliaDBComponent extends VueComponentBase {

    @Prop({ default: null })
    private thread_vo_id: number;

    @Prop({ default: null })
    private referrer_user_ott: string;

    @ModuleDashboardPageAction
    private set_active_field_filters: (active_field_filters: FieldFiltersVO) => void;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleOseliaGetter
    private get_oselia_first_loading_done: boolean;

    private oselia_db_id: number = null;

    private async mounted() {
        this.oselia_db_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleOselia.OSELIA_DB_ID_PARAM_NAME);
        if (!this.oselia_db_id) {
            this.$router.push({
                name: 'oselia_referrer_not_found'
            });
            return;
        }

        if (this.referrer_user_ott && !this.thread_vo_id) {
            this.set_active_field_filters(
                Object.assign(
                    new FieldFiltersVO(),
                    {
                        [OseliaUserReferrerOTTVO.API_TYPE_ID]: {
                            'id': filter(OseliaUserReferrerOTTVO.API_TYPE_ID, 'ott').by_text_eq(this.referrer_user_ott)
                        }
                    },
                    this.get_active_field_filters,
                )
            );
        } else {
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