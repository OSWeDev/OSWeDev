import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardViewerComponent from '../DashboardViewerComponent';
import VueComponentBase from '../../../VueComponentBase';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import { debounce } from 'lodash';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import LinkDashboardAndApiTypeIdVO from '../../../../../../shared/modules/DashboardBuilder/vos/LinkDashboardAndApiTypeIdVO';

@Component({
    template: require('./VoViewerComponent.pug'),
    components: {
        Dashboardviewercomponent: DashboardViewerComponent,
    }
})
export default class VoViewerComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    @ModuleDashboardPageAction
    private set_cms_vo: (vo: IDistantVOBase) => void;

    @ModuleDashboardPageGetter
    private get_cms_dashboard_id: number;

    @ModuleDashboardPageAction
    private set_cms_dashboard_id: (cms_dashboard_id: number) => void;

    @Prop({ default: null })
    private cms_vo_api_type_id: string;

    @Prop({ default: null })
    private cms_vo_id: string;

    private debounced_onchange_cms_vo = debounce(this.load_cms_vo, 100);

    @Watch('cms_vo_api_type_id', { immediate: true })
    @Watch('cms_vo_id')
    private onchange_cms_vo() {
        this.debounced_onchange_cms_vo();
    }

    private async mounted() {
        this.debounced_onchange_cms_vo();
    }

    private async load_cms_vo() {
        let vo: IDistantVOBase = null;

        if (this.cms_vo_api_type_id && this.cms_vo_id && (this.cms_vo_id != 'null') && !isNaN(parseInt(this.cms_vo_id))) {
            vo = await query(this.cms_vo_api_type_id).filter_by_id(parseInt(this.cms_vo_id)).select_vo();
        }

        if ((this.get_cms_vo?._type != vo?._type) || (this.get_cms_vo?.id != vo?.id)) {
            const link_dbb: LinkDashboardAndApiTypeIdVO = await query(LinkDashboardAndApiTypeIdVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<LinkDashboardAndApiTypeIdVO>().api_type_id, this.cms_vo_api_type_id)
                .set_limit(1)
                .select_vo();

            this.set_cms_dashboard_id(link_dbb?.dashboard_id);

            this.set_cms_vo(vo);
        }
    }
}