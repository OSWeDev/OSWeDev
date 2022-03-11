import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import ISupervisedItem from "../../../../../shared/modules/Supervision/interfaces/ISupervisedItem";
import SupervisedCategoryVO from "../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO";
import IStoreModule from '../../../store/IStoreModule';

export type SupervisionContext = ActionContext<ISupervisionState, any>;

export interface ISupervisionState {
    show_errors: boolean;
    show_errors_read: boolean;
    show_warns: boolean;
    show_warns_read: boolean;
    show_oks: boolean;
    show_pauseds: boolean;
    show_unknowns: boolean;
    selected_item: ISupervisedItem;
    categorys: SupervisedCategoryVO[];
    selected_category: SupervisedCategoryVO;
    api_type_ids: string[];
    selected_api_type_id: string;
    dashboard_key: string;
    filter_text_lower_case: string;
    api_type_ids_by_category_ids: { [id: number]: string[] };
}

export default class SupervisionDashboardStore implements IStoreModule<ISupervisionState, SupervisionContext> {

    public static getInstance(): SupervisionDashboardStore {
        if (!SupervisionDashboardStore.instance) {
            SupervisionDashboardStore.instance = new SupervisionDashboardStore();
        }
        return SupervisionDashboardStore.instance;
    }

    private static instance: SupervisionDashboardStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<ISupervisionState, SupervisionContext>;
    public mutations: MutationTree<ISupervisionState>;
    public actions: ActionTree<ISupervisionState, SupervisionContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "SupervisionDashboardStore";


        this.state = {
            show_errors: true,
            show_errors_read: false,
            show_warns: true,
            show_warns_read: false,
            show_oks: false,
            show_pauseds: false,
            show_unknowns: false,
            selected_item: null,
            categorys: null,
            selected_category: null,
            api_type_ids: null,
            selected_api_type_id: null,
            dashboard_key: null,
            filter_text_lower_case: null,
            api_type_ids_by_category_ids: null,
        };


        this.getters = {
            get_show_errors: (state: ISupervisionState): boolean => state.show_errors,
            get_show_errors_read: (state: ISupervisionState): boolean => state.show_errors_read,
            get_show_warns: (state: ISupervisionState): boolean => state.show_warns,
            get_show_warns_read: (state: ISupervisionState): boolean => state.show_warns_read,
            get_show_oks: (state: ISupervisionState): boolean => state.show_oks,
            get_show_pauseds: (state: ISupervisionState): boolean => state.show_pauseds,
            get_show_unknowns: (state: ISupervisionState): boolean => state.show_unknowns,
            get_selected_item: (state: ISupervisionState): ISupervisedItem => state.selected_item,
            get_categorys: (state: ISupervisionState): SupervisedCategoryVO[] => state.categorys,
            get_selected_category: (state: ISupervisionState): SupervisedCategoryVO => state.selected_category,
            get_api_type_ids: (state: ISupervisionState): string[] => state.api_type_ids,
            get_selected_api_type_id: (state: ISupervisionState): string => state.selected_api_type_id,
            get_dashboard_key: (state: ISupervisionState): string => state.dashboard_key,
            get_filter_text_lower_case: (state: ISupervisionState): string => state.filter_text_lower_case,
            get_api_type_ids_by_category_ids: (state: ISupervisionState): { [id: number]: string[] } => state.api_type_ids_by_category_ids,
        };

        this.mutations = {
            switch_show_errors: (state: ISupervisionState): any => {
                state.show_errors = !state.show_errors;
            },
            switch_show_errors_read: (state: ISupervisionState): any => {
                state.show_errors_read = !state.show_errors_read;
            },
            switch_show_warns: (state: ISupervisionState): any => {
                state.show_warns = !state.show_warns;
            },
            switch_show_warns_read: (state: ISupervisionState): any => {
                state.show_warns_read = !state.show_warns_read;
            },
            switch_show_oks: (state: ISupervisionState): any => {
                state.show_oks = !state.show_oks;
            },
            switch_show_pauseds: (state: ISupervisionState): any => {
                state.show_pauseds = !state.show_pauseds;
            },
            switch_show_unknowns: (state: ISupervisionState): any => {
                state.show_unknowns = !state.show_unknowns;
            },
            set_selected_item: (state: ISupervisionState, selected_item: ISupervisedItem): any => state.selected_item = selected_item,
            set_categorys: (state: ISupervisionState, categorys: SupervisedCategoryVO[]): any => state.categorys = categorys,
            set_selected_category: (state: ISupervisionState, selected_category: SupervisedCategoryVO): any => state.selected_category = selected_category,
            set_api_type_ids: (state: ISupervisionState, api_type_ids: string[]): any => state.api_type_ids = api_type_ids,
            set_selected_api_type_id: (state: ISupervisionState, selected_api_type_id: string): any => state.selected_api_type_id = selected_api_type_id,
            set_dashboard_key: (state: ISupervisionState, dashboard_key: string): any => state.dashboard_key = dashboard_key,
            set_filter_text_lower_case: (state: ISupervisionState, filter_text_lower_case: string): any => state.filter_text_lower_case = filter_text_lower_case,
            set_api_type_ids_by_category_ids: (state: ISupervisionState, api_type_ids_by_category_ids: { [id: number]: string[] }): any => state.api_type_ids_by_category_ids = api_type_ids_by_category_ids,
        };



