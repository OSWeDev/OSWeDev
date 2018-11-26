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


@Component({
    template: require('./ProgramPlanComponent.pug'),
    components: {
        "program-plan-component-modal": ProgramPlanComponentModal,
        "program-plan-component-impression": ProgramPlanComponentImpression,
        "program-plan-component-target-listing": ProgramPlanComponentTargetListing
    }
})
export default class ProgramPlanComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

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

    get route_path(): string {
        return this.global_route_path + this.program_id;
    }

    public async mounted() {
        let self = this;
        this.$nextTick(async () => {

            await self.reloadAsyncData();
            setTimeout(() => {
                self.handle_modal_show_hide();
                $("#rdv_modal").on("hidden.bs.modal", function () {
                    self.$router.push(self.route_path);
                });
            }, 100);
        });
    }

    @Watch("$route")
    public async onrouteChange() {
        this.handle_modal_show_hide();
    }

    protected async handle_modal_show_hide() {
        if (!this.modal_show) {
            $('#rdv_modal').modal('hide');
        }
        if (this.modal_show) {
            if ((!this.selected_rdv_id) || (!this.rdvs[this.selected_rdv_id])) {
                $('#rdv_modal').modal('hide');
                return;
            }
            this.selected_rdv = this.rdvs[this.selected_rdv_id];
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
            let program: IPlanProgram = await ModuleDAO.getInstance().getVoById<IPlanProgram>(ModuleProgramPlanBase.getInstance().program_type_id, self.program_id);
            self.storeData(program);
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];

        // partenaires (on charge tous les partenaires ça parait pas être voué à exploser comme donnée mais à suivre)
        promises.push((async () => {
            let partners: IPlanPartner[] = await ModuleDAO.getInstance().getVos<IPlanPartner>(ModuleProgramPlanBase.getInstance().partner_type_id);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().partner_type_id, vos: partners });
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
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id]) {
                let program_manager: IPlanProgramManager = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id][i] as IPlanProgramManager;
                ids.push(program_manager.manager_id);
            }
            let managers: IPlanManager[] = await ModuleDAO.getInstance().getVosByIds<IPlanManager>(ModuleProgramPlanBase.getInstance().manager_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().manager_type_id, vos: managers });
        })());

        // animateurs
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id]) {
                let program_facilitator: IPlanProgramFacilitator = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id][i] as IPlanProgramFacilitator;
                ids.push(program_facilitator.facilitator_id);
            }
            let facilitators: IPlanFacilitator[] = await ModuleDAO.getInstance().getVosByIds<IPlanFacilitator>(ModuleProgramPlanBase.getInstance().facilitator_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().facilitator_type_id, vos: facilitators });
        })());

        // établissements
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id]) {
                let program_target: IPlanProgramTarget = self.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id][i] as IPlanProgramTarget;
                ids.push(program_target.target_id);
            }
            let targets: IPlanTarget[] = await ModuleDAO.getInstance().getVosByIds<IPlanTarget>(ModuleProgramPlanBase.getInstance().target_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().target_type_id, vos: targets });
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];

        // enseignes
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id]) {
                let target: IPlanTarget = self.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id][i] as IPlanTarget;
                ids.push(target.enseigne_id);
            }
            let enseignes: IPlanEnseigne[] = await ModuleDAO.getInstance().getVosByIds<IPlanEnseigne>(ModuleProgramPlanBase.getInstance().enseigne_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().enseigne_type_id, vos: enseignes });
        })());


        await Promise.all(promises);
        self.stopLoading();
    }

    private onFCEventSelected(calEvent: EventObjectInput, jsEvent, view: View) {

        if ((!calEvent) || (!calEvent.id) || (!this.rdvs) || (!this.rdvs[calEvent.id])) {
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
        for (let i in this.facilitators) {
            let facilitator: IPlanFacilitator = this.facilitators[i];
            let manager: IPlanManager = this.managers[facilitator.manager_id];
            let partner: IPlanPartner = this.partners[facilitator.partner_id];

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

        let facilitator: IPlanFacilitator = this.facilitators[rdv.facilitator_id];
        if (!facilitator) {
            return null;
        }

        let etablissement: IPlanTarget = null;

        for (let i in this.targets) {
            let _etablissement: IPlanTarget = this.targets[i];

            if (_etablissement.id == rdv.target_id) {
                etablissement = _etablissement;
            }
        }

        if (!etablissement) {
            // on a un RDV en base qui est orphelin on ignore
            return null;
        }

        let enseigne: IPlanEnseigne = null;

        for (let i in this.enseignes) {
            let ens = this.enseignes[i];

            if (ens.id == etablissement.enseigne_id) {
                enseigne = ens;
            }
        }

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

        ProgramPlanControllerBase.getInstance().populateCalendarEvent(res, this.getStoredDatas);
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

    get program(): IPlanProgram {
        if ((!this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_type_id]) || (!this.program_id)) {
            return null;
        }
        return this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_type_id][this.program_id] as IPlanProgram;
    }

    get targets(): { [id: number]: IPlanTarget } {
        let res: { [id: number]: IPlanTarget } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id]) {
            let pt: IPlanProgramTarget = this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id][i] as IPlanProgramTarget;

            if ((!pt) || (!pt.target_id) || (pt.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id]) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id][pt.target_id])) {
                continue;
            }

            res[pt.target_id] = this.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id][pt.target_id] as IPlanTarget;
        }
        return res;
    }

    get facilitators(): { [id: number]: IPlanFacilitator } {
        let res: { [id: number]: IPlanFacilitator } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id]) {
            let pf: IPlanProgramFacilitator = this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_facilitator_type_id][i] as IPlanProgramFacilitator;

            if ((!pf) || (!pf.facilitator_id) || (pf.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlanBase.getInstance().facilitator_type_id]) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().facilitator_type_id][pf.facilitator_id])) {
                continue;
            }

            res[pf.facilitator_id] = this.getStoredDatas[ModuleProgramPlanBase.getInstance().facilitator_type_id][pf.facilitator_id] as IPlanFacilitator;
        }
        return res;
    }

    get enseignes(): { [id: number]: IPlanEnseigne } {
        let res: { [id: number]: IPlanEnseigne } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id]) {
            let pt: IPlanProgramTarget = this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_target_type_id][i] as IPlanProgramTarget;

            if ((!pt) || (!pt.target_id) || (pt.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id]) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id][pt.target_id])) {
                continue;
            }

            let target: IPlanTarget = this.getStoredDatas[ModuleProgramPlanBase.getInstance().target_type_id][pt.target_id] as IPlanTarget;
            if ((!target) || (!target.enseigne_id) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().enseigne_type_id]) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().enseigne_type_id][target.enseigne_id])) {
                continue;
            }

            res[target.enseigne_id] = this.getStoredDatas[ModuleProgramPlanBase.getInstance().enseigne_type_id][target.enseigne_id] as IPlanEnseigne;
        }
        return res;
    }

    get partners(): { [id: number]: IPlanPartner } {

        return this.getStoredDatas[ModuleProgramPlanBase.getInstance().partner_type_id] as { [id: number]: IPlanPartner };
    }

    get managers(): { [id: number]: IPlanManager } {
        let res: { [id: number]: IPlanManager } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id]) {
            let pm: IPlanProgramManager = this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_manager_type_id][i] as IPlanProgramManager;

            if ((!pm) || (!pm.manager_id) || (pm.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlanBase.getInstance().manager_type_id]) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().manager_type_id][pm.manager_id])) {
                continue;
            }

            res[pm.manager_id] = this.getStoredDatas[ModuleProgramPlanBase.getInstance().manager_type_id][pm.manager_id] as IPlanManager;
        }
        return res;
    }

    get rdvs(): { [id: number]: IPlanRDV } {
        let res: { [id: number]: IPlanRDV } = {};

        if (!this.fcSegment) {
            return res;
        }

        // TODO: c'est typiquement là qu'on GarbageCollector serait utile pour vider les RDVs les plus anciennement chargés pour limiter la taille
        //  si on se balade beaucoup sur le calendrier.
        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_type_id]) {
            let rdv: IPlanRDV = this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_type_id][i] as IPlanRDV;

            if ((!rdv) || (!rdv.start_time) || (!rdv.end_time) || (rdv.program_id != this.program_id) ||
                (moment(rdv.start_time).isSameOrAfter(TimeSegmentHandler.getInstance().getEndTimeSegment(this.fcSegment))) ||
                (moment(rdv.end_time).isSameOrBefore(TimeSegmentHandler.getInstance().getStartTimeSegment(this.fcSegment)))) {
                continue;
            }

            res[rdv.id] = this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_type_id][rdv.id] as IPlanRDV;
        }
        return res;
    }

    get crs(): { [id: number]: IPlanRDVCR } {
        let res: { [id: number]: IPlanRDVCR } = {};

        if (!this.rdvs) {
            return res;
        }

        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_cr_type_id]) {
            let cr: IPlanRDVCR = this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_cr_type_id][i] as IPlanRDVCR;

            if ((!cr) || (!cr.rdv_id) || (!this.rdvs[cr.rdv_id])) {
                continue;
            }

            res[cr.id] = cr;
        }
        return res;
    }

    /**
     * Génère les évènements pour FullCalendar en fonction des évènements issus de la base
     */
    get fcEvents(): EventObjectInput[] {
        let res: EventObjectInput[] = [];

        for (let i in this.rdvs) {

            let e = this.getPlanningEventFromRDV(this.rdvs[i]);

            if (e) {
                res.push(e);
            }
        }

        return res;
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

        let segment = this.fcSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(view.intervalStart, TimeSegment.TYPE_MONTH);
        if (TimeSegmentHandler.getInstance().segmentsAreEquivalent(segment, this.fcSegment)) {
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
        if ((!event) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_type_id]) || (!event.id) || (!this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_type_id][event.id])) {
            this.snotify.error(this.label('programplan.fc.update.error'));
            return;
        }
        let rdv: IPlanRDV = this.getStoredDatas[ModuleProgramPlanBase.getInstance().rdv_type_id][event.id] as IPlanRDV;

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

        this.updateData(rdv);
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
                right: 'timelineWeek,timelineMonth'
            },
            defaultView: 'timelineWeek',

            views: {
                timelineMonth: {
                    slotWidth: 75,
                    slotLabelInterval: {
                        hours: 12
                    },
                    slotDuration: {
                        hours: 12
                    },
                },
                timelineWeek: {
                    slotWidth: 75,
                    slotLabelInterval: {
                        hours: 12
                    },
                    slotDuration: {
                        hours: 12
                    },
                }
            },
            defaultTimedEventDuration: {
                hours: 12
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
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlanBase.getInstance().rdv_type_id,
                vos: await ModuleProgramPlanBase.getInstance().getRDVsOfProgramSegment(self.program_id, self.fcSegment)
            });
        })());

        // CRs
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlanBase.getInstance().rdv_cr_type_id,
                vos: await ModuleProgramPlanBase.getInstance().getCRsOfProgramSegment(self.program_id, self.fcSegment)
            });
        })());

        await Promise.all(promises);
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

        this.storeData(rdv);
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
                        for (let i in self.crs) {
                            let cr: IPlanRDVCR = self.crs[i];

                            if (cr.rdv_id != self.selected_rdv.id) {
                                continue;
                            }

                            toDeleteVos.push(cr);
                            self.removeData({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().rdv_cr_type_id, id: cr.id });
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
                        self.removeData({ API_TYPE_ID: ModuleProgramPlanBase.getInstance().rdv_type_id, id: self.selected_rdv.id });
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
        // Définir l'état et donc l'icone
        let icon = null;

        if ((!event) || (!event.id) || (!this.rdvs[event.id])) {
            return;
        }

        let rdv: IPlanRDV = this.rdvs[event.id];

        switch (rdv.state) {
            case ModuleProgramPlanBase.RDV_STATE_CONFIRMED:
                icon = "fa-square";
                break;
            case ModuleProgramPlanBase.RDV_STATE_CR_OK:
                icon = "fa-envelope-square";
                break;
            case ModuleProgramPlanBase.RDV_STATE_CREATED:
            default:
                icon = "fa-square-o";
        }

        var i = $('<i class="fa ' + icon + ' fa-2x" aria-hidden="true"/>');
        element.find('div.fc-content').prepend(i);
    }
}