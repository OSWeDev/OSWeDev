import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors, GetterHandler } from "vuex-typescript";
import VarGroupControllerBase from '../../../../../shared/modules/Var/VarGroupControllerBase';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import IVarDataParamVOBase from '../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IStoreModule from '../../../store/IStoreModule';
import VarGroupConfVOBase from '../../../../../shared/modules/Var/vos/VarGroupConfVOBase';

export type VarContext = ActionContext<IVarState, any>;

export interface IVarState {
    varDatas: { [index: string]: IVarDataVOBase };
    is_updating: boolean;
}


export default class VarStore implements IStoreModule<IVarState, VarContext> {

    public static getInstance(): VarStore {
        if (!VarStore.instance) {
            VarStore.instance = new VarStore();
        }
        return VarStore.instance;
    }

    private static instance: VarStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IVarState, VarContext>;
    public mutations: MutationTree<IVarState>;
    public actions: ActionTree<IVarState, VarContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "VarStore";


        this.state = {
            varDatas: {},
            is_updating: false
        };


        this.getters = {
            getVarDatas(state: IVarState): { [index: string]: IVarDataVOBase } {
                return state.varDatas;
            },
            isUpdating(state: IVarState): boolean {
                return state.is_updating;
            }
        };

        this.mutations = {

            setIsUpdating(state: IVarState, is_updating: boolean) {
                state.is_updating = is_updating;
            },

            setVarData(state: IVarState, varData: IVarDataVOBase) {
                if (!varData) {
                    return;
                }

                let varGroupController: VarGroupControllerBase<any, any, any> = VarsController.getInstance().getVarGroupControllerById(varData.id);
                if (!varGroupController) {
                    return;
                }

                let index: string = varGroupController.varDataParamController.getIndex(varData);

                Vue.set(state.varDatas as any, index, varData);
            },

            removeVarData(state: IVarState, varDataParam: IVarDataParamVOBase) {

                if ((!varDataParam) ||
                    (!state.varDatas)) {
                    return;
                }

                let varGroupController: VarGroupControllerBase<any, any, any> = VarsController.getInstance().getVarGroupControllerById(varDataParam.id);
                if (!varGroupController) {
                    return;
                }

                let index: string = varGroupController.varDataParamController.getIndex(varDataParam);

                try {
                    Vue.delete(state.varDatas, index);
                } catch (error) {

                }
            },
        };



        this.actions = {
            setIsUpdating(context: VarContext, is_updating: boolean) {
                commitSetIsUpdating(context, is_updating);
            },
            setVarData(context: VarContext, varGroupData) {
                commitSetVarData(context, varGroupData);
            },
            removeVarData(context: VarContext, varDataParam: IVarDataParamVOBase) {
                commitRemoveVarData(context, varDataParam);
            }
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IVarState, any>("VarStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleVarGetter = namespace('VarStore', Getter);
export const ModuleVarAction = namespace('VarStore', Action);

export const getStoredDatas = read(VarStore.getInstance().getters.getStoredDatas as GetterHandler<IVarState, any, any>);

export const commitSetVarData = commit(VarStore.getInstance().mutations.setVarData);
export const commitRemoveVarData = commit(VarStore.getInstance().mutations.removeVarData);
export const commitSetIsUpdating = commit(VarStore.getInstance().mutations.setIsUpdating);
