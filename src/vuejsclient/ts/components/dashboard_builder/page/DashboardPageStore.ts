import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterVO from "../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import DashboardPageWidgetVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardViewportPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DBBConfVO from '../../../../../shared/modules/DashboardBuilder/vos/DBBConfVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import VueAppController from '../../../../VueAppController';
import IStoreModule from "../../../store/IStoreModule";
import { store_mutations_names } from '../../../store/StoreModuleBase';
import VueComponentBase from "../../VueComponentBase";
import DashboardCopyWidgetComponent from "../copy_widget/DashboardCopyWidgetComponent";
import DashboardBuilderVueController from '../DashboardBuilderVueController';

export type DashboardPageContext = ActionContext<IDashboardPageState, any>;

type ActionsAsMethods<T> = {
    [K in keyof T]: T[K] extends (ctx: any, ...args: infer P) => infer R ? (...args: P) => R : never;
};
type ExtractGetters<T> = {
    [K in keyof T]: T[K] extends (state: any) => infer R ? R : never;
};

export interface IDashboardPageState {
    /**
     * Tous les page_widgets du Dashboard (toutes pages confondues)
     */
    page_widgets: DashboardPageWidgetVO[];

    /**
     * Tous les page_widgets de la page actuellement visualisée du Dashboard
     */
    selected_page_page_widgets: DashboardPageWidgetVO[];

    /**
     * Currently Selected Widget
     */
    selected_widget: DashboardPageWidgetVO;
    callback_for_set_selected_widget: (page_widget: DashboardPageWidgetVO) => void;

    /**
     * Stock tous les composants du dashboard
     */
    page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    active_field_filters: FieldFiltersVO;

    Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent;

    dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number };

    page_history: DashboardPageVO[];

    custom_filters: string[];
    active_api_type_ids: string[]; // Setted on user selection (select option) to specify query on specified vos api ids
    query_api_type_ids: string[]; // Setted from widget options to have custom|default query on specified vos api ids

    shared_filters_map: SharedFiltersVO[]; // Shared filters map for all dashboard pages

    widgets_invisibility: { [w_id: number]: boolean };

    dashboard_id: number; // Dashboard id of the current dashboard
    dashboard: DashboardVO;
    dashboard_page: DashboardPageVO; // Current dashboard page
    dashboard_pages: DashboardPageVO[];

    db_graph_vo_refs: DashboardGraphVORefVO[];

    all_widgets: DashboardWidgetVO[]; // All widgets

    viewports: DashboardViewportVO[]; // All viewports
    dashboard_current_viewport: DashboardViewportVO; // Current viewport of the dashboard

    dashboard_viewport_page_widgets: DashboardViewportPageWidgetVO[]; // All page widgets of the current viewport of the current page of the dashboard

    dbb_confs: DBBConfVO[]; // All the DBB configurations available in the system

    crud_vo: IDistantVOBase; // VO used for CRUD operations (read, create, update) in the dashboard / used by template widgets

    selected_onglet: string; // Dans un DBB, permet de switcher d'onglet
}

