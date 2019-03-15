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

    @Prop()
    public program_id: number;

    public selected_rdv: IPlanRDV = null;
    public fcSegment: TimeSegment = null;
    private user = VueAppController.getInstance().data_user;
    private can_edit_planning: boolean = false;
    private program: IPlanProgram = null;
    private fcEvents: EventObjectInput[] = [];
    private printform_filter_date_debut: string = null;
    private printform_filter_date_fin: string = null;

    get route_path(): string {
        return this.global_route_path + this.program_id;
    }

    public async mounted() {
        let self = this;
        this.$nextTick(async () => {

            await self.reloadAsyncData();

            // On limite à 20 tentatives
            let timeout: number = 20;
            async function tryOpenModal() {

                if ((!!self.getRdvsByIds) && (ObjectHandler.getInstance().hasAtLeastOneAttribute(self.getRdvsByIds))) {
                    await self.handle_modal_show_hide();
                    $("#rdv_modal").on("hidden.bs.modal", function () {
                        self.$router.push(self.route_path);
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
        }
        if (this.modal_show) {
            if ((!this.selected_rdv_id) || (!this.getRdvsByIds[this.selected_rdv_id])) {
                $('#rdv_modal').modal('hide');
                return;
            }
            this.selected_rdv = this.getRdvsByIds[this.selected_rdv_id];
            $('#rdv_modal').modal('show');
            return;
        }
    }

    private async reloadAsyncData() {
        let self = this;

        this.nbLoadingSteps = 4;
        this.startLoading();

        let promises = [];

        promises.push((async () => {
            self.can_edit_planning = await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_EDIT);
        })());

        // On va charger par étape pour alléger au max les chargements et réduire au max la taille des données téléchargées
        // Donc on commence par le programme, et on déroule en fonction des liaisons et des ids qu'on a récupérés

        // program
        promises.push((async () => {
            this.program = await ModuleDAO.getInstance().getVoById<IPlanProgram>(ModuleProgramPlanBase.getInstance().program_type_id, self.program_id);
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];

        // partenaires (on charge tous les partenaires ça parait pas être voué à exploser comme donnée mais à suivre)
        promises.push((async () => {
            this.setPartnersByIds(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<IPlanPartner>(ModuleProgramPlanBase.getInstance().partner_type_id)));
        })());

        // managers du programme
        promises.push((async () => {
            let program_managers: IPlanProgramManager[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramManager>(ModuleProgramPlanBase.getInstance().program_manager_type_id, 'program_id', [this.program_id]);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_manager_type_id, vos: program_managers });
        })());

        // animateurs du programme
        promises.push((async () => {
            let program_facilitators: IPlanProgramFacilitator[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramFacilitator>(ModuleProgramPlanBase.getInstance().program_facilitator_type_id, 'program_id', [self.program_id]);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_facilitator_type_id, vos: program_facilitators });
        })());

        // établissements du programme
        promises.push((async () => {
            let program_targets: IPlanProgramTarget[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramTarget>(ModuleProgramPlanBase.getInstance().program_target_type_id, 'program_id', [self.program_id]);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_target_type_id, vos: program_targets });
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];

        // managers
        promises.push((async () => {
            let ids: { [id: number]: boolean } = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id]) {
                let program_manager: IPlanProgramManager = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id][i] as IPlanProgramManager;
                ids[program_manager.manager_id] = true;
            }
            let managers: IPlanManager[] = await ModuleDAO.getInstance().getVosByIds<IPlanManager>(
                ModuleProgramPlanBase.getInstance().manager_type_id,
                ObjectHandler.getInstance().getNumberMapIndexes(ids));


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

        // animateurs
        promises.push((async () => {
            let ids: { [id: number]: boolean } = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id]) {
                let program_facilitator: IPlanProgramFacilitator = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id][i] as IPlanProgramFacilitator;
                ids[program_facilitator.facilitator_id] = true;
            }
            let facilitators: IPlanFacilitator[] = await ModuleDAO.getInstance().getVosByIds<IPlanFacilitator>(
                ModuleProgramPlanBase.getInstance().facilitator_type_id,
                ObjectHandler.getInstance().getNumberMapIndexes(ids));

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
            let ids: { [id: number]: boolean } = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id]) {
                let program_target: IPlanProgramTarget = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id][i] as IPlanProgramTarget;
                ids[program_target.target_id] = true;
            }
            let targets: IPlanTarget[] = await ModuleDAO.getInstance().getVosByIds<IPlanTarget>(
                ModuleProgramPlanBase.getInstance().target_type_id,
                ObjectHandler.getInstance().getNumberMapIndexes(ids));

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
                manager_title: manager ? this.getResourceName(manager.firstname, manager.lastname) : "",
                partner_name: partner ? partner.name : ""
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

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[rdv.facilitator_id];
        if (!facilitator) {
            return null;
        }

        let etablissement: IPlanTarget = this.getTargetsByIds[rdv.target_id];
        if (!etablissement) {
            // on a un RDV en base qui est orphelin on ignore
            return null;
        }

        let enseigne: IPlanEnseigne = this.getEnseignesByIds[etablissement.enseigne_id];
        if (!enseigne) {
            // on a un RDV en base qui est orphelin on ignore
            return null;
        }

        let res: EventObjectInput = {
            // TODO reporter dans le projet / adapter backgroundColor: enseigne.bgcolor,
            // textColor: enseigne.color,
            id: rdv.id,
            target_id: etablissement.id,
            resourceId: facilitator.id,
            start: rdv.start_time,
            end: rdv.end_time,
            title: etablissement.name,
            state: rdv.state
        };

        ProgramPlanControllerBase.getInstance().populateCalendarEvent(
            res,
            this.getEnseignesByIds, this.getTargetsByIds, this.getFacilitatorsByIds, this.getManagersByIds, this.getRdvsByIds, this.getCrsByIds);
        return res;
    }

    // private prepareEventForSave(event) {
    //     // On doit mettre les infos nécessaires au RDV dans l'event si c'est pas déjà le cas, et supprimer les liens récursifs :
    //     // {
    //     //   id: '1',
    //     //   resourceId: 'b',
    //     //   start: '2017-05-07T02:00:00',
    //     //   end: '2017-05-07T07:00:00',
    //     //   title: 'event 1'
    //     // }

    //     event.animateur_id = event.resourceId;
    //     event.boutique_animee_id = event.target_id;
    //     event.date_debut = event.start;
    //     event.date_fin = event.end;
    // }

    // private save() {
    //     this.savingInProgress = true;

    //     let self = this;

    //     var objectsToSave = this.addedEvents.map(function (o) {
    //         self.prepareEventForSave(o);
    //         o._type = "module_planning_rdv_animateurs_boutique_animation_rdv";
    //         return o;
    //     });

    //     this.updatedEvents.map(function (o) {
    //         self.prepareEventForSave(o);
    //         o._type = "module_planning_rdv_animateurs_boutique_animation_rdv";

    //         objectsToSave.push(o);
    //         return o;
    //     });

    //     var objectsToDelete = this.deletedEvents.map(function (o) {
    //         self.prepareEventForSave(o);
    //         o._type = "module_planning_rdv_animateurs_boutique_animation_rdv";
    //         return o;
    //     });

    //     // Avoid circular
    //     function replacer(key, value) {
    //         if (key == "source") {
    //             return undefined;
    //         }
    //         return value;
    //     }

    //     ModuleAjaxCache.getInstance().invalidateUsingURLRegexp(new RegExp('/ref/api/' + this.animation_rdv_datatable.name + '/?(.*)?', 'i'));

    //     // FIXME TODO ModuleDAO.getInstance().insertOrUpdateVOs
    //     // return ModuleAjaxCache.getInstance().save(objectsToSave, objectsToDelete, replacer)
    //     //     .then(function (r: any) {
    //     //         // save inserted ids
    //     //         for (var i in objectsToSave) {
    //     //             if (!objectsToSave[i].id) {
    //     //                 objectsToSave[i].id = r.updates_ids[i];
    //     //             }
    //     //         }

    //     //         self.addedEvents = [];
    //     //         self.updatedEvents = [];
    //     //         self.deletedEvents = [];

    //     //         self.reloadAsyncData();
    //     //         self.savingInProgress = false;
    //     //     }, function (r) {
    //     //         console.log("error while saving", r);
    //     //         self.$snotify.warning('error while saving:' + r.statusText);
    //     //         self.savingInProgress = false;
    //     //     });
    // }

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

        try {

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

    get fcConfig() {
        return {
            locale: 'fr',
            dayNamesShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            now: moment().format('Y-MM-DD'),
            schedulerLicenseKey: '0801712196-fcs-1461229306',
            editable: this.can_edit_planning,
            droppable: this.can_edit_planning,
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
            resourceLabelText: 'Utilisateurs',
            slotLabelFormat: [
                'ddd D/M',
                'a'
            ],
            // slotLabelFormat: 'ddd D/M',
            resourceColumns: [{
                labelText: this.label('programplan.fc.facilitator.name'),
                field: 'title'
            }, {
                labelText: this.label('programplan.fc.manager.name'),
                field: 'manager_title',
                group: true
            }, {
                labelText: this.label('programplan.fc.partner.name'),
                field: 'partner_name'
            }],
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
            rdv.facilitator_id = parseInt(event.resourceId);
            rdv.program_id = this.program_id;
            rdv.state = ModuleProgramPlanBase.RDV_STATE_CREATED;
            rdv.target_id = event.target_id;
        } catch (error) {
            console.error(error);
        }

        if ((!event) || (!rdv)) {
            this.snotify.error(this.label('programplan.fc.create.error'));
            return;
        }

        try {

            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur côté serveur');
            }

            rdv.id = parseInt(insertOrDeleteQueryResult.id);
        } catch (error) {
            console.error(error);
            this.snotify.error(this.label('programplan.fc.create.error'));
            return;
        }

        this.setRdvById(rdv);
        this.snotify.success(this.label('programplan.fc.create.ok'));
    }

    private deleteSelectedEvent() {
        if (!this.selected_rdv) {
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
                        self.selected_rdv = null;
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
        ProgramPlanControllerBase.getInstance().onFCEventRender(
            event, element, view,
            this.getEnseignesByIds,
            this.getTargetsByIds,
            this.getFacilitatorsByIds,
            this.getManagersByIds,
            this.getRdvsByIds,
            this.getCrsByIds);
    }
}