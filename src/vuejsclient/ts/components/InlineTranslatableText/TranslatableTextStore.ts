import Vue from "vue";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../store/IStoreModule';

export type TranslatableTextContext = ActionContext<ITranslatableTextState, any>;

export interface ITranslatableTextState {
    translations: { [code_lang: string]: { [code_text: string]: string } };

    initialized: boolean;
    initializing: boolean;
}


export default class TranslatableTextStore implements IStoreModule<ITranslatableTextState, TranslatableTextContext> {

    public static getInstance(): TranslatableTextStore {
        if (!TranslatableTextStore.instance) {
            TranslatableTextStore.instance = new TranslatableTextStore();
        }
        return TranslatableTextStore.instance;
    }

    private static instance: TranslatableTextStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<ITranslatableTextState, TranslatableTextContext>;
    public mutations: MutationTree<ITranslatableTextState>;
    public actions: ActionTree<ITranslatableTextState, TranslatableTextContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "TranslatableTextStore";


        this.state = {
            translations: {},

            initialized: false,
            initializing: false
        };


        this.getters = {
            get_translations(state: ITranslatableTextState): { [code_lang: string]: { [code_text: string]: string } } {
                return state.translations;
            },

            get_initialized(state: ITranslatableTextState): boolean {
                return state.initialized;
            },
            get_initializing(state: ITranslatableTextState): boolean {
                return state.initializing;
            },
        };



        this.mutations = {

            set_translations(state: ITranslatableTextState, translations: { [code_lang: string]: { [code_text: string]: string } }) {
                state.translations = translations;
            },

            set_initialized(state: ITranslatableTextState, initialized: boolean) {
                state.initialized = initialized;
            },

            set_initializing(state: ITranslatableTextState, initializing: boolean) {
                state.initializing = initializing;
            },

            set_translation(state: ITranslatableTextState, translation: { code_lang: string, code_text: string, value: string }) {
                if (!state.translations[translation.code_lang]) {
                    return;
                }

                let splits = translation.code_text.split('.');
                let last = splits ? splits.pop() : null;
                if ((!splits) || (!last)) {
                    return;
                }

                let trads = state.translations[translation.code_lang];
                let i = 0;
                while (trads && splits && splits[i]) {

                    if (!trads[splits[i]]) {
                        trads[splits[i]] = {} as any;
                    }

                    trads = trads[splits[i]] as any;
                    i++;
                }

                Vue.set(trads, last, translation.value);
            },
        };



        this.actions = {

            set_translations(context: TranslatableTextContext, translations: { [code_lang: string]: { [code_text: string]: string } }) {
                commit_set_translations(context, translations);
            },

            set_initialized(context: TranslatableTextContext, initialized: boolean) {
                commit_set_initialized(context, initialized);
            },

            set_initializing(context: TranslatableTextContext, initializing: boolean) {
                commit_set_initializing(context, initializing);
            },

            set_translation(context: TranslatableTextContext, translation: { code_lang: string, code_text: string, value: string }) {
                commit_set_translation(context, translation);
            },
        };
    }
}

export const TranslatableTextStore_ = TranslatableTextStore.getInstance();


const { commit, read, dispatch } =
    getStoreAccessors<ITranslatableTextState, any>("TranslatableTextStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleTranslatableTextGetter = namespace('TranslatableTextStore', Getter);
export const ModuleTranslatableTextAction = namespace('TranslatableTextStore', Action);

export const commit_set_translations = commit(TranslatableTextStore_.mutations.set_translations);
export const commit_set_translation = commit(TranslatableTextStore_.mutations.set_translation);
export const commit_set_initialized = commit(TranslatableTextStore_.mutations.set_initialized);
export const commit_set_initializing = commit(TranslatableTextStore_.mutations.set_initializing);