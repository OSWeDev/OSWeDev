import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors, GetterHandler } from "vuex-typescript";
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import Vue from 'vue';
import IStoreModule from '../../../../../vuejsclient/ts/store/IStoreModule';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';

export type DAOContext = ActionContext<IDAOState, any>;

export interface IDAOState {
    storedDatasArray: IDistantVOBase[][];
}


export default class DAOStore implements IStoreModule<IDAOState, DAOContext> {

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
    public mutations: MutationTree<IDAOState>;
    public actions: ActionTree<IDAOState, DAOContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "DAOStore";


        this.state = {
            storedDatasArray: [],
        };


        this.getters = {
            getStoredDatas(state: IDAOState): { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } } {
                let res: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } } = {};

                for (let i in state.storedDatasArray) {
                    let storedDataArray = state.storedDatasArray[i];

                    if ((!storedDataArray) || (!storedDataArray[0]) || (!storedDataArray[0]._type)) {
                        continue;
                    }

                    res[storedDataArray[0]._type] = VOsTypesManager.getInstance().vosArray_to_vosByIds(storedDataArray);
                }

                return res;
            },
        };



        this.mutations = {

            storeData(state: IDAOState, vo: IDistantVOBase) {

                if ((!vo) || (!vo.id) || (!vo._type)) {
                    return;
                }

                for (let i in state.storedDatasArray) {
                    if (state.storedDatasArray[i] && state.storedDatasArray[i][0] && state.storedDatasArray[i][0]._type == vo._type) {
                        state.storedDatasArray[i].push(vo);
                        return;
                    }
                }

                state.storedDatasArray.push([vo]);
            },

            storeDatas(state: IDAOState, infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) {

                if ((!infos.vos) || (infos.vos.length <= 0) || (!infos.vos[0]._type)) {
                    return;
                }

                for (let i in state.storedDatasArray) {
                    if (state.storedDatasArray[i] && state.storedDatasArray[i][0] && state.storedDatasArray[i][0]._type == infos.vos[0]._type) {
                        Vue.set(state.storedDatasArray, i, infos.vos);
                        return;
                    }
                }
                state.storedDatasArray.push(infos.vos);
            },

            removeData(state: IDAOState, infos: { API_TYPE_ID: string, id: number }) {

                if (!infos.API_TYPE_ID) {
                    return;
                }

                for (let i in state.storedDatasArray) {
                    if (state.storedDatasArray[i] && state.storedDatasArray[i][0] && state.storedDatasArray[i][0]._type == infos.API_TYPE_ID) {

                        for (let j in state.storedDatasArray[i]) {
                            if (state.storedDatasArray[i][j] && (state.storedDatasArray[i][j].id == infos.id)) {

                                state.storedDatasArray[i].splice(parseInt(j.toString()), 1);
                                return;
                            }
                        }
                        return;
                    }
                }
            },

            updateData(state: IDAOState, vo: IDistantVOBase) {


                if ((!vo) || (!vo._type)) {
                    return;
                }

                for (let i in state.storedDatasArray) {
                    if (state.storedDatasArray[i] && state.storedDatasArray[i][0] && state.storedDatasArray[i][0]._type == vo._type) {

                        for (let j in state.storedDatasArray[i]) {
                            if (state.storedDatasArray[i][j] && (state.storedDatasArray[i][j].id == vo.id)) {

                                Vue.set(state.storedDatasArray[i], j, vo);
                                return;
                            }
                        }
                        return;
                    }
                }
            },
        };



        this.actions = {
            storeData(context: DAOContext, vo: IDistantVOBase) {
                commitStoreData(context, vo);
            },
            storeDatas(context: DAOContext, infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) {
                commitStoreDatas(context, infos);
            },
            removeData(context: DAOContext, infos: { API_TYPE_ID: string, id: number }) {
                commitRemoveData(context, infos);
            },
            updateData(context: DAOContext, vo: IDistantVOBase) {
                commitUpdateData(context, vo);
            }
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IDAOState, any>("DAOStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDAOGetter = namespace('DAOStore', Getter);
export const ModuleDAOAction = namespace('DAOStore', Action);

export const getStoredDatas = read(DAOStore.getInstance().getters.getStoredDatas as GetterHandler<IDAOState, any, any>);

export const commitStoreData = commit(DAOStore.getInstance().mutations.storeData);
export const commitStoreDatas = commit(DAOStore.getInstance().mutations.storeDatas);
export const commitRemoveData = commit(DAOStore.getInstance().mutations.removeData);
export const commitUpdateData = commit(DAOStore.getInstance().mutations.updateData);
