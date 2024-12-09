import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type FeedbackContext = ActionContext<IFeedbackState, any>;

export interface IFeedbackState {
    hidden: boolean;
}

export default class FeedbackStore implements IStoreModule<IFeedbackState, FeedbackContext> {

    private static instance: FeedbackStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IFeedbackState, FeedbackContext>;
    public mutations = {
        set_hidden(state: IFeedbackState, hidden: boolean) { state.hidden = hidden; },
    };
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

        this.actions = {
            set_hidden: (context: FeedbackContext, hidden: boolean) => context.commit(store_mutations_names(this).set_hidden, hidden),
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): FeedbackStore {
        if (!FeedbackStore.instance) {
            FeedbackStore.instance = new FeedbackStore();
        }
        return FeedbackStore.instance;
    }
}

const __namespace = namespace('FeedbackStore');
export const ModuleFeedbackGetter = __namespace.Getter;
export const ModuleFeedbackAction = __namespace.Action;