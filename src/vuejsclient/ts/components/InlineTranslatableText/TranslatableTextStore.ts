import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../store/IStoreModule';
import { store_mutations_names } from '../../store/StoreModuleBase';

export type TranslatableTextContext = ActionContext<ITranslatableTextState, any>;

export interface ITranslatableTextState {
    // translations: { [code_lang: string]: { [code_text: string]: any } };
    flat_locale_translations: { [code_text: string]: any };

    initialized: boolean;
    initializing: boolean;
}


export default class TranslatableTextStore implements IStoreModule<ITranslatableTextState, TranslatableTextContext> {

    // istanbul ignore next: nothing to test
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
    public mutations = {

        set_flat_locale_translations(state: ITranslatableTextState, flat_locale_translations: { [code_text: string]: string }) {
            state.flat_locale_translations = flat_locale_translations;
        },

        set_initialized(state: ITranslatableTextState, initialized: boolean) {
            state.initialized = initialized;
        },

        set_initializing(state: ITranslatableTextState, initializing: boolean) {
            state.initializing = initializing;
        },

        set_flat_locale_translation(state: ITranslatableTextState, flat_locale_translation: { code_text: string, value: string }) {
            Vue.set(state.flat_locale_translations, flat_locale_translation.code_text, flat_locale_translation.value);
        },
    };
    public actions: ActionTree<ITranslatableTextState, TranslatableTextContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "TranslatableTextStore";


        this.state = {
            // translations: {},
            flat_locale_translations: {},

            initialized: false,
            initializing: false
        };


        this.getters = {
            // get_translations(state: ITranslatableTextState): { [code_lang: string]: { [code_text: string]: any } } {
            //     return state.translations;
            // },
            get_flat_locale_translations(state: ITranslatableTextState): { [code_text: string]: string } {
                return state.flat_locale_translations;
            },

            get_initialized(state: ITranslatableTextState): boolean {
                return state.initialized;
            },
            get_initializing(state: ITranslatableTextState): boolean {
                return state.initializing;
            },
        };

        this.actions = {

            set_flat_locale_translations: (context: TranslatableTextContext, flat_locale_translations: { [code_text: string]: string }) => context.commit(store_mutations_names(this).set_flat_locale_translations, flat_locale_translations),
            set_initialized: (context: TranslatableTextContext, initialized: boolean) => context.commit(store_mutations_names(this).set_initialized, initialized),
            set_initializing: (context: TranslatableTextContext, initializing: boolean) => context.commit(store_mutations_names(this).set_initializing, initializing),
            set_flat_locale_translation: (context: TranslatableTextContext, flat_locale_translation: { code_text: string, value: string }) => context.commit(store_mutations_names(this).set_flat_locale_translation, flat_locale_translation),
        };
    }
}

export const TranslatableTextStore_ = TranslatableTextStore.getInstance();

export const ModuleTranslatableTextGetter = namespace('TranslatableTextStore', Getter);
export const ModuleTranslatableTextAction = namespace('TranslatableTextStore', Action);