import { cloneDeep } from 'lodash';

import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
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
import { store_mutations_names } from '../../../store/StoreModuleBase';

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
    refresh: boolean;
    selected_rdv: IPlanRDV;
    filter_date_debut: number;
    filter_date_fin: number;
    printable_table_weeks: any;
}



export default class ProgramPlanStore implements IStoreModule<IProgramPlanState, ProgramPlanContext> {

    // istanbul ignore next: nothing to test
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
    public mutations = {
        set_targets_groups_by_ids: (state: IProgramPlanState, targets_groups_by_ids: { [id: number]: IPlanTargetGroup }): any => state.targets_groups_by_ids = targets_groups_by_ids,

        set_targets_regions_by_ids: (state: IProgramPlanState, targets_regions_by_ids: { [id: number]: IPlanTargetRegion }) => state.targets_regions_by_ids = targets_regions_by_ids,
        set_targets_zones_by_ids: (state: IProgramPlanState, targets_zones_by_ids: { [id: number]: IPlanTargetZone }) => state.targets_zones_by_ids = targets_zones_by_ids,

        set_printable_table_weeks: (state: IProgramPlanState, printable_table_weeks: any) => state.printable_table_weeks = printable_table_weeks,

        set_filter_date_debut: (state: IProgramPlanState, filter_date_debut: number) => state.filter_date_debut = filter_date_debut,
        set_filter_date_fin: (state: IProgramPlanState, filter_date_fin: number) => state.filter_date_fin = filter_date_fin,

        set_targets_facilitators_by_ids: (state: IProgramPlanState, targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator }) => state.targets_facilitators_by_ids = targets_facilitators_by_ids,

        set_can_edit_any: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_any = can_edit,
        set_can_edit_all: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_all = can_edit,
        set_can_edit_own_team: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_own_team = can_edit,
        set_can_edit_self: (state: IProgramPlanState, can_edit: boolean) => state.can_edit_self = can_edit,
        set_can_see_fc: (state: IProgramPlanState, can_edit: boolean) => state.can_see_fc = can_edit,
        set_refresh: (state: IProgramPlanState, refresh: boolean) => state.refresh = refresh,

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

