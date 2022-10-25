import Vue from 'vue';
import { EventObjectInput, View } from 'fullcalendar';
import * as $ from 'jquery';
import debounce from 'lodash/debounce';
import * as  moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import IPlanEnseigne from '../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanProgramFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramFacilitator';
import IPlanProgramManager from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramManager';
import IPlanProgramTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramTarget';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDVPrep from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTargetFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetFacilitator';
import IPlanTargetGroup from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetGroup';
import IPlanTargetRegion from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetRegion';
import IPlanTargetZone from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetZone';
import IPlanTask from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import IPlanTaskType from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../shared/tools/DateHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import VueAppController from '../../../VueAppController';
import AppVuexStoreManager from '../../store/AppVuexStoreManager';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
import VueComponentBase from '../VueComponentBase';
import ProgramPlanComponentImpression from './Impression/ProgramPlanComponentImpression';
import ProgramPlanComponentModal from './Modal/ProgramPlanComponentModal';
import './ProgramPlanComponent.scss';
import ProgramPlanControllerBase from './ProgramPlanControllerBase';
import ProgramPlanTools from './ProgramPlanTools';
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from './store/ProgramPlanStore';
import ProgramPlanComponentTargetListing from './TargetListing/ProgramPlanComponentTargetListing';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';



@Component({
    template: require('./ProgramPlanComponent.pug'),
    components: {
        "program-plan-component-modal": ProgramPlanComponentModal,
        "program-plan-component-impression": ProgramPlanComponentImpression,
        "program-plan-component-target-listing": ProgramPlanComponentTargetListing
    }
})
export default class ProgramPlanComponent extends VueComponentBase {

    @ModuleProgramPlanGetter
    public filter_date_debut: number;

    @ModuleProgramPlanGetter
    public filter_date_fin: number;

    @ModuleProgramPlanGetter
    public can_edit_any: boolean;
    @ModuleProgramPlanGetter
    public can_edit_all: boolean;
    @ModuleProgramPlanGetter
    public can_edit_own_team: boolean;
    @ModuleProgramPlanGetter
    public can_edit_self: boolean;
    @ModuleProgramPlanGetter
    public can_see_fc: boolean;

    @ModuleProgramPlanGetter
    public selected_rdv: IPlanRDV;

    @ModuleProgramPlanGetter
    public getEnseignesByIds: { [id: number]: IPlanEnseigne };

    @ModuleProgramPlanGetter
    public getTargetsByIds: { [id: number]: IPlanTarget };

    @ModuleProgramPlanGetter
    public getFacilitatorsByIds: { [id: number]: IPlanFacilitator };

    @ModuleProgramPlanGetter
    public getManagersByIds: { [id: number]: IPlanManager };

    @ModuleProgramPlanGetter
    public getRdvsByIds: { [id: number]: IPlanRDV };

    @ModuleProgramPlanGetter
    public getCrsByIds: { [id: number]: IPlanRDVCR };

    @ModuleProgramPlanGetter
    public getPartnersByIds: { [id: number]: IPlanPartner };

    @ModuleProgramPlanGetter
    public get_task_types_by_ids: { [id: number]: IPlanTaskType };

    @ModuleProgramPlanGetter
    public get_tasks_by_ids: { [id: number]: IPlanTask };

