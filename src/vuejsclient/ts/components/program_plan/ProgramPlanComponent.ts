import * as $ from 'jquery';
import * as moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import VueAppController from '../../../VueAppController';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import { ModuleDAOGetter, ModuleDAOAction } from '../dao/store/DaoStore';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanProgramTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramTarget';
import IPlanProgram from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgram';
import IPlanProgramFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramFacilitator';
import IPlanEnseigne from '../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import ProgramPlanControllerBase from './ProgramPlanControllerBase';
import IPlanManager from '../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanProgramManager from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramManager';
import IPlanRDVCR from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import { View, EventObjectInput, OptionsInput, Calendar } from 'fullcalendar';
import DateHandler from '../../../../shared/tools/DateHandler';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';
import ProgramPlanComponentModal from './Modal/ProgramPlanComponentModal';
import ProgramPlanComponentImpression from './Impression/ProgramPlanComponentImpression';
import ProgramPlanComponentTargetListing from './TargetListing/ProgramPlanComponentTargetListing';
import ProgramPlanClientVueModule from './ProgramPlanClientVueModule';
import './ProgramPlanComponent.scss';
import IPlanPartner from '../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import { ModuleProgramPlanGetter, ModuleProgramPlanAction } from './store/ProgramPlanStore';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import IPlanTaskType from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import IPlanTask from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import IPlanRDVPrep from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';


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

    @ModuleProgramPlanAction
    public addRdvsByIds: (rdvs_by_ids: { [id: number]: IPlanRDV }) => void;

    @ModuleProgramPlanAction
    public addCrsByIds: (crs_by_ids: { [id: number]: IPlanRDVCR }) => void;

    @ModuleProgramPlanAction
    public addPrepsByIds: (preps_by_ids: { [id: number]: IPlanRDVPrep }) => void;

    @ModuleProgramPlanAction
    public set_can_edit_any: (can_edit: boolean) => void;
    @ModuleProgramPlanAction
    public set_can_edit_all: (can_edit: boolean) => void;
    @ModuleProgramPlanAction
    public set_can_edit_own_team: (can_edit: boolean) => void;
    @ModuleProgramPlanAction
    public set_can_edit_self: (can_edit: boolean) => void;


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

    public fcSegment: TimeSegment = null;
    private user = VueAppController.getInstance().data_user;
    private fcEvents: EventObjectInput[] = [];
    private printform_filter_date_debut: string = null;
    private printform_filter_date_fin: string = null;

    private show_targets: boolean = true;

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
                    await self.handle_modal_show_hide();
                    $("#rdv_modal").on("hidden.bs.modal", function () {
                        self.$router.push(self.route_path);
                        self.show_targets = true;
                    });
                    return;
                }

                timeout--;
                if (timeout < 0) {
                    return;
                }

                setTimeout(tryOpenModal, 100);
            }

            self.$nextTick(tryOpenModal);
        });
    }

    @Watch("$route")
    public async onrouteChange() {
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

    private async reloadAsyncData() {
        let self = this;

        this.nbLoadingSteps = 3;
        this.startLoading();

        let promises = [];

        if ((!!ModuleProgramPlanBase.getInstance().partner_type_id) ||
            (ModuleProgramPlanBase.getInstance().program_manager_type_id) ||
            (ModuleProgramPlanBase.getInstance().program_facilitator_type_id) ||
            (ModuleProgramPlanBase.getInstance().program_target_type_id)) {

            // partenaires (on charge tous les partenaires ça parait pas être voué à exploser comme donnée mais à suivre)
            if (!!ModuleProgramPlanBase.getInstance().partner_type_id) {
                promises.push((async () => {
                    self.setPartnersByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<IPlanPartner>(ModuleProgramPlanBase.getInstance().partner_type_id)));
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
                self.set_task_types_by_ids(task_types);
            })());
        }

        // Tasks
        if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
            promises.push((async () => {
                let tasks: IPlanTask[] = await ModuleDAO.getInstance().getVos<IPlanTask>(ModuleProgramPlanBase.getInstance().task_type_id);
                self.set_tasks_by_ids(tasks);
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

                targets_by_ids[target.id] = target;
            }

            self.setTargetsByIds(targets_by_ids);
        })());

        await Promise.all(promises);
        self.nextLoadingStep();

        if (!!ModuleProgramPlanBase.getInstance().enseigne_type_id) {

            promises = [];

            // enseignes
            promises.push((async () => {
                let ids: { [id: number]: boolean } = [];
                for (let i in self.getTargetsByIds) {
                    let target: IPlanTarget = self.getTargetsByIds[i] as IPlanTarget;

                    ids[target.enseigne_id] = true;
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

        if ((!calEvent) || (!calEvent.id) || (!this.getRdvsByIds) || (!this.getRdvsByIds[calEvent.id])) {
            this.$router.push(this.route_path);
            return;
        }
        this.$router.push(this.route_path + '/rdv/' + calEvent.id);
    }

    private getResourceName(first_name, name) {
        return ProgramPlanControllerBase.getInstance().getResourceName(first_name, name);
    }

    private getPlanningResources() {
        // On veut un tableau avec des éléments de ce type:
        // {
        //   id: 1,
        //   title: 'animateur',
        //   manager_title: 'manager'
        // }

        let res = [];
        for (let i in this.getFacilitatorsByIds) {
            let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[i];
            let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id];
            let partner: IPlanPartner = this.getPartnersByIds[facilitator.partner_id];

            res.push({
                id: facilitator.id,
                title: this.getResourceName(facilitator.firstname, facilitator.lastname),
                manager_title: (!!manager) ? this.getResourceName(manager.firstname, manager.lastname) : "",
                partner_name: (!!partner) ? partner.name : ""
            });
        }

        return res;
    }

    private getPlanningEventFromRDV(rdv: IPlanRDV): EventObjectInput {
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

        let target: IPlanTarget = this.getTargetsByIds[rdv.target_id];
        if (!target) {
            // on a un RDV en base qui est orphelin on ignore
            return null;
        }

        let res: EventObjectInput = {
            id: rdv.id,
            task_id: (!!ModuleProgramPlanBase.getInstance().task_type_id) ? rdv.task_id : undefined,
            target_id: (!!ModuleProgramPlanBase.getInstance().task_type_id) ? undefined : rdv.target_id,
            resourceId: (!!ModuleProgramPlanBase.getInstance().task_type_id) ? rdv.target_id : rdv.facilitator_id,
            start: rdv.start_time,
            end: rdv.end_time,
            title: target.name,
            state: rdv.state
        };

        ProgramPlanControllerBase.getInstance().populateCalendarEvent(res);
        return res;
    }

    @Watch('getRdvsByIds', { immediate: true, deep: true })
    private onchange_rdvsByIds() {
        this.fcEvents = [];

        for (let i in this.getRdvsByIds) {

            let e = this.getPlanningEventFromRDV(this.getRdvsByIds[i]);

            if (e) {
                this.fcEvents.push(e);
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

        let segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(
            view.intervalStart,
            (view.name == "timelineWeek") ? TimeSegment.TYPE_WEEK : TimeSegment.TYPE_MONTH);
        if (!TimeSegmentHandler.getInstance().segmentsAreEquivalent(segment, this.fcSegment)) {
            this.fcSegment = segment;
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
        if ((!event) || (!event.id) || (!this.getRdvsByIds[event.id])) {
            this.snotify.error(this.label('programplan.fc.update.error'));
            return;
        }
        let rdv: IPlanRDV = this.getRdvsByIds[event.id] as IPlanRDV;

        let tmp_start: string = rdv.start_time;
        let tmp_end: string = rdv.end_time;
        let tmp_facilitator_id: number = rdv.facilitator_id;
        let new_facilitator_id: number = parseInt(event.resourceId);

        try {

            if (!this.can_edit_rdv(tmp_facilitator_id, new_facilitator_id)) {
                this.snotify.error(this.label('programplan.fc.update.denied'));
                throw new Error('Pas le droit');
            }

            rdv.start_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.start));
            rdv.end_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.end));
            rdv.facilitator_id = parseInt(event.resourceId);
            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur côté serveur');
            }
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
            group: undefined
        };

        if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
            resourceColumns.push({
                labelText: this.label('programplan.fc.target.name'),
                field: 'target_title'
            });
            facilitator_column.group = true;
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


        return {
            locale: 'fr',
            dayNamesShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            now: moment().format('Y-MM-DD'),
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
            defaultView: 'timelineWeek',

            views: {
                timelineMonth: {
                    slotWidth: 150 / (24 / ProgramPlanControllerBase.getInstance().slot_interval),
                    slotLabelInterval: {
                        hours: ProgramPlanControllerBase.getInstance().slot_interval
                    },
                    slotDuration: {
                        hours: ProgramPlanControllerBase.getInstance().slot_interval
                    },
                },
                timelineWeek: {
                    slotWidth: 150 / (24 / ProgramPlanControllerBase.getInstance().slot_interval),
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
            slotLabelFormat: [
                'ddd D/M',
                'a'
            ],
            resourceColumns,
            resources: this.getPlanningResources(),
        };
    }

    @Watch('fcSegment')
    private async onChangeFCSegment() {

        let promises: Array<Promise<any>> = [];
        let self = this;

        // RDVs
        // Sont chargés lors du changement de segment consulté
        promises.push((async () => {
            self.setRdvsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleProgramPlanBase.getInstance().getRDVsOfProgramSegment(self.program_id, self.fcSegment)));
        })());

        // Preps
        promises.push((async () => {
            self.setPrepsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleProgramPlanBase.getInstance().getPrepsOfProgramSegment(self.program_id, self.fcSegment)));
        })());

        // CRs
        promises.push((async () => {
            self.setCrsByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleProgramPlanBase.getInstance().getCRsOfProgramSegment(self.program_id, self.fcSegment)));
        })());

        await Promise.all(promises);


        this.printform_filter_date_debut = this.fcSegment ? TimeSegmentHandler.getInstance().getStartTimeSegment(this.fcSegment).format("Y-MM-DD") : null;
        this.printform_filter_date_fin = this.fcSegment ? TimeSegmentHandler.getInstance().getEndTimeSegment(this.fcSegment).add(-1, 'day').format("Y-MM-DD") : null;
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
                rdv.task_id = event.task_id;
                rdv.target_id = parseInt(event.resourceId);
            } else {
                rdv.facilitator_id = parseInt(event.resourceId);
                rdv.target_id = event.target_id;
            }

            rdv.state = ModuleProgramPlanBase.RDV_STATE_CREATED;
        } catch (error) {
            console.error(error);
        }

        if ((!event) || (!rdv)) {
            this.snotify.error(this.label('programplan.fc.create.error'));
            return;
        }

        try {

            if (!this.can_edit_rdv(rdv.facilitator_id)) {
                this.snotify.error(this.label('programplan.fc.create.denied'));
                throw new Error('Interdit');
            }

            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur côté serveur');
            }

            rdv.id = parseInt(insertOrDeleteQueryResult.id);
        } catch (error) {
            console.error(error);
            this.snotify.error(this.label('programplan.fc.create.error'));
            this.setRdvById({ id: 0 } as any);
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

    private deleteSelectedEvent() {
        if (!this.selected_rdv) {
            return;
        }

        if (!this.can_edit_rdv(this.selected_rdv.facilitator_id)) {
            this.snotify.error(this.label('programplan.fc.delete.denied'));
            return;
        }

        let self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression des CRs en premier lieu puis du rdv
        self.snotify.confirm(self.label('programplan.delete.confirmation.body'), self.label('programplan.delete.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
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
                    },
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
}