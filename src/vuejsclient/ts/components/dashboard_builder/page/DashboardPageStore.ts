import Vue from "vue";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import DashboardPageWidgetVO from "../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import IStoreModule from "../../../store/IStoreModule";

export type DashboardPageContext = ActionContext<IDashboardPageState, any>;

export interface IDashboardPageState {
    page_widgets: DashboardPageWidgetVO[];
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
            page_widgets: []
        };


        this.getters = {
            get_page_widgets(state: IDashboardPageState): DashboardPageWidgetVO[] {
                return state.page_widgets;
            },
        };



        this.mutations = {
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
