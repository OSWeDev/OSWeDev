import Component from 'vue-class-component';
import { Prop, Provide } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import DashboardVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardVOManager';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import { SafeWatch } from '../../../tools/annotations/SafeWatch';
import { SyncVO } from '../../../tools/annotations/SyncVO';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import DashboardHistoryController from '../DashboardHistoryController';
import DashboardPageStore, { IDashboardGetters, IDashboardPageActionsMethods } from '../page/DashboardPageStore';
import './DashboardViewerComponent.scss';

@Component({
    template: require('./DashboardViewerComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
    }
})
export default class DashboardViewerComponent extends VueComponentBase {

    @Prop({ default: null })
    public dashboard_id: number;

    @SyncVO(DashboardVO.API_TYPE_ID, {
        debug: true,

        watch_fields: [reflect<DashboardViewerComponent>().dashboard_id],
        id_factory: (self) => self.dashboard_id,
        sync_to_store_namespace: (self) => self.storeNamespace,
    })
    public dashboard: DashboardVO = null; // The current dashboard


    // public loading: boolean = true;
    public loading: boolean = false;

    // namespace dynamique
    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Provide('storeNamespace')
    public readonly storeNamespace = `dashboardStore_${DashboardPageStore.__UID++}`;

    public can_edit: boolean = false;

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet(reflect<this>().get_dashboard_page);
    }

    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_pages);
    }

    get get_page_history(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_page_history);
    }

    get get_dashboard_navigation_history(): { current_dashboard_id: number, previous_dashboard_id: number } {
        return this.vuexGet(reflect<this>().get_dashboard_navigation_history);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }


    get has_navigation_history(): boolean {
        return this.get_page_history && (this.get_page_history.length > 0);
    }

    get visible_pages(): DashboardPageVO[] {

        if (!this.get_dashboard_pages) {
            return null;
        }

        const res: DashboardPageVO[] = [];

        for (const i in this.get_dashboard_pages) {
            const page = this.get_dashboard_pages[i];
            if (!page.hide_navigation) {
                res.push(page);
            }
        }

        return res;
    }

    get get_viewports(): DashboardViewportVO[] {
        return this.vuexGet(reflect<this>().get_viewports);
    }

    @SafeWatch(reflect<DashboardViewerComponent>().dashboard_id, { immediate: true })
    public async onchange_dashboard_id_update_store() {
        this.set_dashboard_id(this.dashboard_id);
    }

    @SafeWatch(reflect<DashboardViewerComponent>().get_dashboard_page)
    public onchange_page() {
        this.set_selected_widget(null);
    }

    @SafeWatch(reflect<DashboardViewerComponent>().dashboard)
    public async onchange_dashboard() {
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
    @SafeWatch(reflect<DashboardViewerComponent>().dashboard_id)
    public async onchange_dashboard_id() {
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

        this.can_edit = await ModuleAccessPolicy.getInstance().testAccess(
            ModuleDashboardBuilder.POLICY_BO_ACCESS
        );

        this.loading = false;
    }

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

    // registre/déréf module
    public created() {
        const instance = new DashboardPageStore();
        this.$store.registerModule(this.storeNamespace, instance);

        // Ne pas mettre en immediate true, le storeNamespace n'est pas encore créé
        this.onchange_dashboard_id(); // Initialisation de la page dashboard
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
        return this.vuexAct(reflect<this>().clear_active_field_filters, null);
    }

    public set_active_field_filters(param: FieldFiltersVO) {
        return this.vuexAct(reflect<this>().set_active_field_filters, param);
    }

    public set_selected_widget(selected_widget: DashboardPageWidgetVO): void {
        this.vuexAct(reflect<this>().set_selected_widget, selected_widget);
    }

    public beforeDestroy() {
        this.$store.unregisterModule(this.storeNamespace);
    }

    public set_dashboard_page(page: DashboardPageVO) {
        this.vuexAct(reflect<this>().set_dashboard_page, page);
    }

    public select_page(page: DashboardPageVO) {
        DashboardHistoryController.select_page(
            this.get_dashboard_page,
            page,
            this.add_page_history,
            this.set_dashboard_page,
        );
    }


    public select_previous_page() {
        DashboardHistoryController.select_previous_page(
            this.get_page_history,
            this.set_dashboard_page,
            this.pop_page_history,
        );
    }

    /**
     * load_dashboard_pages_by_dashboard_id
     * - Load the dashboard pages by dashboard id and sort them by weight
     *
     * @param {number} [dashboard_id]
     * @param {boolean} [options.refresh]
     * @returns {Promise<DashboardVO[]>}
     */
    public async load_dashboard_pages_by_dashboard_id(
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

    public set_dashboard_id(dashboard_id: number): void {
        this.vuexAct(reflect<this>().set_dashboard_id, dashboard_id);
    }
}