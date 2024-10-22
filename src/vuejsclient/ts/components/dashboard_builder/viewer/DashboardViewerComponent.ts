import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import WidgetOptionsVOManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import './DashboardViewerComponent.scss';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardBuilderBoardManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardBuilderBoardManager';
import { field_names } from '../../../../../shared/tools/ObjectHandler';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import { debounce } from 'lodash';

@Component({
    template: require('./DashboardViewerComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
    }
})
export default class DashboardViewerComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_discarded_field_paths: (discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_dashboard_api_type_ids: (dashboard_api_type_ids: string[]) => void;

    @ModuleDashboardPageAction
    private add_shared_filters_to_map: (shared_filters: SharedFiltersVO[]) => void;

    @ModuleDashboardPageGetter
    private get_page_history: DashboardPageVO[];

    @ModuleDashboardPageAction
    private add_page_history: (page_history: DashboardPageVO) => void;

    @ModuleDashboardPageAction
    private set_dashboard_navigation_history: (
        dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }
    ) => void;

    @ModuleDashboardPageAction
    private set_page_history: (page_history: DashboardPageVO[]) => void;

    @ModuleDashboardPageAction
    private pop_page_history: (fk) => void;

    @ModuleDashboardPageAction
    private clear_active_field_filters: () => void;

    @ModuleDashboardPageGetter
    private get_dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    @ModuleDashboardPageAction
    private set_active_field_filters: (param: FieldFiltersVO) => void;

    @ModuleDashboardPageAction
    private set_cms_vo: (vo: IDistantVOBase) => void;


    // @ModuleDashboardPageAction
    // private add_shared_filters_to_map: (shared_filters: SharedFiltersVO[]) => void;

    @Prop({ default: null })
    private dashboard_id: number;

    @Prop({ default: null })
    private dashboard_vo_action: string;

    @Prop({ default: null })
    private dashboard_vo_id: string;

    @Prop({ default: null })
    private api_type_id_action: string;

    @Prop({ default: null })
    private cms_vo_api_type_id: string;

    @Prop({ default: null })
    private cms_vo_id: string;

    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null;

    private selected_widget: DashboardPageWidgetVO = null;
    private viewports: DashboardViewportVO[] = [];
    private selected_viewport: DashboardViewportVO = null;

    private can_edit: boolean = false;

    private debounced_onchange_cms_vo = debounce(this.load_cms_vo, 100);

    get has_navigation_history(): boolean {
        return this.get_page_history && (this.get_page_history.length > 0);
    }

    get visible_pages(): DashboardPageVO[] {

        if (!this.pages) {
            return null;
        }

        const res: DashboardPageVO[] = [];

        for (const i in this.pages) {
            const page = this.pages[i];
            if (!page.hide_navigation) {
                res.push(page);
            }
        }

        return res;
    }

    get dashboard_name_code_text(): string {
        if (!this.dashboard) {
            return null;
        }

        return this.dashboard.translatable_name_code_text ? this.dashboard.translatable_name_code_text : null;
    }

    get pages_name_code_text(): string[] {
        const res: string[] = [];

        if (!this.pages) {
            return res;
        }

        for (const i in this.pages) {
            const page = this.pages[i];

            res.push(page.translatable_name_code_text ? page.translatable_name_code_text : null);
        }

        return res;
    }

    @Watch('cms_vo_api_type_id', { immediate: true })
    @Watch('cms_vo_id')
    private onchange_cms_vo() {
        this.debounced_onchange_cms_vo();
    }

    /**
     * Quand on change de dahsboard, on supprime les filtres contextuels existants (en tout cas par défaut)
     *  on pourrait vouloir garder les filtres communs aussi => non implémenté (il faut un switch et supprimer les filtres non applicables aux widgets du dashboard)
     *  et on pourrait vouloir garder tous les filtres => non implémenté (il faut un switch et simplement ne pas supprimer les filtres)
     */
    @Watch("dashboard_id", { immediate: true })
    private async onchange_dashboard_id() {
        this.loading = true;

        if (!this.dashboard_id) {
            this.can_edit = false;
            this.loading = false;
            return;
        }

        // Update the dashboard navigation history
        DashboardVOManager.update_dashboard_navigation_history(
            this.dashboard_id,
            this.get_dashboard_navigation_history,
            this.set_dashboard_navigation_history
        );

        const access_policy_name = ModuleDAO.getInstance().getAccessPolicyName(
            ModuleDAO.DAO_ACCESS_TYPE_READ,
            DashboardVO.API_TYPE_ID
        );

        const has_dashboard_access = await ModuleAccessPolicy.getInstance().testAccess(
            access_policy_name
        );

        if (!has_dashboard_access) {
            this.loading = false;
            return;
        }

        this.dashboard = await DashboardVOManager.find_dashboard_by_id(
            this.dashboard_id
        );

        if (!this.dashboard) {
            this.can_edit = false;
            this.loading = false;
            return;
        }

        await this.init_api_type_ids_and_discarded_field_paths();

        // // FIXME : JNE pour MDU : Je remets le clear en place, en le supprimant tu as juste partagé tous les filtres de tous les dashboards entre eux,
        // // ya aucune notion de paramétrage associée... donc je remets dans l'état inital et on corrigera le partage par la suite...
        // this.clear_active_field_filters();

        const shared_filters: SharedFiltersVO[] = await DashboardVOManager.load_shared_filters_with_dashboard_id(
            this.dashboard.id,
        );

        this.add_shared_filters_to_map(shared_filters);

        this.pages = await this.load_dashboard_pages_by_dashboard_id(
            this.dashboard.id
        );

        if (!this.pages) {
            this.isLoading = false;
            this.can_edit = false;
            return;
        }

        WidgetOptionsVOManager.getInstance().initialize();

        WeightHandler.getInstance().sortByWeight(this.pages);
        this.page = this.pages[0];

        this.can_edit = await ModuleAccessPolicy.getInstance().testAccess(
            ModuleDashboardBuilder.POLICY_BO_ACCESS
        );

        // Si on a pas de viewport selectionné (cas du viewer), on prend le plus grand possible selon la taille de l'écran
        if (!this.selected_viewport) {
            const screen_width = window.innerWidth;
            this.viewports = await query(DashboardViewportVO.API_TYPE_ID).select_vos<DashboardViewportVO>();
            let selected_viewport: DashboardViewportVO = this.viewports.find((v) => v.is_default == true);

            for (let i in this.viewports) {
                const viewport = this.viewports[i];

                if (viewport.screen_min_width <= screen_width &&
                    (viewport.screen_min_width > selected_viewport.screen_min_width || selected_viewport.screen_min_width > screen_width)) {
                    selected_viewport = viewport;
                }

            }

            this.selected_viewport = selected_viewport;
        }

        this.loading = false;
    }

    @Watch("dashboard", { immediate: true })
    private async onchange_dashboard() {
        // We should load the shared_filters with the current dashboard
        await DashboardVOManager.load_shared_filters_with_dashboard(
            this.dashboard,
            this.get_dashboard_navigation_history,
            this.get_active_field_filters,
            this.set_active_field_filters
        );
    }

    private async load_cms_vo() {
        let vo: IDistantVOBase = null;

        if (this.cms_vo_api_type_id && this.cms_vo_id && (this.cms_vo_id != 'null') && !isNaN(parseInt(this.cms_vo_id))) {
            vo = await query(this.cms_vo_api_type_id).filter_by_id(parseInt(this.cms_vo_id)).select_vo();
        }

        if ((this.get_cms_vo?._type != vo?._type) || (this.get_cms_vo?.id != vo?.id)) {
            this.set_cms_vo(vo);
        }
    }

    private select_widget(page_widget) {
        this.selected_widget = page_widget;
    }

    private select_previous_page() {
        this.page = this.get_page_history[this.get_page_history.length - 1];
        this.pop_page_history(null);
    }

    private select_page_clear_navigation(page: DashboardPageVO) {
        this.set_page_history([]);
        this.page = page;
    }

    private async init_api_type_ids_and_discarded_field_paths() {
        const { api_type_ids, discarded_field_paths } = await DashboardBuilderBoardManager.get_api_type_ids_and_discarded_field_paths(this.dashboard.id);
        this.set_dashboard_api_type_ids(api_type_ids);
        this.set_discarded_field_paths(discarded_field_paths);
    }

    /**
     * load_dashboard_pages_by_dashboard_id
     * - Load the dashboard pages by dashboard id and sort them by weight
     *
     * @param {number} [dashboard_id]
     * @param {boolean} [options.refresh]
     * @returns {Promise<DashboardVO[]>}
     */
    private async load_dashboard_pages_by_dashboard_id(
        dashboard_id: number,
        options?: { refresh?: boolean }
    ): Promise<DashboardPageVO[]> {

        const dashboard_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_id(
            dashboard_id,
            {
                sorts: [
                    new SortByVO(DashboardVO.API_TYPE_ID, field_names<DashboardVO>().weight, true),
                    new SortByVO(DashboardVO.API_TYPE_ID, field_names<DashboardVO>().id, true)
                ]
            },
            options
        );

        return dashboard_pages;
    }

    private select_page(page: DashboardPageVO) {
        this.add_page_history(this.page);
        this.select_widget(null);
        this.page = page;
    }
}