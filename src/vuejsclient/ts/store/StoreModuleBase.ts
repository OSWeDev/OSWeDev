import { ActionTree, GetterTree } from 'vuex';
import AppVuexStoreManager from './AppVuexStoreManager';
import IStoreModule, { MutationsBase } from './IStoreModule';

export const store_mutations_names: <T extends { mutations }>(obj?: T) => { [P in keyof T["mutations"]]?: P } = <T extends { mutations }>(obj?: T): { [P in keyof T["mutations"]]?: P } => {

    return new Proxy({}, {
        get: (_, prop) => prop,
        set: () => {
            throw Error('Set not supported');
        },
    }) as { [P in keyof T]?: P; };
};

export default abstract class StoreModuleBase<StoreModuleState, StoreModuleContext> implements IStoreModule<StoreModuleState, StoreModuleContext> {

    public namespaced: boolean = true;

    public state: any;
    public getters: GetterTree<StoreModuleState, StoreModuleContext>;
    public mutations: MutationsBase<StoreModuleState>;
    public actions: ActionTree<StoreModuleState, StoreModuleContext>;

    protected constructor(public module_name: string) {
        AppVuexStoreManager.getInstance().registerModule(this);
    }

    public getMutationsBase(): MutationsBase<StoreModuleState> {
        return {
            clear_store(state: StoreModuleState) {
                Object.keys(state).forEach((key) => {
                    const value = (state as any)[key];

                    delete (state as any)[key];

                    if (Array.isArray(value)) {
                        // Si la propriété est un tableau, on réinitialise à []
                        (state as any)[key] = [];
                    } else if (value && typeof value === 'object') {
                        // Si la propriété est un objet, on réinitialise à {}
                        (state as any)[key] = {};
                    } else {
                        // Sinon, on réinitialise à null (par défaut)
                        (state as any)[key] = null;
                    }
                });
            },
        };
    }

    // Ajoute l'action clear_store
    public getActionsBase(): ActionTree<StoreModuleState, StoreModuleContext> {
        return {
            clear_store({ commit }) {
                commit('clear_store');
            },
        };
    }
}