const getters = {

    get_selected_onglet(state: IDashboardPageState): string {
        return state.selected_onglet || DashboardBuilderVueController.DBB_ONGLET_TABLE;
    },

    get_dashboard_valid_viewports(state: IDashboardPageState): DashboardViewportVO[] {

        if (!state.dashboard) {
            return [];
        }

        if (!state.viewports || state.viewports.length <= 0) {
            return [];
        }

        if (!state.dashboard.activated_viewport_id_ranges || state.dashboard.activated_viewport_id_ranges.length <= 0) {
            // No activated viewport id ranges, return all viewports
            return state.viewports;
        }

        const res: DashboardViewportVO[] = [];

        for (const i in state.viewports) {
            const viewport = state.viewports[i];

            if (RangeHandler.elt_intersects_any_range(viewport.id, state.dashboard.activated_viewport_id_ranges)) {
                // If the viewport id intersects with the activated viewport id ranges
                res.push(viewport);
            }
        }

        return res;
    },

    get_crud_vo(state: IDashboardPageState): IDistantVOBase {
        return state.crud_vo;
    },

    get_dbb_confs(state: IDashboardPageState): DBBConfVO[] {
        return state.dbb_confs;
    },

    get_current_dbb_conf(state: IDashboardPageState): DBBConfVO {
        if (!state.dashboard || !state.dbb_confs || state.dbb_confs.length <= 0) {
            // No dashboard or no DBB confs, return the first valid DBB conf
            return null;
        }

        return state.dbb_confs.find((dbb_conf) => dbb_conf.id == state.dashboard.dbb_conf_id) || null;
    },

    get_user_valid_dbb_confs(state: IDashboardPageState): DBBConfVO[] {
        const res: DBBConfVO[] = [];

        if (!state.dbb_confs || state.dbb_confs.length <= 0) {
            return res;
        }

        if (!VueAppController.getInstance().data_user_roles || VueAppController.getInstance().data_user_roles.length <= 0) {
            // No user roles, no valid DBB confs
            return res;
        }

        const user_role_id_ranges = RangeHandler.get_ids_ranges_from_vos(VueAppController.getInstance().data_user_roles);

        // Si le user a le rôle admin : on pousse toutes les confs
        if (VueAppController.getInstance().data_user_roles.some((role) => role.translatable_name == ModuleAccessPolicy.ROLE_ADMIN)) {
            return state.dbb_confs;
        }

        for (const i in state.dbb_confs) {
            const dbb_conf = state.dbb_confs[i];

            if (dbb_conf.role_id_ranges && RangeHandler.any_range_intersects_any_range(user_role_id_ranges, dbb_conf.role_id_ranges)) {
                // If the user has at least one role that intersects with the DBB conf role_id_ranges
                res.push(dbb_conf);
            }
        }

        return res;
    },

    get_shared_filters_map(state: IDashboardPageState): SharedFiltersVO[] {
        return state.shared_filters_map;
    },
    get_dashboard_page(state: IDashboardPageState): DashboardPageVO {
        return state.dashboard_page;
    },

    get_dashboard_id(state: IDashboardPageState): number {
        return state.dashboard_id;
    },

    get_viewports(state: IDashboardPageState): DashboardViewportVO[] {
        return state.viewports;
    },

    get_dashboard_current_viewport(state: IDashboardPageState): DashboardViewportVO {
        return state.dashboard_current_viewport;
    },

    get_dashboard_viewport_page_widgets(state: IDashboardPageState): DashboardViewportPageWidgetVO[] {
        return state.dashboard_viewport_page_widgets;
    },

    get_all_widgets(state: IDashboardPageState): DashboardWidgetVO[] {
        return state.all_widgets;
    },

    get_widgets_by_id(state: IDashboardPageState): { [id: number]: DashboardWidgetVO } {
        const widgets_by_id: { [id: number]: DashboardWidgetVO } = {};

        for (const i in state.all_widgets) {
            const widget = state.all_widgets[i];
            widgets_by_id[widget.id] = widget;
        }

        return widgets_by_id;
    },

    get_dashboard_pages(state: IDashboardPageState): DashboardPageVO[] {
        return state.dashboard_pages;
    },

    get_selected_page_page_widgets(state: IDashboardPageState): DashboardPageWidgetVO[] {
        return state.selected_page_page_widgets;
    },

    get_selected_page_page_widgets_by_id(state: IDashboardPageState): { [id: number]: DashboardPageWidgetVO } {
        const selected_page_page_widgets_by_id: { [id: number]: DashboardPageWidgetVO } = {};

        for (const i in state.selected_page_page_widgets) {
            const page_widget = state.selected_page_page_widgets[i];
            selected_page_page_widgets_by_id[page_widget.id] = page_widget;
        }

        return selected_page_page_widgets_by_id;
    },

    get_db_graph_vo_refs(state: IDashboardPageState): DashboardGraphVORefVO[] {
        return state.db_graph_vo_refs;
    },

    get_dashboard(state: IDashboardPageState): DashboardVO {
        return state.dashboard;
    },

    get_callback_for_set_selected_widget(state: IDashboardPageState): (page_widget: DashboardPageWidgetVO) => void {
        return state.callback_for_set_selected_widget;
    },

    get_selected_widget(state: IDashboardPageState): DashboardPageWidgetVO {
        return state.selected_widget;
    },

    has_navigation_history(state: IDashboardPageState): boolean {
        return state.page_history && (state.page_history.length > 0);
    },

    get_page_widgets_components_by_pwid(state: IDashboardPageState): { [pwid: number]: VueComponentBase } {
        return state.page_widgets_components_by_pwid;
    },

    get_custom_filters(state: IDashboardPageState): string[] {
        return state.custom_filters;
    },

    get_active_api_type_ids(state: IDashboardPageState): string[] {
        return state.active_api_type_ids;
    },

    get_dashboard_navigation_history(state: IDashboardPageState): { current_dashboard_id: number, previous_dashboard_id: number } {
        return state.dashboard_navigation_history;
    },

    get_query_api_type_ids(state: IDashboardPageState): string[] {
        return state.query_api_type_ids;
    },

    get_page_history(state: IDashboardPageState): DashboardPageVO[] {
        return state.page_history;
    },

    get_widgets_invisibility(state: IDashboardPageState): { [w_id: number]: boolean } {
        return state.widgets_invisibility;
    },

    get_Dashboardcopywidgetcomponent(state: IDashboardPageState): DashboardCopyWidgetComponent {
        return state.Dashboardcopywidgetcomponent;
    },


    get_page_widgets(state: IDashboardPageState): DashboardPageWidgetVO[] {
        return state.page_widgets;
    },

    get_active_field_filters(state: IDashboardPageState): FieldFiltersVO {
        return state.active_field_filters;
    },

    get_dashboard_api_type_ids(state: IDashboardPageState): string[] {
        const api_type_ids: string[] = [];

        if (!state.db_graph_vo_refs || state.db_graph_vo_refs.length <= 0) {
            return api_type_ids;
        }

        for (const i in state.db_graph_vo_refs) {
            api_type_ids.push(state.db_graph_vo_refs[i].vo_type);
        }

        return api_type_ids;
    },

    get_page_widgets_by_page_id(state: IDashboardPageState): { [page_id: number]: DashboardPageWidgetVO[] } {
        const page_widgets_by_page_id: { [page_id: number]: DashboardPageWidgetVO[] } = {};

        if (!state.page_widgets || state.page_widgets.length <= 0) {
            return page_widgets_by_page_id;
        }

        for (const i in state.page_widgets) {
            const page_widget = state.page_widgets[i];

            if (!page_widgets_by_page_id[page_widget.page_id]) {
                page_widgets_by_page_id[page_widget.page_id] = [];
            }

            page_widgets_by_page_id[page_widget.page_id].push(page_widget);
        }

        return page_widgets_by_page_id;
    },

    get_dashboard_discarded_field_paths(state: IDashboardPageState): { [vo_type: string]: { [field_id: string]: boolean } } {

        const discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } } = {};

        for (const i in state.db_graph_vo_refs) {
            const db_graph_vo_ref = state.db_graph_vo_refs[i];

            if (!db_graph_vo_ref.values_to_exclude) {
                continue;
            }

            for (const key in db_graph_vo_ref.values_to_exclude) {
                const field_id: string = db_graph_vo_ref.values_to_exclude[key];

                if (!discarded_field_paths[db_graph_vo_ref.vo_type]) {
                    discarded_field_paths[db_graph_vo_ref.vo_type] = {};
                }

                discarded_field_paths[db_graph_vo_ref.vo_type][field_id] = true;
            }
        }

        return discarded_field_paths;
    }

} satisfies GetterTree<IDashboardPageState, DashboardPageContext>;