        setTargetById(state: IProgramPlanState, vo: IPlanTarget) {

            if (!vo) {
                return;
            }

            if (!state.targets_by_ids[vo.id]) {
                Vue.set(state.targets_by_ids as any, vo.id, cloneDeep(vo));
                return;
            }
            state.targets_by_ids[vo.id] = cloneDeep(vo);
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
            refresh: false,
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

            filter_date_debut: (state: IProgramPlanState): number => state.filter_date_debut,
            filter_date_fin: (state: IProgramPlanState): number => state.filter_date_fin,

            can_edit_any: (state: IProgramPlanState): boolean => state.can_edit_any,
            can_edit_all: (state: IProgramPlanState): boolean => state.can_edit_all,
            can_edit_own_team: (state: IProgramPlanState): boolean => state.can_edit_own_team,
            can_edit_self: (state: IProgramPlanState): boolean => state.can_edit_self,
            can_see_fc: (state: IProgramPlanState): boolean => state.can_see_fc,
            get_refresh: (state: IProgramPlanState): boolean => state.refresh,

            get_targets_facilitators_by_ids: (state: IProgramPlanState): { [id: number]: IPlanTargetFacilitator } => state.targets_facilitators_by_ids,
            get_targets_facilitators_by_facilitator_ids: (state: IProgramPlanState): { [facilitator_id: number]: IPlanTargetFacilitator[] } => {
                const res: { [facilitator_id: number]: IPlanTargetFacilitator[] } = {};

                for (const i in state.targets_facilitators_by_ids) {
                    const target_facilitator: IPlanTargetFacilitator = state.targets_facilitators_by_ids[i];

                    if (!res[target_facilitator.facilitator_id]) {
                        res[target_facilitator.facilitator_id] = [];
                    }
                    res[target_facilitator.facilitator_id].push(target_facilitator);
                }

                return res;
            },
            get_targets_facilitators_by_target_ids: (state: IProgramPlanState): { [target_id: number]: IPlanTargetFacilitator[] } => {
                const res: { [target_id: number]: IPlanTargetFacilitator[] } = {};

                for (const i in state.targets_facilitators_by_ids) {
                    const target_facilitator: IPlanTargetFacilitator = state.targets_facilitators_by_ids[i];

                    if (!res[target_facilitator.target_id]) {
                        res[target_facilitator.target_id] = [];
                    }
                    res[target_facilitator.target_id].push(target_facilitator);
                }

                return res;
            },
            get_facilitators_by_target_ids: (state: IProgramPlanState): { [target_id: number]: IPlanFacilitator[] } => {
                const res: { [target_id: number]: IPlanFacilitator[] } = {};

                for (const i in state.targets_facilitators_by_ids) {
                    const target_facilitator: IPlanTargetFacilitator = state.targets_facilitators_by_ids[i];

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

                const res: IPlanRDV[] = [];

                for (const i in state.rdvs_by_ids) {
                    const rdv = state.rdvs_by_ids[i];

                    if (rdv.target_id != state.selected_rdv.target_id) {
                        continue;
                    }

                    if (rdv.start_time >= state.selected_rdv.start_time) {
                        continue;
                    }

                    res.push(rdv);
                }

                res.sort((a: IPlanRDV, b: IPlanRDV) => b.start_time - a.start_time);

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

        this.actions = {
            set_targets_groups_by_ids: (context: ProgramPlanContext, targets_groups_by_ids: { [id: number]: IPlanTargetGroup }): any => context.commit(store_mutations_names(this).set_targets_groups_by_ids, targets_groups_by_ids),

            set_targets_regions_by_ids: (context: ProgramPlanContext, targets_regions_by_ids: { [id: number]: IPlanTargetRegion }) => context.commit(store_mutations_names(this).set_targets_regions_by_ids, targets_regions_by_ids),
            set_targets_zones_by_ids: (context: ProgramPlanContext, targets_zones_by_ids: { [id: number]: IPlanTargetZone }) => context.commit(store_mutations_names(this).set_targets_zones_by_ids, targets_zones_by_ids),

            set_printable_table_weeks: (context: ProgramPlanContext, printable_table_weeks: any) => context.commit(store_mutations_names(this).set_printable_table_weeks, printable_table_weeks),

            set_filter_date_debut: (context: ProgramPlanContext, filter_date_debut: number) => context.commit(store_mutations_names(this).set_filter_date_debut, filter_date_debut),
            set_filter_date_fin: (context: ProgramPlanContext, filter_date_fin: number) => context.commit(store_mutations_names(this).set_filter_date_fin, filter_date_fin),

            set_targets_facilitators_by_ids: (context: ProgramPlanContext, targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator }) => context.commit(store_mutations_names(this).set_targets_facilitators_by_ids, targets_facilitators_by_ids),

            set_tasks_by_ids: (context: ProgramPlanContext, tasks_by_ids: { [id: number]: IPlanTask }) => context.commit(store_mutations_names(this).set_tasks_by_ids, tasks_by_ids),
            set_task_types_by_ids: (context: ProgramPlanContext, task_types_by_ids: { [id: number]: IPlanTaskType }) => context.commit(store_mutations_names(this).set_task_types_by_ids, task_types_by_ids),
            set_selected_rdv: (context: ProgramPlanContext, selected_rdv: IPlanRDV) => context.commit(store_mutations_names(this).set_selected_rdv, selected_rdv),
            setEnseignesByIds: (context: ProgramPlanContext, enseignes_by_ids: { [id: number]: IPlanEnseigne }) => context.commit(store_mutations_names(this).setEnseignesByIds, enseignes_by_ids),
            setTargetsByIds: (context: ProgramPlanContext, targets_by_ids: { [id: number]: IPlanTarget }) => context.commit(store_mutations_names(this).setTargetsByIds, targets_by_ids),
            setFacilitatorsByIds: (context: ProgramPlanContext, facilitators_by_ids: { [id: number]: IPlanFacilitator }) => context.commit(store_mutations_names(this).setFacilitatorsByIds, facilitators_by_ids),
            setPartnersByIds: (context: ProgramPlanContext, partners_by_ids: { [id: number]: IPlanPartner }) => context.commit(store_mutations_names(this).setPartnersByIds, partners_by_ids),
            setManagersByIds: (context: ProgramPlanContext, managers_by_ids: { [id: number]: IPlanManager }) => context.commit(store_mutations_names(this).setManagersByIds, managers_by_ids),

            setRdvsByIds: (context: ProgramPlanContext, rdvs_by_ids: { [id: number]: IPlanRDV }) => context.commit(store_mutations_names(this).setRdvsByIds, rdvs_by_ids),
            setCrsByIds: (context: ProgramPlanContext, crs_by_ids: { [id: number]: IPlanRDVCR }) => context.commit(store_mutations_names(this).setCrsByIds, crs_by_ids),
            setPrepsByIds: (context: ProgramPlanContext, preps_by_ids: { [id: number]: IPlanRDVCR }) => context.commit(store_mutations_names(this).setPrepsByIds, preps_by_ids),

            setRdvById: (context: ProgramPlanContext, vo: IPlanRDV) => context.commit(store_mutations_names(this).setRdvById, vo),

            setTargetById: (context: ProgramPlanContext, vo: IPlanTarget) => context.commit(store_mutations_names(this).setTargetById, vo),
            setCrById: (context: ProgramPlanContext, vo: IPlanRDVCR) => context.commit(store_mutations_names(this).setCrById, vo),
            setPrepById: (context: ProgramPlanContext, vo: IPlanRDVPrep) => context.commit(store_mutations_names(this).setPrepById, vo),

            removeRdv: (context: ProgramPlanContext, id: number) => context.commit(store_mutations_names(this).removeRdv, id),
            removeCr: (context: ProgramPlanContext, id: number) => context.commit(store_mutations_names(this).removeCr, id),
            removePrep: (context: ProgramPlanContext, id: number) => context.commit(store_mutations_names(this).removePrep, id),

            updateRdv: (context: ProgramPlanContext, vo: IPlanRDV) => context.commit(store_mutations_names(this).updateRdv, vo),
            updateCr: (context: ProgramPlanContext, vo: IPlanRDVCR) => context.commit(store_mutations_names(this).updateCr, vo),
            updatePrep: (context: ProgramPlanContext, vo: IPlanRDVPrep) => context.commit(store_mutations_names(this).updatePrep, vo),

            addRdvsByIds: (context: ProgramPlanContext, rdvs_by_ids: { [id: number]: IPlanRDV }) => {

                for (const i in rdvs_by_ids) {
                    const rdv = rdvs_by_ids[i];

                    context.commit(store_mutations_names(this).setRdvById, rdv);
                }
            },

            addCrsByIds: (context: ProgramPlanContext, crs_by_ids: { [id: number]: IPlanRDVCR }) => {

                for (const i in crs_by_ids) {
                    const cr = crs_by_ids[i];

                    context.commit(store_mutations_names(this).setCrById, cr);
                }
            },

            addPrepsByIds: (context: ProgramPlanContext, preps_by_ids: { [id: number]: IPlanRDVPrep }) => {

                for (const i in preps_by_ids) {
                    const prep = preps_by_ids[i];

                    context.commit(store_mutations_names(this).setPrepById, prep);
                }
            },

            set_can_edit_any: (context: ProgramPlanContext, can_edit: boolean) => context.commit(store_mutations_names(this).set_can_edit_any, can_edit),
            set_can_edit_all: (context: ProgramPlanContext, can_edit: boolean) => context.commit(store_mutations_names(this).set_can_edit_all, can_edit),
            set_can_edit_own_team: (context: ProgramPlanContext, can_edit: boolean) => context.commit(store_mutations_names(this).set_can_edit_own_team, can_edit),
            set_can_edit_self: (context: ProgramPlanContext, can_edit: boolean) => context.commit(store_mutations_names(this).set_can_edit_self, can_edit),
            set_can_see_fc: (context: ProgramPlanContext, can_edit: boolean) => context.commit(store_mutations_names(this).set_can_see_fc, can_edit),
            set_refresh: (context: ProgramPlanContext, refresh: boolean) => context.commit(store_mutations_names(this).set_refresh, refresh),

        };
    }
}

export const ModuleProgramPlanGetter = namespace('ProgramPlanStore', Getter);
export const ModuleProgramPlanAction = namespace('ProgramPlanStore', Action);