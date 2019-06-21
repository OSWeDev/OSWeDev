import * as debounce from 'lodash/debounce';
import { EventObjectInput, View } from 'fullcalendar';
import * as $ from 'jquery';
import * as moment from 'moment';
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
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
import DateHandler from '../../../../shared/tools/DateHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
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
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from './store/ProgramPlanStore';
import ProgramPlanComponentTargetListing from './TargetListing/ProgramPlanComponentTargetListing';
import ModuleTable from '../../../../shared/modules/ModuleTable';


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
    public filter_date_debut: moment.Moment;

    @ModuleProgramPlanGetter
    public filter_date_fin: moment.Moment;

    @ModuleProgramPlanGetter
    public can_edit_any: boolean;
    @ModuleProgramPlanGetter
    public can_edit_all: boolean;
    @ModuleProgramPlanGetter
    public can_edit_own_team: boolean;
    @ModuleProgramPlanGetter
    public can_edit_self: boolean;

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

    @ModuleProgramPlanAction
    public set_targets_regions_by_ids: (targets_regions_by_ids: { [id: number]: IPlanTargetRegion }) => void;

    @ModuleProgramPlanAction
    public set_targets_zones_by_ids: (targets_zones_by_ids: { [id: number]: IPlanTargetZone }) => void;

    @ModuleProgramPlanAction
    public set_targets_groups_by_ids: (targets_groups_by_ids: { [id: number]: IPlanTargetGroup }) => void;

    @ModuleProgramPlanAction
    public addRdvsByIds: (rdvs_by_ids: { [id: number]: IPlanRDV }) => void;

    @ModuleProgramPlanAction
    public addCrsByIds: (crs_by_ids: { [id: number]: IPlanRDVCR }) => void;

    @ModuleProgramPlanAction
    public addPrepsByIds: (preps_by_ids: { [id: number]: IPlanRDVPrep }) => void;

    @ModuleProgramPlanAction
    public set_filter_date_debut: (filter_date_debut: moment.Moment) => void;

    @ModuleProgramPlanAction
    public set_filter_date_fin: (filter_date_fin: moment.Moment) => void;

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

    private user = VueAppController.getInstance().data_user;
    private fcEvents: EventObjectInput[] = [];

    private calendar_date: string = DateHandler.getInstance().formatDayForIndex(moment());
    private viewname: string = 'timelineWeek';

    private fcSegment: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
        moment(this.calendar_date),
        (this.viewname == "timelineWeek") ? TimeSegment.TYPE_WEEK : TimeSegment.TYPE_MONTH);

    private custom_filter_component = ProgramPlanControllerBase.getInstance().customFilterComponent;
    private custom_overview_program_plan_component = ProgramPlanControllerBase.getInstance().customOverviewProgramPlanComponent;

    private show_targets: boolean = true;

    private valid_targets: IPlanTarget[] = [];
    private valid_facilitators: IPlanFacilitator[] = [];
    private valid_rdvs: IPlanRDV[] = [];

    private calendar_key: number = 1;

    get route_path(): string {
        return this.global_route_path + ((!!this.program_id) ? this.program_id : 'g');
    }

    public async mounted() {
        let self = this;
        this.$nextTick(async () => {

            // On va vérifier qu'on a le droit de faire cette action
            let promises: Array<Promise<any>> = [];

            promises.push((async () => {
                self.set_can_edit_any(await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_EDIT));
            })());
            promises.push((async () => {
                self.set_can_edit_all(await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_EDIT_ALL_RDVS));
            })());
            promises.push((async () => {
                self.set_can_edit_own_team(await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_EDIT_OWN_TEAM_RDVS));
            })());
            promises.push((async () => {
                self.set_can_edit_self(await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_EDIT_OWN_RDVS));
            })());
            promises.push(self.reloadAsyncData());

            await Promise.all(promises);

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
        return ProgramPlanControllerBase.getInstance().use_print_component;
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

        await ProgramPlanControllerBase.getInstance().component_hook_onAsyncLoading(this.getStoredDatas, this.storeDatas);

        this.nextLoadingStep();

        let promises = [];

        if ((!!ModuleProgramPlanBase.getInstance().partner_type_id) ||
            (ModuleProgramPlanBase.getInstance().program_manager_type_id) ||
            (ModuleProgramPlanBase.getInstance().program_facilitator_type_id) ||
            (ModuleProgramPlanBase.getInstance().program_target_type_id) ||
            (ModuleProgramPlanBase.getInstance().target_region_type_id) ||
            (ModuleProgramPlanBase.getInstance().target_zone_type_id) ||
            (ModuleProgramPlanBase.getInstance().target_group_type_id)) {

            // partenaires (on charge tous les partenaires ça parait pas être voué à exploser comme donnée mais à suivre)
            if (!!ModuleProgramPlanBase.getInstance().partner_type_id) {
                promises.push((async () => {
                    self.setPartnersByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<IPlanPartner>(ModuleProgramPlanBase.getInstance().partner_type_id)));
                })());
            }

            if (!!ModuleProgramPlanBase.getInstance().target_region_type_id) {
                promises.push((async () => {
                    self.set_targets_regions_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<IPlanTargetRegion>(ModuleProgramPlanBase.getInstance().target_region_type_id)));
                })());
            }

            if (!!ModuleProgramPlanBase.getInstance().target_zone_type_id) {
                promises.push((async () => {
                    self.set_targets_zones_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<IPlanTargetZone>(ModuleProgramPlanBase.getInstance().target_zone_type_id)));
                })());
            }

            if (!!ModuleProgramPlanBase.getInstance().target_group_type_id) {
                promises.push((async () => {
                    self.set_targets_groups_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<IPlanTargetGroup>(ModuleProgramPlanBase.getInstance().target_group_type_id)));
                })());
            }

            // managers du programme
            if (!!ModuleProgramPlanBase.getInstance().program_manager_type_id) {
                promises.push((async () => {
                    let program_managers: IPlanProgramManager[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramManager>(ModuleProgramPlanBase.getInstance().program_manager_type_id, 'program_id', [self.program_id]);
                    self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_manager_type_id, vos: program_managers });
                })());
            }

            // animateurs du programme
            if (!!ModuleProgramPlanBase.getInstance().program_facilitator_type_id) {
                promises.push((async () => {
                    let program_facilitators: IPlanProgramFacilitator[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramFacilitator>(ModuleProgramPlanBase.getInstance().program_facilitator_type_id, 'program_id', [self.program_id]);
                    self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_facilitator_type_id, vos: program_facilitators });
                })());
            }

            // établissements du programme
            if (!!ModuleProgramPlanBase.getInstance().program_target_type_id) {
                promises.push((async () => {
                    let program_targets: IPlanProgramTarget[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramTarget>(ModuleProgramPlanBase.getInstance().program_target_type_id, 'program_id', [self.program_id]);
                    self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_target_type_id, vos: program_targets });
                })());
            }

            await Promise.all(promises);
            promises = [];
        }

        self.nextLoadingStep();

        // managers
        if (!!ModuleProgramPlanBase.getInstance().manager_type_id) {

            promises.push((async () => {

                let managers: IPlanManager[] = null;

                if (!!ModuleProgramPlanBase.getInstance().program_manager_type_id) {
                    let ids: { [id: number]: boolean } = [];
                    for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id]) {
                        let program_manager: IPlanProgramManager = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id][i] as IPlanProgramManager;
                        ids[program_manager.manager_id] = true;
                    }
                    managers = await ModuleDAO.getInstance().getVosByIds<IPlanManager>(
                        ModuleProgramPlanBase.getInstance().manager_type_id,
                        ObjectHandler.getInstance().getNumberMapIndexes(ids));
                } else {
                    managers = await ModuleDAO.getInstance().getVos<IPlanManager>(ModuleProgramPlanBase.getInstance().manager_type_id);
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
        if (!!ModuleProgramPlanBase.getInstance().task_type_type_id) {
            promises.push((async () => {
                let task_types: IPlanTaskType[] = await ModuleDAO.getInstance().getVos<IPlanTaskType>(ModuleProgramPlanBase.getInstance().task_type_type_id);
                self.set_task_types_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(task_types));
            })());
        }

        // Tasks
        if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
            promises.push((async () => {
                let tasks: IPlanTask[] = await ModuleDAO.getInstance().getVos<IPlanTask>(ModuleProgramPlanBase.getInstance().task_type_id);
                let tmps: IPlanTask[] = [];

                for (let i in tasks) {
                    let task = tasks[i];

                    if (!ProgramPlanControllerBase.getInstance().hide_task(task)) {
                        tmps.push(task);
                    }
                }
                self.set_tasks_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(tmps));
            })());
        }

        // animateurs
        promises.push((async () => {
            let facilitators: IPlanFacilitator[] = null;

            if (!!ModuleProgramPlanBase.getInstance().program_facilitator_type_id) {
                let ids: { [id: number]: boolean } = [];
                for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id]) {
                    let program_facilitator: IPlanProgramFacilitator = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id][i] as IPlanProgramFacilitator;
                    ids[program_facilitator.facilitator_id] = true;
                }
                facilitators = await ModuleDAO.getInstance().getVosByIds<IPlanFacilitator>(
                    ModuleProgramPlanBase.getInstance().facilitator_type_id,
                    ObjectHandler.getInstance().getNumberMapIndexes(ids));
            } else {
                facilitators = await ModuleDAO.getInstance().getVos<IPlanFacilitator>(ModuleProgramPlanBase.getInstance().facilitator_type_id);
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

            if (!!ModuleProgramPlanBase.getInstance().program_target_type_id) {

                let ids: { [id: number]: boolean } = [];
                for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id]) {
                    let program_target: IPlanProgramTarget = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id][i] as IPlanProgramTarget;
                    ids[program_target.target_id] = true;
                }
                targets = await ModuleDAO.getInstance().getVosByIds<IPlanTarget>(
                    ModuleProgramPlanBase.getInstance().target_type_id,
                    ObjectHandler.getInstance().getNumberMapIndexes(ids));
            } else {
                targets = await ModuleDAO.getInstance().getVos<IPlanTarget>(ModuleProgramPlanBase.getInstance().target_type_id);
            }

            let targets_by_ids: { [id: number]: IPlanTarget } = {};
            for (let i in targets) {
                let target: IPlanTarget = targets[i];

                if (!target.activated) {
                    continue;
                }

                if (await ProgramPlanControllerBase.getInstance().component_hook_refuseTargetOnLoading(target, this.getStoredDatas, this.storeDatas)) {
                    continue;
                }

                targets_by_ids[target.id] = target;
            }

            self.setTargetsByIds(targets_by_ids);
        })());

        await Promise.all(promises);
        self.nextLoadingStep();

        // targets facilitators
        if (!!ModuleProgramPlanBase.getInstance().target_facilitator_type_id) {
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
                        ModuleProgramPlanBase.getInstance().target_facilitator_type_id,
                        'target_id', targets_ids,
                        'facilitator_id', facilitators_ids
                    )));
            })());
        }

        if (!!ModuleProgramPlanBase.getInstance().enseigne_type_id) {

            promises = [];

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
                    ModuleProgramPlanBase.getInstance().enseigne_type_id,
                    ObjectHandler.getInstance().getNumberMapIndexes(ids));

                let enseignes_by_ids: { [id: number]: IPlanEnseigne } = {};
                for (let i in enseignes) {
                    let enseigne: IPlanEnseigne = enseignes[i];

                    enseignes_by_ids[enseigne.id] = enseigne;
                }

                self.setEnseignesByIds(enseignes_by_ids);
            })());

            await Promise.all(promises);
        }

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
        return ProgramPlanControllerBase.getInstance().getResourceName(first_name, name);
    }

    get planningResources() {
        // On veut un tableau avec des éléments de ce type:
        // {
        //   id: 1,
        //   title: 'animateur',
        //   manager_title: 'manager'
        // }

        let res = [];

        if (!!ModuleProgramPlanBase.getInstance().target_facilitator_type_id) {

            for (let i in this.valid_targets) {
                let target: IPlanTarget = this.valid_targets[i];

                for (let j in this.get_targets_facilitators_by_ids) {

                    let target_facilitator: IPlanTargetFacilitator = this.get_targets_facilitators_by_ids[j];

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
                    let target_table: ModuleTable<IPlanTarget> = VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().target_type_id];
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

        if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
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

        let target: IPlanTarget = null;
        for (let i in this.valid_targets) {
            if (this.valid_targets[i].id == rdv.target_id) {
                target = this.valid_targets[i];
            }
        }
        if (!target) {
            // on a un RDV en base qui est orphelin on ignore, sauf si tache admin
            if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
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
            start: rdv.start_time,
            end: rdv.end_time,
            title: null,
            state: rdv.state
        };
        if (!!ModuleProgramPlanBase.getInstance().target_facilitator_type_id) {

            if (!this.get_tasks_by_ids[rdv.task_id]) {
                console.error('TASK id introuvable:' + rdv.task_id);
                return null;
            }

            event_item.task_id = rdv.task_id;
            event_item.title = this.get_tasks_by_ids[rdv.task_id].name;

            // Si on est sur ce mode d'affichage, il faut gérer le cas d'un RDV admin (donc lié à un facilitator et non une target+facilitator)
            //  et dans ce cas on renvoie un event pour toutes les ressources identifiées

            if ((!!this.get_tasks_by_ids[rdv.task_id]) && (this.get_tasks_by_ids[rdv.task_id].is_facilitator_specific)) {

                // C'est une tâche d'admin sur l'employé
                for (let i in this.get_targets_facilitators_by_ids) {
                    let target_facilitator: IPlanTargetFacilitator = this.get_targets_facilitators_by_ids[i];

                    if (target_facilitator.facilitator_id != rdv.facilitator_id) {
                        continue;
                    }

                    let cloned_event = Object.assign({}, event_item);
                    cloned_event.target_id = target_facilitator.target_id;
                    cloned_event.resourceId = target_facilitator.id.toString();
                    res.push(cloned_event);
                }
            } else {
                for (let i in this.get_targets_facilitators_by_ids) {
                    let target_facilitator: IPlanTargetFacilitator = this.get_targets_facilitators_by_ids[i];

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
            ProgramPlanControllerBase.getInstance().populateCalendarEvent(res[i]);
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
        if (this.calendar_date != DateHandler.getInstance().formatDayForIndex(view.intervalStart)) {
            this.calendar_date = DateHandler.getInstance().formatDayForIndex(view.intervalStart);
        }
    }

    @Watch('calendar_date')
    private onchange_calendar_date_direct() {

        this.debounced_onchange_calendar_date();
    }

    get debounced_onchange_calendar_date() {

        return debounce(this.onchange_calendar_date, 1000);
    }

    @Watch('viewname')
    private onchange_calendar_date() {

        if (!moment(this.calendar_date).isValid()) {
            return;
        }

        let segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            moment(this.calendar_date),
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

        this.snotify.info(this.label('programplan.fc.update.start'));
        if ((!event) || (!event.rdv_id) || (!this.getRdvsByIds[event.rdv_id])) {
            this.snotify.error(this.label('programplan.fc.update.error'));
            return;
        }
        let rdv: IPlanRDV = this.getRdvsByIds[event.rdv_id] as IPlanRDV;

        let tmp_start: string = rdv.start_time;
        let tmp_end: string = rdv.end_time;
        let tmp_facilitator_id: number = rdv.facilitator_id;
        let tmp_target_id: number = rdv.target_id;

        let new_facilitator_id: number = null;
        let new_target_id: number = null;
        let new_start_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.start));
        let new_end_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.end));

        if (!!ModuleProgramPlanBase.getInstance().target_facilitator_type_id) {
            let new_target_facilitator_id: number = parseInt(event.resourceId);
            for (let i in this.get_targets_facilitators_by_ids) {
                let target_facilitator: IPlanTargetFacilitator = this.get_targets_facilitators_by_ids[i];

                if (target_facilitator.id != new_target_facilitator_id) {
                    continue;
                }

                new_facilitator_id = target_facilitator.facilitator_id;
                new_target_id = target_facilitator.target_id;
                break;
            }
        } else {
            new_facilitator_id = parseInt(event.resourceId);
            new_target_id = tmp_target_id;
        }

        try {

            if (!this.can_edit_rdv(tmp_facilitator_id, new_facilitator_id)) {
                this.snotify.error(this.label('programplan.fc.update.denied'));
                throw new Error('Pas le droit');
            }

            if (!!ModuleProgramPlanBase.getInstance().target_facilitator_type_id) {
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
                        this.snotify.error(this.label('programplan.fc.update.denied_change_target'));
                        throw new Error('Pas le droit de changer d\'établissement ou d\'animateur sur des RDVs à choix automatique.');
                    }

                    // On check qu'on ne change pas l'ordre des RDVs sur la cible
                    // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                    // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                    let all_rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(
                        ModuleProgramPlanBase.getInstance().rdv_type_id,
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

                        let min_moment = moment(tmp_start);
                        let max_moment = moment(new_start_time);
                        if (moment(tmp_start).isAfter(moment(new_start_time))) {

                            min_moment = moment(new_start_time);
                            max_moment = moment(tmp_start);
                        }

                        if (moment(all_rdv.start_time).isBetween(min_moment, max_moment)) {
                            this.snotify.error(this.label('programplan.fc.update.cannot_change_rdv_order'));
                            throw new Error('Pas le droit de changer l\'ordre sur des RDVs à choix automatique.');
                        }
                    }
                }
            }

            rdv.start_time = new_start_time;
            rdv.end_time = new_end_time;
            rdv.facilitator_id = new_facilitator_id;
            rdv.target_id = new_target_id;

            if (await ProgramPlanControllerBase.getInstance().component_hook_refuseChangeRDV(rdv, this.getStoredDatas, this.storeDatas, this.get_tasks_by_ids)) {
                throw new Error('Interdit');
            }

            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur côté serveur');
            }

            rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(ModuleProgramPlanBase.getInstance().rdv_type_id, rdv.id);

        } catch (error) {
            console.error(error);
            this.snotify.error(this.label('programplan.fc.update.error'));

            // On tente d'annuler le déplacement initial
            try {
                revertFunc();
                rdv.start_time = tmp_start;
                rdv.end_time = tmp_end;
                rdv.facilitator_id = tmp_facilitator_id;
            } catch (error) {
            }
            return;
        }
        this.setRdvById(rdv);

        this.snotify.success(this.label('programplan.fc.update.ok'));
    }

    /**
     * On peut être amenés à changer les paramètres en fonction des types disponibles :
     *  Si on a défini des taches et types de taches, on utilise plus les targets, et on pose des tasks sur des targets plutôt
     */
    get fcConfig() {

        let resourceColumns = [];
        let facilitator_column = {
            labelText: this.label('programplan.fc.facilitator.name'),
            field: 'title',
            group: undefined,
            width: undefined
        };

        if (!!ModuleProgramPlanBase.getInstance().target_facilitator_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.fc.target.name'),
                field: 'target_name',
                group: true,
                width: '65%'
            });
            //facilitator_column.group = true;
            facilitator_column.width = '35%';
        }

        resourceColumns.push(facilitator_column);

        if (!!ModuleProgramPlanBase.getInstance().manager_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.fc.manager.name'),
                field: 'manager_title',
                group: true
            });
        }

        if (!!ModuleProgramPlanBase.getInstance().partner_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.fc.partner.name'),
                field: 'partner_name'
            });
        }

        let slotLabelFormat = [
            'ddd D/M'
        ];

        if (ProgramPlanControllerBase.getInstance().slot_interval < 24) {
            slotLabelFormat.push('a');
        }

        return {
            locale: 'fr',
            timeZone: 'locale',
            dayNamesShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            now: moment().format('Y-MM-DD'),
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
                right: ProgramPlanControllerBase.getInstance().month_view ? 'timelineWeek,timelineMonth' : 'timelineWeek'
            },
            defaultView: this.viewname,
            views: {
                timelineMonth: {
                    slotWidth: 150 / this.nb_day_slices,
                    slotLabelInterval: {
                        hours: ProgramPlanControllerBase.getInstance().slot_interval
                    },
                    slotDuration: {
                        hours: ProgramPlanControllerBase.getInstance().slot_interval
                    },
                },
                timelineWeek: {
                    slotWidth: 150 / this.nb_day_slices,
                    slotLabelInterval: {
                        hours: ProgramPlanControllerBase.getInstance().slot_interval
                    },
                    slotDuration: {
                        hours: ProgramPlanControllerBase.getInstance().slot_interval
                    },
                }
            },
            defaultTimedEventDuration: {
                hours: ProgramPlanControllerBase.getInstance().slot_interval
            },
            navLinks: false,
            eventOverlap: false,
            resourceAreaWidth: '400px',
            resourceLabelText: this.label('programplan.fc.resourcelabeltext.name'),
            slotLabelFormat,
            resourceColumns,
            resources: this.planningResources,
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

    @Watch('fcSegment', { deep: true })
    private async onChangeFCSegment() {

        let promises: Array<Promise<any>> = [];
        let self = this;

        // RDVs
        // Sont chargés lors du changement de segment consulté
        if (ProgramPlanControllerBase.getInstance().load_rdv_on_segment_change) {

            promises.push((async () => {
                self.setRdvsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleProgramPlanBase.getInstance().getRDVsOfProgramSegment(self.program_id, self.fcSegment)));
            })());
        }

        // Preps
        promises.push((async () => {
            self.setPrepsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleProgramPlanBase.getInstance().getPrepsOfProgramSegment(self.program_id, self.fcSegment)));
        })());

        // CRs
        promises.push((async () => {
            self.setCrsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleProgramPlanBase.getInstance().getCRsOfProgramSegment(self.program_id, self.fcSegment)));
        })());

        await Promise.all(promises);

        this.set_filter_date_debut(this.fcSegment ? TimeSegmentHandler.getInstance().getStartTimeSegment(this.fcSegment) : null);
        this.set_filter_date_fin(this.fcSegment ? TimeSegmentHandler.getInstance().getEndTimeSegment(this.fcSegment).add(-1, 'day') : null);

        // this.filter_changed();
    }

    /**
     * Called when a valid external jQuery UI draggable, containing event data, has been dropped onto the calendar.
     * @param event
     */
    private async onFCEventReceive(event: EventObjectInput) {
        this.snotify.info(this.label('programplan.fc.create.start'));

        let rdv: IPlanRDV;

        try {
            rdv = ProgramPlanControllerBase.getInstance().getRDVNewInstance();
            rdv.start_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.start));
            rdv.end_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.end));

            if (!!ModuleProgramPlanBase.getInstance().program_type_id) {
                rdv.program_id = this.program_id;
            }

            if (!!ModuleProgramPlanBase.getInstance().task_type_id) {

                // Soit on est sur un task_id et on prend son id,
                // soit on est sur un type de task et on doit définir la task_id a assigner
                let target_facilitator = this.get_targets_facilitators_by_ids[parseInt(event.resourceId)];

                if (!target_facilitator) {
                    this.snotify.error(this.label('programplan.fc.create.error'));
                    console.error("!task_type.order_tasks_on_same_target:event._type:" + event._type);
                    // this.setRdvById({ id: 0 } as any);
                    this.reset_rdvs();
                    return;
                }

                rdv.target_id = target_facilitator.target_id;
                rdv.facilitator_id = target_facilitator.facilitator_id;

                if (event._type == ModuleProgramPlanBase.getInstance().task_type_id) {
                    rdv.task_id = event.task_id;
                } else {
                    // On doit choisir le RDV à poser
                    // Dépend de l'historique des Tasks déjà posées sur cette target
                    let task_type: IPlanTaskType = this.get_task_types_by_ids[event.task_type_id];

                    if (!task_type.order_tasks_on_same_target) {
                        // Pas normal...
                        this.snotify.error(this.label('programplan.fc.create.error'));
                        console.error("!task_type.order_tasks_on_same_target:event._type:" + event._type);
                        // this.setRdvById({ id: 0 } as any);
                        this.reset_rdvs();
                        return;
                    }

                    // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                    // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                    let all_rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(
                        ModuleProgramPlanBase.getInstance().rdv_type_id,
                        'target_id', [rdv.target_id]);

                    let max_weight: number = -1;
                    let max_weight_task: IPlanTask = null;
                    let nb_maxed_weight: number = 0;

                    for (let i in all_rdvs) {
                        let all_rdv = all_rdvs[i];
                        let all_rdv_task = this.get_tasks_by_ids[all_rdv.task_id];

                        if (!all_rdv_task) {
                            continue;
                        }

                        if (all_rdv_task.task_type_id != task_type.id) {
                            continue;
                        }

                        if (moment(all_rdv.start_time).isAfter(moment(rdv.start_time))) {
                            this.snotify.error(this.label('programplan.fc.create.has_more_recent_task__denied'));
                            // this.setRdvById({ id: 0 } as any);
                            this.reset_rdvs();
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
                    for (let j in this.get_tasks_by_ids) {
                        let task_ = this.get_tasks_by_ids[j];

                        if (task_.task_type_id == task_type.id) {
                            task_type_tasks.push(task_);
                        }
                    }
                    WeightHandler.getInstance().sortByWeight(task_type_tasks);

                    if ((!task_type_tasks) || (!task_type_tasks.length)) {
                        this.snotify.error(this.label('programplan.fc.create.error'));
                        console.error("!task_type_tasks.length");
                        // this.setRdvById({ id: 0 } as any);
                        this.reset_rdvs();
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
                        this.snotify.error(this.label('programplan.fc.create.no_task_left'));
                        console.error("!task");
                        // this.setRdvById({ id: 0 } as any);
                        this.reset_rdvs();
                        return;
                    }

                    rdv.task_id = task.id;
                }
            } else {
                rdv.facilitator_id = parseInt(event.resourceId);
                rdv.target_id = event.target_id;
            }
        } catch (error) {
            console.error(error);
            // this.setRdvById({ id: 0 } as any);
            this.reset_rdvs();
            return;
        }

        if ((!event) || (!rdv)) {
            this.snotify.error(this.label('programplan.fc.create.error'));
            // this.setRdvById({ id: 0 } as any);
            this.reset_rdvs();
            return;
        }

        try {

            if (!this.can_edit_rdv(rdv.facilitator_id)) {
                this.snotify.error(this.label('programplan.fc.create.denied'));
                throw new Error('Interdit');
            }

            if (await ProgramPlanControllerBase.getInstance().component_hook_refuseReceiveRDV(rdv, this.getStoredDatas, this.storeDatas, this.get_tasks_by_ids)) {
                throw new Error('Interdit');
            }

            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur côté serveur');
            }

            rdv.id = parseInt(insertOrDeleteQueryResult.id);
            rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(ModuleProgramPlanBase.getInstance().rdv_type_id, rdv.id);

        } catch (error) {
            console.error(error);
            this.snotify.error(this.label('programplan.fc.create.error'));
            // this.setRdvById({ id: 0 } as any);
            this.reset_rdvs();
            return;
        }

        this.setRdvById(rdv);
        this.snotify.success(this.label('programplan.fc.create.ok'));
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
        if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
            let task = this.get_tasks_by_ids[this.selected_rdv.task_id];
            if (!task) {
                console.error('Impossible de retrouver le type de tache');
                return;
            }

            // Si on est sur une tache admin, on veut un texte différent
            if (task.is_facilitator_specific) {
                confirmation_content_code = 'programplan.delete.confirmation.facilitator_specific.body';
            }

            let task_type = this.get_task_types_by_ids[task.task_type_id];
            if (!task_type) {
                console.error('Impossible de retrouver le type de tache');
                return;
            }

            if (task_type.order_tasks_on_same_target) {

                // On check qu'on ne change pas l'ordre des RDVs sur la cible
                // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                let all_rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(
                    ModuleProgramPlanBase.getInstance().rdv_type_id,
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

                    if (moment(all_rdv.start_time).isAfter(moment(this.selected_rdv.start_time))) {
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
            self.snotify.info(self.label('programplan.delete.start'));

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
                console.error(error);
                self.snotify.error(self.label('programplan.delete.error'));
                return;
            }
            self.removeRdv(self.selected_rdv.id);
            self.set_selected_rdv(null);
            self.snotify.success(self.label('programplan.delete.ok'));
            self.$router.push(self.route_path);
        };

        if (!ProgramPlanControllerBase.getInstance().confirm_before_rdv_deletion) {
            onconfirmation(null);
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
        ProgramPlanControllerBase.getInstance().onFCEventRender(event, element, view);
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

        let rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(ModuleProgramPlanBase.getInstance().rdv_type_id, 'target_id', [this.selected_rdv.target_id]);

        if (rdvs.length > 5) {
            rdvs.splice(5, rdvs.length);
        }

        let rdvs_by_ids: { [id: number]: IPlanRDV } = VOsTypesManager.getInstance().vosArray_to_vosByIds(rdvs);
        self.addRdvsByIds(rdvs_by_ids);
        let rdvs_ids: number[] = ObjectHandler.getInstance().getNumberMapIndexes(rdvs_by_ids);

        let promises: Array<Promise<any>> = [];

        promises.push((async () => {
            let vos: IPlanRDVPrep[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(ModuleProgramPlanBase.getInstance().rdv_prep_type_id, 'rdv_id', rdvs_ids);
            self.addPrepsByIds(vos);
        })());
        promises.push((async () => {
            let vos: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(ModuleProgramPlanBase.getInstance().rdv_cr_type_id, 'rdv_id', rdvs_ids);
            self.addCrsByIds(vos);
        })());

        await Promise.all(promises);
    }


    private get_printable_table_weeks() {
        let res = [];

        let date_debut = moment(this.filter_date_debut).day() == 1 ? moment(this.filter_date_debut) : moment(this.filter_date_debut).day(1);
        let date_fin = moment(this.filter_date_fin).day() == 0 ? moment(this.filter_date_fin) : moment(this.filter_date_fin).day(7);

        let d = moment(date_debut);

        let week_begin = moment(d);
        let week_end = moment(d).add(6, 'days');

        let week: any = {};
        week.days = this.get_printable_table_days(week_begin, week_end);
        // week.rows = this.printform_filter_clientformat ? this.get_printable_table_rows_clientformat(week_begin, week_end) : this.get_printable_table_rows(week_begin, week_end);
        week.rows = this.get_printable_table_rows(week_begin, week_end);
        res.push(week);
        d.add(7, 'days');

        while (d <= moment(date_fin)) {


            week_begin = moment(d);
            week_end = moment(d).add(6, 'days');

            week = {};
            week.days = this.get_printable_table_days(week_begin, week_end);
            // week.rows = this.printform_filter_clientformat ? this.get_printable_table_rows_clientformat(week_begin, week_end) : this.get_printable_table_rows(week_begin, week_end);
            week.rows = this.get_printable_table_rows(week_begin, week_end);
            res.push(week);

            d.add(7, 'days');
        }
        return res;
    }

    private get_printable_table_days(date_debut, date_fin) {
        let res = [];

        let d = moment(date_debut);

        while (d <= moment(date_fin)) {

            res.push(d.format('DD/MM'));
            d.add(1, 'days');
        }

        return res;
    }

    private get_printable_table_rows(date_debut, date_fin) {
        let res = [];

        for (let i in this.valid_facilitators) {
            let datas_animateur = [];
            let facilitator = this.valid_facilitators[i];

            // Remplir le tableau en fonction des dates, à vide.
            /*let date_debut = moment(this.printform_filter_date_debut).day() == 1 ? moment(this.printform_filter_date_debut) : moment(this.printform_filter_date_debut).day(1);
            let date_fin = moment(this.printform_filter_date_fin).day() == 0 ? moment(this.printform_filter_date_fin) : moment(this.printform_filter_date_fin).day(7);
            */

            let d = moment(date_debut);

            let nb_offsets = 0;

            while (d <= moment(date_fin)) {

                // am / pm ou am / am, pm / pm
                for (let day_slice = 0; day_slice < this.nb_day_slices; day_slice++) {
                    datas_animateur.push({
                        isrdv: false,
                        nb_slots: 1
                    });
                }
                d.add(1, 'days');
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

                    if (((moment(rdv.start_time) < moment(this.filter_date_fin).add(1, 'days')) &&
                        (moment(rdv.start_time) >= moment(this.filter_date_debut))) ||
                        ((moment(rdv.end_time) <= moment(this.filter_date_fin).add(1, 'days')) &&
                            (moment(rdv.end_time) > moment(this.filter_date_debut)))) {

                        // Calculer l'index
                        let offset_start = moment(rdv.start_time).diff(moment(date_debut), 'hours');
                        let offset_start_halfdays = Math.round(offset_start / (24 / this.nb_day_slices));

                        if (offset_start_halfdays < 0) {
                            offset_start_halfdays = 0;
                        }

                        let offset_end = moment(rdv.end_time).diff(moment(date_debut), 'hours');
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

                        ProgramPlanControllerBase.getInstance().populateCalendarEvent(
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
        return Math.floor(24 / ProgramPlanControllerBase.getInstance().slot_interval);
    }

    @Watch('getTargetsByIds', { deep: true, immediate: true })
    private reset_targets() {
        this.valid_targets = [];
        for (let i in this.getTargetsByIds) {
            let target: IPlanTarget = this.getTargetsByIds[i];

            if ((!!ProgramPlanControllerBase.getInstance().is_valid_target) && (!ProgramPlanControllerBase.getInstance().is_valid_target(target))) {
                continue;
            }
            this.valid_targets.push(target);
        }
    }

    @Watch('getFacilitatorsByIds', { deep: true, immediate: true })
    private reset_facilitators() {
        this.valid_facilitators = [];
        for (let i in this.getFacilitatorsByIds) {
            let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[i];

            if ((!!ProgramPlanControllerBase.getInstance().is_valid_facilitator) && (!ProgramPlanControllerBase.getInstance().is_valid_facilitator(facilitator))) {
                continue;
            }
            this.valid_facilitators.push(facilitator);
        }
    }

    @Watch('getRdvsByIds', { deep: true, immediate: true })
    private reset_rdvs() {
        this.valid_rdvs = [];
        for (let i in this.getRdvsByIds) {
            let rdv: IPlanRDV = this.getRdvsByIds[i];

            if ((!!ProgramPlanControllerBase.getInstance().is_valid_rdv) && (!ProgramPlanControllerBase.getInstance().is_valid_rdv(rdv))) {
                continue;
            }
            this.valid_rdvs.push(rdv);
        }
    }

    private filter_changed() {

        this.reset_targets();
        this.reset_facilitators();
        this.reset_rdvs();
        this.calendar_key++;
    }
}