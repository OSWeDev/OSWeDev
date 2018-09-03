import { ActionTree, GetterTree, MutationTree } from 'vuex';
import AppVuexStoreManager from './AppVuexStoreManager';
import IStoreModule from './IStoreModule';

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