    @ModuleProgramPlanGetter
    public get_targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator };

    @ModuleProgramPlanGetter
    public get_targets_facilitators_by_facilitator_ids: { [facilitator_id: number]: IPlanTargetFacilitator[] };

    @ModuleProgramPlanGetter
    public get_targets_facilitators_by_target_ids: { [target_id: number]: IPlanTargetFacilitator[] };

    @ModuleProgramPlanAction
    public set_targets_regions_by_ids: (targets_regions_by_ids: { [id: number]: IPlanTargetRegion }) => void;

    @ModuleProgramPlanAction
    public set_targets_zones_by_ids: (targets_zones_by_ids: { [id: number]: IPlanTargetZone }) => void;

    @ModuleProgramPlanAction
    public set_targets_groups_by_ids: (targets_groups_by_ids: { [id: number]: IPlanTargetGroup }) => void;

    @ModuleProgramPlanAction
    public set_can_see_fc: (can_see_fc: boolean) => void;

    @ModuleProgramPlanAction
    public addRdvsByIds: (rdvs_by_ids: { [id: number]: IPlanRDV }) => void;

    @ModuleProgramPlanAction
    public addCrsByIds: (crs_by_ids: { [id: number]: IPlanRDVCR }) => void;

    @ModuleProgramPlanAction
    public addPrepsByIds: (preps_by_ids: { [id: number]: IPlanRDVPrep }) => void;

    @ModuleProgramPlanAction
    public set_filter_date_debut: (filter_date_debut: number) => void;

    @ModuleProgramPlanAction
    public set_filter_date_fin: (filter_date_fin: number) => void;

    @ModuleProgramPlanAction
    public set_printable_table_weeks: (printable_table_weeks: any) => void;

    @ModuleProgramPlanAction
    public set_can_edit_any: (can_edit: boolean) => void;
    @ModuleProgramPlanAction
    public set_can_edit_all: (can_edit: boolean) => void;
    @ModuleProgramPlanAction
    public set_can_edit_own_team: (can_edit: boolean) => void;
    @ModuleProgramPlanAction
    public set_can_edit_self: (can_edit: boolean) => void;

    @ModuleProgramPlanAction
    public set_targets_facilitators_by_ids: (targets_facilitators_by_ids: { [id: number]: IPlanTargetFacilitator }) => void;

    @ModuleProgramPlanAction
    public set_task_types_by_ids: (task_types_by_ids: { [id: number]: IPlanTaskType }) => void;

    @ModuleProgramPlanAction
    public set_tasks_by_ids: (tasks_by_ids: { [id: number]: IPlanTask }) => void;

    @ModuleProgramPlanAction
    public setTargetsByIds: (targets_by_ids: { [id: number]: IPlanTarget }) => void;

    @ModuleProgramPlanAction
    public setEnseignesByIds: (enseignes_by_ids: { [id: number]: IPlanEnseigne }) => void;

    @ModuleProgramPlanAction
    public setFacilitatorsByIds: (facilitators_by_ids: { [id: number]: IPlanFacilitator }) => void;

    @ModuleProgramPlanAction
    public setPartnersByIds: (partners_by_ids: { [id: number]: IPlanPartner }) => void;

    @ModuleProgramPlanAction
    public setManagersByIds: (managers_by_ids: { [id: number]: IPlanManager }) => void;

    @ModuleProgramPlanAction
    public setRdvsByIds: (rdvs_by_ids: { [id: number]: IPlanRDV }) => void;

    @ModuleProgramPlanAction
    public setCrsByIds: (crs_by_ids: { [id: number]: IPlanRDVCR }) => void;

    @ModuleProgramPlanAction
    public setPrepsByIds: (preps_by_ids: { [id: number]: IPlanRDVPrep }) => void;

    @ModuleProgramPlanAction
    public set_selected_rdv: (selected_rdv: IPlanRDV) => void;

    @ModuleProgramPlanAction
    public setRdvById: (rdv: IPlanRDV) => void;

    @ModuleProgramPlanAction
    public setCrById: (cr: IPlanRDVCR) => void;

    @ModuleProgramPlanAction
    public updateRdv: (rdv: IPlanRDV) => void;

    @ModuleProgramPlanAction
    public updateCr: (cr: IPlanRDVCR) => void;

    @ModuleProgramPlanAction
    public removeRdv: (id: number) => void;

    @ModuleProgramPlanAction
    public set_refresh: (refresh: boolean) => void;

    @ModuleProgramPlanAction
    public removeCr: (id: number) => void;

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @Prop()
    public global_route_path: string;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public selected_rdv_id: number;

    @Prop({ default: null })
    public program_id: number;

    @Prop({ default: null })
    public program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    public program_plan_controller: ProgramPlanControllerBase;

    private user = VueAppController.getInstance().data_user;
    private fcEvents: EventObjectInput[] = [];

    private calendar_date: string = DateHandler.getInstance().formatDayForIndex(Dates.now());
    private viewname: string = 'timelineWeek';

    private reset_targets = ThrottleHelper.getInstance().declare_throttle_without_args(this.reset_targets_throttled.bind(this), 100, { leading: false, trailing: true });

    private fcSegment: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
        moment(this.calendar_date).utc(true).unix(),
        (this.viewname == "timelineWeek") ? TimeSegment.TYPE_WEEK : TimeSegment.TYPE_MONTH);

    get custom_filter_component() {
        return this.program_plan_controller.customFilterComponent;
    }

    get custom_overview_program_plan_component() {
        return this.program_plan_controller.customOverviewProgramPlanComponent;
    }

    private show_targets: boolean = true;

    private valid_targets: IPlanTarget[] = [];
    private valid_target_by_ids: { [id: number]: IPlanTarget } = {};
    private valid_facilitators: IPlanFacilitator[] = [];
    private valid_rdvs: IPlanRDV[] = [];

    private calendar_key: number = 1;

    private debounced_onchange_calendar_date = debounce(this.onchange_calendar_date, 1000);

    private debounced_async_load = debounce(this.async_load, 100);

    get route_path(): string {
        return this.global_route_path + ((!!this.program_id) ? this.program_id : 'g');
    }

    @Watch('program_plan_shared_module')
    public async onchange_program_plan_shared_module() {
        this.startLoading();
        await this.debounced_async_load();
    }

    public async mounted() {
        await this.debounced_async_load();
    }

    public async async_load() {
        let self = this;

        this.$nextTick(async () => {

            // On va vérifier qu'on a le droit de faire cette action
            let promises: Array<Promise<any>> = [];

            promises.push((async () => {
                self.set_can_edit_any(await ModuleAccessPolicy.getInstance().testAccess(this.program_plan_shared_module.POLICY_FO_EDIT));
            })());
            promises.push((async () => {
                self.set_can_see_fc(await ModuleAccessPolicy.getInstance().testAccess(this.program_plan_shared_module.POLICY_FO_SEE_FC));
            })());
            promises.push((async () => {
                self.set_can_edit_all(await ModuleAccessPolicy.getInstance().testAccess(this.program_plan_shared_module.POLICY_FO_EDIT_ALL_RDVS));
            })());
            promises.push((async () => {
                self.set_can_edit_own_team(await ModuleAccessPolicy.getInstance().testAccess(this.program_plan_shared_module.POLICY_FO_EDIT_OWN_TEAM_RDVS));
            })());
            promises.push((async () => {
                self.set_can_edit_self(await ModuleAccessPolicy.getInstance().testAccess(this.program_plan_shared_module.POLICY_FO_EDIT_OWN_RDVS));
            })());
            promises.push((async () => {
                await self.reloadAsyncData();
            })());

            await all_promises(promises);

            // On limite à 20 tentatives
            let timeout: number = 20;
            async function tryOpenModal() {

                if ((!!self.getRdvsByIds) && (ObjectHandler.getInstance().hasAtLeastOneAttribute(self.getRdvsByIds))) {

                    if ((!self.selected_rdv_id) || (!self.getRdvsByIds[self.selected_rdv_id])) {
                        self.$router.push(self.route_path);
                        return;
                    }

                    await self.handle_modal_show_hide();
                    return;
                }

                timeout--;
                if (timeout < 0) {

                    // On change la route si on a pas réussi à ouvrir le rdv
                    if ((!self.selected_rdv_id) || (!self.getRdvsByIds[self.selected_rdv_id])) {
                        self.$router.push(self.route_path);
                    }

                    return;
                }

                setTimeout(tryOpenModal, 100);
            }

            if (!!this.selected_rdv_id) {
                self.$nextTick(tryOpenModal);
            }
            $("#rdv_modal").on("hidden.bs.modal", function () {
                self.$router.push(self.route_path);
                self.show_targets = true;
            });

        });
    }

    @Watch("$route")
    public async onrouteChange() {

        this.init_print();

        await this.handle_modal_show_hide();
    }

    protected async handle_modal_show_hide() {
        if (!this.modal_show) {
            $('#rdv_modal').modal('hide');
            this.show_targets = true;
        }
        if (this.modal_show) {
            if ((!this.selected_rdv_id) || (!this.getRdvsByIds[this.selected_rdv_id])) {
                $('#rdv_modal').modal('hide');
                this.show_targets = true;
                return;
            }
            this.set_selected_rdv(this.getRdvsByIds[this.selected_rdv_id]);
            this.show_targets = false;
            $('#rdv_modal').modal('show');
            return;
        }
    }

    get use_print_component(): boolean {
        return this.program_plan_controller.use_print_component;
    }

    private init_print() {
        let self = this;

        AppVuexStoreManager.getInstance().appVuexStore.commit('PRINT_ENABLE');
        if (this.use_print_component) {
            AppVuexStoreManager.getInstance().appVuexStore.commit('set_onprint', () => {
                self.set_printable_table_weeks(self.get_printable_table_weeks());
                self.$nextTick(function () {
                    window['print']();
                });
            });
        }
    }

    private async reloadAsyncData() {

        let self = this;

        this.init_print();

        this.nbLoadingSteps = 4;
        this.startLoading();

        await this.program_plan_controller.component_hook_onAsyncLoading(this.getStoredDatas, this.storeDatas);

        this.nextLoadingStep();

        let promises = [];

        if ((!!this.program_plan_shared_module.partner_type_id) ||
            (this.program_plan_shared_module.program_manager_type_id) ||
            (this.program_plan_shared_module.program_facilitator_type_id) ||
            (this.program_plan_shared_module.program_target_type_id) ||
            (this.program_plan_shared_module.target_region_type_id) ||
            (this.program_plan_shared_module.target_zone_type_id) ||
            (this.program_plan_shared_module.target_group_type_id)) {

            // partenaires (on charge tous les partenaires ça parait pas être voué à exploser comme donnée mais à suivre)
            if (!!this.program_plan_shared_module.partner_type_id) {
                promises.push((async () => {
                    self.setPartnersByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(this.program_plan_shared_module.partner_type_id).select_vos<IPlanPartner>()));
                })());
            }

            if (!!this.program_plan_shared_module.target_region_type_id) {
                promises.push((async () => {
                    self.set_targets_regions_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(this.program_plan_shared_module.target_region_type_id).select_vos<IPlanTargetRegion>()));
                })());
            }

            if (!!this.program_plan_shared_module.target_zone_type_id) {
                promises.push((async () => {
                    self.set_targets_zones_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(this.program_plan_shared_module.target_zone_type_id).select_vos<IPlanTargetZone>()));
                })());
            }

            if (!!this.program_plan_shared_module.target_group_type_id) {
                promises.push((async () => {
                    self.set_targets_groups_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(this.program_plan_shared_module.target_group_type_id).select_vos<IPlanTargetGroup>()));
                })());
            }

            // managers du programme
            if (!!this.program_plan_shared_module.program_manager_type_id) {
                promises.push((async () => {
                    let program_managers: IPlanProgramManager[] = await query(this.program_plan_shared_module.program_manager_type_id).filter_by_num_eq('program_id', self.program_id).select_vos<IPlanProgramManager>();
                    self.storeDatas({ API_TYPE_ID: this.program_plan_shared_module.program_manager_type_id, vos: program_managers });
                })());
            }

            // animateurs du programme
            if (!!this.program_plan_shared_module.program_facilitator_type_id) {
                promises.push((async () => {
                    let program_facilitators: IPlanProgramFacilitator[] = await query(this.program_plan_shared_module.program_facilitator_type_id).filter_by_num_eq('program_id', self.program_id).select_vos<IPlanProgramFacilitator>();
                    self.storeDatas({ API_TYPE_ID: this.program_plan_shared_module.program_facilitator_type_id, vos: program_facilitators });
                })());
            }

            // établissements du programme
            if (!!this.program_plan_shared_module.program_target_type_id) {
                promises.push((async () => {
                    let program_targets: IPlanProgramTarget[] = await query(this.program_plan_shared_module.program_target_type_id).filter_by_num_eq('program_id', self.program_id).select_vos<IPlanProgramTarget>();
                    self.storeDatas({ API_TYPE_ID: this.program_plan_shared_module.program_target_type_id, vos: program_targets });
                })());
            }

            await all_promises(promises);
            promises = [];
        }

        self.nextLoadingStep();

        // managers
        if (!!this.program_plan_shared_module.manager_type_id) {

            promises.push((async () => {

                let managers: IPlanManager[] = null;

                if (!!this.program_plan_shared_module.program_manager_type_id) {
                    let ids: { [id: number]: boolean } = [];
                    for (let i in self.getStoredDatas[this.program_plan_shared_module.program_manager_type_id]) {
                        let program_manager: IPlanProgramManager = self.getStoredDatas[this.program_plan_shared_module.program_manager_type_id][i] as IPlanProgramManager;
                        ids[program_manager.manager_id] = true;
                    }
                    managers = await ModuleDAO.getInstance().getVosByIds<IPlanManager>(
                        this.program_plan_shared_module.manager_type_id,
                        ObjectHandler.getInstance().getNumberMapIndexes(ids));
                } else {
                    managers = await query(this.program_plan_shared_module.manager_type_id).select_vos<IPlanManager>();
                }

                let managers_by_ids: { [id: number]: IPlanManager } = {};
                for (let i in managers) {
                    let manager: IPlanManager = managers[i];

                    if (!manager.activated) {
                        continue;
                    }

                    managers_by_ids[manager.id] = manager;
                }

                self.setManagersByIds(managers_by_ids);
            })());
        }

        // Task Types
        if (!!this.program_plan_shared_module.task_type_type_id) {
            promises.push((async () => {
                let task_types: IPlanTaskType[] = await query(this.program_plan_shared_module.task_type_type_id).select_vos<IPlanTaskType>();
                self.set_task_types_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(task_types));
            })());
        }

        // Tasks
        if (!!this.program_plan_shared_module.task_type_id) {
            promises.push((async () => {
                let tasks: IPlanTask[] = await query(this.program_plan_shared_module.task_type_id).select_vos<IPlanTask>();
                let tmps: IPlanTask[] = [];

                for (let i in tasks) {
                    let task = tasks[i];

                    if (!this.program_plan_controller.hide_task(task)) {
                        tmps.push(task);
                    }
                }
                self.set_tasks_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(tmps));
            })());
        }

        // animateurs
        promises.push((async () => {
            let facilitators: IPlanFacilitator[] = null;

            if (!!this.program_plan_shared_module.program_facilitator_type_id) {
                let ids: { [id: number]: boolean } = [];
                for (let i in self.getStoredDatas[this.program_plan_shared_module.program_facilitator_type_id]) {
                    let program_facilitator: IPlanProgramFacilitator = self.getStoredDatas[this.program_plan_shared_module.program_facilitator_type_id][i] as IPlanProgramFacilitator;
                    ids[program_facilitator.facilitator_id] = true;
                }
                facilitators = await ModuleDAO.getInstance().getVosByIds<IPlanFacilitator>(
                    this.program_plan_shared_module.facilitator_type_id,
                    ObjectHandler.getInstance().getNumberMapIndexes(ids));
            } else {
                facilitators = await query(this.program_plan_shared_module.facilitator_type_id).select_vos<IPlanFacilitator>();
            }

            let facilitators_by_ids: { [id: number]: IPlanFacilitator } = {};
            for (let i in facilitators) {
                let facilitator: IPlanFacilitator = facilitators[i];

                if (!facilitator.activated) {
                    continue;
                }

                facilitators_by_ids[facilitator.id] = facilitator;
            }

            self.setFacilitatorsByIds(facilitators_by_ids);
        })());

        // établissements
        promises.push((async () => {
            let targets: IPlanTarget[] = null;

            if (!!this.program_plan_shared_module.program_target_type_id) {

                let ids: { [id: number]: boolean } = [];
                for (let i in self.getStoredDatas[this.program_plan_shared_module.program_target_type_id]) {
                    let program_target: IPlanProgramTarget = self.getStoredDatas[this.program_plan_shared_module.program_target_type_id][i] as IPlanProgramTarget;
                    ids[program_target.target_id] = true;
                }
                targets = await ModuleDAO.getInstance().getVosByIds<IPlanTarget>(
                    this.program_plan_shared_module.target_type_id,
                    ObjectHandler.getInstance().getNumberMapIndexes(ids));
            } else {
                targets = await query(this.program_plan_shared_module.target_type_id).select_vos<IPlanTarget>();
            }

            let targets_by_ids: { [id: number]: IPlanTarget } = {};
            for (let i in targets) {
                let target: IPlanTarget = targets[i];

                if (!target.activated) {
                    continue;
                }

                if (await this.program_plan_controller.component_hook_refuseTargetOnLoading(target, this.getStoredDatas, this.storeDatas)) {
                    continue;
                }

                targets_by_ids[target.id] = target;
            }

            self.setTargetsByIds(targets_by_ids);
        })());

        await all_promises(promises);
        self.nextLoadingStep();
        promises = [];

        // targets facilitators
        if (!!this.program_plan_shared_module.target_facilitator_type_id) {
            promises.push((async () => {

                let targets_ids: number[] = ObjectHandler.getInstance().getNumberMapIndexes(self.getTargetsByIds);
                let facilitators_ids: number[] = ObjectHandler.getInstance().getNumberMapIndexes(self.getFacilitatorsByIds);

                if ((!targets_ids) || (!targets_ids.length)) {
                    return;
                }
                if ((!facilitators_ids) || (!facilitators_ids.length)) {
                    return;
                }

                self.set_targets_facilitators_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(
                    await ModuleDAO.getInstance().getVosByRefFieldsIds<IPlanTargetFacilitator>(
                        this.program_plan_shared_module.target_facilitator_type_id,
                        'target_id', targets_ids,
                        'facilitator_id', facilitators_ids
                    )));
            })());
        }

        if (!!this.program_plan_shared_module.enseigne_type_id) {
            // enseignes
            promises.push((async () => {
                let ids: { [id: number]: boolean } = [];
                for (let i in self.getTargetsByIds) {
                    let target: IPlanTarget = self.getTargetsByIds[i] as IPlanTarget;

                    if (!!target.enseigne_id) {
                        ids[target.enseigne_id] = true;
                    }
                }
                let enseignes: IPlanEnseigne[] = await ModuleDAO.getInstance().getVosByIds<IPlanEnseigne>(
                    this.program_plan_shared_module.enseigne_type_id,
                    ObjectHandler.getInstance().getNumberMapIndexes(ids));

                let enseignes_by_ids: { [id: number]: IPlanEnseigne } = {};
                for (let i in enseignes) {
                    let enseigne: IPlanEnseigne = enseignes[i];

                    enseignes_by_ids[enseigne.id] = enseigne;
                }

                self.setEnseignesByIds(enseignes_by_ids);
            })());
        }
        await all_promises(promises);

        self.stopLoading();
    }

    private onFCEventSelected(calEvent: EventObjectInput, jsEvent, view: View) {

        if ((!calEvent) || (!calEvent.rdv_id) || (!this.getRdvsByIds) || (!this.getRdvsByIds[calEvent.rdv_id])) {
            this.$router.push(this.route_path);
            return;
        }
        this.$router.push(this.route_path + '/rdv/' + calEvent.rdv_id);
    }

    private select_rdv(rdv_id: number) {

        if ((!rdv_id) || (!this.getRdvsByIds) || (!this.getRdvsByIds[rdv_id])) {
            this.$router.push(this.route_path);
            return;
        }
        this.$router.push(this.route_path + '/rdv/' + rdv_id);
    }

    private getResourceName(first_name, name) {
        return ProgramPlanTools.getResourceName(first_name, name);
    }

    get planningResources() {
        // On veut un tableau avec des éléments de ce type:
        // {
        //   id: 1,
        //   title: 'animateur',
        //   manager_title: 'manager'
        // }

        let res = [];

        if (!!this.program_plan_shared_module.target_facilitator_type_id) {

            for (let i in this.valid_targets) {
                let target: IPlanTarget = this.valid_targets[i];

                let tfs: IPlanTargetFacilitator[] = this.get_targets_facilitators_by_target_ids[target.id];

                for (let j in tfs) {

                    let target_facilitator: IPlanTargetFacilitator = tfs[j];

                    if (target_facilitator.target_id != target.id) {
                        continue;
                    }

                    let facilitator: IPlanFacilitator = null;
                    for (let k in this.valid_facilitators) {
                        if (this.valid_facilitators[k].id == target_facilitator.facilitator_id) {
                            facilitator = this.valid_facilitators[k];
                        }
                    }
                    if (!facilitator) {
                        continue;
                    }

                    let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id];
                    let partner: IPlanPartner = this.getPartnersByIds[facilitator.partner_id];

                    let target_name: string = (!!target) ? target.name : "";
                    let target_table: ModuleTable<IPlanTarget> = VOsTypesManager.getInstance().moduleTables_by_voType[this.program_plan_shared_module.target_type_id];
                    if (target_table && target_table.default_label_field) {
                        target_name = (!!target) ? target[target_table.default_label_field.field_id] : "";
                    } else if (target_table && target_table.table_label_function) {
                        target_name = (!!target) ? target_table.table_label_function(target) : "";
                    }

                    res.push({
                        id: target_facilitator.id,
                        title: this.getResourceName(facilitator.firstname, facilitator.lastname),
                        manager_title: (!!manager) ? this.getResourceName(manager.firstname, manager.lastname) : "",
                        partner_name: (!!partner) ? partner.name : "",
                        target_name
                    });
                }
            }
        } else {
            for (let i in this.valid_facilitators) {
                let facilitator: IPlanFacilitator = this.valid_facilitators[i];

                let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id];
                let partner: IPlanPartner = this.getPartnersByIds[facilitator.partner_id];

                res.push({
                    id: facilitator.id,
                    title: this.getResourceName(facilitator.firstname, facilitator.lastname),
                    manager_title: (!!manager) ? this.getResourceName(manager.firstname, manager.lastname) : "",
                    partner_name: (!!partner) ? partner.name : ""
                });
            }
        }
        return res;
    }

    private getPlanningEventFromRDV(rdv: IPlanRDV): EventObjectInput[] {
        // exemple :
        // {
        //   id: '1',
        //   resourceId: 'b',
        //   start: '2017-05-07T02:00:00',
        //   end: '2017-05-07T07:00:00',
        //   title: 'event 1'
        // }

        if (!!this.program_plan_shared_module.task_type_id) {
            let task: IPlanTask = this.get_tasks_by_ids[rdv.task_id];
            if (!task) {
                return null;
            }
        } else {
            let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[rdv.facilitator_id];
            if (!facilitator) {
                return null;
            }
        }

        let target: IPlanTarget = this.valid_target_by_ids[rdv.target_id];

        if (!target) {
            // on a un RDV en base qui est orphelin on ignore, sauf si tache admin
            if (!!this.program_plan_shared_module.task_type_id) {
                let task: IPlanTask = this.get_tasks_by_ids[rdv.task_id];
                if ((!task) || (!task.is_facilitator_specific)) {
                    return null;
                }
            } else {
                return null;
            }
        }

        let res: EventObjectInput[] = [];

        let event_item: EventObjectInput = {
            rdv_id: rdv.id,
            task_id: undefined,
            target_id: rdv.target_id,
            facilitator_id: rdv.facilitator_id,
            resourceId: undefined,
            start: moment.unix(rdv.start_time).utc(),
            end: moment.unix(rdv.end_time).utc(),
            title: null,
            state: rdv.state
        };
        if (!!this.program_plan_shared_module.target_facilitator_type_id) {

            if (!this.get_tasks_by_ids[rdv.task_id]) {
                ConsoleHandler.getInstance().error('TASK id introuvable:' + rdv.task_id);
                return null;
            }

            event_item.task_id = rdv.task_id;
            event_item.title = this.get_tasks_by_ids[rdv.task_id].name;

            // Si on est sur ce mode d'affichage, il faut gérer le cas d'un RDV admin (donc lié à un facilitator et non une target+facilitator)
            //  et dans ce cas on renvoie un event pour toutes les ressources identifiées

            if ((!!this.get_tasks_by_ids[rdv.task_id]) && (this.get_tasks_by_ids[rdv.task_id].is_facilitator_specific)) {

                let ptfs: IPlanTargetFacilitator[] = this.get_targets_facilitators_by_facilitator_ids[rdv.facilitator_id];

                // C'est une tâche d'admin sur l'employé
                for (let i in ptfs) {
                    let target_facilitator: IPlanTargetFacilitator = ptfs[i];

                    if (target_facilitator.facilitator_id != rdv.facilitator_id) {
                        continue;
                    }

                    let cloned_event = Object.assign({}, event_item);
                    cloned_event.target_id = target_facilitator.target_id;
                    cloned_event.resourceId = target_facilitator.id.toString();
                    res.push(cloned_event);
                }
            } else {
                let ptfs: IPlanTargetFacilitator[] = this.get_targets_facilitators_by_facilitator_ids[rdv.facilitator_id];

                for (let i in ptfs) {
                    let target_facilitator: IPlanTargetFacilitator = ptfs[i];

                    if (target_facilitator.target_id != rdv.target_id) {
                        continue;
                    }
                    if (target_facilitator.facilitator_id != rdv.facilitator_id) {
                        continue;
                    }

                    event_item.resourceId = target_facilitator.id.toString();
                    res.push(event_item);
                    break;
                }
            }
        } else {
            event_item.title = target.name;
            event_item.resourceId = rdv.facilitator_id.toString();
            res.push(event_item);
        }

        for (let i in res) {
            this.program_plan_controller.populateCalendarEvent(res[i]);
        }

        return res;
    }

    @Watch('valid_rdvs', { immediate: true, deep: true })
    private onchange_rdvsByIds() {
        this.fcEvents = [];

        for (let i in this.valid_rdvs) {

            let rdv = this.valid_rdvs[i];

            let es: EventObjectInput[] = this.getPlanningEventFromRDV(rdv);

            if ((!!es) && (es.length > 0)) {
                this.fcEvents = this.fcEvents.concat(es);
            }
        }
    }

    /**
     * Triggered when a new date-range is rendered, or when the view type switches.
     * @param view https://fullcalendar.io/docs/view-object
     * @param element is a jQuery element for the container of the new view.
     */
    private onFCViewRender(view: View, element) {
        if ((!view) || (!view.start) || (!view.end)) {
            return;
        }

        if (view.name != this.viewname) {
            this.viewname = view.name;
        }
        if (this.calendar_date != DateHandler.getInstance().formatDayForIndex(view.intervalStart.unix())) {
            this.calendar_date = DateHandler.getInstance().formatDayForIndex(view.intervalStart.unix());
        }
    }

    @Watch('calendar_date')
    private onchange_calendar_date_direct() {

        this.debounced_onchange_calendar_date();
    }

    @Watch('viewname')
    private onchange_calendar_date() {

        if (!moment(this.calendar_date).utc(true).isValid()) {
            return;
        }

        let segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment(this.calendar_date).utc(true).unix(),
            (this.viewname == "timelineWeek") ? TimeSegment.TYPE_WEEK : TimeSegment.TYPE_MONTH);

        if (!TimeSegmentHandler.getInstance().segmentsAreEquivalent(segment, this.fcSegment)) {
            this.fcSegment = segment;
            this.$refs.calendar['fireMethod']('gotoDate', this.calendar_date);
        }
    }

    /**
     * Triggered when dragging stops and the event has moved to a different day/time.
     * @param event https://fullcalendar.io/docs/event-object
     */
    private async onFCEventDrop(event: EventObjectInput, delta, revertFunc, jsEvent, ui, view: View) {
        await this.updateEvent(event, revertFunc, view);
    }

    /**
     * Triggered when resizing stops and the event has changed in duration.
     * @param event https://fullcalendar.io/docs/event-object
     */
    private async onFCEventResize(event: EventObjectInput, delta, revertFunc, jsEvent, ui, view: View) {
        await this.updateEvent(event, revertFunc, view);
    }

    private async updateEvent(event: EventObjectInput, revertFunc, view: View) {
        // Il faut modifier le vo source, mettre à jour côté serveur et notifier en cas d'échec et annuler la modif (remettre la resource et les dates précédentes)

        let self = this;
        let msg_error_code = 'programplan.fc.update.error';
        self.snotify.async(self.label('programplan.fc.update.start'), () =>
            new Promise(async (resolve, reject) => {

                if ((!event) || (!event.rdv_id) || (!this.getRdvsByIds[event.rdv_id])) {
                    reject({
                        body: self.label('programplan.fc.update.error'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }
                let rdv: IPlanRDV = this.getRdvsByIds[event.rdv_id] as IPlanRDV;

                let tmp_start: number = rdv.start_time;
                let tmp_end: number = rdv.end_time;
                let tmp_facilitator_id: number = rdv.facilitator_id;
                let tmp_target_id: number = rdv.target_id;

                let new_facilitator_id: number = null;
                let new_target_id: number = null;
                let new_start_time: number = moment(event.start).utc(true).unix();
                let new_end_time: number = moment(event.end).utc(true).unix();

                if (!!this.program_plan_shared_module.target_facilitator_type_id) {
                    let new_target_facilitator_id: number = parseInt(event.resourceId);

                    let target_facilitator: IPlanTargetFacilitator = this.get_targets_facilitators_by_ids[new_target_facilitator_id];

                    if (target_facilitator) {
                        new_facilitator_id = target_facilitator.facilitator_id;
                        new_target_id = target_facilitator.target_id;
                    }
                } else {
                    new_facilitator_id = parseInt(event.resourceId);
                    new_target_id = tmp_target_id;
                }

                try {

                    if (!this.can_edit_rdv(tmp_facilitator_id, new_facilitator_id)) {
                        msg_error_code = 'programplan.fc.update.denied';
                        throw new Error('Pas le droit');
                    }

                    if (!!this.program_plan_shared_module.target_facilitator_type_id) {
                        let task = this.get_tasks_by_ids[rdv.task_id];
                        if (!task) {
                            throw new Error('Impossible de retrouver le type de tache');
                        }

                        let task_type = this.get_task_types_by_ids[task.task_type_id];
                        if (!task_type) {
                            throw new Error('Impossible de retrouver le type de tache');
                        }

                        if (task_type.order_tasks_on_same_target) {

                            if ((new_facilitator_id != tmp_facilitator_id) || (new_target_id != tmp_target_id)) {
                                msg_error_code = 'programplan.fc.update.denied_change_target';
                                throw new Error('Pas le droit de changer d\'établissement ou d\'animateur sur des RDVs à choix automatique.');
                            }

                            // On check qu'on ne change pas l'ordre des RDVs sur la cible
                            // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                            // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                            let all_rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(
                                this.program_plan_shared_module.rdv_type_id,
                                'target_id', [rdv.target_id]);

                            for (let i in all_rdvs) {
                                let all_rdv = all_rdvs[i];
                                let all_rdv_task = this.get_tasks_by_ids[all_rdv.task_id];

                                if (all_rdv.id == rdv.id) {
                                    continue;
                                }

                                if (!all_rdv_task) {
                                    continue;
                                }

                                if (all_rdv_task.task_type_id != task_type.id) {
                                    continue;
                                }

                                let min_moment = tmp_start;
                                let max_moment = new_start_time;
                                if (tmp_start > new_start_time) {

                                    min_moment = new_start_time;
                                    max_moment = tmp_start;
                                }

                                if (Dates.isBetween(all_rdv.start_time, min_moment, max_moment)) {
                                    msg_error_code = 'programplan.fc.update.cannot_change_rdv_order';
                                    throw new Error('Pas le droit de changer l\'ordre sur des RDVs à choix automatique.');
                                }
                            }
                        }
                    }

                    rdv.start_time = new_start_time;
                    rdv.end_time = new_end_time;
                    rdv.facilitator_id = new_facilitator_id;
                    rdv.target_id = new_target_id;

                    if (await this.program_plan_controller.component_hook_refuseChangeRDV(rdv, this.getStoredDatas, this.storeDatas, this.get_tasks_by_ids)) {
                        throw new Error('Interdit');
                    }

                    let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

                    if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                        throw new Error('Erreur côté serveur');
                    }

                    rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.program_plan_shared_module.rdv_type_id, rdv.id);

                } catch (error) {
                    ConsoleHandler.getInstance().error(error);

                    // On tente d'annuler le déplacement initial
                    try {
                        revertFunc();
                        rdv.start_time = tmp_start;
                        rdv.end_time = tmp_end;
                        rdv.facilitator_id = tmp_facilitator_id;
                    } catch (error) {
                    }
                    reject({
                        body: self.label(msg_error_code),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }
                this.setRdvById(rdv);

                resolve({
                    body: self.label('programplan.fc.update.ok'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );
    }

    get fcConfig() {

        let resourceColumns = [];
        let facilitator_column = {
            labelText: this.label('programplan.' + this.program_plan_shared_module.name + '.fc.facilitator.name'),
            field: 'title',
            group: undefined,
            width: undefined
        };

        if (!!this.program_plan_shared_module.target_facilitator_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.' + this.program_plan_shared_module.name + '.fc.target.name'),
                field: 'target_name',
                group: true,
                width: this.program_plan_controller.resourceColumns_target_name_width
            });
            //facilitator_column.group = true;
            facilitator_column.width = this.program_plan_controller.resourceColumns_facilitator_name_width;
        }

        resourceColumns.push(facilitator_column);

        if (!!this.program_plan_shared_module.manager_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.' + this.program_plan_shared_module.name + '.fc.manager.name'),
                field: 'manager_title',
                group: true
            });
        }

        if (!!this.program_plan_shared_module.partner_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.' + this.program_plan_shared_module.name + '.fc.partner.name'),
                field: 'partner_name'
            });
        }

        let slotLabelFormat = [
            'ddd D/M'
        ];

        if (this.program_plan_controller.slot_interval < 24) {
            slotLabelFormat.push('a');
        }

        return {
            locale: 'fr-fr',
            timeZone: 'UTC',
            dayNamesShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            now: Dates.format(Dates.now(), 'Y-MM-DD'),
            defaultDate: this.calendar_date,
            schedulerLicenseKey: '0801712196-fcs-1461229306',
            editable: this.can_edit_any,
            droppable: this.can_edit_any,
            aspectRatio: 3,
            forceEventDuration: true, // Pour forcer la création du end.
            scrollTime: '00:00',
            header: {
                left: 'today prev,next',
                center: 'title',
                right: this.program_plan_controller.month_view ? 'timelineWeek,timelineMonth' : 'timelineWeek'
            },
            defaultView: this.viewname,
            views: {
                timelineMonth: {
                    slotWidth: 150 / this.nb_day_slices,
                    slotLabelInterval: {
                        hours: this.program_plan_controller.slot_interval
                    },
                    slotDuration: {
                        hours: this.program_plan_controller.slot_interval
                    },
                },
                timelineWeek: {
                    slotWidth: 150 / this.nb_day_slices,
                    slotLabelInterval: {
                        hours: this.program_plan_controller.slot_interval
                    },
                    slotDuration: {
                        hours: this.program_plan_controller.slot_interval
                    },
                }
            },
            defaultTimedEventDuration: {
                hours: this.program_plan_controller.slot_interval
            },
            navLinks: false,
            eventOverlap: this.program_plan_controller.event_overlap_hook ? this.program_plan_controller.event_overlap_hook : false,
            resourceAreaWidth: this.program_plan_controller.resourceAreaWidth,
            resourceLabelText: this.label('programplan.' + this.program_plan_shared_module.name + '.fc.resourcelabeltext.name'),
            slotLabelFormat,
            resourceColumns,
            resources: this.planningResources
        };
    }

    get is_facilitator_specific(): boolean {

        if (!this.selected_rdv) {
            return false;
        }

        if (!this.get_tasks_by_ids[this.selected_rdv.task_id]) {
            return false;
        }

        return this.get_tasks_by_ids[this.selected_rdv.task_id].is_facilitator_specific;
    }

    @Watch('fcSegment', { deep: true, immediate: true })
    private async onChangeFCSegment() {

        let promises: Array<Promise<any>> = [];
        let self = this;

        // RDVs
        // Sont chargés lors du changement de segment consulté
        if (this.program_plan_controller.load_rdv_on_segment_change) {

            promises.push((async () => {
                self.setRdvsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await this.program_plan_shared_module.getRDVsOfProgramSegment(self.program_id, self.fcSegment)));
            })());
        }

        if (!!this.program_plan_shared_module.rdv_prep_type_id) {
            // Preps
            promises.push((async () => {
                self.setPrepsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await this.program_plan_shared_module.getPrepsOfProgramSegment(self.program_id, self.fcSegment)));
            })());
        }

        // CRs
        promises.push((async () => {
            self.setCrsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await this.program_plan_shared_module.getCRsOfProgramSegment(self.program_id, self.fcSegment)));
        })());

        await all_promises(promises);

        this.set_filter_date_debut(this.fcSegment ? TimeSegmentHandler.getInstance().getStartTimeSegment(this.fcSegment) : null);
        this.set_filter_date_fin(this.fcSegment ? Dates.add(TimeSegmentHandler.getInstance().getEndTimeSegment(this.fcSegment), -1, TimeSegment.TYPE_DAY) : null);

        // this.filter_changed();
    }

    /**
     * Called when a valid external jQuery UI draggable, containing event data, has been dropped onto the calendar.
     * @param event
     */
    private async onFCEventReceive(event: EventObjectInput) {

        let self = this;
        let errormsg = 'programplan.fc.create.error';
        self.snotify.async(self.label('programplan.fc.create.start'), () =>
            new Promise(async (resolve, reject) => {

                let rdv: IPlanRDV;

                try {
                    rdv = self.program_plan_controller.getRDVNewInstance();
                    rdv.start_time = moment(event.start).utc(true).unix();
                    rdv.end_time = moment(event.end).utc(true).unix();

                    if (!!self.program_plan_shared_module.program_type_id) {
                        rdv.program_id = self.program_id;
                    }

                    if (!!self.program_plan_shared_module.task_type_id) {

                        // Soit on est sur un task_id et on prend son id,
                        // soit on est sur un type de task et on doit définir la task_id a assigner
                        let target_facilitator = self.get_targets_facilitators_by_ids[parseInt(event.resourceId)];

                        if (!target_facilitator) {
                            ConsoleHandler.getInstance().error("!task_type.order_tasks_on_same_target:event._type:" + event._type);
                            // self.setRdvById({ id: 0 } as any);
                            self.reset_rdvs();
                            reject({
                                body: self.label(errormsg),
                                config: {
                                    timeout: 10000,
                                    showProgressBar: true,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                },
                            });
                            return;
                        }

                        rdv.target_id = target_facilitator.target_id;
                        rdv.facilitator_id = target_facilitator.facilitator_id;

                        if (event._type == self.program_plan_shared_module.task_type_id) {
                            rdv.task_id = event.task_id;
                        } else {
                            // On doit choisir le RDV à poser
                            // Dépend de l'historique des Tasks déjà posées sur cette target
                            let task_type: IPlanTaskType = self.get_task_types_by_ids[event.task_type_id];

                            if (!task_type.order_tasks_on_same_target) {
                                // Pas normal...
                                ConsoleHandler.getInstance().error("!task_type.order_tasks_on_same_target:event._type:" + event._type);
                                // self.setRdvById({ id: 0 } as any);
                                self.reset_rdvs();
                                reject({
                                    body: self.label(errormsg),
                                    config: {
                                        timeout: 10000,
                                        showProgressBar: true,
                                        closeOnClick: false,
                                        pauseOnHover: true,
                                    },
                                });
                                return;
                            }

                            // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                            // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                            let all_rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(
                                self.program_plan_shared_module.rdv_type_id,
                                'target_id', [rdv.target_id]);

                            let max_weight: number = -1;
                            let max_weight_task: IPlanTask = null;
                            let nb_maxed_weight: number = 0;

                            for (let i in all_rdvs) {
                                let all_rdv = all_rdvs[i];
                                let all_rdv_task = self.get_tasks_by_ids[all_rdv.task_id];

                                if (!all_rdv_task) {
                                    continue;
                                }

                                if (all_rdv_task.task_type_id != task_type.id) {
                                    continue;
                                }

                                if (all_rdv.start_time > rdv.start_time) {
                                    errormsg = 'programplan.fc.create.has_more_recent_task__denied';
                                    // self.setRdvById({ id: 0 } as any);
                                    self.reset_rdvs();
                                    return;
                                }

                                if (all_rdv_task.weight > max_weight) {
                                    max_weight = all_rdv_task.weight;
                                    max_weight_task = all_rdv_task;
                                    nb_maxed_weight = 0;
                                }
                                nb_maxed_weight++;
                            }

                            // Il nous faut toutes les tâches possible dans ce type par poids
                            let task_type_tasks: IPlanTask[] = [];
                            for (let j in self.get_tasks_by_ids) {
                                let task_ = self.get_tasks_by_ids[j];

                                if (task_.task_type_id == task_type.id) {
                                    task_type_tasks.push(task_);
                                }
                            }
                            WeightHandler.getInstance().sortByWeight(task_type_tasks);

                            if ((!task_type_tasks) || (!task_type_tasks.length)) {
                                errormsg = 'programplan.fc.create.error';
                                ConsoleHandler.getInstance().error("!task_type_tasks.length");
                                // self.setRdvById({ id: 0 } as any);
                                self.reset_rdvs();
                                return;
                            }

                            let task: IPlanTask = null;
                            if (max_weight < 0) {
                                task = task_type_tasks[0];
                            } else {

                                if (max_weight_task.limit_on_same_target <= nb_maxed_weight) {
                                    task = WeightHandler.getInstance().findNextHeavierItemByWeight(task_type_tasks, max_weight);
                                }
                            }

                            if (!task) {
                                errormsg = 'programplan.fc.create.no_task_left';
                                ConsoleHandler.getInstance().error("!task");
                                // self.setRdvById({ id: 0 } as any);
                                self.reset_rdvs();
                                return;
                            }

                            rdv.task_id = task.id;
                        }
                    } else {
                        rdv.facilitator_id = parseInt(event.resourceId);
                        rdv.target_id = event.target_id;
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    // self.setRdvById({ id: 0 } as any);
                    self.reset_rdvs();
                    return;
                }

                if ((!event) || (!rdv)) {
                    errormsg = 'programplan.fc.create.error';
                    // self.setRdvById({ id: 0 } as any);
                    self.reset_rdvs();
                    return;
                }

                try {

                    if (!self.can_edit_rdv(rdv.facilitator_id)) {
                        errormsg = 'programplan.fc.create.denied';
                        throw new Error('Interdit');
                    }

                    if (await self.program_plan_controller.component_hook_refuseReceiveRDV(rdv, self.getStoredDatas, self.storeDatas, self.get_tasks_by_ids)) {
                        throw new Error('Interdit');
                    }

                    let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

                    if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                        throw new Error('Erreur côté serveur');
                    }

                    rdv.id = insertOrDeleteQueryResult.id;
                    rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(self.program_plan_shared_module.rdv_type_id, rdv.id);

                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    reject({
                        body: self.label(errormsg),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                    // self.setRdvById({ id: 0 } as any);
                    self.reset_rdvs();
                    return;
                }

                self.setRdvById(rdv);
                resolve({
                    body: self.label('programplan.fc.create.ok'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );
    }

    private can_edit_rdv(facilitator_id: number, new_facilitator_id: number = null): boolean {
        if (!this.can_edit_any) {
            return false;
        }

        if (this.can_edit_all) {
            return true;
        }

        if (!this.can_edit_own_team) {
            if (!this.can_edit_self) {
                return false;
            }

            // Peut modifier ses Rdvs
            if ((!!facilitator_id) && (this.getFacilitatorsByIds[facilitator_id]) &&
                (!!this.user) &&
                (this.getFacilitatorsByIds[facilitator_id].user_id == this.user.id)) {

                if ((!new_facilitator_id) || this.can_edit_rdv(new_facilitator_id)) {
                    return true;
                }
            }

            return false;
        }

        // Peut modifier les Rdvs de son équipe
        if ((!facilitator_id) || (!this.getFacilitatorsByIds[facilitator_id])) {
            return false;
        }

        // Test si user est facilitator
        if ((!!this.user_s_facilitators) && (this.user_s_facilitators.length > 0)) {
            for (let i in this.user_s_facilitators) {
                let facilitator = this.user_s_facilitators[i];

                if (this.getFacilitatorsByIds[facilitator_id].manager_id == facilitator.manager_id) {

                    if ((!new_facilitator_id) || this.can_edit_rdv(new_facilitator_id)) {
                        return true;
                    }
                }
            }
        }

        // Test si user est manager
        if ((!!this.user_s_managers) && (this.user_s_managers.length > 0)) {
            for (let i in this.user_s_managers) {
                let manager = this.user_s_managers[i];

                if (this.getFacilitatorsByIds[facilitator_id].manager_id == manager.id) {
                    if ((!new_facilitator_id) || this.can_edit_rdv(new_facilitator_id)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private async deleteSelectedEvent() {
        if (!this.selected_rdv) {
            return;
        }

        if (!this.can_edit_rdv(this.selected_rdv.facilitator_id)) {
            this.snotify.error(this.label('programplan.fc.delete.denied'));
            return;
        }

        let confirmation_content_code: string = 'programplan.delete.confirmation.body';

        // On check qu'on peut supprimer dans le cas d'un enchaînement de taches
        if (!!this.program_plan_shared_module.task_type_id) {
            let task = this.get_tasks_by_ids[this.selected_rdv.task_id];
            if (!task) {
                ConsoleHandler.getInstance().error('Impossible de retrouver le type de tache');
                return;
            }

            // Si on est sur une tache admin, on veut un texte différent
            if (task.is_facilitator_specific) {
                confirmation_content_code = 'programplan.delete.confirmation.facilitator_specific.body';
            }

            let task_type = this.get_task_types_by_ids[task.task_type_id];
            if (!task_type) {
                ConsoleHandler.getInstance().error('Impossible de retrouver le type de tache');
                return;
            }

            if (task_type.order_tasks_on_same_target) {

                // On check qu'on ne change pas l'ordre des RDVs sur la cible
                // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                let all_rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(
                    this.program_plan_shared_module.rdv_type_id,
                    'target_id', [this.selected_rdv.target_id]);

                for (let i in all_rdvs) {
                    let all_rdv = all_rdvs[i];
                    let all_rdv_task = this.get_tasks_by_ids[all_rdv.task_id];

                    if (all_rdv.id == this.selected_rdv.id) {
                        continue;
                    }

                    if (!all_rdv_task) {
                        continue;
                    }

                    if (all_rdv_task.task_type_id != task_type.id) {
                        continue;
                    }

                    if (all_rdv.start_time > this.selected_rdv.start_time) {
                        this.snotify.error(this.label('programplan.fc.delete.has_more_recent_event'));
                        return;
                    }
                }
            }
        }

        let self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression des CRs en premier lieu puis du rdv
        let onconfirmation = async (toast) => {

            if (!!toast) {
                self.$snotify.remove(toast.id);
            }


            self.snotify.async(self.label('programplan.delete.start'), () =>
                new Promise(async (resolve, reject) => {


                    let toDeleteVos: IPlanRDVCR[] = [];
                    for (let i in self.getCrsByIds) {
                        let cr: IPlanRDVCR = self.getCrsByIds[i];

                        if (cr.rdv_id != self.selected_rdv.id) {
                            continue;
                        }

                        toDeleteVos.push(cr);
                        self.removeCr(cr.id);
                    }

                    try {

                        if (toDeleteVos && toDeleteVos.length > 0) {
                            let insertOrDeleteQueryResult_: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs(toDeleteVos);
                            if ((!insertOrDeleteQueryResult_) || (insertOrDeleteQueryResult_.length != toDeleteVos.length)) {
                                throw new Error('Erreur serveur');
                            }
                        }
                        let insertOrDeleteQueryResult = await ModuleDAO.getInstance().deleteVOs([self.selected_rdv]);
                        if ((!insertOrDeleteQueryResult) || (insertOrDeleteQueryResult.length != 1)) {
                            throw new Error('Erreur serveur');
                        }
                    } catch (error) {
                        ConsoleHandler.getInstance().error(error);
                        reject({
                            body: self.label('programplan.delete.error'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }
                    self.removeRdv(self.selected_rdv.id);
                    self.set_refresh(true);
                    self.set_selected_rdv(null);
                    self.$router.push(self.route_path);

                    resolve({
                        body: self.label('programplan.delete.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                })
            );
        };

        if (!this.program_plan_controller.confirm_before_rdv_deletion) {
            await onconfirmation(null);
            return;
        }

        self.snotify.confirm(self.label(confirmation_content_code), self.label('programplan.delete.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: onconfirmation,
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private onFCEventRender(event: EventObjectInput, element, view: View) {
        this.program_plan_controller.onFCEventRender(event, element, view);
    }

    get user_s_facilitators(): IPlanFacilitator[] {
        if (!this.user) {
            return null;
        }

        if (!this.getFacilitatorsByIds) {
            return null;
        }

        let res: IPlanFacilitator[] = [];
        for (let i in this.getFacilitatorsByIds) {
            let facilitator = this.getFacilitatorsByIds[i];

            if (facilitator.user_id == this.user.id) {
                res.push(facilitator);
            }
        }

        return (res && res.length) ? res : null;
    }

    get user_s_managers(): IPlanManager[] {
        if (!this.user) {
            return null;
        }

        if (!this.getManagersByIds) {
            return null;
        }

        let res: IPlanManager[] = [];
        for (let i in this.getManagersByIds) {
            let manager = this.getManagersByIds[i];

            if (manager.user_id == this.user.id) {
                res.push(manager);
            }
        }

        return (res && res.length) ? res : null;
    }

    @Watch('selected_rdv', { immediate: true })
    private async onChangeSelectedRDV() {

        if (!this.selected_rdv) {
            return;
        }

        let self = this;

        let rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(this.program_plan_shared_module.rdv_type_id, 'target_id', [this.selected_rdv.target_id]);

        let rdvs_by_ids: { [id: number]: IPlanRDV } = VOsTypesManager.getInstance().vosArray_to_vosByIds(rdvs);
        self.addRdvsByIds(rdvs_by_ids);
        let rdvs_ids: number[] = ObjectHandler.getInstance().getNumberMapIndexes(rdvs_by_ids);

        let promises: Array<Promise<any>> = [];

        if (!!this.program_plan_shared_module.rdv_prep_type_id) {
            promises.push((async () => {
                let vos: IPlanRDVPrep[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(this.program_plan_shared_module.rdv_prep_type_id, 'rdv_id', rdvs_ids);
                self.addPrepsByIds(vos);
            })());
        }
        promises.push((async () => {
            let vos: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(this.program_plan_shared_module.rdv_cr_type_id, 'rdv_id', rdvs_ids);
            self.addCrsByIds(vos);
        })());

        await all_promises(promises);
    }


    private get_printable_table_weeks() {
        let res = [];

        let date_debut = (Dates.day(this.filter_date_debut) == 1) ? this.filter_date_debut : Dates.day(this.filter_date_debut, 1);
        let date_fin = (Dates.day(this.filter_date_fin) == 0) ? this.filter_date_fin : Dates.day(this.filter_date_fin, 7);

        let d = date_debut;

        let week_begin = d;
        let week_end = Dates.add(d, 6, TimeSegment.TYPE_DAY);

        let week: any = {};
        week.days = this.get_printable_table_days(week_begin, week_end);
        // week.rows = this.printform_filter_clientformat ? this.get_printable_table_rows_clientformat(week_begin, week_end) : this.get_printable_table_rows(week_begin, week_end);
        week.rows = this.get_printable_table_rows(week_begin, week_end);
        res.push(week);
        d = Dates.add(d, 7, TimeSegment.TYPE_DAY);

        while (d <= date_fin) {


            week_begin = d;
            week_end = Dates.add(d, 6, TimeSegment.TYPE_DAY);

            week = {};
            week.days = this.get_printable_table_days(week_begin, week_end);
            // week.rows = this.printform_filter_clientformat ? this.get_printable_table_rows_clientformat(week_begin, week_end) : this.get_printable_table_rows(week_begin, week_end);
            week.rows = this.get_printable_table_rows(week_begin, week_end);
            res.push(week);

            d = Dates.add(d, 7, TimeSegment.TYPE_DAY);
        }
        return res;
    }

    private get_printable_table_days(date_debut: number, date_fin: number) {
        let res = [];

        let d: number = date_debut;

        while (d <= date_fin) {

            res.push(Dates.format(d, 'DD/MM'));
            d = Dates.add(d, 1, TimeSegment.TYPE_DAY);
        }

        return res;
    }

    private get_printable_table_rows(date_debut: number, date_fin: number) {
        let res = [];

        for (let i in this.valid_facilitators) {
            let datas_animateur = [];
            let facilitator = this.valid_facilitators[i];

            // Remplir le tableau en fonction des dates, à vide.
            /*let date_debut = moment(this.printform_filter_date_debut).day() == 1 ? moment(this.printform_filter_date_debut) : moment(this.printform_filter_date_debut).day(1);
            let date_fin = moment(this.printform_filter_date_fin).day() == 0 ? moment(this.printform_filter_date_fin) : moment(this.printform_filter_date_fin).day(7);
            */

            let d = date_debut;

            let nb_offsets = 0;

            while (d <= date_fin) {

                // am / pm ou am / am, pm / pm
                for (let day_slice = 0; day_slice < this.nb_day_slices; day_slice++) {
                    datas_animateur.push({
                        isrdv: false,
                        nb_slots: 1
                    });
                }
                d = Dates.add(d, 1, TimeSegment.TYPE_DAY);
                nb_offsets += this.nb_day_slices;
            }

            // Positionner les évènements
            for (let j in this.valid_rdvs) {
                let rdv = this.valid_rdvs[j];

                // if ((!!rdv.task_id) && (!!this.get_tasks_by_ids[rdv.task_id]) && (this.get_tasks_by_ids[rdv.task_id].is_facilitator_specific)) {
                //     // On ignore les taches d'admin
                //     continue;
                // }

                if (rdv.facilitator_id == facilitator.id) {

                    if (((rdv.start_time < Dates.add(this.filter_date_fin, 1, TimeSegment.TYPE_DAY)) &&
                        (rdv.start_time >= this.filter_date_debut)) ||
                        ((rdv.end_time <= Dates.add(this.filter_date_fin, 1, TimeSegment.TYPE_DAY)) &&
                            (rdv.end_time > this.filter_date_debut))) {

                        // Calculer l'index
                        let offset_start = Dates.diff(rdv.start_time, date_debut, TimeSegment.TYPE_HOUR);
                        let offset_start_halfdays = Math.round(offset_start / (24 / this.nb_day_slices));

                        if (offset_start_halfdays < 0) {
                            offset_start_halfdays = 0;
                        }

                        let offset_end = Dates.diff(rdv.end_time, date_debut, TimeSegment.TYPE_HOUR);
                        let offset_end_halfdays = Math.round(offset_end / (24 / this.nb_day_slices));

                        if (offset_end_halfdays >= nb_offsets) {
                            offset_end_halfdays = nb_offsets - 1;
                        }

                        if ((offset_end_halfdays - offset_start_halfdays) < 0) {
                            continue;
                        }

                        datas_animateur[offset_start_halfdays] = {
                            isrdv: true,
                            nb_slots: (offset_end_halfdays - offset_start_halfdays),
                            short_name: this.getTargetsByIds[rdv.target_id].name,
                            target_id: rdv.target_id,
                            resourceId: facilitator.id,
                            title: this.getTargetsByIds[rdv.target_id].name,
                            task_id: rdv.task_id
                        };

                        this.program_plan_controller.populateCalendarEvent(
                            datas_animateur[offset_start_halfdays]);
                    }
                }
            }

            // Regrouper les evenements et les cases vides
            let res_datas_animateur = [];
            let ignore_next_indexes = 0;
            let combine = 0;
            let last_res_data = null;

            // Les lignes vides ne sont pas imprimées
            let emptyrow = true;

            for (let k in datas_animateur) {
                let data_animateur = datas_animateur[k];

                if (ignore_next_indexes) {
                    ignore_next_indexes--;
                    continue;
                }

                if (last_res_data && (!last_res_data.isrdv) && (!data_animateur.isrdv)) {
                    last_res_data.nb_slots++;
                    continue;
                }

                last_res_data = {
                    isrdv: data_animateur.isrdv,
                    nb_slots: data_animateur.nb_slots,
                    color: data_animateur.color,
                    bgcolor: data_animateur.bgcolor,
                    short_name: data_animateur.short_name
                };

                if (data_animateur.isrdv) {
                    emptyrow = false;
                }

                res_datas_animateur.push(last_res_data);

                if (data_animateur.nb_slots > 1) {
                    ignore_next_indexes = data_animateur.nb_slots - 1;
                }
            }

            if (!emptyrow) {
                res.push(res_datas_animateur);
            }
        }

        return res;
    }

    get nb_day_slices() {
        return Math.floor(24 / this.program_plan_controller.slot_interval);
    }

    @Watch('getTargetsByIds', { deep: true, immediate: true })
    private onchange_getTargetsByIds() {
        this.reset_targets();
    }

    private reset_targets_throttled() {
        let valid_targets: IPlanTarget[] = [];
        let valid_target_by_ids: { [id: number]: IPlanTarget } = {};

        for (let i in this.getTargetsByIds) {
            let target: IPlanTarget = this.getTargetsByIds[i];

            if ((!!this.program_plan_controller.is_valid_target) && (!this.program_plan_controller.is_valid_target(target))) {
                continue;
            }

            valid_targets.push(target);
            valid_target_by_ids[target.id] = target;
        }

        Vue.set(this, 'valid_targets', valid_targets);
        Vue.set(this, 'valid_target_by_ids', valid_target_by_ids);

        // On change la clé une fois le throttle terminé pour s'assurer de prendre en compte les params à jour
        this.calendar_key++;
    }

    private filter_ready() {
        this.reset_targets();
    }

    @Watch('getFacilitatorsByIds', { deep: true, immediate: true })
    private reset_facilitators() {
        this.valid_facilitators = [];
        for (let i in this.getFacilitatorsByIds) {
            let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[i];

            if ((!!this.program_plan_controller.is_valid_facilitator) && (!this.program_plan_controller.is_valid_facilitator(facilitator))) {
                continue;
            }
            this.valid_facilitators.push(facilitator);
        }
    }

    @Watch('valid_targets', { deep: true, immediate: true })
    @Watch('getRdvsByIds', { deep: true, immediate: true })
    private debounce_reset_rdvs() {
        this.debounced_reset_rdvs();
    }

    get debounced_reset_rdvs() {
        let self = this;
        return debounce(async () => {
            self.reset_rdvs();
        }, this.program_plan_controller.reset_rdvs_debouncer);
    }

    private reset_rdvs() {
        this.valid_rdvs = [];
        for (let i in this.getRdvsByIds) {
            let rdv: IPlanRDV = this.getRdvsByIds[i];

            if ((!!this.program_plan_controller.is_valid_rdv) && (!this.program_plan_controller.is_valid_rdv(rdv))) {
                continue;
            }
            this.valid_rdvs.push(rdv);
        }
    }

    private filter_changed() {

        this.reset_targets();
        this.reset_facilitators();
        this.reset_rdvs();
    }

    get show_calendar(): boolean {
        return this.program_plan_controller.show_calendar;
    }

    get show_targets_pp(): boolean {
        return this.program_plan_controller.show_targets_pp;
    }
}