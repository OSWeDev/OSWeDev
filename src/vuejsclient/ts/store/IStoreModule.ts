import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';

export default interface IStoreModule<S, R> extends Module<S, R> {
    module_name: string;
    state: any;
    getters: GetterTree<S, R>;
    mutations: MutationTree<S>;
    actions: ActionTree<S, R>;
    namespaced: boolean;
}