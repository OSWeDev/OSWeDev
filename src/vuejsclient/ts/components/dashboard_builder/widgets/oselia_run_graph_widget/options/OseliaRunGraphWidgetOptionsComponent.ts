import Component from "vue-class-component";
import { Inject, Prop } from "vue-property-decorator";
import DashboardPageVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import { reflect } from "../../../../../../../shared/tools/ObjectHandler";
import InlineTranslatableText from "../../../../InlineTranslatableText/InlineTranslatableText";
import VueComponentBase from "../../../../VueComponentBase";
import SingleVoFieldRefHolderComponent from "../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent";
import './OseliaRunGraphWidgetOptionsComponent.scss';
@Component({
    template: require('./OseliaRunGraphWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class OseliaRunGraphWidgetOptionsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }

}