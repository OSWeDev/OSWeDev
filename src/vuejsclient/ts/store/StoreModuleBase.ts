import { ActionTree, GetterTree, MutationTree } from 'vuex';
import AppVuexStoreManager from './AppVuexStoreManager';
import IStoreModule from './IStoreModule';

export const store_mutations_names: <T extends { mutations }>(obj?: T) => { [P in keyof T["mutations"]]?: P } = <T extends { mutations }>(obj?: T): { [P in keyof T["mutations"]]?: P } => {

    return new Proxy({}, {
        get: (_, prop) => prop,
        set: () => {
            throw Error('Set not supported');
        },
    }) as {
            [P in keyof T]?: P;
        };
};

export default abstract class StoreModuleBase<StoreModuleState, StoreModuleContext> implements IStoreModule<StoreModuleState, StoreModuleContext> {

    public namespaced: boolean = true;

    public state: any;
    public getters: GetterTree<StoreModuleState, StoreModuleContext>;
    public mutations: MutationTree<StoreModuleState>;
    public actions: ActionTree<StoreModuleState, StoreModuleContext>;

    protected constructor(public module_name: string) {
        AppVuexStoreManager.getInstance().registerModule(this);
    }
}