import Vue from "vue";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import DataFilterOption from "../../../../../../shared/modules/DataRender/vos/DataFilterOption";
import IStoreModule from "../../../../store/IStoreModule";

export type FieldValueFilterWidgetContext = ActionContext<IFieldValueFilterWidgetVueXState, any>;

export interface IFieldValueFilterWidgetVueXState {
    filters_active_options: { [api_type_id: string]: { [field_id: string]: DataFilterOption[] } };
}

export default class FieldValueFilterWidgetStoreModule implements IStoreModule<IFieldValueFilterWidgetVueXState, FieldValueFilterWidgetContext> {

    public static getInstance(): FieldValueFilterWidgetStoreModule {
        if (!FieldValueFilterWidgetStoreModule.instance) {
            FieldValueFilterWidgetStoreModule.instance = new FieldValueFilterWidgetStoreModule();
        }
        return FieldValueFilterWidgetStoreModule.instance;
    }

    private static instance: FieldValueFilterWidgetStoreModule;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IFieldValueFilterWidgetVueXState, FieldValueFilterWidgetContext>;
    public mutations: MutationTree<IFieldValueFilterWidgetVueXState>;
    public actions: ActionTree<IFieldValueFilterWidgetVueXState, FieldValueFilterWidgetContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "FieldValueFilterWidgetVuexStore";

        this.state = {
            filters_active_options: {}
        };

        this.getters = {
            get_filters_active_options: (state: IFieldValueFilterWidgetVueXState): { [api_type_id: string]: { [field_id: string]: DataFilterOption[] } } => {
                return state.filters_active_options;
            }
        };

        this.mutations = {
            set_filters_active_options: (state: IFieldValueFilterWidgetVueXState, filters_active_options: { [api_type_id: string]: { [field_id: string]: DataFilterOption[] } }) => state.filters_active_options = filters_active_options,
            set_filter_active_options: (state: IFieldValueFilterWidgetVueXState, params: { api_type_id: string, field_id: string, filter_active_options: DataFilterOption[] }) => {

                if ((!params.api_type_id) || (!params.field_id)) {
                    return;
                }

                if (!state.filters_active_options[params.api_type_id]) {
                    state.filters_active_options[params.api_type_id] = {};
                }

                Vue.set(state.filters_active_options[params.api_type_id], params.field_id, params.filter_active_options);
            },
        };

        this.actions = {
            set_filters_active_options: (context: FieldValueFilterWidgetContext, filters_active_options: { [api_type_id: string]: { [field_id: string]: DataFilterOption[] } }) => commit_set_filters_active_options(context, filters_active_options),
            set_filter_active_options: (context: FieldValueFilterWidgetContext, params: { api_type_id: string, field_id: string, filter_active_options: DataFilterOption[] }) => commit_set_filter_active_options(context, params),
        };
    }
}

export const FieldValueFilterWidgetVuexStore = FieldValueFilterWidgetStoreModule.getInstance();

const { commit, read, dispatch } = getStoreAccessors<IFieldValueFilterWidgetVueXState, any>("FieldValueFilterWidgetVuexStore");

export const ModuleFieldValueFilterWidgetVuexGetter = namespace('FieldValueFilterWidgetVuexStore', Getter);
export const ModuleFieldValueFilterWidgetVuexAction = namespace('FieldValueFilterWidgetVuexStore', Action);

export const commit_set_filters_active_options = commit(FieldValueFilterWidgetVuexStore.mutations.set_filters_active_options);
export const commit_set_filters_active_option = commit(FieldValueFilterWidgetVuexStore.mutations.set_filters_active_option);
