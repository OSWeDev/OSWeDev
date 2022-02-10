import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';

export type FeedbackContext = ActionContext<IFeedbackState, any>;

export interface IFeedbackState {
    hidden: boolean;
}

export default class FeedbackStore implements IStoreModule<IFeedbackState, FeedbackContext> {

    public static getInstance(): FeedbackStore {
        if (!FeedbackStore.instance) {
            FeedbackStore.instance = new FeedbackStore();
        }
        return FeedbackStore.instance;
    }

    private static instance: FeedbackStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IFeedbackState, FeedbackContext>;
    public mutations: MutationTree<IFeedbackState>;
    public actions: ActionTree<IFeedbackState, FeedbackContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "FeedbackStore";


        this.state = {
            hidden: true,
        };


        this.getters = {

            get_hidden(state: IFeedbackState): boolean { return state.hidden; },
        };

        this.mutations = {

            set_hidden(state: IFeedbackState, hidden: boolean) { state.hidden = hidden; },
        };



        this.actions = {
            set_hidden(context: FeedbackContext, hidden: boolean) { commit_set_hidden(context, hidden); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IFeedbackState, any>("FeedbackStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleFeedbackGetter = namespace('FeedbackStore', Getter);
export const ModuleFeedbackAction = namespace('FeedbackStore', Action);

export const commit_set_hidden = commit(FeedbackStore.getInstance().mutations.set_hidden);