import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../shared/modules/DAO/ModuleTableController';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardBuilderBoardManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardBuilderBoardManager';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import DashboardPageWidgetVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardActiveonViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardActiveonViewportVO';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import ObjectHandler, { field_names } from '../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import VueAppController from '../../../../VueAppController';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import DroppableVoFieldsComponent from '../droppable_vo_fields/DroppableVoFieldsComponent';
import { ModuleDroppableVoFieldsAction } from '../droppable_vo_fields/DroppableVoFieldsStore';
import DashboardMenuConfComponent from '../menu_conf/DashboardMenuConfComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import DashboardSharedFiltersComponent from '../shared_filters/DashboardSharedFiltersComponent';
import TablesGraphComponent from '../tables_graph/TablesGraphComponent';
import DashboardBuilderWidgetsComponent from '../widgets/DashboardBuilderWidgetsComponent';
import DashboardBuilderWidgetsController from '../widgets/DashboardBuilderWidgetsController';
import IExportableWidgetOptions from '../widgets/IExportableWidgetOptions';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import TranslatableTextController from '../../InlineTranslatableText/TranslatableTextController';
import { ModuleTranslatableTextAction } from '../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../VueComponentBase';
import './CMSConfigComponent.scss';

@Component({
    template: require('./CMSConfigComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Droppablevofieldscomponent: DroppableVoFieldsComponent,
        Dashboardbuilderwidgetscomponent: DashboardBuilderWidgetsComponent,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
        Tablesgraphcomponent: TablesGraphComponent,
        Dashboardmenuconfcomponent: DashboardMenuConfComponent,
        Dashboardsharedfilterscomponent: DashboardSharedFiltersComponent,
    },
})
export default class CMSConfigComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_discarded_field_paths: (discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_dashboard_api_type_ids: (dashboard_api_type_ids: string[]) => void;

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private dashboard_id: string;

    @ModuleDashboardPageAction
    private set_page_widgets_components_by_pwid: (page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) => void;

    @ModuleDashboardPageGetter
    private get_page_history: DashboardPageVO[];

    @ModuleDashboardPageAction
    private set_page_widgets: (page_widgets: DashboardPageWidgetVO[]) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageAction
    private delete_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleTranslatableTextAction
    private set_flat_locale_translations: (translations: { [code_text: string]: string }) => void;

    @ModuleDashboardPageAction
    private add_page_history: (page_history: DashboardPageVO) => void;

    @ModuleDashboardPageAction
    private set_page_history: (page_history: DashboardPageVO[]) => void;

    @ModuleDashboardPageAction
    private set_dashboard_navigation_history: (
        dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }
    ) => void;

    @ModuleDashboardPageGetter
    private get_dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number };

    @ModuleDashboardPageAction
    private pop_page_history: (fk) => void;

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    @ModuleDashboardPageAction
    private add_shared_filters_to_map: (shared_filters: SharedFiltersVO[]) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    private dashboards: DashboardVO[] = [];
    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private show_cms_dashboard_pages: boolean = true;
    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null; // The current page

    private show_build_page: boolean = true;
    private show_menu_conf: boolean = false;

    private selected_widget: DashboardPageWidgetVO = null;

    private collapsed_fields_wrapper: boolean = true;
    private collapsed_fields_wrapper_2: boolean = true;

    private can_use_clipboard: boolean = false;

    private viewports: DashboardViewportVO[] = [];
    private selected_viewport: DashboardViewportVO = null;
    private is_dbb_actived_on_viewport: boolean = false;

    private is_cms_config: boolean = true;

    private async mounted() {
        const self = this;
    }

    private async add_api_type_id(api_type_id: string) {
        if (!this.get_dashboard_api_type_ids) {
            this.set_dashboard_api_type_ids([]);
        }
        if (this.get_dashboard_api_type_ids.indexOf(api_type_id) >= 0) {
            return;
        }
        const tmp = Array.from(this.get_dashboard_api_type_ids);
        tmp.push(api_type_id);
        this.set_dashboard_api_type_ids(tmp);
    }

    private async del_api_type_id(api_type_id: string) {
        if (!this.get_dashboard_api_type_ids) {
            return;
        }
        this.set_dashboard_api_type_ids(this.get_dashboard_api_type_ids.filter((ati) => ati != api_type_id));
    }

    private async update_discarded_field_paths(discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
        this.set_discarded_field_paths(discarded_field_paths);
    }
}