import { Prop } from "vue-property-decorator";
import DashboardPageWidgetVO from "../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";
import TimeSegment from "../../../../../../../shared/modules/DataRender/vos/TimeSegment";
import DefaultTranslationVO from "../../../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VarConfVO from "../../../../../../../shared/modules/Var/vos/VarConfVO";
import VueComponentBase from "../../../../VueComponentBase";
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from "../../../page/DashboardPageStore";
import IExportableWidgetOptions from "../../IExportableWidgetOptions";
import Component from 'vue-class-component';

@Component({
    template: require('./TeamsApiWidgetOptionsComponent.pug')
})
export default class TeamsApiWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    public static TITLE_CODE_PREFIX: string = "TeamsApiWidgetOptions.title.";

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        if (page_widget.json_options) {
            const options = JSON.parse(page_widget.json_options);
        }
        return {};
    }
}