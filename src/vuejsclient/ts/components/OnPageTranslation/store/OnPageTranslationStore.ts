import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../../../vuejsclient/ts/store/IStoreModule';
import OnPageTranslationItem from '../vos/OnPageTranslationItem';
import Vue from 'vue';

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
    public mutations: MutationTree<IOnPageTranslationState>;
    public actions: ActionTree<IOnPageTranslationState, OnPageTranslationContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "OnPageTranslationStore";


        this.state = {
            page_translations: {}
        };


        this.getters = {
            getPageTranslations(state: IOnPageTranslationState): { [translation_code: string]: OnPageTranslationItem } {
                return state.page_translations;
            },
        };



        this.mutations = {

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

            clear(state: IOnPageTranslationState) {
                state.page_translations = {};
            }
        };



        this.actions = {
            registerPageTranslation(context: OnPageTranslationContext, infos: { translation_code: string, missing: boolean }) {
                commitRegisterPageTranslation(context, infos);
            },

            clear(context: OnPageTranslationContext) {
                commitClear(context, null);
            }
        };
    }
}

export const OnPageTranslationStore_ = OnPageTranslationStore.getInstance();


const { commit, read, dispatch } =
    getStoreAccessors<IOnPageTranslationState, any>("OnPageTranslationStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleOnPageTranslationGetter = namespace('OnPageTranslationStore', Getter);
export const ModuleOnPageTranslationAction = namespace('OnPageTranslationStore', Action);

export const commitRegisterPageTranslation = commit(OnPageTranslationStore_.mutations.registerPageTranslation);
export const commitClear = commit(OnPageTranslationStore_.mutations.clear);