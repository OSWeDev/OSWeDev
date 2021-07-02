import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from "../../../store/IStoreModule";

export type DroppableVoFieldsContext = ActionContext<IDroppableVoFieldsState, any>;

export interface IDroppableVoFieldsState {
    selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } };
    filter_by_field_id_or_api_type_id: string;
}

export default class DroppableVoFieldsStore implements IStoreModule<IDroppableVoFieldsState, DroppableVoFieldsContext> {

    public static getInstance(): DroppableVoFieldsStore {
        if (!DroppableVoFieldsStore.instance) {
            DroppableVoFieldsStore.instance = new DroppableVoFieldsStore();
        }
        return DroppableVoFieldsStore.instance;
    }

    private static instance: DroppableVoFieldsStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDroppableVoFieldsState, DroppableVoFieldsContext>;
    public mutations: MutationTree<IDroppableVoFieldsState>;
    public actions: ActionTree<IDroppableVoFieldsState, DroppableVoFieldsContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "DroppableVoFieldsStore";


        this.state = {
            selected_fields: {},
            filter_by_field_id_or_api_type_id: null
        };


        this.getters = {
            get_selected_fields(state: IDroppableVoFieldsState): { [api_type_id: string]: { [field_id: string]: boolean } } {
                return state.selected_fields;
            },
            get_filter_by_field_id_or_api_type_id(state: IDroppableVoFieldsState): string {
                return state.filter_by_field_id_or_api_type_id;
            },
        };



        this.mutations = {
            set_selected_fields(state: IDroppableVoFieldsState, selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) {
                state.selected_fields = selected_fields;
            },

            set_filter_by_field_id_or_api_type_id(state: IDroppableVoFieldsState, filter_by_field_id_or_api_type_id: string) {
                state.filter_by_field_id_or_api_type_id = filter_by_field_id_or_api_type_id;
            },

            switch_selected_field(state: IDroppableVoFieldsState, infos: { api_type_id: string, field_id: string }) {
                if ((!infos) || (!infos.api_type_id) || (!infos.field_id) || (!state.selected_fields[infos.api_type_id])) {
                    return;
                }
                state.selected_fields[infos.api_type_id][infos.field_id] = !state.selected_fields[infos.api_type_id][infos.field_id];
            },
        };



        this.actions = {
            set_selected_fields(context: DroppableVoFieldsContext, selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) {
                commit_set_selected_fields(context, selected_fields);
            },
            set_filter_by_field_id_or_api_type_id(context: DroppableVoFieldsContext, filter_by_field_id_or_api_type_id: string) {
                commit_set_filter_by_field_id_or_api_type_id(context, filter_by_field_id_or_api_type_id);
            },
            switch_selected_field(context: DroppableVoFieldsContext, infos: { api_type_id: string, field_id: string }) {
                commit_switch_selected_field(context, infos);
            }
        };
    }
}

export const DroppableVoFieldsStoreInstance = DroppableVoFieldsStore.getInstance();

const { commit, read, dispatch } =
    getStoreAccessors<IDroppableVoFieldsState, any>("DroppableVoFieldsStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDroppableVoFieldsGetter = namespace('DroppableVoFieldsStore', Getter);
export const ModuleDroppableVoFieldsAction = namespace('DroppableVoFieldsStore', Action);

export const commit_set_selected_fields = commit(DroppableVoFieldsStoreInstance.mutations.set_selected_fields);
export const commit_switch_selected_field = commit(DroppableVoFieldsStoreInstance.mutations.switch_selected_field);
export const commit_set_filter_by_field_id_or_api_type_id = commit(DroppableVoFieldsStoreInstance.mutations.set_filter_by_field_id_or_api_type_id);