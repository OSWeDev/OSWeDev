import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import PerfMonFuncStat from '../../../../../shared/modules/PerfMon/vos/PerfMonFuncStat';
import IStoreModule from '../../../store/IStoreModule';

export type PerfMonContext = ActionContext<IPerfMonState, any>;

export interface IPerfMonState {
    perfMonFuncStats: { [function_uid: string]: PerfMonFuncStat };
}

export default class PerfMonStore implements IStoreModule<IPerfMonState, PerfMonContext> {

    public static getInstance(): PerfMonStore {
        if (!PerfMonStore.instance) {
            PerfMonStore.instance = new PerfMonStore();
        }
        return PerfMonStore.instance;
    }

    private static instance: PerfMonStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IPerfMonState, PerfMonContext>;
    public mutations: MutationTree<IPerfMonState>;
    public actions: ActionTree<IPerfMonState, PerfMonContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "PerfMonStore";


        this.state = {
            perfMonFuncStats: {}
        };


        this.getters = {
            getPerfMonFuncStats(state: IPerfMonState): { [function_uid: string]: PerfMonFuncStat } {
                return state.perfMonFuncStats;
            },
        };

        this.mutations = {
            setPerfMonFuncStats(state: IPerfMonState, perfMonFuncStats: PerfMonFuncStat[]) {
                if (!perfMonFuncStats) {
                    return;
                }

                for (let i in perfMonFuncStats) {
                    let perfMonFuncStat = perfMonFuncStats[i];

                    Vue.set(state.perfMonFuncStats as any, perfMonFuncStat.function_uid, perfMonFuncStat);
                }
            },
        };



        this.actions = {
            setPerfMonFuncStats(context: PerfMonContext, perfMonFuncStats: PerfMonFuncStat[]) {
                commitSetPerfMonFuncStats(context, perfMonFuncStats);
            },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IPerfMonState, any>("PerfMonStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModulePerfMonGetter = namespace('PerfMonStore', Getter);
export const ModulePerfMonAction = namespace('PerfMonStore', Action);

export const commitSetPerfMonFuncStats = commit(PerfMonStore.getInstance().mutations.setPerfMonFuncStats);