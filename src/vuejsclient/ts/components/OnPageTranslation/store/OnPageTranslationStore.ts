import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from '../../../store/StoreModuleBase';
import OnPageTranslationItem from '../vos/OnPageTranslationItem';

export type OnPageTranslationContext = ActionContext<IOnPageTranslationState, any>;

export interface IOnPageTranslationState {
    page_translations: { [translation_code: string]: OnPageTranslationItem };
}


export default class OnPageTranslationStore implements IStoreModule<IOnPageTranslationState, OnPageTranslationContext> {

    public static getInstance(): OnPageTranslationStore {
        if (!OnPageTranslationStore.instance) {
            OnPageTranslationStore.instance = new OnPageTranslationStore();
        }
        return OnPageTranslationStore.instance;
    }

    private static instance: OnPageTranslationStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IOnPageTranslationState, OnPageTranslationContext>;
    public mutations = {

        registerPageTranslation(state: IOnPageTranslationState, infos: { translation_code: string, missing: boolean }) {
            if (state.page_translations[infos.translation_code]) {

                // Si on a déjà le code, mais qu'on a en info missing, cette info doit être prioritaire
                if (infos.missing) {
                    state.page_translations[infos.translation_code].missing = true;
                }
                return;
            }

            Vue.set(state.page_translations, infos.translation_code, new OnPageTranslationItem(infos.translation_code, infos.missing));
        },

        registerPageTranslations(state: IOnPageTranslationState, infos: Array<{ translation_code: string, missing: boolean }>) {

            for (let i in infos) {
                OnPageTranslationStore_.mutations.registerPageTranslation(state, infos[i]);
            }
        },

        clear(state: IOnPageTranslationState) {
            // On clear tout sauf les traductions manquantes
            let res: { [translation_code: string]: OnPageTranslationItem } = {};

            for (let i in state.page_translations) {
                let page_translation = state.page_translations[i];

                if (page_translation.missing) {
                    res[page_translation.translation_code] = page_translation;
                }
            }
            state.page_translations = res;
        }
    };
    public actions: ActionTree<IOnPageTranslationState, OnPageTranslationContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "OnPageTranslationStore";


        this.state = {
            page_translations: {}
        };


        this.getters = {
            getPageTranslations(state: IOnPageTranslationState): { [translation_code: string]: OnPageTranslationItem } {
                return state.page_translations;
            },
        };

        this.actions = {
            registerPageTranslation: (context: OnPageTranslationContext, infos: { translation_code: string, missing: boolean }) => context.commit(store_mutations_names(this).registerPageTranslation, infos),
            registerPageTranslations: (context: OnPageTranslationContext, infos: Array<{ translation_code: string, missing: boolean }>) => context.commit(store_mutations_names(this).registerPageTranslations, infos),
            clear: (context: OnPageTranslationContext) => context.commit(store_mutations_names(this).clear, null),
        };
    }
}

export const OnPageTranslationStore_ = OnPageTranslationStore.getInstance();

export const ModuleOnPageTranslationGetter = namespace('OnPageTranslationStore', Getter);
export const ModuleOnPageTranslationAction = namespace('OnPageTranslationStore', Action);