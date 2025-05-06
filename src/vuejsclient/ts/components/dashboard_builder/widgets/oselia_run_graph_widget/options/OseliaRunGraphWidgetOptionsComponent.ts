import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import DashboardPageVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import InlineTranslatableText from "../../../../InlineTranslatableText/InlineTranslatableText";
import VueComponentBase from "../../../../VueComponentBase";
import SingleVoFieldRefHolderComponent from "../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent";
import { ModuleDashboardPageAction } from "../../../page/DashboardPageStore";
import './OseliaRunGraphWidgetOptionsComponent.scss';
@Component({
    template: require('./OseliaRunGraphWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class OseliaRunGraphWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

}