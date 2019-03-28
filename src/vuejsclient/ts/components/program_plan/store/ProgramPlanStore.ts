import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors, GetterHandler } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanManager from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanFacilitator from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDVCR from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanPartner from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanTaskType from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import IPlanTask from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import IPlanRDVPrep from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';

export type ProgramPlanContext = ActionContext<IProgramPlanState, any>;

export interface IProgramPlanState {
    task_types_by_ids: { [id: number]: IPlanTaskType };
    tasks_by_ids: { [id: number]: IPlanTask };
    enseignes_by_ids: { [id: number]: IPlanEnseigne };
    targets_by_ids: { [id: number]: IPlanTarget };
    facilitators_by_ids: { [id: number]: IPlanFacilitator };
    managers_by_ids: { [id: number]: IPlanManager };
    rdvs_by_ids: { [id: number]: IPlanRDV };
    crs_by_ids: { [id: number]: IPlanRDVCR };
    preps_by_ids: { [id: number]: IPlanRDVPrep };
    partners_by_ids: { [id: number]: IPlanPartner };
}



export default class ProgramPlanStore implements IStoreModule<IProgramPlanState, ProgramPlanContext> {

    public static getInstance(): ProgramPlanStore {
        if (!ProgramPlanStore.instance) {
            ProgramPlanStore.instance = new ProgramPlanStore();
        }
        return ProgramPlanStore.instance;
    }

    private static instance: ProgramPlanStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IProgramPlanState, ProgramPlanContext>;
    public mutations: MutationTree<IProgramPlanState>;
    public actions: ActionTree<IProgramPlanState, ProgramPlanContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "ProgramPlanStore";


        this.state = {
            task_types_by_ids: {},
            tasks_by_ids: {},
            targets_by_ids: {},
            facilitators_by_ids: {},
            managers_by_ids: {},
            rdvs_by_ids: {},
            crs_by_ids: {},
            preps_by_ids: {},
            partners_by_ids: {}
        };


        this.getters = {
            get_task_types_by_ids(state: IProgramPlanState): { [id: number]: IPlanTaskType } {
                return state.task_types_by_ids;
            },
            get_tasks_by_ids(state: IProgramPlanState): { [id: number]: IPlanTask } {
                return state.tasks_by_ids;
            },
            getEnseignesByIds(state: IProgramPlanState): { [id: number]: IPlanEnseigne } {
                return state.enseignes_by_ids;
            },
            getTargetsByIds(state: IProgramPlanState): { [id: number]: IPlanTarget } {
                return state.targets_by_ids;
            },
            getFacilitatorsByIds(state: IProgramPlanState): { [id: number]: IPlanFacilitator } {
                return state.facilitators_by_ids;
            },
            getManagersByIds(state: IProgramPlanState): { [id: number]: IPlanManager } {
                return state.managers_by_ids;
            },
            getRdvsByIds(state: IProgramPlanState): { [id: number]: IPlanRDV } {
                return state.rdvs_by_ids;
            },
            getCrsByIds(state: IProgramPlanState): { [id: number]: IPlanRDVCR } {
                return state.crs_by_ids;
            },
            getPrepsByIds(state: IProgramPlanState): { [id: number]: IPlanRDVPrep } {
                return state.preps_by_ids;
            },
            getPartnersByIds(state: IProgramPlanState): { [id: number]: IPlanPartner } {
                return state.partners_by_ids;
            },
        };

