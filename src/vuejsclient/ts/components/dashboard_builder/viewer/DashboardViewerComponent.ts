import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardBuilderBoardManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardBuilderBoardManager';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import WidgetOptionsVOManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import './DashboardViewerComponent.scss';

@Component({
    template: require('./DashboardViewerComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
    }
})
export default class DashboardViewerComponent extends VueComponentBase {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private dashboard_id: number;

    private dashboard: DashboardVO = null;
    private loading: boolean = true;

    private pages: DashboardPageVO[] = [];
    private page: DashboardPageVO = null;

    private selected_widget: DashboardPageWidgetVO = null;

    private can_edit: boolean = false;

    get get_page_history(): DashboardPageVO[] {
        return this.vuexGet<DashboardPageVO[]>(reflect<this>().get_page_history);
    }

    get get_dashboard_navigation_history(): { current_dashboard_id: number, previous_dashboard_id: number } {
        return this.vuexGet<{ current_dashboard_id: number, previous_dashboard_id: number }>(reflect<this>().get_dashboard_navigation_history);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }


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

        const access_policy_name = ModuleDAO.instance.getAccessPolicyName(
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

        if (shared_filters?.length > 0) {

            this.add_shared_filters_to_map(shared_filters);
        }

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

        this.loading = false;
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_discarded_field_paths(discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
        return this.vuexAct(reflect<this>().set_discarded_field_paths, discarded_field_paths);
    }

    public set_dashboard_api_type_ids(dashboard_api_type_ids: string[]) {
        return this.vuexAct(reflect<this>().set_dashboard_api_type_ids, dashboard_api_type_ids);
    }

    public add_shared_filters_to_map(shared_filters: SharedFiltersVO[]) {
        return this.vuexAct(reflect<this>().add_shared_filters_to_map, shared_filters);
    }

    public add_page_history(page_history: DashboardPageVO) {
        return this.vuexAct(reflect<this>().add_page_history, page_history);
    }

    public set_dashboard_navigation_history(dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }) {
        return this.vuexAct(reflect<this>().set_dashboard_navigation_history, dashboard_navigation_history);
    }

    public set_page_history(page_history: DashboardPageVO[]) {
        return this.vuexAct(reflect<this>().set_page_history, page_history);
    }

    public pop_page_history(fk) {
        return this.vuexAct(reflect<this>().pop_page_history, fk);
    }

    public clear_active_field_filters() {
        return this.vuexAct(reflect<this>().clear_active_field_filters);
    }

    public set_active_field_filters(param: FieldFiltersVO) {
        return this.vuexAct(reflect<this>().set_active_field_filters, param);
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

    // private mounted() {
    //     let body = document.getElementById('page-top');
    //     body.classList.add("sidenav-toggled");
    // }

    // private beforeDestroy() {
    //     let body = document.getElementById('page-top');
    //     body.classList.remove("sidenav-toggled");
    // }
}