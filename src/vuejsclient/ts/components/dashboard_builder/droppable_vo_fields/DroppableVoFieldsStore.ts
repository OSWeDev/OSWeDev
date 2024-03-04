import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from "../../../store/IStoreModule";
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type DroppableVoFieldsContext = ActionContext<IDroppableVoFieldsState, any>;

export interface IDroppableVoFieldsState {
    selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } };
    filter_by_field_id_or_api_type_id: string;
}

export default class DroppableVoFieldsStore implements IStoreModule<IDroppableVoFieldsState, DroppableVoFieldsContext> {

    // istanbul ignore next: nothing to test
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
    public mutations = {
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

        this.actions = {
            set_selected_fields: (context: DroppableVoFieldsContext, selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => context.commit(store_mutations_names(this).set_selected_fields, selected_fields),
            set_filter_by_field_id_or_api_type_id: (context: DroppableVoFieldsContext, filter_by_field_id_or_api_type_id: string) => context.commit(store_mutations_names(this).set_filter_by_field_id_or_api_type_id, filter_by_field_id_or_api_type_id),
            switch_selected_field: (context: DroppableVoFieldsContext, infos: { api_type_id: string, field_id: string }) => context.commit(store_mutations_names(this).switch_selected_field, infos),
        };
    }
}

export const DroppableVoFieldsStoreInstance = DroppableVoFieldsStore.getInstance();

export const ModuleDroppableVoFieldsGetter = namespace('DroppableVoFieldsStore', Getter);
export const ModuleDroppableVoFieldsAction = namespace('DroppableVoFieldsStore', Action);