        this.actions = {
            switch_show_errors: (context: SupervisionContext): any => commit_switch_show_errors(context, null),
            switch_show_errors_read: (context: SupervisionContext): any => commit_switch_show_errors_read(context, null),
            switch_show_warns: (context: SupervisionContext): any => commit_switch_show_warns(context, null),
            switch_show_warns_read: (context: SupervisionContext): any => commit_switch_show_warns_read(context, null),
            switch_show_oks: (context: SupervisionContext): any => commit_switch_show_oks(context, null),
            switch_show_pauseds: (context: SupervisionContext): any => commit_switch_show_pauseds(context, null),
            switch_show_unknowns: (context: SupervisionContext): any => commit_switch_show_unknowns(context, null),
            set_selected_item: (context: SupervisionContext, selected_item: ISupervisedItem): any => commit_set_selected_item(context, selected_item),
            set_categorys: (context: SupervisionContext, categorys: SupervisedCategoryVO[]): any => commit_set_categorys(context, categorys),
            set_selected_category: (context: SupervisionContext, selected_category: SupervisedCategoryVO): any => commit_set_selected_category(context, selected_category),
            set_api_type_ids: (context: SupervisionContext, api_type_ids: string[]): any => commit_set_api_type_ids(context, api_type_ids),
            set_selected_api_type_id: (context: SupervisionContext, selected_api_type_id: string): any => commit_set_selected_api_type_id(context, selected_api_type_id),
            set_dashboard_key: (context: SupervisionContext, dashboard_key: string): any => commit_set_dashboard_key(context, dashboard_key),
            set_filter_text_lower_case: (context: SupervisionContext, filter_text_lower_case: string): any => commit_set_filter_text_lower_case(context, filter_text_lower_case),
            set_api_type_ids_by_category_ids: (context: SupervisionContext, api_type_ids_by_category_ids: { [id: number]: string[] }): any => commit_set_api_type_ids_by_category_ids(context, api_type_ids_by_category_ids),
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<ISupervisionState, any>("SupervisionDashboardStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleSupervisionGetter = namespace('SupervisionDashboardStore', Getter);
export const ModuleSupervisionAction = namespace('SupervisionDashboardStore', Action);

export const commit_switch_show_errors = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_errors);
export const commit_switch_show_errors_read = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_errors_read);
export const commit_switch_show_warns = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_warns);
export const commit_switch_show_warns_read = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_warns_read);
export const commit_switch_show_oks = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_oks);
export const commit_switch_show_pauseds = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_pauseds);
export const commit_switch_show_unknowns = commit(SupervisionDashboardStore.getInstance().mutations.switch_show_unknowns);
export const commit_set_selected_item = commit(SupervisionDashboardStore.getInstance().mutations.set_selected_item);
export const commit_set_categorys = commit(SupervisionDashboardStore.getInstance().mutations.set_categorys);
export const commit_set_selected_category = commit(SupervisionDashboardStore.getInstance().mutations.set_selected_category);
export const commit_set_api_type_ids = commit(SupervisionDashboardStore.getInstance().mutations.set_api_type_ids);
export const commit_set_selected_api_type_id = commit(SupervisionDashboardStore.getInstance().mutations.set_selected_api_type_id);
export const commit_set_dashboard_key = commit(SupervisionDashboardStore.getInstance().mutations.set_dashboard_key);
export const commit_set_filter_text_lower_case = commit(SupervisionDashboardStore.getInstance().mutations.set_filter_text_lower_case);
export const commit_set_api_type_ids_by_category_ids = commit(SupervisionDashboardStore.getInstance().mutations.set_api_type_ids_by_category_ids);
