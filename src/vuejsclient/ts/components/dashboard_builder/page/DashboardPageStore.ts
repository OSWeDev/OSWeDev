import Vue from "vue";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import DashboardPageWidgetVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import IStoreModule from "../../../store/IStoreModule";
import ContextFilterVO from "../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import CRUDUpdateModalComponent from "../widgets/table_widget/crud_modals/update/CRUDUpdateModalComponent";
import CRUDCreateModalComponent from "../widgets/table_widget/crud_modals/create/CRUDCreateModalComponent";

import DashboardPageVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import ChecklistItemModalComponent from "../widgets/checklist_widget/checklist_item_modal/ChecklistItemModalComponent";
import VueComponentBase from "../../VueComponentBase";
import DashboardCopyWidgetComponent from "../copy_widget/DashboardCopyWidgetComponent";
import SupervisionItemModalComponent from "../widgets/supervision_widget/supervision_item_modal/SupervisionItemModalComponent";
import SaveFavoritesFiltersModalComponent from "../widgets/save_favorites_filters_widget/modal/SaveFavoritesFiltersModalComponent";
import FieldFiltersVO from "../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";

export type DashboardPageContext = ActionContext<IDashboardPageState, any>;

export interface IDashboardPageState {
    /**
     * Stock tous les widgets du dashboard
     */
    page_widgets: DashboardPageWidgetVO[];

    /**
     * Stock tous les composants du dashboard
     */
    page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase };

    active_field_filters: FieldFiltersVO;

    Savefavoritesfiltersmodalcomponent: SaveFavoritesFiltersModalComponent;
    Checklistitemmodalcomponent: ChecklistItemModalComponent;
    Supervisionitemmodal: SupervisionItemModalComponent;
    Crudupdatemodalcomponent: CRUDUpdateModalComponent;
    Crudcreatemodalcomponent: CRUDCreateModalComponent;
    Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent;


    page_history: DashboardPageVO[];

    custom_filters: string[];
    active_api_type_ids: string[]; // Setted on user selection (select option) to specify query on specified vos api ids
    query_api_type_ids: string[]; // Setted from widget options to have custom|default query on specified vos api ids

    widgets_invisibility: { [w_id: number]: boolean };

    discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };
}

export default class DashboardPageStore implements IStoreModule<IDashboardPageState, DashboardPageContext> {

    public static getInstance(): DashboardPageStore {
        if (!DashboardPageStore.instance) {
            DashboardPageStore.instance = new DashboardPageStore();
        }
        return DashboardPageStore.instance;
    }

    private static instance: DashboardPageStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDashboardPageState, DashboardPageContext>;
    public mutations: MutationTree<IDashboardPageState>;
    public actions: ActionTree<IDashboardPageState, DashboardPageContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "DashboardPageStore";


        this.state = {
            page_widgets: [],
            page_widgets_components_by_pwid: {},
            active_field_filters: {},
            Checklistitemmodalcomponent: null,
            Supervisionitemmodal: null,
            Savefavoritesfiltersmodalcomponent: null,
            Crudupdatemodalcomponent: null,
            Crudcreatemodalcomponent: null,
            Dashboardcopywidgetcomponent: null,
            page_history: [],
            custom_filters: [],
            active_api_type_ids: [],
            query_api_type_ids: [],
            widgets_invisibility: {},
            discarded_field_paths: {}
        };


