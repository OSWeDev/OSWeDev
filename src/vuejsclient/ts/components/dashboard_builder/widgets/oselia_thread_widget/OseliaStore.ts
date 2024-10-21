import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../../../store/IStoreModule';
import { store_mutations_names } from "../../../../store/StoreModuleBase";

export type OseliaContext = ActionContext<IOseliaState, any>;

export interface IOseliaState {
    too_many_assistants: boolean;
    can_run_assistant: boolean;
    oselia_first_loading_done: boolean;
    left_panel_open: boolean;

    show_hidden_messages: boolean;
}

export default class OseliaStore implements IStoreModule<IOseliaState, OseliaContext> {

    private static instance: OseliaStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IOseliaState, OseliaContext>;
    public mutations = {
        set_too_many_assistants(state: IOseliaState, too_many_assistants: boolean) { state.too_many_assistants = too_many_assistants; },
        set_can_run_assistant(state: IOseliaState, can_run_assistant: boolean) { state.can_run_assistant = can_run_assistant; },
        set_oselia_first_loading_done(state: IOseliaState, oselia_first_loading_done: boolean) { state.oselia_first_loading_done = oselia_first_loading_done; },
        set_left_panel_open(state: IOseliaState, left_panel_open: boolean) { state.left_panel_open = left_panel_open; },
        set_show_hidden_messages(state: IOseliaState, show_hidden_messages: boolean) { state.show_hidden_messages = show_hidden_messages; },
    };
    public actions: ActionTree<IOseliaState, OseliaContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "OseliaStore";


        this.state = {
            too_many_assistants: false,
            can_run_assistant: false,
            oselia_first_loading_done: false,
            left_panel_open: false,
            show_hidden_messages: false,
        };


        this.getters = {

            get_too_many_assistants(state: IOseliaState): boolean { return state.too_many_assistants; },
            get_can_run_assistant(state: IOseliaState): boolean { return state.can_run_assistant; },
            get_oselia_first_loading_done(state: IOseliaState): boolean { return state.oselia_first_loading_done; },
            get_left_panel_open(state: IOseliaState): boolean { return state.left_panel_open; },
            get_show_hidden_messages(state: IOseliaState): boolean { return state.show_hidden_messages; },
        };

        this.actions = {
            set_too_many_assistants: (context: OseliaContext, too_many_assistants: boolean) => context.commit(store_mutations_names(this).set_too_many_assistants, too_many_assistants),
            set_can_run_assistant: (context: OseliaContext, can_run_assistant: boolean) => context.commit(store_mutations_names(this).set_can_run_assistant, can_run_assistant),
            set_oselia_first_loading_done: (context: OseliaContext, oselia_first_loading_done: boolean) => context.commit(store_mutations_names(this).set_oselia_first_loading_done, oselia_first_loading_done),
            set_left_panel_open: (context: OseliaContext, left_panel_open: boolean) => context.commit(store_mutations_names(this).set_left_panel_open, left_panel_open),
            set_show_hidden_messages: (context: OseliaContext, show_hidden_messages: boolean) => context.commit(store_mutations_names(this).set_show_hidden_messages, show_hidden_messages),
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): OseliaStore {
        if (!OseliaStore.instance) {
            OseliaStore.instance = new OseliaStore();
        }
        return OseliaStore.instance;
    }
}

export const ModuleOseliaGetter = namespace('OseliaStore', Getter);
export const ModuleOseliaAction = namespace('OseliaStore', Action);