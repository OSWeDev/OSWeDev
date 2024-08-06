import Component from "vue-class-component";
import VueComponentBase from "../../../VueComponentBase";
import { Prop } from "vue-property-decorator";
import DashboardPageVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardVO from "../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import FieldFiltersVO from "../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";
import { ModuleTranslatableTextGetter } from "../../../InlineTranslatableText/TranslatableTextStore";
import { ModuleDashboardPageGetter } from "../../page/DashboardPageStore";

@Component({
    template: require('./TeamsApiWidgetComponent.pug')
})
export default class TeamsApiWidgetComponent extends VueComponentBase {
    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;
}