const actions = {
    set_selected_onglet: (context: DashboardPageContext, selected_onglet: string) => context.commit(store_mutations_names(storeInstance).set_selected_onglet, selected_onglet),
    set_crud_vo: (context: DashboardPageContext, crud_vo: IDistantVOBase) => context.commit(store_mutations_names(storeInstance).set_crud_vo, crud_vo),
    set_dbb_confs: (context: DashboardPageContext, dbb_confs: DBBConfVO[]) => context.commit(store_mutations_names(storeInstance).set_dbb_confs, dbb_confs),
    set_page_widgets: (context: DashboardPageContext, page_widgets: DashboardPageWidgetVO[]) => context.commit(store_mutations_names(storeInstance).set_page_widgets, page_widgets),
    set_page_widget_component_by_pwid: (context: DashboardPageContext, param: { pwid: number, page_widget_component: VueComponentBase }) => context.commit(store_mutations_names(storeInstance).set_page_widget_component_by_pwid, param),
    set_dashboard_page: (context: DashboardPageContext, dashboard_page: DashboardPageVO) => context.commit(store_mutations_names(storeInstance).set_dashboard_page, dashboard_page),
    set_dashboard_id: (context: DashboardPageContext, dashboard_id: number) => context.commit(store_mutations_names(storeInstance).set_dashboard_id, dashboard_id),
    set_viewports: (context: DashboardPageContext, viewports: DashboardViewportVO[]) => context.commit(store_mutations_names(storeInstance).set_viewports, viewports),
    set_dashboard_current_viewport: (context: DashboardPageContext, dashboard_current_viewport: DashboardViewportVO) => context.commit(store_mutations_names(storeInstance).set_dashboard_current_viewport, dashboard_current_viewport),
    set_dashboard_viewport_page_widgets: (context: DashboardPageContext, dashboard_viewport_page_widgets: DashboardViewportPageWidgetVO[]) => context.commit(store_mutations_names(storeInstance).set_dashboard_viewport_page_widgets, dashboard_viewport_page_widgets),
    set_all_widgets: (context: DashboardPageContext, all_widgets: DashboardWidgetVO[]) => context.commit(store_mutations_names(storeInstance).set_all_widgets, all_widgets),
    set_dashboard_pages: (context: DashboardPageContext, dashboard_pages: DashboardPageVO[]) => context.commit(store_mutations_names(storeInstance).set_dashboard_pages, dashboard_pages),
    set_selected_page_page_widgets: (context: DashboardPageContext, selected_page_page_widgets: DashboardPageWidgetVO[]) => context.commit(store_mutations_names(storeInstance).set_selected_page_page_widgets, selected_page_page_widgets),
    set_db_graph_vo_refs: (context: DashboardPageContext, db_graph_vo_refs: DashboardGraphVORefVO[]) => context.commit(store_mutations_names(storeInstance).set_db_graph_vo_refs, db_graph_vo_refs),
    set_dashboard: (context: DashboardPageContext, dashboard: DashboardVO) => context.commit(store_mutations_names(storeInstance).set_dashboard, dashboard),
    set_callback_for_set_selected_widget: (context: DashboardPageContext, callback_for_set_selected_widget: (page_widget: DashboardPageWidgetVO) => void) => context.commit(store_mutations_names(storeInstance).set_callback_for_set_selected_widget, callback_for_set_selected_widget),
    set_selected_widget: (context: DashboardPageContext, selected_widget: DashboardPageWidgetVO) => context.commit(store_mutations_names(storeInstance).set_selected_widget, selected_widget),
    set_page_widgets_components_by_pwid: (context: DashboardPageContext, page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) => context.commit(store_mutations_names(storeInstance).set_page_widgets_components_by_pwid, page_widgets_components_by_pwid),
    set_widget_invisibility: (context: DashboardPageContext, w_id: number) => context.commit(store_mutations_names(storeInstance).set_widget_invisibility, w_id),
    set_widget_visibility: (context: DashboardPageContext, w_id: number) => context.commit(store_mutations_names(storeInstance).set_widget_visibility, w_id),
    set_widgets_invisibility: (context: DashboardPageContext, widgets_invisibility: { [w_id: number]: boolean }) => context.commit(store_mutations_names(storeInstance).set_widgets_invisibility, widgets_invisibility),
    set_custom_filters: (context: DashboardPageContext, custom_filters: string[]) => context.commit(store_mutations_names(storeInstance).set_custom_filters, custom_filters),
    set_active_api_type_ids: (context: DashboardPageContext, active_api_type_ids: string[]) => context.commit(store_mutations_names(storeInstance).set_active_api_type_ids, active_api_type_ids),
    set_query_api_type_ids: (context: DashboardPageContext, query_api_type_ids: string[]) => context.commit(store_mutations_names(storeInstance).set_query_api_type_ids, query_api_type_ids),
    set_page_history: (context: DashboardPageContext, page_history: DashboardPageVO[]) => context.commit(store_mutations_names(storeInstance).set_page_history, page_history),
    add_page_history: (context: DashboardPageContext, page_history: DashboardPageVO) => context.commit(store_mutations_names(storeInstance).add_page_history, page_history),
    pop_page_history: (context: DashboardPageContext, fk) => context.commit(store_mutations_names(storeInstance).pop_page_history, null),
    set_Dashboardcopywidgetcomponent: (context: DashboardPageContext, Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) => context.commit(store_mutations_names(storeInstance).set_Dashboardcopywidgetcomponent, Dashboardcopywidgetcomponent),
    set_dashboard_navigation_history: (context: DashboardPageContext, dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }) => context.commit(store_mutations_names(storeInstance).set_dashboard_navigation_history, dashboard_navigation_history),
    add_shared_filters_to_map: (context: DashboardPageContext, shared_filters_map: SharedFiltersVO[]) => context.commit(store_mutations_names(storeInstance).add_shared_filters_to_map, shared_filters_map),
    set_shared_filters_map: (context: DashboardPageContext, shared_filters_map: SharedFiltersVO[]) => context.commit(store_mutations_names(storeInstance).set_shared_filters_map, shared_filters_map),
    set_active_field_filters: (context: DashboardPageContext, active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }) => context.commit(store_mutations_names(storeInstance).set_active_field_filters, active_field_filters),
    set_active_field_filter: (context: DashboardPageContext, param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => context.commit(store_mutations_names(storeInstance).set_active_field_filter, param),
    remove_active_field_filter: (context: DashboardPageContext, params: { vo_type: string, field_id: string }) => context.commit(store_mutations_names(storeInstance).remove_active_field_filter, params),
    clear_active_field_filters: (context: DashboardPageContext, empty) => context.commit(store_mutations_names(storeInstance).clear_active_field_filters, empty),
    remove_page_widgets_components_by_pwid: (context: DashboardPageContext, pwid: number) => context.commit(store_mutations_names(storeInstance).remove_page_widgets_components_by_pwid, pwid),
} satisfies ActionTree<IDashboardPageState, DashboardPageContext>;

