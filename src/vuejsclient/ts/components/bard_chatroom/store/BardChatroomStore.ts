import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type BardChatroomContext = ActionContext<IBardChatroomState, any>;

export interface IBardChatroomState {
    hidden: boolean;
}

export default class BardChatroomStore implements IStoreModule<IBardChatroomState, BardChatroomContext> {

    public static getInstance(): BardChatroomStore {
        if (!BardChatroomStore.instance) {
            BardChatroomStore.instance = new BardChatroomStore();
        }

        return BardChatroomStore.instance;
    }

    private static instance: BardChatroomStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IBardChatroomState, BardChatroomContext>;
    public mutations = {
        set_hidden(state: IBardChatroomState, hidden: boolean) { state.hidden = hidden; },
    };
    public actions: ActionTree<IBardChatroomState, BardChatroomContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "BardChatroomStore";

        this.state = {
            hidden: true,
        };

        this.getters = {
            get_hidden(state: IBardChatroomState): boolean { return state.hidden; },
        };

        this.actions = {
            set_hidden: (context: BardChatroomContext, hidden: boolean) => context.commit(store_mutations_names(this).set_hidden, hidden),
        };
    }
}

export const ModuleBardChatroomGetter = namespace('BardChatroomStore', Getter);
export const ModuleBardChatroomAction = namespace('BardChatroomStore', Action);