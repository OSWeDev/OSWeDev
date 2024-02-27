import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from "../../../store/IStoreModule";
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type DroppableVosContext = ActionContext<IDroppableVosState, any>;

export interface IDroppableVosState {
    selected_vos: { [api_type_id: string]: boolean };
    filter_by_api_type_id: string;
}

export default class DroppableVosStore implements IStoreModule<IDroppableVosState, DroppableVosContext> {

    // istanbul ignore next: nothing to test
    public static getInstance(): DroppableVosStore {
        if (!DroppableVosStore.instance) {
            DroppableVosStore.instance = new DroppableVosStore();
        }
        return DroppableVosStore.instance;
    }

    private static instance: DroppableVosStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDroppableVosState, DroppableVosContext>;
    public mutations = {
        set_selected_vos(state: IDroppableVosState, selected_vos: { [api_type_id: string]: boolean }) {
            state.selected_vos = selected_vos;
        },

        set_filter_by_api_type_id(state: IDroppableVosState, filter_by_api_type_id: string) {
            state.filter_by_api_type_id = filter_by_api_type_id;
        },

        switch_selected_field(state: IDroppableVosState, api_type_id: string) {
            if (!api_type_id) {
                return;
            }
            state.selected_vos[api_type_id] = !state.selected_vos[api_type_id];
        },
    };

    public actions: ActionTree<IDroppableVosState, DroppableVosContext>;
    public namespaced: boolean = true;

    protected constructor() {
        const self = this;
        this.module_name = "DroppableVosStore";


        this.state = {
            selected_vos: {},
            filter_by_api_type_id: null
        };


        this.getters = {
            get_selected_vos(state: IDroppableVosState): { [api_type_id: string]: boolean } {
                return state.selected_vos;
            },
            get_filter_by_api_type_id(state: IDroppableVosState): string {
                return state.filter_by_api_type_id;
            },
        };

        this.actions = {
            set_selected_vos: (context: DroppableVosContext, selected_vos: { [api_type_id: string]: boolean }) => context.commit(store_mutations_names(this).set_selected_vos, selected_vos),
            set_filter_by_api_type_id: (context: DroppableVosContext, filter_by_api_type_id: string) => context.commit(store_mutations_names(this).set_filter_by_api_type_id, filter_by_api_type_id),
            switch_selected_field: (context: DroppableVosContext, api_type_id: string) => context.commit(store_mutations_names(this).switch_selected_field, api_type_id),
        };
    }
}

export const DroppableVosStoreInstance = DroppableVosStore.getInstance();

const { commit, read, dispatch } =
    getStoreAccessors<IDroppableVosState, any>("DroppableVosStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDroppableVosGetter = namespace('DroppableVosStore', Getter);
export const ModuleDroppableVosAction = namespace('DroppableVosStore', Action);