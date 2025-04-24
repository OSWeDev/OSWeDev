import Vue, { computed, watchEffect } from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { namespace } from 'vuex-class/lib/bindings';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import LocaleManager from '../../../../shared/tools/LocaleManager';
import SemaphoreHandler from '../../../../shared/tools/SemaphoreHandler';
import VueAppBaseInstanceHolder from '../../../VueAppBaseInstanceHolder';
import VueAppController from '../../../VueAppController';
import IStoreModule from '../../store/IStoreModule';
import { store_mutations_names } from '../../store/StoreModuleBase';
import Throttle from '../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import VueAppBaseDatasHolder from '../../../VueAppBaseInstanceHolder';

export type TranslatableTextContext = ActionContext<ITranslatableTextState, any>;


// type TReturn = {
//     toString: () => string;
//     then: (resolve: (value: string) => void) => Promise<string>;
// };

export function useTranslation() {
    const CACHE_PREFIX = 'translations_cache___';

    const loadFromCache = (key: string): string | null =>
        localStorage.getItem(CACHE_PREFIX + key);

    const saveToCache = (key: string, value: string) =>
        localStorage.setItem(CACHE_PREFIX + key, value);

    const fetchAndUpdate = async (key: string, cached_value: string): Promise<string> => {

        const cach_key = CACHE_PREFIX + key;

        return SemaphoreHandler.do_only_once(cach_key, async () => {

            const server_value = await ModuleTranslation.getInstance().t(key, VueAppController.getInstance().data_user_lang?.id);
            if (server_value && (cached_value !== server_value)) {
                VueAppBaseInstanceHolder.instance.vueInstance.$store.commit('TranslatableTextStore/set_flat_locale_translation', { code_text: key, value: server_value });
                saveToCache(key, server_value);
            }
            return server_value;
        });
    };

    const t = (key: string, params?: Record<string, string>): string | PromiseLike<string> => {

        if (!key) {
            const resolved = Promise.resolve(key);
            const result: any = new String(key);

            result.toString = () => key;
            result.then = resolved.then.bind(resolved);

            return result;

            // return {
            //     toString() {
            //         return key;
            //     },
            //     then(resolve: (value: string) => void | Promise<void>) {
            //         return resolved.then(resolve) as Promise<string>;
            //     },
            // };
        }

        // return txt;
        if (VueAppBaseDatasHolder.has_access_to_onpage_translation) {
            TranslatableTextStore.register_translation({
                [key]: false,
            });
        }

        const translation = computed(() =>
            VueAppBaseInstanceHolder.instance.vueInstance.$store.state.TranslatableTextStore.flat_locale_translations[key] || loadFromCache(key) || null
        );

        const applyParams = (str: string, params_to_apply?: Record<string, string>) =>
            params_to_apply ? str.replace(/\{(\w+)\}/g, (_, match) => params_to_apply[match] || `{${match}}`) : str;

        watchEffect(() => {
            if (typeof VueAppBaseInstanceHolder.instance.vueInstance.$store.state.TranslatableTextStore.flat_locale_translations[key] === 'undefined') {
                // If the translation is not in the store, fetch it
                fetchAndUpdate(key, translation.value);
            }
        });

        const promise = (async () => {
            let value = translation.value;

            if (value == null) {
                value = await fetchAndUpdate(key, value);
            }

            return applyParams(value || '...', params);
        })();

        const res = translation.value ? applyParams(translation.value, params) : '...';
        const result: any = new String(res);

        result.toString = () => res;
        result.then = promise.then.bind(promise);

        return result;

        // return {
        //     toString() {
        //         return translation.value ? applyParams(translation.value, params) : '...';
        //     },
        //     then(resolve: (value: string) => void | Promise<void>) {
        //         return promise.then(resolve) as Promise<string>;
        //     },
        // };
    };

    return { t };
}

export interface ITranslatableTextState {
    flat_locale_translations: { [code_text: string]: any };

    initialized: boolean;
    initializing: boolean;
}


export default class TranslatableTextStore implements IStoreModule<ITranslatableTextState, TranslatableTextContext> {

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

        set_flat_locale_translation(state: ITranslatableTextState, flat_locale_translation: { code_text: string, value: string, synced?: boolean }) {
            if (!flat_locale_translation.synced) {
                LocaleManager.set_translation(flat_locale_translation.code_text, flat_locale_translation.value, true);
            }
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

    // istanbul ignore next: nothing to test
    public static getInstance(): TranslatableTextStore {
        if (!TranslatableTextStore.instance) {
            TranslatableTextStore.instance = new TranslatableTextStore();
        }
        return TranslatableTextStore.instance;
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_MAP,
        throttle_ms: 1000,
        leading: false,
    })
    public static register_translation(translations: { [translation_code: string]: boolean }) {
        VueAppBaseInstanceHolder.instance.vueInstance.$store.commit('OnPageTranslationStore/registerPageTranslations', translations);
    }
}

export const TranslatableTextStore_ = TranslatableTextStore.getInstance();

const __namespace = namespace('TranslatableTextStore');
export const ModuleTranslatableTextGetter = __namespace.Getter;
export const ModuleTranslatableTextAction = __namespace.Action;