        this.mutations = {

            set_task_types_by_ids(state: IProgramPlanState, task_types_by_ids: { [id: number]: IPlanTaskType }) {
                state.task_types_by_ids = task_types_by_ids;
            },

            set_tasks_by_ids(state: IProgramPlanState, tasks_by_ids: { [id: number]: IPlanTask }) {
                state.tasks_by_ids = tasks_by_ids;
            },

            setEnseignesByIds(state: IProgramPlanState, enseignes_by_ids: { [id: number]: IPlanEnseigne }) {
                state.enseignes_by_ids = enseignes_by_ids;
            },

            setTargetsByIds(state: IProgramPlanState, targets_by_ids: { [id: number]: IPlanTarget }) {
                state.targets_by_ids = targets_by_ids;
            },

            setFacilitatorsByIds(state: IProgramPlanState, facilitators_by_ids: { [id: number]: IPlanFacilitator }) {
                state.facilitators_by_ids = facilitators_by_ids;
            },

            setManagersByIds(state: IProgramPlanState, managers_by_ids: { [id: number]: IPlanManager }) {
                state.managers_by_ids = managers_by_ids;
            },

            setPartnersByIds(state: IProgramPlanState, partners_by_ids: { [id: number]: IPlanPartner }) {
                state.partners_by_ids = partners_by_ids;
            },

            setRdvsByIds(state: IProgramPlanState, rdvs_by_ids: { [id: number]: IPlanRDV }) {
                state.rdvs_by_ids = rdvs_by_ids;
            },

            setCrsByIds(state: IProgramPlanState, crs_by_ids: { [id: number]: IPlanRDVCR }) {
                state.crs_by_ids = crs_by_ids;
            },

            setPrepsByIds(state: IProgramPlanState, preps_by_ids: { [id: number]: IPlanRDVPrep }) {
                state.preps_by_ids = preps_by_ids;
            },

            setRdvById(state: IProgramPlanState, vo: IPlanRDV) {

                if (!vo) {
                    return;
                }

                if (!state.rdvs_by_ids[vo.id]) {
                    Vue.set(state.rdvs_by_ids as any, vo.id, vo);
                    return;
                }
                state.rdvs_by_ids[vo.id] = vo;
            },

            setCrById(state: IProgramPlanState, vo: IPlanRDVCR) {

                if (!vo) {
                    return;
                }

                if (!state.crs_by_ids[vo.id]) {
                    Vue.set(state.crs_by_ids as any, vo.id, vo);
                    return;
                }
                state.crs_by_ids[vo.id] = vo;
            },

            setPrepById(state: IProgramPlanState, vo: IPlanRDVPrep) {

                if (!vo) {
                    return;
                }

                if (!state.preps_by_ids[vo.id]) {
                    Vue.set(state.preps_by_ids as any, vo.id, vo);
                    return;
                }
                state.preps_by_ids[vo.id] = vo;
            },

            removeRdv(state: IProgramPlanState, id: number) {

                Vue.delete(state.rdvs_by_ids as any, id);
            },

            removeCr(state: IProgramPlanState, id: number) {

                Vue.delete(state.crs_by_ids as any, id);
            },

            removePrep(state: IProgramPlanState, id: number) {

                Vue.delete(state.preps_by_ids as any, id);
            },

            updateRdv(state: IProgramPlanState, vo: IPlanRDV) {

                if (!vo) {
                    return;
                }

                state.rdvs_by_ids[vo.id] = vo;
            },

            updateCr(state: IProgramPlanState, vo: IPlanRDVCR) {

                if (!vo) {
                    return;
                }

                state.crs_by_ids[vo.id] = vo;
            },

            updatePrep(state: IProgramPlanState, vo: IPlanRDVPrep) {

                if (!vo) {
                    return;
                }

                state.preps_by_ids[vo.id] = vo;
            },
        };



