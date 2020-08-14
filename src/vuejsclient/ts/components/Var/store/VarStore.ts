import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IVarDataVOBase from '../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import IStoreModule from '../../../store/IStoreModule';

export type VarContext = ActionContext<IVarState, any>;

export interface IVarState {
    varDatas: { [index: string]: IVarDataVOBase };
    is_waiting: boolean;
    is_stepping: boolean;
    step_number: number;
    desc_mode: boolean;
    desc_selected_index: string;
    desc_opened: boolean;
    desc_deps_opened: boolean;
    desc_registrations_opened: boolean;
    desc_funcstats_opened: boolean;
    dependencies_heatmap_version: number;
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
            is_stepping: false,
            step_number: 1,
            is_waiting: false,
            desc_mode: false,
            desc_selected_index: null,
            desc_opened: false,
            desc_deps_opened: false,
            desc_registrations_opened: false,
            desc_funcstats_opened: false,
            dependencies_heatmap_version: 0
        };


        this.getters = {
            getVarDatas(state: IVarState): { [index: string]: IVarDataVOBase } {
                return state.varDatas;
            },
            isStepping(state: IVarState): boolean {
                return state.is_stepping;
            },
            getStepNumber(state: IVarState): number {
                return state.step_number;
            },
            get_dependencies_heatmap_version(state: IVarState): number {
                return state.dependencies_heatmap_version;
            },
            isWaiting(state: IVarState): boolean {
                return state.is_waiting;
            },
            isDescOpened(state: IVarState): boolean {
                return state.desc_opened;
            },
            isDescDepsOpened(state: IVarState): boolean {
                return state.desc_deps_opened;
            },
            isDescRegistrationsOpened(state: IVarState): boolean {
                return state.desc_registrations_opened;
            },
            isDescFuncStatsOpened(state: IVarState): boolean {
                return state.desc_funcstats_opened;
            },
            isDescMode(state: IVarState): boolean {
                return state.desc_mode;
            },
            getDescSelectedIndex(state: IVarState): string {
                return state.desc_selected_index;
            },
        };

        this.mutations = {

            setStepNumber(state: IVarState, step_number: number) {
                state.step_number = step_number;
                VarsController.getInstance().step_number = step_number;
            },

            set_dependencies_heatmap_version(state: IVarState, dependencies_heatmap_version: number) {
                state.dependencies_heatmap_version = dependencies_heatmap_version;
            },

            setIsWaiting(state: IVarState, is_waiting: boolean) {
                state.is_waiting = is_waiting;
                VarsController.getInstance().is_waiting = is_waiting;
            },

            setIsStepping(state: IVarState, is_stepping: boolean) {
                state.is_stepping = is_stepping;
                VarsController.getInstance().is_stepping = is_stepping;
            },

            setDescOpened(state: IVarState, desc_opened: boolean) {
                state.desc_opened = desc_opened;
            },

            setDescDepsOpened(state: IVarState, desc_deps_opened: boolean) {
                state.desc_deps_opened = desc_deps_opened;
            },

            setDescRegistrationsOpened(state: IVarState, desc_registrations_opened: boolean) {
                state.desc_registrations_opened = desc_registrations_opened;
            },

            setDescFuncStatsOpened(state: IVarState, desc_funcstats_opened: boolean) {
                state.desc_funcstats_opened = desc_funcstats_opened;
            },

            setDescMode(state: IVarState, desc_mode: boolean) {
                state.desc_mode = desc_mode;
            },

            setDescSelectedIndex(state: IVarState, desc_selected_index: string) {
                state.desc_selected_index = desc_selected_index;
                state.desc_opened = true;
                state.desc_deps_opened = false;
            },

            setVarData(state: IVarState, varData: IVarDataVOBase) {
                if (!varData) {
                    return;
                }

                Vue.set(state.varDatas as any, varData.index, varData);
            },

            setVarsData(state: IVarState, varsData: IVarDataVOBase[] | { [index: string]: IVarDataVOBase }) {
                if (!varsData) {
                    return;
                }

                for (let i in varsData) {

                    let varData = varsData[i];

                    Vue.set(state.varDatas as any, varData.index, varData);
                }
            },

            removeVarData(state: IVarState, varData: IVarDataVOBase) {

                if ((!varData) ||
                    (!state.varDatas)) {
                    return;
                }

                try {
                    if (!!state.varDatas[varData.index]) {
                        Vue.delete(state.varDatas, varData.index);
                    }
                } catch (error) {

                }
            },
        };



        this.actions = {
            setIsWaiting(context: VarContext, is_waiting: boolean) {
                commitSetIsWaiting(context, is_waiting);
            },
            setIsStepping(context: VarContext, is_stepping: boolean) {
                commitSetIsStepping(context, is_stepping);
            },
            setDescMode(context: VarContext, desc_mode: boolean) {
                commitSetDescMode(context, desc_mode);
            },

            set_dependencies_heatmap_version(context: VarContext, dependencies_heatmap_version: number) {
                commit_set_dependencies_heatmap_version(context, dependencies_heatmap_version);
            },

            setStepNumber(context: VarContext, step_number: number) {
                commitSetStepNumber(context, step_number);
            },
            setDescOpened(context: VarContext, desc_opened: boolean) {
                commitSetDescOpened(context, desc_opened);
            },
            setDescDepsOpened(context: VarContext, desc_deps_opened: boolean) {
                commitSetDescDepsOpened(context, desc_deps_opened);
            },
            setDescRegistrationsOpened(context: VarContext, desc_registrations_opened: boolean) {
                commitSetDescRegistrationsOpened(context, desc_registrations_opened);
            },
            setDescFuncStatsOpened(context: VarContext, desc_funcstats_opened: boolean) {
                commitsetDescFuncStatsOpened(context, desc_funcstats_opened);
            },
            setDescSelectedIndex(context: VarContext, desc_selected_index: string) {
                commitSetDescSelectedIndex(context, desc_selected_index);
            },
            setVarData(context: VarContext, varData) {
                commitSetVarData(context, varData);
            },
            setVarsData(context: VarContext, varsData: IVarDataVOBase[] | { [index: string]: IVarDataVOBase }) {
                commitSetVarsData(context, varsData);
            },
            removeVarData(context: VarContext, varDataParam: IVarDataVOBase) {
                commitRemoveVarData(context, varDataParam);
            },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IVarState, any>("VarStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleVarGetter = namespace('VarStore', Getter);
export const ModuleVarAction = namespace('VarStore', Action);

export const commitSetVarData = commit(VarStore.getInstance().mutations.setVarData);
export const commitSetVarsData = commit(VarStore.getInstance().mutations.setVarsData);
export const commitRemoveVarData = commit(VarStore.getInstance().mutations.removeVarData);
export const commitSetDescMode = commit(VarStore.getInstance().mutations.setDescMode);
export const commitSetDescOpened = commit(VarStore.getInstance().mutations.setDescOpened);
export const commitSetDescRegistrationsOpened = commit(VarStore.getInstance().mutations.setDescRegistrationsOpened);
export const commitsetDescFuncStatsOpened = commit(VarStore.getInstance().mutations.setDescFuncStatsOpened);
export const commitSetDescDepsOpened = commit(VarStore.getInstance().mutations.setDescDepsOpened);
export const commitSetDescSelectedIndex = commit(VarStore.getInstance().mutations.setDescSelectedIndex);
export const commitSetIsWaiting = commit(VarStore.getInstance().mutations.setIsWaiting);
export const commitSetIsStepping = commit(VarStore.getInstance().mutations.setIsStepping);
export const commitSetStepNumber = commit(VarStore.getInstance().mutations.setStepNumber);
export const commit_set_dependencies_heatmap_version = commit(VarStore.getInstance().mutations.set_dependencies_heatmap_version);
