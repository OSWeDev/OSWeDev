
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';

export type LangSelectorContext = ActionContext<ILangSelectorState, any>;

export interface ILangSelectorState {
    hide_lang_selector: boolean;
}

export default class LangSelectorStore implements IStoreModule<ILangSelectorState, LangSelectorStore> {

    public static getInstance(): LangSelectorStore {
        if (!LangSelectorStore.instance) {
            LangSelectorStore.instance = new LangSelectorStore();
        }
        return LangSelectorStore.instance;
    }

    private static instance: LangSelectorStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<ILangSelectorState, LangSelectorStore>;
    public mutations: MutationTree<ILangSelectorState>;
    public actions: ActionTree<ILangSelectorState, LangSelectorStore>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "LangSelectorStore";


        this.state = {
            hide_lang_selector: true,
        };


        this.getters = {

            get_hide_lang_selector(state: ILangSelectorState): boolean { return state.hide_lang_selector; },
        };

        this.mutations = {

            set_hide_lang_selector(state: ILangSelectorState, hide_lang_selector: boolean) { state.hide_lang_selector = hide_lang_selector; },
        };



        this.actions = {
            set_hide_lang_selector(context: LangSelectorContext, hide_lang_selector: boolean) { commit_set_hide_lang_selector(context, hide_lang_selector); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<ILangSelectorState, any>("LangSelectorStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleLangSelectorGetter = namespace('LangSelectorStore', Getter);
export const ModuleLangSelectorAction = namespace('LangSelectorStore', Action);

export const commit_set_hide_lang_selector = commit(LangSelectorStore.getInstance().mutations.set_hide_lang_selector);