        this.actions = {
            set_tasks_by_ids(context: ProgramPlanContext, tasks_by_ids: { [id: number]: IPlanTask }) {
                commit_set_tasks_by_ids(context, tasks_by_ids);
            },
            set_task_types_by_ids(context: ProgramPlanContext, task_types_by_ids: { [id: number]: IPlanTaskType }) {
                commit_set_task_types_by_ids(context, task_types_by_ids);
            },
            setEnseignesByIds(context: ProgramPlanContext, enseignes_by_ids: { [id: number]: IPlanEnseigne }) {
                commitSetEnseignesByIds(context, enseignes_by_ids);
            },
            setTargetsByIds(context: ProgramPlanContext, targets_by_ids: { [id: number]: IPlanTarget }) {
                commitSetTargetsByIds(context, targets_by_ids);
            },
            setFacilitatorsByIds(context: ProgramPlanContext, facilitators_by_ids: { [id: number]: IPlanFacilitator }) {
                commitSetFacilitatorsByIds(context, facilitators_by_ids);
            },
            setPartnersByIds(context: ProgramPlanContext, partners_by_ids: { [id: number]: IPlanPartner }) {
                commitSetPartnersByIds(context, partners_by_ids);
            },
            setManagersByIds(context: ProgramPlanContext, managers_by_ids: { [id: number]: IPlanManager }) {
                commitSetManagersByIds(context, managers_by_ids);
            },

            setRdvsByIds(context: ProgramPlanContext, rdvs_by_ids: { [id: number]: IPlanRDV }) {
                commitSetRdvsByIds(context, rdvs_by_ids);
            },
            setCrsByIds(context: ProgramPlanContext, crs_by_ids: { [id: number]: IPlanRDVCR }) {
                commitSetCrsByIds(context, crs_by_ids);
            },
            setPrepsByIds(context: ProgramPlanContext, preps_by_ids: { [id: number]: IPlanRDVCR }) {
                commitSetPrepsByIds(context, preps_by_ids);
            },

            setRdvById(context: ProgramPlanContext, vo: IPlanRDV) {
                commitSetRdvById(context, vo);
            },
            setCrById(context: ProgramPlanContext, vo: IPlanRDVCR) {
                commitSetCrById(context, vo);
            },
            setPrepById(context: ProgramPlanContext, vo: IPlanRDVPrep) {
                commitSetPrepById(context, vo);
            },

            removeRdv(context: ProgramPlanContext, id: number) {
                commitRemoveRdv(context, id);
            },
            removeCr(context: ProgramPlanContext, id: number) {
                commitRemoveCr(context, id);
            },
            removePrep(context: ProgramPlanContext, id: number) {
                commitRemovePrep(context, id);
            },

            updateRdv(context: ProgramPlanContext, vo: IPlanRDV) {
                commitUpdateRdv(context, vo);
            },
            updateCr(context: ProgramPlanContext, vo: IPlanRDVCR) {
                commitUpdateCr(context, vo);
            },
            updatePrep(context: ProgramPlanContext, vo: IPlanRDVPrep) {
                commitUpdatePrep(context, vo);
            },

            addRdvsByIds(context: ProgramPlanContext, rdvs_by_ids: { [id: number]: IPlanRDV }) {

                for (let i in rdvs_by_ids) {
                    let rdv = rdvs_by_ids[i];

                    commitSetRdvById(context, rdv);
                }
            },

            addCrsByIds(context: ProgramPlanContext, crs_by_ids: { [id: number]: IPlanRDVCR }) {

                for (let i in crs_by_ids) {
                    let cr = crs_by_ids[i];

                    commitSetCrById(context, cr);
                }
            },

            addPrepsByIds(context: ProgramPlanContext, preps_by_ids: { [id: number]: IPlanRDVPrep }) {

                for (let i in preps_by_ids) {
                    let prep = preps_by_ids[i];

                    commitSetPrepById(context, prep);
                }
            },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IProgramPlanState, any>("ProgramPlanStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleProgramPlanGetter = namespace('ProgramPlanStore', Getter);
export const ModuleProgramPlanAction = namespace('ProgramPlanStore', Action);

export const commitSetEnseignesByIds = commit(ProgramPlanStore.getInstance().mutations.setEnseignesByIds);
export const commitSetTargetsByIds = commit(ProgramPlanStore.getInstance().mutations.setTargetsByIds);
export const commitSetFacilitatorsByIds = commit(ProgramPlanStore.getInstance().mutations.setFacilitatorsByIds);
export const commitSetManagersByIds = commit(ProgramPlanStore.getInstance().mutations.setManagersByIds);
export const commitSetPartnersByIds = commit(ProgramPlanStore.getInstance().mutations.setPartnersByIds);
export const commitSetPrepsByIds = commit(ProgramPlanStore.getInstance().mutations.setPrepsByIds);
export const commitSetRdvsByIds = commit(ProgramPlanStore.getInstance().mutations.setRdvsByIds);
export const commitSetCrsByIds = commit(ProgramPlanStore.getInstance().mutations.setCrsByIds);

export const commit_set_task_types_by_ids = commit(ProgramPlanStore.getInstance().mutations.set_task_types_by_ids);
export const commit_set_tasks_by_ids = commit(ProgramPlanStore.getInstance().mutations.set_tasks_by_ids);

export const commitSetRdvById = commit(ProgramPlanStore.getInstance().mutations.setRdvById);
export const commitSetCrById = commit(ProgramPlanStore.getInstance().mutations.setCrById);
export const commitRemoveRdv = commit(ProgramPlanStore.getInstance().mutations.removeRdv);
export const commitRemoveCr = commit(ProgramPlanStore.getInstance().mutations.removeCr);
export const commitUpdateRdv = commit(ProgramPlanStore.getInstance().mutations.updateRdv);
export const commitUpdateCr = commit(ProgramPlanStore.getInstance().mutations.updateCr);
export const commitSetPrepById = commit(ProgramPlanStore.getInstance().mutations.setPrepById);
export const commitRemovePrep = commit(ProgramPlanStore.getInstance().mutations.removePrep);
export const commitUpdatePrep = commit(ProgramPlanStore.getInstance().mutations.updatePrep);