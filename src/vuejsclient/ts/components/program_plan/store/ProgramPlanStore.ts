import { Moment } from 'moment';
import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDVPrep from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTargetFacilitator from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetFacilitator';
import IPlanTargetGroup from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetGroup';
import IPlanTargetRegion from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetRegion';
import IPlanTargetZone from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetZone';
import IPlanTask from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import IPlanTaskType from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import IStoreModule from '../../../store/IStoreModule';

export type ProgramPlanContext = ActionContext<IProgramPlanState, any>;

export interface IProgramPlanState {
    task_types_by_ids: { [id: number]: IPlanTaskType };
    tasks_by_ids: { [id: number]: IPlanTask };
    enseignes_by_ids: { [id: number]: IPlanEnseigne };
    targets_by_ids: { [id: number]: IPlanTarget };
    facilitators_by_ids: { [id: number]: IPlanFacilitator };
    targets_regions_by_ids: { [id: number]: IPlanTargetRegion };
    targets_zones_by_ids: { [id: number]: IPlanTargetZone };
    targets_groups_by_ids: { [id: number]: IPlanTargetGroup };
    targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator };
    managers_by_ids: { [id: number]: IPlanManager };
    rdvs_by_ids: { [id: number]: IPlanRDV };
    crs_by_ids: { [id: number]: IPlanRDVCR };
    preps_by_ids: { [id: number]: IPlanRDVPrep };
    partners_by_ids: { [id: number]: IPlanPartner };
    can_edit_any: boolean;
    can_edit_all: boolean;
    can_edit_own_team: boolean;
    can_edit_self: boolean;
    can_see_fc: boolean;
    selected_rdv: IPlanRDV;
    filter_date_debut: Moment;
    filter_date_fin: Moment;
    printable_table_weeks: any;
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
            targets_regions_by_ids: {},
            targets_zones_by_ids: {},
            task_types_by_ids: {},
            tasks_by_ids: {},
            targets_by_ids: {},
            enseignes_by_ids: {},
            facilitators_by_ids: {},
            managers_by_ids: {},
            rdvs_by_ids: {},
            crs_by_ids: {},
            preps_by_ids: {},
            partners_by_ids: {},
            can_edit_any: false,
            can_edit_all: false,
            can_edit_own_team: false,
            can_edit_self: false,
            can_see_fc: false,
            selected_rdv: null,
            targets_facilitators_by_ids: {},
            filter_date_debut: null,
            filter_date_fin: null,
            printable_table_weeks: {},
            targets_groups_by_ids: {}
        };


        this.getters = {
            targets_groups_by_ids: (state: IProgramPlanState): any => state.targets_groups_by_ids,

            targets_regions_by_ids: (state: IProgramPlanState): any => state.targets_regions_by_ids,
            targets_zones_by_ids: (state: IProgramPlanState): any => state.targets_zones_by_ids,

            printable_table_weeks: (state: IProgramPlanState): any => state.printable_table_weeks,

            filter_date_debut: (state: IProgramPlanState): Moment => state.filter_date_debut,
            filter_date_fin: (state: IProgramPlanState): Moment => state.filter_date_fin,

            can_edit_any: (state: IProgramPlanState): boolean => state.can_edit_any,
            can_edit_all: (state: IProgramPlanState): boolean => state.can_edit_all,
            can_edit_own_team: (state: IProgramPlanState): boolean => state.can_edit_own_team,
            can_edit_self: (state: IProgramPlanState): boolean => state.can_edit_self,
            can_see_fc: (state: IProgramPlanState): boolean => state.can_see_fc,

            get_targets_facilitators_by_ids: (state: IProgramPlanState): { [id: number]: IPlanTargetFacilitator } => state.targets_facilitators_by_ids,
            get_facilitators_by_target_ids: (state: IProgramPlanState): { [target_id: number]: IPlanFacilitator[] } => {
                let res: { [target_id: number]: IPlanFacilitator[] } = {};

                for (let i in state.targets_facilitators_by_ids) {
                    let target_facilitator: IPlanTargetFacilitator = state.targets_facilitators_by_ids[i];

                    if (!res[target_facilitator.target_id]) {
                        res[target_facilitator.target_id] = [];
                    }
                    res[target_facilitator.target_id].push(state.facilitators_by_ids[target_facilitator.facilitator_id]);
                }

                return res;
            },

            selected_rdv: (state: IProgramPlanState): IPlanRDV => state.selected_rdv,

            selected_rdv_historics: (state: IProgramPlanState): IPlanRDV[] => {

                if (!state.selected_rdv) {
                    return [];
                }

                let res: IPlanRDV[] = [];

                for (let i in state.rdvs_by_ids) {
                    let rdv = state.rdvs_by_ids[i];

                    if (rdv.target_id != state.selected_rdv.target_id) {
                        continue;
                    }

                    if (rdv.start_time.isSameOrAfter(state.selected_rdv.start_time)) {
                        continue;
                    }

                    res.push(rdv);
                }

                res.sort((a: IPlanRDV, b: IPlanRDV) => b.start_time.diff(a.start_time));

                return res;
            },

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
            set_targets_groups_by_ids: (state: IProgramPlanState, targets_groups_by_ids: { [id: number]: IPlanTargetGroup }): any => state.targets_groups_by_ids = targets_groups_by_ids,

            set_targets_regions_by_ids: (state: IProgramPlanState, targets_regions_by_ids: { [id: number]: IPlanTargetRegion }) => state.targets_regions_by_ids = targets_regions_by_ids,
            set_targets_zones_by_ids: (state: IProgramPlanState, targets_zones_by_ids: { [id: number]: IPlanTargetZone }) => state.targets_zones_by_ids = targets_zones_by_ids,

            set_printable_table_weeks: (state: IProgramPlanState, printable_table_weeks: any) => state.printable_table_weeks = printable_table_weeks,

            set_filter_date_debut: (state: IProgramPlanState, filter_date_debut: Moment) => state.filter_date_debut = filter_date_debut,
            set_filter_date_fin: (state: IProgramPlanState, filter_date_fin: Moment) => state.filter_date_fin = filter_date_fin,

            set_targets_facilitators_by_ids: (state: IProgramPlanState, targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator }) => state.targets_facilitators_by_ids = targets_facilitators_by_ids,

            set_can_edit_any: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_any = can_edit,
            set_can_edit_all: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_all = can_edit,
            set_can_edit_own_team: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_own_team = can_edit,
            set_can_edit_self: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_self = can_edit,
            set_can_see_fc: (state: IProgramPlanState, can_edit: boolean) => state.can_see_fc = can_edit,

            set_selected_rdv: (state: IProgramPlanState, selected_rdv: IPlanRDV) => state.selected_rdv = selected_rdv,


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
            set_targets_groups_by_ids: (context: ProgramPlanContext, targets_groups_by_ids: { [id: number]: IPlanTargetGroup }): any => commit_set_targets_groups_by_ids(context, targets_groups_by_ids),

            set_targets_regions_by_ids: (context: ProgramPlanContext, targets_regions_by_ids: { [id: number]: IPlanTargetRegion }) => commit_set_targets_regions_by_ids(context, targets_regions_by_ids),
            set_targets_zones_by_ids: (context: ProgramPlanContext, targets_zones_by_ids: { [id: number]: IPlanTargetZone }) => commit_set_targets_zones_by_ids(context, targets_zones_by_ids),

            set_printable_table_weeks: (context: ProgramPlanContext, printable_table_weeks: any) => commit_set_printable_table_weeks(context, printable_table_weeks),

            set_filter_date_debut: (context: ProgramPlanContext, filter_date_debut: Moment) => commit_set_filter_date_debut(context, filter_date_debut),
            set_filter_date_fin: (context: ProgramPlanContext, filter_date_fin: Moment) => commit_set_filter_date_fin(context, filter_date_fin),

            set_targets_facilitators_by_ids: (context: ProgramPlanContext, targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator }) => commit_set_targets_facilitators_by_ids(context, targets_facilitators_by_ids),

            set_tasks_by_ids(context: ProgramPlanContext, tasks_by_ids: { [id: number]: IPlanTask }) {
                commit_set_tasks_by_ids(context, tasks_by_ids);
            },
            set_task_types_by_ids(context: ProgramPlanContext, task_types_by_ids: { [id: number]: IPlanTaskType }) {
                commit_set_task_types_by_ids(context, task_types_by_ids);
            },
            set_selected_rdv(context: ProgramPlanContext, selected_rdv: IPlanRDV) {
                commit_set_selected_rdv(context, selected_rdv);
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

            set_can_edit_any: (context: ProgramPlanContext, can_edit: boolean) => comit_set_can_edit_any(context, can_edit),
            set_can_edit_all: (context: ProgramPlanContext, can_edit: boolean) => comit_set_can_edit_all(context, can_edit),
            set_can_edit_own_team: (context: ProgramPlanContext, can_edit: boolean) => comit_set_can_edit_own_team(context, can_edit),
            set_can_edit_self: (context: ProgramPlanContext, can_edit: boolean) => comit_set_can_edit_self(context, can_edit),
            set_can_see_fc: (context: ProgramPlanContext, can_edit: boolean) => comit_set_can_see_fc(context, can_edit),

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

export const commit_set_filter_date_debut = commit(ProgramPlanStore.getInstance().mutations.set_filter_date_debut);
export const commit_set_filter_date_fin = commit(ProgramPlanStore.getInstance().mutations.set_filter_date_fin);

export const commitSetRdvById = commit(ProgramPlanStore.getInstance().mutations.setRdvById);
export const commitSetCrById = commit(ProgramPlanStore.getInstance().mutations.setCrById);
export const commitRemoveRdv = commit(ProgramPlanStore.getInstance().mutations.removeRdv);
export const commitRemoveCr = commit(ProgramPlanStore.getInstance().mutations.removeCr);
export const commitUpdateRdv = commit(ProgramPlanStore.getInstance().mutations.updateRdv);
export const commitUpdateCr = commit(ProgramPlanStore.getInstance().mutations.updateCr);
export const commitSetPrepById = commit(ProgramPlanStore.getInstance().mutations.setPrepById);
export const commitRemovePrep = commit(ProgramPlanStore.getInstance().mutations.removePrep);
export const commitUpdatePrep = commit(ProgramPlanStore.getInstance().mutations.updatePrep);

export const commit_set_selected_rdv = commit(ProgramPlanStore.getInstance().mutations.set_selected_rdv);

export const commit_set_targets_groups_by_ids = commit(ProgramPlanStore.getInstance().mutations.set_targets_groups_by_ids);

export const commit_set_printable_table_weeks = commit(ProgramPlanStore.getInstance().mutations.set_printable_table_weeks);

export const commit_set_targets_facilitators_by_ids = commit(ProgramPlanStore.getInstance().mutations.set_targets_facilitators_by_ids);

export const commit_set_targets_regions_by_ids = commit(ProgramPlanStore.getInstance().mutations.set_targets_regions_by_ids);
export const commit_set_targets_zones_by_ids = commit(ProgramPlanStore.getInstance().mutations.set_targets_zones_by_ids);

export const comit_set_can_edit_any = commit(ProgramPlanStore.getInstance().mutations.set_can_edit_any);
export const comit_set_can_edit_all = commit(ProgramPlanStore.getInstance().mutations.set_can_edit_all);
export const comit_set_can_edit_own_team = commit(ProgramPlanStore.getInstance().mutations.set_can_edit_own_team);
export const comit_set_can_edit_self = commit(ProgramPlanStore.getInstance().mutations.set_can_edit_self);
export const comit_set_can_see_fc = commit(ProgramPlanStore.getInstance().mutations.set_can_see_fc);