type ExtractActions<T> = {
    [K in keyof T]: T[K] extends (ctx: any, ...args: infer P) => infer R
    ? (context: DashboardPageContext, ...args: P) => R
    : never;
};

export type IDashboardPageStoreActions = ExtractActions<typeof actions>;

export type IDashboardPageActionsMethods = ActionsAsMethods<IDashboardPageStoreActions>;

export type IDashboardGetters = ExtractGetters<typeof getters>;

export type IDashboardPageConsumer = {
    vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K];
    vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    );
} & Partial<IDashboardPageActionsMethods & IDashboardGetters>;

export default class DashboardPageStore implements IStoreModule<IDashboardPageState, DashboardPageContext> {

    public static __UID: number = 0;

    // public static instance: DashboardPageStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDashboardPageState, DashboardPageContext>;
    public mutations = {

        set_selected_onglet(state: IDashboardPageState, selected_onglet: string) {
            if (state.selected_onglet === selected_onglet) {
                return;
            }

            state.selected_onglet = selected_onglet;
        },

        set_crud_vo(state: IDashboardPageState, crud_vo: IDistantVOBase) {
            if (state.crud_vo === crud_vo) {
                return;
            }

            state.crud_vo = crud_vo;
        },

        set_dbb_confs(state: IDashboardPageState, dbb_confs: DBBConfVO[]) {
            if (state.dbb_confs === dbb_confs) {
                return;
            }

            state.dbb_confs = dbb_confs;
        },

        set_dashboard_page(state: IDashboardPageState, dashboard_page: DashboardPageVO) {
            if (state.dashboard_page?.id == dashboard_page?.id) {
                return;
            }

            state.dashboard_page = dashboard_page;
        },

        set_dashboard_id(state: IDashboardPageState, dashboard_id: number) {
            if (state.dashboard_id === dashboard_id) {
                return;
            }

            state.dashboard_id = dashboard_id;
        },

        set_viewports(state: IDashboardPageState, viewports: DashboardViewportVO[]) {
            if (state.viewports === viewports) {
                return;
            }

            state.viewports = viewports;
        },
        set_dashboard_current_viewport(state: IDashboardPageState, dashboard_current_viewport: DashboardViewportVO) {
            if (state.dashboard_current_viewport?.id == dashboard_current_viewport?.id) {
                return;
            }

            state.dashboard_current_viewport = dashboard_current_viewport;
        },
        set_dashboard_viewport_page_widgets(state: IDashboardPageState, dashboard_viewport_page_widgets: DashboardViewportPageWidgetVO[]) {
            if (state.dashboard_viewport_page_widgets === dashboard_viewport_page_widgets) {
                return;
            }

            state.dashboard_viewport_page_widgets = dashboard_viewport_page_widgets;
        },

        set_all_widgets(state: IDashboardPageState, all_widgets: DashboardWidgetVO[]) {
            if (state.all_widgets === all_widgets) {
                return;
            }

            state.all_widgets = all_widgets;
        },

        set_dashboard_pages(state: IDashboardPageState, dashboard_pages: DashboardPageVO[]) {
            if (state.dashboard_pages === dashboard_pages) {
                return;
            }

            state.dashboard_pages = dashboard_pages;
        },

        set_selected_page_page_widgets(state: IDashboardPageState, selected_page_page_widgets: DashboardPageWidgetVO[]) {
            if (state.selected_page_page_widgets === selected_page_page_widgets) {
                return;
            }

            state.selected_page_page_widgets = selected_page_page_widgets;
        },

        set_db_graph_vo_refs(state: IDashboardPageState, db_graph_vo_refs: DashboardGraphVORefVO[]) {
            if (state.db_graph_vo_refs === db_graph_vo_refs) {
                return;
            }

            state.db_graph_vo_refs = db_graph_vo_refs;
        },

        set_dashboard(state: IDashboardPageState, dashboard: DashboardVO) {
            if (state.dashboard?.id == dashboard?.id) {
                return;
            }

            state.dashboard = dashboard;
        },

        set_callback_for_set_selected_widget(state: IDashboardPageState, callback_for_set_selected_widget: (page_widget: DashboardPageWidgetVO) => void) {
            if (state.callback_for_set_selected_widget === callback_for_set_selected_widget) {
                return;
            }

            state.callback_for_set_selected_widget = callback_for_set_selected_widget;
        },

        set_selected_widget(state: IDashboardPageState, selected_widget: DashboardPageWidgetVO) {
            if (state.selected_widget?.id == selected_widget?.id) {
                return;
            }

            state.selected_widget = selected_widget;

            if (!state.callback_for_set_selected_widget) {
                return;
            }

            state.callback_for_set_selected_widget(selected_widget);
        },

        set_page_widgets_components_by_pwid(state: IDashboardPageState, page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) {
            state.page_widgets_components_by_pwid = page_widgets_components_by_pwid;
        },
        remove_page_widgets_components_by_pwid(state: IDashboardPageState, pwid: number) {
            delete state.page_widgets_components_by_pwid[pwid];
        },
        set_page_widget_component_by_pwid(state: IDashboardPageState, param: { pwid: number, page_widget_component: VueComponentBase }) {
            Vue.set(state.page_widgets_components_by_pwid, param.pwid, param.page_widget_component);
        },

        set_widgets_invisibility(state: IDashboardPageState, widgets_invisibility: { [w_id: number]: boolean }) {
            state.widgets_invisibility = widgets_invisibility;
        },

        set_widget_invisibility(state: IDashboardPageState, w_id: number) {
            Vue.set(state.widgets_invisibility, w_id, true);
        },
        set_widget_visibility(state: IDashboardPageState, w_id: number) {
            Vue.set(state.widgets_invisibility, w_id, false);
        },

        set_custom_filters(state: IDashboardPageState, custom_filters: string[]) {
            state.custom_filters = custom_filters;
        },

        set_active_api_type_ids(state: IDashboardPageState, active_api_type_ids: string[]) {
            state.active_api_type_ids = active_api_type_ids;
        },

        set_query_api_type_ids(state: IDashboardPageState, query_api_type_ids: string[]) {
            state.query_api_type_ids = query_api_type_ids;
        },

        set_page_history(state: IDashboardPageState, page_history: DashboardPageVO[]) {
            state.page_history = page_history;
        },

        add_page_history(state: IDashboardPageState, page_history: DashboardPageVO) {
            state.page_history.push(page_history);
        },

        pop_page_history(state: IDashboardPageState, fk) {
            state.page_history.pop();
        },

        set_Dashboardcopywidgetcomponent(state: IDashboardPageState, Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) {
            state.Dashboardcopywidgetcomponent = Dashboardcopywidgetcomponent;
        },

        set_active_field_filters(state: IDashboardPageState, active_field_filters: FieldFiltersVO) {
            state.active_field_filters = active_field_filters;
        },

        set_active_field_filter(state: IDashboardPageState, param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
            if (!param.vo_type || !param.field_id) {
                return;
            }

            if (!state.active_field_filters[param.vo_type]) {
                Vue.set(state.active_field_filters, param.vo_type, {
                    [param.field_id]: param.active_field_filter
                });
                return;
            }

            if (ObjectHandler.are_equal(state.active_field_filters[param.vo_type][param.field_id], param.active_field_filter)) {
                return;
            }

            Vue.set(state.active_field_filters[param.vo_type], param.field_id, param.active_field_filter);
        },

        remove_active_field_filter(state: IDashboardPageState, params: { vo_type: string, field_id: string }) {

            if (!state.active_field_filters[params.vo_type]) {
                return;
            }

            Vue.set(state.active_field_filters[params.vo_type], params.field_id, null);
        },

        clear_active_field_filters(state: IDashboardPageState, empty) {

            state.active_field_filters = {};
        },

        set_page_widgets(state: IDashboardPageState, page_widgets: DashboardPageWidgetVO[]) {
            state.page_widgets = page_widgets;
        },

        set_dashboard_navigation_history(
            state: IDashboardPageState,
            dashboard_navigation_history: { current_dashboard_id: number, previous_dashboard_id: number }
        ) {
            state.dashboard_navigation_history = dashboard_navigation_history;
        },

        set_shared_filters_map(state: IDashboardPageState, shared_filters_map: SharedFiltersVO[]) {
            state.shared_filters_map = shared_filters_map;
        },

        add_shared_filters_to_map(state: IDashboardPageState, shared_filters_map: SharedFiltersVO[]) {
            let _shared_filters_map = state.shared_filters_map;

            if (_shared_filters_map?.length > 0) {
                _shared_filters_map = _shared_filters_map.concat(shared_filters_map);
            } else {
                _shared_filters_map = shared_filters_map;
            }

            // Add shared filters to map
            // Remove duplicates
            state.shared_filters_map = _shared_filters_map.reduce((accumulator, shared_filter) => {
                if (!accumulator.find((sf) => sf.id == shared_filter.id)) {
                    accumulator.push(shared_filter);
                }

                return accumulator;
            }, []);
        },
    };

