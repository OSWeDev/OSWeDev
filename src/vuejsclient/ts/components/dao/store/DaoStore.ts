import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors, GetterHandler } from "vuex-typescript";
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import IStoreModule from '../../../store/IStoreModule';
import DaoStoreTypeWatcherDefinition from '../vos/DaoStoreTypeWatcherDefinition';
import { store_mutations_names } from '../../../store/StoreModuleBase';

export type DAOContext = ActionContext<IDAOState, any>;

export interface IDAOState {
    storedDatasArray: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    typeWatchers: { [API_TYPE_ID: string]: DaoStoreTypeWatcherDefinition[] };
}

let callWatchers = async (watchers: DaoStoreTypeWatcherDefinition[]) => {
    for (let i in watchers) {
        await watchers[i].handler();
    }
};

export default class DAOStore implements IStoreModule<IDAOState, DAOContext> {

    // istanbul ignore next: nothing to test
    public static getInstance(): DAOStore {
        if (!DAOStore.instance) {
            DAOStore.instance = new DAOStore();
        }

        return DAOStore.instance;
    }

    private static instance: DAOStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDAOState, DAOContext>;
    public mutations = {

        unregisterTypeWatcher(state: IDAOState, watcher: DaoStoreTypeWatcherDefinition) {

            if (!watcher) {
                return;
            }

            if (!state.typeWatchers[watcher.API_TYPE_ID]) {
                return;
            }

            for (let i in state.typeWatchers[watcher.API_TYPE_ID]) {
                if (state.typeWatchers[watcher.API_TYPE_ID][i].UID == watcher.UID) {
                    // On le supprime
                    state.typeWatchers[watcher.API_TYPE_ID].splice(parseInt(i), 1);
                    return;
                }
            }
        },

        registerTypeWatcher(state: IDAOState, watcher: DaoStoreTypeWatcherDefinition) {

            if (!watcher) {
                return;
            }

            if (!state.typeWatchers[watcher.API_TYPE_ID]) {
                Vue.set(state.typeWatchers, watcher.API_TYPE_ID, []);
            }

            for (let i in state.typeWatchers[watcher.API_TYPE_ID]) {
                if (state.typeWatchers[watcher.API_TYPE_ID][i].UID == watcher.UID) {
                    // On remplace le précédent
                    state.typeWatchers[watcher.API_TYPE_ID][i] = watcher;
                    return;
                }
            }

            state.typeWatchers[watcher.API_TYPE_ID].push(watcher);
        },

        async storeData(state: IDAOState, vo: IDistantVOBase) {

            if ((!vo) || (!vo.id) || (!vo._type)) {
                return;
            }

            if (!state.storedDatasArray[vo._type]) {
                Vue.set(state.storedDatasArray, vo._type, {
                    [vo.id]: vo
                });

                if (state.typeWatchers[vo._type]) {
                    await callWatchers(state.typeWatchers[vo._type]);
                }

                return;
            }

            if (!state.storedDatasArray[vo._type][vo.id]) {
                Vue.set(state.storedDatasArray[vo._type] as any, vo.id, vo);

                if (state.typeWatchers[vo._type]) {
                    await callWatchers(state.typeWatchers[vo._type]);
                }

                return;
            }

            state.storedDatasArray[vo._type][vo.id] = vo;

            if (state.typeWatchers[vo._type]) {
                await callWatchers(state.typeWatchers[vo._type]);
            }
        },

        async storeDatas(state: IDAOState, infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) {

            Vue.set(state.storedDatasArray, infos.API_TYPE_ID, VOsTypesManager.vosArray_to_vosByIds(infos.vos));

            if (state.typeWatchers[infos.API_TYPE_ID]) {
                await callWatchers(state.typeWatchers[infos.API_TYPE_ID]);
            }
        },

        async storeDatasByIds(state: IDAOState, infos: { API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }) {

            Vue.set(state.storedDatasArray, infos.API_TYPE_ID, infos.vos_by_ids);

            if (state.typeWatchers[infos.API_TYPE_ID]) {
                await callWatchers(state.typeWatchers[infos.API_TYPE_ID]);
            }
        },

        async storeMultipleDatasByIds(state: IDAOState, infos: Array<{ API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }>) {

            for (let i in infos) {
                let info = infos[i];

                Vue.set(state.storedDatasArray, info.API_TYPE_ID, info.vos_by_ids);

                if (state.typeWatchers[info.API_TYPE_ID]) {
                    await callWatchers(state.typeWatchers[info.API_TYPE_ID]);
                }
            }
        },

        async removeData(state: IDAOState, infos: { API_TYPE_ID: string, id: number }) {

            if (!infos.API_TYPE_ID || !state.storedDatasArray[infos.API_TYPE_ID]) {
                return;
            }

            Vue.delete(state.storedDatasArray[infos.API_TYPE_ID] as any, infos.id);

            if (state.typeWatchers[infos.API_TYPE_ID]) {
                await callWatchers(state.typeWatchers[infos.API_TYPE_ID]);
            }
        },

        async updateData(state: IDAOState, vo: IDistantVOBase) {

            if ((!vo) || (!vo._type) || (!state.storedDatasArray[vo._type])) {
                return;
            }

            state.storedDatasArray[vo._type][vo.id] = vo;

            if (state.typeWatchers[vo._type]) {
                await callWatchers(state.typeWatchers[vo._type]);
            }
        },
    };
    public actions: ActionTree<IDAOState, DAOContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "DAOStore";


        this.state = {
            storedDatasArray: {},
            typeWatchers: {}
        };


        this.getters = {
            getStoredDatas(state: IDAOState): { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } } {
                return state.storedDatasArray;
            },
        };

        this.actions = {
            unregisterTypeWatcher: (context: DAOContext, watcher: DaoStoreTypeWatcherDefinition) => context.commit(store_mutations_names(this).unregisterTypeWatcher, watcher),
            registerTypeWatcher: (context: DAOContext, watcher: DaoStoreTypeWatcherDefinition) => context.commit(store_mutations_names(this).registerTypeWatcher, watcher),
            storeData: (context: DAOContext, vo: IDistantVOBase) => context.commit(store_mutations_names(this).storeData, vo),
            storeDatas: (context: DAOContext, infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => context.commit(store_mutations_names(this).storeDatas, infos),
            storeDatasByIds: (context: DAOContext, infos: { API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }) => context.commit(store_mutations_names(this).storeDatasByIds, infos),
            storeMultipleDatasByIds: (context: DAOContext, infos: Array<{ API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }>) => context.commit(store_mutations_names(this).storeMultipleDatasByIds, infos),
            removeData: (context: DAOContext, infos: { API_TYPE_ID: string, id: number }) => context.commit(store_mutations_names(this).removeData, infos),
            updateData: (context: DAOContext, vo: IDistantVOBase) => context.commit(store_mutations_names(this).updateData, vo),
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IDAOState, any>("DAOStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDAOGetter = namespace('DAOStore', Getter);
export const ModuleDAOAction = namespace('DAOStore', Action);

export const getStoredDatas = read(DAOStore.getInstance().getters.getStoredDatas as GetterHandler<IDAOState, any, any>);