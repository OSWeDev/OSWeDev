import Component from "vue-class-component";
import { Inject, Prop } from "vue-property-decorator";
import DashboardPageVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import { reflect } from "../../../../../../../shared/tools/ObjectHandler";
import InlineTranslatableText from "../../../../InlineTranslatableText/InlineTranslatableText";
import VueComponentBase from "../../../../VueComponentBase";
import SingleVoFieldRefHolderComponent from "../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent";
import './OseliaRunGraphWidgetOptionsComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from "../../../page/DashboardPageStore";
@Component({
    template: require('./OseliaRunGraphWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class OseliaRunGraphWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

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

    public set_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }

}