    public actions: ActionTree<IDashboardPageState, DashboardPageContext>;
    public namespaced: boolean = true;

    public constructor() {
        this.module_name = "DashboardPageStore";


        this.state = {
            selected_onglet: DashboardBuilderVueController.DBB_ONGLET_TABLE, // Dans un DBB, permet de switcher d'onglet
            crud_vo: null, // VO used for CRUD operations (read, create, update) in the dashboard / used by template widgets
            dashboard_page: null, // Current dashboard page
            dashboard_id: null, // Dashboard id of the current dashboard
            selected_page_page_widgets: [], // DashboardPageWidgetVO[] - Page widgets of the currently selected page
            dashboard: null,
            selected_widget: null,
            page_widgets: [],
            page_widgets_components_by_pwid: {},
            active_field_filters: {},
            Checklistitemmodalcomponent: null,
            Supervisionitemmodal: null,
            Favoritesfiltersmodalcomponent: null,
            Sharedfiltersmodalcomponent: null,
            Crudupdatemodalcomponent: null,
            Crudcreatemodalcomponent: null,
            Dashboardcopywidgetcomponent: null,
            dashboard_navigation_history: { current_dashboard_id: null, previous_dashboard_id: null },
            page_history: [],
            custom_filters: [],
            active_api_type_ids: [],
            query_api_type_ids: [],
            shared_filters_map: [],
            widgets_invisibility: {},
            dashboard_api_type_ids: [],
            discarded_field_paths: {},
            db_graph_vo_refs: [], // DashboardGraphVORefVO[]
            dashboard_pages: [], // DashboardPageVO[]
            callback_for_set_selected_widget: null, // (page_widget: DashboardPageWidgetVO) => void
            all_widgets: [], // DashboardWidgetVO[]
            viewports: [], // DashboardViewportVO[]
            dashboard_current_viewport: null, // DashboardViewportVO
            dashboard_valid_viewports: [], // DashboardViewportVO[]
            dashboard_viewport_page_widgets: [], // DashboardViewportPageWidgetVO[]
            dbb_confs: [], // DBBConfVO[]
            user_valid_dbb_confs: [], // DBBConfVO[]
        };


        this.getters = getters;

        this.actions = actions;
    }
}
const storeInstance = new DashboardPageStore();
