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

export type DashboardPageContext = ActionContext<IDashboardPageState, any>;

export interface IDashboardPageState {
    page_widgets: DashboardPageWidgetVO[];

    active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    Crudupdatemodalcomponent: CRUDUpdateModalComponent;
    Crudcreatemodalcomponent: CRUDCreateModalComponent;

    page_history: DashboardPageVO[];
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
            active_field_filters: {},
            Crudupdatemodalcomponent: null,
            Crudcreatemodalcomponent: null,
            page_history: []
        };


        this.getters = {
            get_page_history(state: IDashboardPageState): DashboardPageVO[] {
                return state.page_history;
            },

            get_Crudupdatemodalcomponent(state: IDashboardPageState): CRUDUpdateModalComponent {
                return state.Crudupdatemodalcomponent;
            },

            get_Crudcreatemodalcomponent(state: IDashboardPageState): CRUDCreateModalComponent {
                return state.Crudcreatemodalcomponent;
            },

            get_page_widgets(state: IDashboardPageState): DashboardPageWidgetVO[] {
                return state.page_widgets;
            },

            get_active_field_filters(state: IDashboardPageState): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {
                return state.active_field_filters;
            },
        };



        this.mutations = {

            set_page_history(state: IDashboardPageState, page_history: DashboardPageVO[]) {
                state.page_history = page_history;
            },

            add_page_history(state: IDashboardPageState, page_history: DashboardPageVO) {
                state.page_history.push(page_history);
            },

            pop_page_history(state: IDashboardPageState, fk) {
                state.page_history.pop();
            },

            set_Crudupdatemodalcomponent(state: IDashboardPageState, Crudupdatemodalcomponent: CRUDUpdateModalComponent) {
                state.Crudupdatemodalcomponent = Crudupdatemodalcomponent;
            },

            set_Crudcreatemodalcomponent(state: IDashboardPageState, Crudcreatemodalcomponent: CRUDCreateModalComponent) {
                state.Crudcreatemodalcomponent = Crudcreatemodalcomponent;
            },

            set_active_field_filters(state: IDashboardPageState, active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }) {
                state.active_field_filters = active_field_filters;
            },

            set_active_field_filter(state: IDashboardPageState, active_field_filter: ContextFilterVO) {

                if (!state.active_field_filters[active_field_filter.vo_type]) {
                    Vue.set(state.active_field_filters, active_field_filter.vo_type, {
                        [active_field_filter.field_id]: active_field_filter
                    });
                    return;
                }

                Vue.set(state.active_field_filters[active_field_filter.vo_type], active_field_filter.field_id, active_field_filter);
            },

            remove_active_field_filter(state: IDashboardPageState, params: { vo_type: string, field_id: string }) {

                if (!state.active_field_filters[params.vo_type]) {
                    return;
                }

                Vue.set(state.active_field_filters[params.vo_type], params.field_id, null);
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

            set_page_history(context: DashboardPageContext, page_history: DashboardPageVO[]) {
                commit_set_page_history(context, page_history);
            },
            add_page_history(context: DashboardPageContext, page_history: DashboardPageVO) {
                commit_add_page_history(context, page_history);
            },
            pop_page_history(context: DashboardPageContext, fk) {
                commit_pop_page_history(context, null);
            },
            set_Crudupdatemodalcomponent(context: DashboardPageContext, Crudupdatemodalcomponent: CRUDUpdateModalComponent) {
                commit_set_Crudupdatemodalcomponent(context, Crudupdatemodalcomponent);
            },

            set_Crudcreatemodalcomponent(context: DashboardPageContext, Crudcreatemodalcomponent: CRUDCreateModalComponent) {
                commit_set_Crudcreatemodalcomponent(context, Crudcreatemodalcomponent);
            },

            set_active_field_filters(context: DashboardPageContext, active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }) {
                commit_set_active_field_filters(context, active_field_filters);
            },

            set_active_field_filter(context: DashboardPageContext, active_field_filter: ContextFilterVO) {
                commit_set_active_field_filter(context, active_field_filter);
            },

            remove_active_field_filter(context: DashboardPageContext, params: { vo_type: string, field_id: string }) {
                commit_remove_active_field_filter(context, params);
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
export const commit_set_Crudupdatemodalcomponent = commit(DashboardPageStoreInstance.mutations.set_Crudupdatemodalcomponent);
export const commit_set_Crudcreatemodalcomponent = commit(DashboardPageStoreInstance.mutations.set_Crudcreatemodalcomponent);
export const commit_set_page_history = commit(DashboardPageStoreInstance.mutations.set_page_history);
export const commit_add_page_history = commit(DashboardPageStoreInstance.mutations.add_page_history);
export const commit_pop_page_history = commit(DashboardPageStoreInstance.mutations.pop_page_history);