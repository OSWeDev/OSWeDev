import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type SurveyContext = ActionContext<ISurveyState, any>;

export interface ISurveyState {
    hidden: boolean;
}

export default class SurveyStore implements IStoreModule<ISurveyState, SurveyContext> {

    private static instance: SurveyStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<ISurveyState, SurveyContext>;
    public mutations = {
        set_hidden(state: ISurveyState, hidden: boolean) { state.hidden = hidden; },
    };
    public actions: ActionTree<ISurveyState, SurveyContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "SurveyStore";


        this.state = {
            hidden: true,
        };


        this.getters = {

            get_hidden(state: ISurveyState): boolean { return state.hidden; },
        };

        this.actions = {
            set_hidden: (context: SurveyContext, hidden: boolean) => context.commit(store_mutations_names(this).set_hidden, hidden)
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): SurveyStore {
        if (!SurveyStore.instance) {
            SurveyStore.instance = new SurveyStore();
        }
        return SurveyStore.instance;
    }
}

const __namespace = namespace('SurveyStore');
export const ModuleSurveyGetter = __namespace.Getter;
export const ModuleSurveyAction = __namespace.Action;