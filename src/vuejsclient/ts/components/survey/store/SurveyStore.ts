import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';

export type SurveyContext = ActionContext<ISurveyState, any>;

export interface ISurveyState {
    hidden: boolean;
}

export default class SurveyStore implements IStoreModule<ISurveyState, SurveyContext> {

    public static getInstance(): SurveyStore {
        if (!SurveyStore.instance) {
            SurveyStore.instance = new SurveyStore();
        }
        return SurveyStore.instance;
    }

    private static instance: SurveyStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<ISurveyState, SurveyContext>;
    public mutations: MutationTree<ISurveyState>;
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

        this.mutations = {

            set_hidden(state: ISurveyState, hidden: boolean) { state.hidden = hidden; },
        };



        this.actions = {
            set_hidden(context: SurveyContext, hidden: boolean) { commit_set_hidden(context, hidden); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<ISurveyState, any>("SurveyStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleSurveyGetter = namespace('SurveyStore', Getter);
export const ModuleSurveyAction = namespace('SurveyStore', Action);

export const commit_set_hidden = commit(SurveyStore.getInstance().mutations.set_hidden);