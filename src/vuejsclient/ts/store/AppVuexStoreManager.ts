import Vue from 'vue';
import Vuex from 'vuex';
import AppMainStoreModule from './AppMainStoreModule';
import IStoreModule from './IStoreModule';

export default class AppVuexStoreManager {

    public static getInstance<IAppXState>(): AppVuexStoreManager {
        if (!AppVuexStoreManager.instance) {
            AppVuexStoreManager.instance = new AppVuexStoreManager();
        }
        return AppVuexStoreManager.instance;
    }

    private static instance = null;

    public appVuexStore;
    protected registered_modules: { [name: string]: IStoreModule<any, any> };

    protected constructor() {
        this.registered_modules = {};
    }

    public registerModule(module: IStoreModule<any, any>) {
        this.registered_modules[module.module_name] = module;
        module.namespaced = true;
    }

    public configure_store() {
        Vue.use(Vuex);

        const appStoreX = Object.assign({}, AppMainStoreModule.getInstance());
        appStoreX['modules'] = this.registered_modules;

        this.appVuexStore = new Vuex.Store(appStoreX);
    }
}