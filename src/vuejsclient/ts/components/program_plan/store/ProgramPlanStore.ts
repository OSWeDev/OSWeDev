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

export type ProgramPlanContext = ActionContext<IProgramPlanState, any>;

export interface IProgramPlanState {
    enseignes_by_ids: { [id: number]: IPlanEnseigne };
    targets_by_ids: { [id: number]: IPlanTarget };
    facilitators_by_ids: { [id: number]: IPlanFacilitator };
    managers_by_ids: { [id: number]: IPlanManager };
    rdvs_by_ids: { [id: number]: IPlanRDV };
    crs_by_ids: { [id: number]: IPlanRDVCR };
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
            targets_by_ids: {},
            facilitators_by_ids: {},
            managers_by_ids: {},
            rdvs_by_ids: {},
            crs_by_ids: {},
            partners_by_ids: {}
        };


        this.getters = {
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
            getPartnersByIds(state: IProgramPlanState): { [id: number]: IPlanPartner } {
                return state.partners_by_ids;
            },
        };

        this.mutations = {

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

            removeRdv(state: IProgramPlanState, id: number) {

                Vue.delete(state.rdvs_by_ids as any, id);
            },

            removeCr(state: IProgramPlanState, id: number) {

                Vue.delete(state.crs_by_ids as any, id);
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
        };



        this.actions = {
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

            setRdvById(context: ProgramPlanContext, vo: IPlanRDV) {
                commitSetRdvById(context, vo);
            },
            setCrById(context: ProgramPlanContext, vo: IPlanRDV) {
                commitSetCrById(context, vo);
            },

            removeRdv(context: ProgramPlanContext, id: number) {
                commitRemoveRdv(context, id);
            },
            removeCr(context: ProgramPlanContext, id: number) {
                commitRemoveCr(context, id);
            },

            updateRdv(context: ProgramPlanContext, vo: IPlanRDV) {
                commitUpdateRdv(context, vo);
            },
            updateCr(context: ProgramPlanContext, vo: IPlanRDVCR) {
                commitUpdateCr(context, vo);
            }
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

export const commitSetRdvsByIds = commit(ProgramPlanStore.getInstance().mutations.setRdvsByIds);
export const commitSetCrsByIds = commit(ProgramPlanStore.getInstance().mutations.setCrsByIds);

export const commitSetRdvById = commit(ProgramPlanStore.getInstance().mutations.setRdvById);
export const commitSetCrById = commit(ProgramPlanStore.getInstance().mutations.setCrById);
export const commitRemoveRdv = commit(ProgramPlanStore.getInstance().mutations.removeRdv);
export const commitRemoveCr = commit(ProgramPlanStore.getInstance().mutations.removeCr);
export const commitUpdateRdv = commit(ProgramPlanStore.getInstance().mutations.updateRdv);
export const commitUpdateCr = commit(ProgramPlanStore.getInstance().mutations.updateCr);