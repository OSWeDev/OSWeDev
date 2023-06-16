import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import ContextFilterVO from "../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import DashboardPageWidgetVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import IStoreModule from "../../../store/IStoreModule";
import CRUDCreateModalComponent from "../widgets/table_widget/crud_modals/create/CRUDCreateModalComponent";
import CRUDUpdateModalComponent from "../widgets/table_widget/crud_modals/update/CRUDUpdateModalComponent";

import DashboardPageVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO";
import { store_mutations_names } from '../../../store/StoreModuleBase';
import VueComponentBase from "../../VueComponentBase";
import DashboardCopyWidgetComponent from "../copy_widget/DashboardCopyWidgetComponent";
import ChecklistItemModalComponent from "../widgets/checklist_widget/checklist_item_modal/ChecklistItemModalComponent";
import SaveFavoritesFiltersModalComponent from "../widgets/save_favorites_filters_widget/modal/SaveFavoritesFiltersModalComponent";
import SupervisionItemModalComponent from "../widgets/supervision_widget/supervision_item_modal/SupervisionItemModalComponent";

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

    active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

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
    public mutations = {
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



        set_active_field_filters(state: IDashboardPageState, active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }) {
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
    public actions: ActionTree<IDashboardPageState, DashboardPageContext>;
    public namespaced: boolean = true;

    protected constructor() {
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

            get_active_field_filters(state: IDashboardPageState): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {
                return state.active_field_filters;
            },
        };

        this.actions = {
            set_page_widgets_components_by_pwid: (context: DashboardPageContext, page_widgets_components_by_pwid: { [pwid: number]: VueComponentBase }) => context.commit(store_mutations_names(this).set_page_widgets_components_by_pwid, page_widgets_components_by_pwid),
            set_discarded_field_paths: (context: DashboardPageContext, discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) => context.commit(store_mutations_names(this).set_discarded_field_paths, discarded_field_paths),
            set_widget_invisibility: (context: DashboardPageContext, w_id: number) => context.commit(store_mutations_names(this).set_widget_invisibility, w_id),
            set_widget_visibility: (context: DashboardPageContext, w_id: number) => context.commit(store_mutations_names(this).set_widget_visibility, w_id),
            set_widgets_invisibility: (context: DashboardPageContext, widgets_invisibility: { [w_id: number]: boolean }) => context.commit(store_mutations_names(this).set_widgets_invisibility, widgets_invisibility),
            set_custom_filters: (context: DashboardPageContext, custom_filters: string[]) => context.commit(store_mutations_names(this).set_custom_filters, custom_filters),
            set_active_api_type_ids: (context: DashboardPageContext, active_api_type_ids: string[]) => context.commit(store_mutations_names(this).set_active_api_type_ids, active_api_type_ids),
            set_query_api_type_ids: (context: DashboardPageContext, query_api_type_ids: string[]) => context.commit(store_mutations_names(this).set_query_api_type_ids, query_api_type_ids),
            set_page_history: (context: DashboardPageContext, page_history: DashboardPageVO[]) => context.commit(store_mutations_names(this).set_page_history, page_history),
            add_page_history: (context: DashboardPageContext, page_history: DashboardPageVO) => context.commit(store_mutations_names(this).add_page_history, page_history),
            pop_page_history: (context: DashboardPageContext, fk) => context.commit(store_mutations_names(this).pop_page_history, null),
            set_Savefavoritesfiltersmodalcomponent: (context: DashboardPageContext, Savefavoritesfiltersmodalcomponent: SaveFavoritesFiltersModalComponent) => context.commit(store_mutations_names(this).set_Savefavoritesfiltersmodalcomponent, Savefavoritesfiltersmodalcomponent),
            set_Crudupdatemodalcomponent: (context: DashboardPageContext, Crudupdatemodalcomponent: CRUDUpdateModalComponent) => context.commit(store_mutations_names(this).set_Crudupdatemodalcomponent, Crudupdatemodalcomponent),
            set_Checklistitemmodalcomponent: (context: DashboardPageContext, Checklistitemmodalcomponent: ChecklistItemModalComponent) => context.commit(store_mutations_names(this).set_Checklistitemmodalcomponent, Checklistitemmodalcomponent),
            set_Supervisionitemmodal: (context: DashboardPageContext, Supervisionitemmodal: SupervisionItemModalComponent) => context.commit(store_mutations_names(this).set_Supervisionitemmodal, Supervisionitemmodal),
            set_Crudcreatemodalcomponent: (context: DashboardPageContext, Crudcreatemodalcomponent: CRUDCreateModalComponent) => context.commit(store_mutations_names(this).set_Crudcreatemodalcomponent, Crudcreatemodalcomponent),
            set_Dashboardcopywidgetcomponent: (context: DashboardPageContext, Dashboardcopywidgetcomponent: DashboardCopyWidgetComponent) => context.commit(store_mutations_names(this).set_Dashboardcopywidgetcomponent, Dashboardcopywidgetcomponent),
            set_active_field_filters: (context: DashboardPageContext, active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }) => context.commit(store_mutations_names(this).set_active_field_filters, active_field_filters),
            set_active_field_filter: (context: DashboardPageContext, param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => context.commit(store_mutations_names(this).set_active_field_filter, param),
            remove_active_field_filter: (context: DashboardPageContext, params: { vo_type: string, field_id: string }) => context.commit(store_mutations_names(this).remove_active_field_filter, params),
            clear_active_field_filters: (context: DashboardPageContext, empty) => context.commit(store_mutations_names(this).clear_active_field_filters, empty),
            set_page_widgets: (context: DashboardPageContext, page_widgets: DashboardPageWidgetVO[]) => context.commit(store_mutations_names(this).set_page_widgets, page_widgets),
            set_page_widget: (context: DashboardPageContext, page_widget: DashboardPageWidgetVO) => context.commit(store_mutations_names(this).set_page_widget, page_widget),
            delete_page_widget: (context: DashboardPageContext, page_widget: DashboardPageWidgetVO) => context.commit(store_mutations_names(this).delete_page_widget, page_widget),
            remove_page_widgets_components_by_pwid: (context: DashboardPageContext, pwid: number) => context.commit(store_mutations_names(this).remove_page_widgets_components_by_pwid, pwid),
            set_page_widget_component_by_pwid: (context: DashboardPageContext, param: { pwid: number, page_widget_component: VueComponentBase }) => context.commit(store_mutations_names(this).set_page_widget_component_by_pwid, param),
        };
    }
}

export const DashboardPageStoreInstance = DashboardPageStore.getInstance();

export const ModuleDashboardPageGetter = namespace('DashboardPageStore', Getter);
export const ModuleDashboardPageAction = namespace('DashboardPageStore', Action);