        this.getters = {

            get_page_widgets_components_by_pwid(state: IDashboardPageState): { [pwid: number]: VueComponentBase } {
                return state.page_widgets_components_by_pwid;
            },

            get_discarded_field_paths(state: IDashboardPageState): { [vo_type: string]: { [field_id: string]: boolean } } {
                return state.discarded_field_paths;
            },

            get_custom_filters(state: IDashboardPageState): string[] {
                return state.custom_filters;
            },

            get_active_api_type_ids(state: IDashboardPageState): string[] {
                return state.active_api_type_ids;
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

            get_Checklistitemmodalcomponent(state: IDashboardPageState): ChecklistItemModalComponent {
                return state.Checklistitemmodalcomponent;
            },

            get_Supervisionitemmodal(state: IDashboardPageState): SupervisionItemModalComponent {
                return state.Supervisionitemmodal;
            },

            get_Savefavoritesfiltersmodalcomponent(state: IDashboardPageState): SaveFavoritesFiltersModalComponent {
                return state.Savefavoritesfiltersmodalcomponent;
            },

            get_Crudupdatemodalcomponent(state: IDashboardPageState): CRUDUpdateModalComponent {
                return state.Crudupdatemodalcomponent;
            },

            get_Crudcreatemodalcomponent(state: IDashboardPageState): CRUDCreateModalComponent {
                return state.Crudcreatemodalcomponent;
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
        };



        this.mutations = {
            set_page_widgets_components_by_pwid(state: IDashboardPageState, page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) {
                state.page_widgets_components_by_pwid = page_widgets_components_by_pwid;
            },
            remove_page_widgets_components_by_pwid(state: IDashboardPageState, pwid: number) {
                delete state.page_widgets_components_by_pwid[pwid];
            },
            set_page_widget_component_by_pwid(state: IDashboardPageState, param: { pwid: number, page_widget_component: VueComponentBase }) {
                Vue.set(state.page_widgets_components_by_pwid, param.pwid, param.page_widget_component);
            },

            set_discarded_field_paths(state: IDashboardPageState, discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
                state.discarded_field_paths = discarded_field_paths;
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

            set_Checklistitemmodalcomponent(state: IDashboardPageState, Checklistitemmodalcomponent: ChecklistItemModalComponent) {
                state.Checklistitemmodalcomponent = Checklistitemmodalcomponent;
            },

            set_Supervisionitemmodal(state: IDashboardPageState, Supervisionitemmodal: SupervisionItemModalComponent) {
                state.Supervisionitemmodal = Supervisionitemmodal;
            },

            set_Savefavoritesfiltersmodalcomponent(state: IDashboardPageState, Savefavoritesfiltersmodalcomponent: SaveFavoritesFiltersModalComponent) {
                state.Savefavoritesfiltersmodalcomponent = Savefavoritesfiltersmodalcomponent;
            },

            set_Crudupdatemodalcomponent(state: IDashboardPageState, Crudupdatemodalcomponent: CRUDUpdateModalComponent) {
                state.Crudupdatemodalcomponent = Crudupdatemodalcomponent;
            },

            set_Crudcreatemodalcomponent(state: IDashboardPageState, Crudcreatemodalcomponent: CRUDCreateModalComponent) {
                state.Crudcreatemodalcomponent = Crudcreatemodalcomponent;
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

            set_page_widget(state: IDashboardPageState, page_widget: DashboardPageWidgetVO) {
                let store_i = null;

                for (let i in state.page_widgets) {
                    let pw = state.page_widgets[i];

                    if (pw.id == page_widget.id) {
                        store_i = i;
                        break;
                    }
                }

                if (store_i === null) {
                    state.page_widgets.push(page_widget);
                    return;
                }

                Vue.set(state.page_widgets, store_i, page_widget);
            },

            delete_page_widget(state: IDashboardPageState, page_widget: DashboardPageWidgetVO) {
                let store_i = null;

                for (let i in state.page_widgets) {
                    let pw = state.page_widgets[i];

                    if (pw.id == page_widget.id) {
                        store_i = i;
                        break;
                    }
                }

                if (store_i === null) {
                    return;
                }

                state.page_widgets.splice(store_i, 1);
            },
        };



        this.actions = {
            set_page_widgets_components_by_pwid(context: DashboardPageContext, page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) {
                commit_set_page_widgets_components_by_pwid(context, page_widgets_components_by_pwid);
            },

            set_discarded_field_paths(context: DashboardPageContext, discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
                commit_set_discarded_field_paths(context, discarded_field_paths);
            },
            set_widget_invisibility(context: DashboardPageContext, w_id: number) {
                commit_set_widget_invisibility(context, w_id);
            },
            set_widget_visibility(context: DashboardPageContext, w_id: number) {
                commit_set_widget_visibility(context, w_id);
            },
            set_widgets_invisibility(context: DashboardPageContext, widgets_invisibility: { [w_id: number]: boolean }) {
                commit_set_widgets_invisibility(context, widgets_invisibility);
            },
            set_custom_filters(context: DashboardPageContext, custom_filters: string[]) {
                commit_set_custom_filters(context, custom_filters);
            },
            set_active_api_type_ids(context: DashboardPageContext, active_api_type_ids: string[]) {
                commit_set_active_api_type_ids(context, active_api_type_ids);
            },
            set_query_api_type_ids(context: DashboardPageContext, query_api_type_ids: string[]) {
                commit_set_query_api_type_ids(context, query_api_type_ids);
            },
            set_page_history(context: DashboardPageContext, page_history: DashboardPageVO[]) {
                commit_set_page_history(context, page_history);
            },
            add_page_history(context: DashboardPageContext, page_history: DashboardPageVO) {
                commit_add_page_history(context, page_history);
            },
            pop_page_history(context: DashboardPageContext, fk) {
                commit_pop_page_history(context, null);
            },
            set_Savefavoritesfiltersmodalcomponent(context: DashboardPageContext, Savefavoritesfiltersmodalcomponent: SaveFavoritesFiltersModalComponent) {
                commit_set_Savefavoritesfiltersmodalcomponent(context, Savefavoritesfiltersmodalcomponent);
            },
            set_Crudupdatemodalcomponent(context: DashboardPageContext, Crudupdatemodalcomponent: CRUDUpdateModalComponent) {
                commit_set_Crudupdatemodalcomponent(context, Crudupdatemodalcomponent);
            },
            set_Checklistitemmodalcomponent(context: DashboardPageContext, Checklistitemmodalcomponent: ChecklistItemModalComponent) {
                commit_set_Checklistitemmodalcomponent(context, Checklistitemmodalcomponent);
            },
            set_Supervisionitemmodal(context: DashboardPageContext, Supervisionitemmodal: SupervisionItemModalComponent) {
                commit_set_Supervisionitemmodal(context, Supervisionitemmodal);
            },

            set_Crudcreatemodalcomponent(context: DashboardPageContext, Crudcreatemodalcomponent: CRUDCreateModalComponent) {
                commit_set_Crudcreatemodalcomponent(context, Crudcreatemodalcomponent);
            },

            set_Dashboardcopywidgetcomponent(context: DashboardPageContext, Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) {
                commit_set_Dashboardcopywidgetcomponent(context, Dashboardcopywidgetcomponent);
            },

            set_active_field_filters(context: DashboardPageContext, active_field_filters: FieldFiltersVO) {
                commit_set_active_field_filters(context, active_field_filters);
            },

            set_active_field_filter(context: DashboardPageContext, param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
                commit_set_active_field_filter(context, param);
            },

            remove_active_field_filter(context: DashboardPageContext, params: { vo_type: string, field_id: string }) {
                commit_remove_active_field_filter(context, params);
            },

            clear_active_field_filters(context: DashboardPageContext, empty) {
                commit_clear_active_field_filters(context, empty);
            },

            set_page_widgets(context: DashboardPageContext, page_widgets: DashboardPageWidgetVO[]) {
                commit_set_page_widgets(context, page_widgets);
            },

            set_page_widget(context: DashboardPageContext, page_widget: DashboardPageWidgetVO) {
                commit_set_page_widget(context, page_widget);
            },

            delete_page_widget(context: DashboardPageContext, page_widget: DashboardPageWidgetVO) {
                commit_delete_page_widget(context, page_widget);
            },

            remove_page_widgets_components_by_pwid(context: DashboardPageContext, pwid: number) {
                commit_remove_page_widgets_components_by_pwid(context, pwid);
            },
            set_page_widget_component_by_pwid(context: DashboardPageContext, param: { pwid: number, page_widget_component: VueComponentBase }) {
                commit_set_page_widget_component_by_pwid(context, param);
            },
        };
    }
}

export const DashboardPageStoreInstance = DashboardPageStore.getInstance();

const { commit, read, dispatch } =
    getStoreAccessors<IDashboardPageState, any>("DashboardPageStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDashboardPageGetter = namespace('DashboardPageStore', Getter);
export const ModuleDashboardPageAction = namespace('DashboardPageStore', Action);

export const commit_set_page_widgets = commit(DashboardPageStoreInstance.mutations.set_page_widgets);
export const commit_set_page_widget = commit(DashboardPageStoreInstance.mutations.set_page_widget);
export const commit_delete_page_widget = commit(DashboardPageStoreInstance.mutations.delete_page_widget);
export const commit_set_active_field_filters = commit(DashboardPageStoreInstance.mutations.set_active_field_filters);
export const commit_set_active_field_filter = commit(DashboardPageStoreInstance.mutations.set_active_field_filter);
export const commit_remove_active_field_filter = commit(DashboardPageStoreInstance.mutations.remove_active_field_filter);
export const commit_set_Checklistitemmodalcomponent = commit(DashboardPageStoreInstance.mutations.set_Checklistitemmodalcomponent);
export const commit_set_Supervisionitemmodal = commit(DashboardPageStoreInstance.mutations.set_Supervisionitemmodal);
export const commit_set_Savefavoritesfiltersmodalcomponent = commit(DashboardPageStoreInstance.mutations.set_Savefavoritesfiltersmodalcomponent);
export const commit_set_Crudupdatemodalcomponent = commit(DashboardPageStoreInstance.mutations.set_Crudupdatemodalcomponent);
export const commit_set_Crudcreatemodalcomponent = commit(DashboardPageStoreInstance.mutations.set_Crudcreatemodalcomponent);
export const commit_set_Dashboardcopywidgetcomponent = commit(DashboardPageStoreInstance.mutations.set_Dashboardcopywidgetcomponent);
export const commit_set_page_history = commit(DashboardPageStoreInstance.mutations.set_page_history);
export const commit_add_page_history = commit(DashboardPageStoreInstance.mutations.add_page_history);
export const commit_pop_page_history = commit(DashboardPageStoreInstance.mutations.pop_page_history);
export const commit_set_custom_filters = commit(DashboardPageStoreInstance.mutations.set_custom_filters);
export const commit_set_active_api_type_ids = commit(DashboardPageStoreInstance.mutations.set_active_api_type_ids);
export const commit_set_query_api_type_ids = commit(DashboardPageStoreInstance.mutations.set_query_api_type_ids);
export const commit_clear_active_field_filters = commit(DashboardPageStoreInstance.mutations.clear_active_field_filters);
export const commit_set_widgets_invisibility = commit(DashboardPageStoreInstance.mutations.set_widgets_invisibility);
export const commit_set_widget_invisibility = commit(DashboardPageStoreInstance.mutations.set_widget_invisibility);
export const commit_set_widget_visibility = commit(DashboardPageStoreInstance.mutations.set_widget_visibility);
export const commit_set_discarded_field_paths = commit(DashboardPageStoreInstance.mutations.set_discarded_field_paths);
export const commit_set_page_widgets_components_by_pwid = commit(DashboardPageStoreInstance.mutations.set_page_widgets_components_by_pwid);
export const commit_remove_page_widgets_components_by_pwid = commit(DashboardPageStoreInstance.mutations.remove_page_widgets_components_by_pwid);
export const commit_set_page_widget_component_by_pwid = commit(DashboardPageStoreInstance.mutations.set_page_widget_component_by_pwid);