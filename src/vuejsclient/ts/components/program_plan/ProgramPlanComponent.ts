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
import ModuleProgramPlan from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanProgramTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramTarget';
import IPlanProgram from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgram';
import IPlanProgramFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramFacilitator';
import IPlanEnseigne from '../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import ProgramPlanControllerBase from './ProgramPlanControllerBase';
import IPlanManager from '../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanProgramManager from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramManager';
import IPlanRDVCR from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import { View, EventObjectInput, OptionsInput } from 'fullcalendar';
import DateHandler from '../../../../shared/tools/DateHandler';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../shared/tools/TimeSegmentHandler';


@Component({
    template: require('./planning_rdv_animateurs_boutique.pug'),
    components: {
        "ba-modal": VuePlanningRDVAnimateursBoutiqueBaModalComponent,
        "module-impression-rdvs": VuePlanningRDVAnimateursBoutiqueModuleImpressionRdvsComponent,
        "planning-store-visits-ba-listing": VuePlanningRDVAnimateursBoutiqueBaListingComponent
    }
})
export default class VuePlanningRDVAnimateursBoutiqueComponent extends VueComponentBase {

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
    public program_id: number;

    public selected_event = null;

    public addedEvents = [];
    public updatedEvents = [];
    public deletedEvents = [];

    public needSaving = false;

    // [boutiques_animee.id] . animation_rdvs = []

    public fcSegment: TimeSegment = null;


    // [animation_rdv.id] . animation_crs = []

    private user = VueAppController.getInstance().data_user;

    private canEditPlanning: boolean = false;

    public cloneEvent(event) {
        let clonedEvent: any = {};

        clonedEvent.end = moment(event.end);
        clonedEvent.resourceId = event.resourceId;
        clonedEvent.start = moment(event.start);
        clonedEvent.id = event.id;
        clonedEvent._id = event._id;
        clonedEvent.ba_id = event.ba_id;
        clonedEvent.rdvpris = event.rdvpris;

        return clonedEvent;
    }

    // public getCalendarEventFromRDV(rdv: IPlanRDV) {
    //     let calendarEvent: any = {};

    //     calendarEvent.end = moment(rdv.start_time);
    //     calendarEvent.resourceId = rdv.facilitator_id;
    //     calendarEvent.start = moment(rdv.end_time);
    //     calendarEvent.id = rdv.id;
    //     return calendarEvent;
    // }


    get bas() {
        return this.etablissements;
    }

    private async mounted() {
        let self = this;
        this.$nextTick(function () {

            self.reloadAsyncData();
        });
    }

    private registerUpdatedEvent(updatedEvent) {

        // On risque pas d'enregistrer plusieurs fois l'ajout, mais on risque de stocker ajout + modif ou modif + modif sur le même event.
        // Le but de la fonction est d'éviter ces cas.

        for (let i in this.addedEvents) {
            if (this.addedEvents[i]._id == updatedEvent._id) {
                this.addedEvents.splice(parseInt(i.toString()), 1);
                break;
            }
        }

        for (let i in this.updatedEvents) {
            if (this.updatedEvents[i]._id == updatedEvent._id) {
                this.updatedEvents.splice(parseInt(i.toString()), 1);
            }
        }

        if (!this.updatedEvents) {
            this.updatedEvents = [];
        }

        this.updatedEvents.push(this.cloneEvent(updatedEvent));
        this.prepareEventForSave(updatedEvent);
        this.updateBascpts();
        this.needSaving = true;
    }

    private async registerAddedEvent(addedEvent) {

        this.snotify.info(this.label('programplan.notify.save.start'));
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = null;
        try {

            insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.cloneEvent(addedEvent));
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Réponse serveur erronnée:' + (insertOrDeleteQueryResult ? JSON.stringify(insertOrDeleteQueryResult) : insertOrDeleteQueryResult));
            }
        } catch (error) {

            console.error(error);
            this.snotify.error(this.label('programplan.notify.save.error'));
            return;
        }


        this.snotify.success(this.label('programplan.notify.save.ok'));

        this.addedEvents.push();
        this.prepareEventForSave(addedEvent);
        this.needSaving = true;
        // On a besoin d'un ID unique, or en BDD on peut pas générer de lettres
        this.rdvs[addedEvent._id] = addedEvent;

        if (!this.etablissements[addedEvent.boutique_animee_id].animation_rdvs) {
            this.etablissements[addedEvent.boutique_animee_id].animation_rdvs = [];
        }
        this.etablissements[addedEvent.boutique_animee_id].animation_rdvs.push(addedEvent);

        this.updateBascpts();
    }

    private reloadAsyncData() {
        let self = this;

        this.nbLoadingSteps = 3;
        this.startLoading();

        let promises = [];

        promises.push((async () => {
            self.canEditPlanning = await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlan.ACCESS_GROUP_NAME, ModuleProgramPlan.FRONT_EDIT_RULE_NAME);
        })());

        // On va charger par étape pour alléger au max les chargements et réduire au max la taille des données téléchargées
        // Donc on commence par le programme, et on déroule en fonction des liaisons et des ids qu'on a récupérés

        // program
        promises.push((async () => {
            let program: IPlanProgram = await ModuleDAO.getInstance().getVoById<IPlanProgram>(ModuleProgramPlan.getInstance().program_type_id, self.program_id);
            self.storeData(program);
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];

        // managers du programme
        promises.push((async () => {
            let program_managers: IPlanProgramManager[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramManager>(ModuleProgramPlan.getInstance().program_manager_type_id, 'program_id', [this.program_id]);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().program_manager_type_id, vos: program_managers });
        })());

        // animateurs du programme
        promises.push((async () => {
            let program_facilitators: IPlanProgramFacilitator[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramFacilitator>(ModuleProgramPlan.getInstance().program_facilitator_type_id, 'program_id', [self.program_id]);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().program_facilitator_type_id, vos: program_facilitators });
        })());

        // établissements du programme
        promises.push((async () => {
            let program_targets: IPlanProgramTarget[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanProgramTarget>(ModuleProgramPlan.getInstance().program_target_type_id, 'program_id', [self.program_id]);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().program_target_type_id, vos: program_targets });
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];

        // managers
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlan.getInstance().program_manager_type_id]) {
                let program_manager: IPlanProgramManager = self.getStoredDatas[ModuleProgramPlan.getInstance().program_manager_type_id][i] as IPlanProgramManager;
                ids.push(program_manager.manager_id);
            }
            let managers: IPlanManager[] = await ModuleDAO.getInstance().getVosByIds<IPlanManager>(ModuleProgramPlan.getInstance().manager_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().manager_type_id, vos: managers });
        })());

        // animateurs
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlan.getInstance().program_facilitator_type_id]) {
                let program_facilitator: IPlanProgramFacilitator = self.getStoredDatas[ModuleProgramPlan.getInstance().program_facilitator_type_id][i] as IPlanProgramFacilitator;
                ids.push(program_facilitator.facilitator_id);
            }
            let facilitators: IPlanFacilitator[] = await ModuleDAO.getInstance().getVosByIds<IPlanFacilitator>(ModuleProgramPlan.getInstance().facilitator_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().facilitator_type_id, vos: facilitators });
        })());

        // établissements
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlan.getInstance().program_target_type_id]) {
                let program_target: IPlanProgramTarget = self.getStoredDatas[ModuleProgramPlan.getInstance().program_target_type_id][i] as IPlanProgramTarget;
                ids.push(program_target.target_id);
            }
            let targets: IPlanTarget[] = await ModuleDAO.getInstance().getVosByIds<IPlanTarget>(ModuleProgramPlan.getInstance().target_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().target_type_id, vos: targets });
        })());

        await Promise.all(promises);
        self.nextLoadingStep();
        promises = [];



        // enseignes
        promises.push((async () => {
            let ids: number[] = [];
            for (let i in self.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id]) {
                let target: IPlanTarget = self.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id][i] as IPlanTarget;
                ids.push(target.enseigne_id);
            }
            let enseignes: IPlanEnseigne[] = await ModuleDAO.getInstance().getVosByIds<IPlanEnseigne>(ModuleProgramPlan.getInstance().enseigne_type_id, ids);
            self.storeDatas({ API_TYPE_ID: ModuleProgramPlan.getInstance().enseigne_type_id, vos: enseignes });
        })());


        self.stopLoading();

        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().enseigne_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().enseigne_type_id)
            });
        })());
        //         promises_needed.push((async () => {
        // ModuleAjaxCache.getInstance().get('/ref/api/' + this.region_datatable.name, [this.region_datatable.name]).then(function (data: any[]) {
        // tmp_regions = data;
        // })());        
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().target_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().target_type_id)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().facilitator_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().facilitator_type_id)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().manager_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().manager_type_id)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().program_facilitator_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().program_facilitator_type_id)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().program_manager_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().program_manager_type_id)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().program_target_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().program_target_type_id)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().enseigne_type_id,
                vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlan.getInstance().enseigne_type_id)
            });
        })());
        promises.push((async () => {
            ModuleAjaxCache.getInstance().get('/ref/api/' + this.manager_datatable.name, [this.manager_datatable.name]).then(function (data: any[]) {
                tmp_managers = data;
            })());
        promises.push((async () => {
            ModuleAjaxCache.getInstance().get('/ref/api/' + this.boutique_animee_datatable.name, [this.boutique_animee_datatable.name]).then(function (data: any[]) {
                tmp_boutiques_animees = data;
            })());
        promises.push((async () => {
            ModuleAjaxCache.getInstance().get('/ref/api/' + this.boutique_animee_month_datatable.name, [this.boutique_animee_month_datatable.name]).then(function (data: any[]) {
                tmp_boutiques_animees_mois = data;
            })());
        promises.push((async () => {
            ModuleAjaxCache.getInstance().get('/ref/api/' + this.animateur_datatable.name, [this.animateur_datatable.name]).then(function (data: any[]) {
                tmp_animateurs = data;
            })());
        promises.push((async () => {
            tmp_animation_rdvs = await $.get('/ref/api/' + self.animation_rdv_datatable.name + "?date_fin=gt." + min_date.format('Y-MM-DD'));

            // needs new api
            let animation_rdv_id_min = 0;
            for (let i in tmp_animation_rdvs) {
                let tmp_animation_rdv = tmp_animation_rdvs[i];

                if (animation_rdv_id_min == 0) {
                    animation_rdv_id_min = tmp_animation_rdv.id;
                } else if (animation_rdv_id_min > tmp_animation_rdv.id) {
                    animation_rdv_id_min = tmp_animation_rdv.id;
                }
            }

            tmp_animation_crs = await $.get('/ref/api/' + self.animation_cr_datatable.name + "?animation_rdv_id=gt." + animation_rdv_id_min);
        })());
        //promises_needed.push($.get('/ref/api/' + this.animation_cr_datatable.datatable_name, function(data) {
        //  tmp_animation_crs = data;
        //}));

        Promise.all(promises).then(() => {

            // Tout est en synchrone après, on passe sur les vrais datas :
            this.enseignes = tmp_enseignes;
            this.managers = tmp_managers;
            this.etablissements = tmp_boutiques_animees;
            this.boutiques_animees_mois = tmp_boutiques_animees_mois;
            this.facilitators = tmp_animateurs;
            this.rdvs = tmp_animation_rdvs;
            this.animation_crs = tmp_animation_crs;
            this.regions = tmp_regions;

            // On va filtrer en fonction du rôle
            if (this.user.admin || this.user.super_admin || this.user.admin_central) {
                this.user_role = this.role_admin;
                // Aucun filtrage
            } else {
                // On cherche un manager en premier lieu
                this.user_manager_obj = null;
                this.user_animateur_obj = null;

                for (let i in this.managers) {
                    let manager = this.managers[i];

                    if (manager.user_id == this.user.id) {
                        this.user_role = this.role_manager;
                        this.user_manager_obj = manager;

                        break;
                    }
                }

                if (this.user_manager_obj) {
                    // Filtrage en fonction du manager

                    // Managers
                    this.managers = [this.user_manager_obj];

                    // Animateurs
                    let filtered_animateurs = [];
                    for (let i in this.facilitators) {
                        let animateur = this.facilitators[i];

                        if (animateur.manager_id == this.user_manager_obj.id) {
                            filtered_animateurs.push(animateur);
                        }
                    }
                    this.facilitators = filtered_animateurs;

                    this.updateFilteredDatas();
                } else {

                    // On cherche un animateur
                    for (let i in this.facilitators) {
                        let animateur = this.facilitators[i];

                        if (animateur.user_id == this.user.id) {
                            this.user_role = this.role_animateur;
                            this.user_animateur_obj = animateur;

                            break;
                        }
                    }

                    if (this.user_animateur_obj) {
                        // Filtrage en fonction de l'animateur

                        if (!this.user_animateur_obj.region_id) {
                            // Filtrage par le manager et affichage que de l'animateur
                            this.facilitators = [this.user_animateur_obj];

                            for (let i in this.managers) {
                                let manager = this.managers[i];

                                if (manager.id == this.user_animateur_obj.manager_id) {
                                    this.managers = [manager];
                                    break;
                                }
                            }
                        } else {

                            // Filtrage par région et visu sur les plannings des commerciaux de la région

                            // Le premier est celui connecté pour plus de clarté
                            let new_animateurs = [this.user_animateur_obj];

                            for (let i in this.facilitators) {
                                if ((this.facilitators[i].region_id == this.user_animateur_obj.region_id) && (this.facilitators[i].id != this.user_animateur_obj.id)) {
                                    new_animateurs.push(this.facilitators[i]);
                                }
                            }
                            this.facilitators = new_animateurs;
                        }

                        this.updateFilteredDatas();
                    } else {
                        // Ni admin, ni animateur, ni manager...

                        // Réinitialiser les datas
                        this.enseignes = [];
                        this.managers = [];
                        this.etablissements = [];
                        this.boutiques_animees_mois = [];
                        this.facilitators = [];
                        this.rdvs = [];
                        this.animation_crs = [];

                        // this.stopLoading();
                        return;
                    }
                }
            }

            $('#calendar-planning-store-visits').fullCalendar('destroy');

        });
    }

    private onCloseBAModal(event_id, rdvpris) {

        for (let i in this.rdvs) {
            let animation_rdv = this.rdvs[i];

            if (animation_rdv.id == event_id) {
                animation_rdv.rdvpris = rdvpris;
                break;
            }
        }

        $('#calendar-planning-store-visits').fullCalendar('rerenderEvents');
    }

    private selectEvent(calEvent, domObj) {

        this.selected_event = this.cloneEvent(calEvent);
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

            res.push({
                id: facilitator.id,
                title: this.getResourceName(facilitator.firstname, facilitator.lastname),
                manager_title: manager ? this.getResourceName(manager.firstname, manager.lastname) : ""
            });
        }

        return res;
    }

    private getPlanningEvents() {
        // On veut un tableau avec des éléments de ce type:
        // {
        //   id: '1',
        //   resourceId: 'b',
        //   start: '2017-05-07T02:00:00',
        //   end: '2017-05-07T07:00:00',
        //   title: 'event 1'
        // }

        let res = [];

        for (let i in this.rdvs) {

            let e = this.getPlanningEventFromRDV(this.rdvs[i]);

            if (e) {
                res.push(e);
            }
        }

        return res;
    }

    private getPlanningEventFromRDV(rdv: IPlanRDV) {
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

        for (let i in this.etablissements) {
            let _etablissement: IPlanTarget = this.etablissements[i];

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

        let res = {
            // TODO reporter dans le projet / adapter backgroundColor: enseigne.bgcolor,
            // textColor: enseigne.color,
            id: rdv.id,
            etablissement_id: etablissement.id,
            resourceId: facilitator.id,
            start: rdv.start_time,
            end: rdv.end_time,
            title: etablissement.name,
            state: rdv.state
        };

        ProgramPlanControllerBase.getInstance().populateCalendarEvent(res);
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
    //     event.boutique_animee_id = event.ba_id;
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
        if ((!this.getStoredDatas[ModuleProgramPlan.getInstance().program_type_id]) || (!this.program_id)) {
            return null;
        }
        return this.getStoredDatas[ModuleProgramPlan.getInstance().program_type_id][this.program_id] as IPlanProgram;
    }

    get etablissements(): { [id: number]: IPlanTarget } {
        let res: { [id: number]: IPlanTarget } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlan.getInstance().program_target_type_id]) {
            let pt: IPlanProgramTarget = this.getStoredDatas[ModuleProgramPlan.getInstance().program_target_type_id][i] as IPlanProgramTarget;

            if ((!pt) || (!pt.target_id) || (pt.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id]) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id][pt.target_id])) {
                continue;
            }

            res[pt.target_id] = this.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id][pt.target_id] as IPlanTarget;
        }
        return res;
    }

    get facilitators(): { [id: number]: IPlanFacilitator } {
        let res: { [id: number]: IPlanFacilitator } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlan.getInstance().program_facilitator_type_id]) {
            let pf: IPlanProgramFacilitator = this.getStoredDatas[ModuleProgramPlan.getInstance().program_facilitator_type_id][i] as IPlanProgramFacilitator;

            if ((!pf) || (!pf.facilitator_id) || (pf.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlan.getInstance().facilitator_type_id]) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().facilitator_type_id][pf.facilitator_id])) {
                continue;
            }

            res[pf.facilitator_id] = this.getStoredDatas[ModuleProgramPlan.getInstance().facilitator_type_id][pf.facilitator_id] as IPlanFacilitator;
        }
        return res;
    }

    get enseignes(): { [id: number]: IPlanEnseigne } {
        let res: { [id: number]: IPlanEnseigne } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlan.getInstance().program_target_type_id]) {
            let pt: IPlanProgramTarget = this.getStoredDatas[ModuleProgramPlan.getInstance().program_target_type_id][i] as IPlanProgramTarget;

            if ((!pt) || (!pt.target_id) || (pt.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id]) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id][pt.target_id])) {
                continue;
            }

            let target: IPlanTarget = this.getStoredDatas[ModuleProgramPlan.getInstance().target_type_id][pt.target_id] as IPlanTarget;
            if ((!target) || (!target.enseigne_id) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().enseigne_type_id]) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().enseigne_type_id][target.enseigne_id])) {
                continue;
            }

            res[target.enseigne_id] = this.getStoredDatas[ModuleProgramPlan.getInstance().enseigne_type_id][target.enseigne_id] as IPlanEnseigne;
        }
        return res;
    }

    get managers(): { [id: number]: IPlanManager } {
        let res: { [id: number]: IPlanManager } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlan.getInstance().program_manager_type_id]) {
            let pm: IPlanProgramManager = this.getStoredDatas[ModuleProgramPlan.getInstance().program_manager_type_id][i] as IPlanProgramManager;

            if ((!pm) || (!pm.manager_id) || (pm.program_id != this.program_id)) {
                continue;
            }

            if ((!this.getStoredDatas[ModuleProgramPlan.getInstance().manager_type_id]) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().manager_type_id][pm.manager_id])) {
                continue;
            }

            res[pm.manager_id] = this.getStoredDatas[ModuleProgramPlan.getInstance().manager_type_id][pm.manager_id] as IPlanManager;
        }
        return res;
    }

    get rdvs(): { [id: number]: IPlanRDV } {
        let res: { [id: number]: IPlanRDV } = {};

        if ((!this.start_date) || (!this.end_date)) {
            return res;
        }

        // TODO: c'est typiquement là qu'on GarbageCollector serait utile pour vider les RDVs les plus anciennement chargés pour limiter la taille 
        //  si on se balade beaucoup sur le calendrier.
        for (let i in this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_type_id]) {
            let rdv: IPlanRDV = this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_type_id][i] as IPlanRDV;

            if ((!rdv) || (!rdv.start_time) || (!rdv.end_time) || (rdv.program_id != this.program_id) ||
                (moment(rdv.start_time).isSameOrAfter(this.end_date)) || (moment(rdv.end_time).isSameOrBefore(this.start_date))) {
                continue;
            }

            res[rdv.id] = this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_type_id][rdv.id] as IPlanRDV;
        }
        return res;
    }

    get crs(): { [id: number]: IPlanRDVCR } {
        let res: { [id: number]: IPlanRDVCR } = {};

        if (!this.rdvs) {
            return res;
        }

        for (let i in this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_cr_type_id]) {
            let cr: IPlanRDVCR = this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_cr_type_id][i] as IPlanRDVCR;

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
    get fcEvents() {

    }

    /**
     * Triggered when a new date-range is rendered, or when the view type switches.
     * @param view https://fullcalendar.io/docs/view-object
     * @param element is a jQuery element for the container of the new view.
     */
    public onFCViewRender(view: View, element) {
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
    public async onFCEventDrop(event: EventObjectInput, delta, revertFunc, jsEvent, ui, view: View) {
        await this.updateEvent(event, revertFunc, view);
    }

    /**
     * Triggered when resizing stops and the event has changed in duration.
     * @param event https://fullcalendar.io/docs/event-object
     */
    public async onFCEventResize(event: EventObjectInput, delta, revertFunc, jsEvent, ui, view: View) {
        await this.updateEvent(event, revertFunc, view);
    }

    private async updateEvent(event: EventObjectInput, revertFunc, view: View) {
        // Il faut modifier le vo source, mettre à jour côté serveur et notifier en cas d'échec et annuler la modif (remettre la resource et les dates précédentes)

        this.snotify.info('programplan.fc.update.error');
        if ((!event) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_type_id]) || (!event.id) || (!this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_type_id][event.id])) {
            this.snotify.error('programplan.fc.update.error');
            return;
        }
        let rdv: IPlanRDV = this.getStoredDatas[ModuleProgramPlan.getInstance().rdv_type_id][event.id] as IPlanRDV;

        let tmp_start: string = rdv.start_time;
        let tmp_end: string = rdv.end_time;
        let tmp_facilitator_id: number = rdv.facilitator_id;

        try {

            rdv.start_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.start));
            rdv.end_time = DateHandler.getInstance().formatDateTimeForBDD(moment(event.end));
            rdv.facilitator_id = event.resourceIds[0];
            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur côté serveur');
            }
        } catch (error) {
            console.error(error);
            this.snotify.error('programplan.fc.update.error');

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

        this.snotify.error('programplan.fc.update.ok');
    }

    get fcConfig(): OptionsInput {
        return {
            locale: 'fr',
            dayNamesShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            now: moment().format('Y-MM-DD'),
            schedulerLicenseKey: '0801712196-fcs-1461229306',
            editable: this.canEditPlanning,
            droppable: this.canEditPlanning,
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
                    slotLabelInterval: {
                        hours: 12
                    },
                    slotDuration: {
                        hours: 12
                    },
                },
                timelineWeek: {
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
            navLinks: true,
            eventOverlap: false,
            resourceAreaWidth: '300px',
            resourceLabelText: 'Utilisateurs',
            slotLabelFormat: [
                'ddd D/M',
                'a'
            ],
            resourceColumns: [{
                labelText: 'Commercial',
                field: 'title'
            }, {
                labelText: 'Manager',
                field: 'manager_title',
                group: true
            }],
            resources: this.getPlanningResources(),
            events: this.getPlanningEvents(),
            eventRender: function (event, element) {

                // Définir l'état et donc l'icone
                let icon = null;

                //  rechercher le rdv qui a généré l'event
                for (let a in self.rdvs) {
                    let animation_rdv = self.rdvs[a];

                    if (animation_rdv.id == event.id) {
                        // remettre le rdv à jour
                        event.rdvpris = animation_rdv.rdvpris;
                    }
                }

                if (event.rdvpris) {
                    icon = "fa-battery-empty";

                    // On essaie de trouver un cr associé
                    let cr = null;

                    for (let i in self.animation_crs) {
                        let animation_cr_list = self.animation_crs[i];

                        for (let j in animation_cr_list) {
                            let animation_cr = animation_cr_list[j];

                            if (animation_cr.animation_rdv_id == event.id) {
                                cr = animation_cr;
                                break;
                            }
                        }
                    }

                    if (cr) {
                        if ((cr.pointschiffres) && (cr.pointschiffres != "") && (cr.objectif) && (cr.objectif != "")) {
                            icon = "fa-battery-half";

                            if ((cr.actions) && (cr.actions != "") && (cr.plan_action) && (cr.plan_action != "") && (cr.resultats) && (cr.resultats != "")) {
                                icon = "fa-battery-full";
                            }
                        }
                    }
                }

                if (icon) {
                    var i = $('<i class="fa ' + icon + '" aria-hidden="true"/>');
                    element.find('div.fc-content').prepend(i);
                }
            },
            eventReceive: function (event) { // called when a proper external event is dropped
                // console.log('eventReceive', event);

                // C'est donc un ajout à gérer
                self.registerAddedEvent(event);
            },
            eventClick: function (calEvent, jsEvent, view) {
                // console.log('eventClick', calEvent);

                // On sélectionne un élément pour pouvoir le supprimer facilement ou le copier
                self.selectEvent(calEvent, $(this));
            },
        };
    }

    @Watch('fcSegment')
    private async onChangeFCSegment() {

        let promises: Promise<any>[] = [];
        let self = this;

        // RDVs
        // Sont chargés lors du changement de segment consulté
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().rdv_type_id,
                vos: await ModuleProgramPlan.getInstance().getRDVsOfProgramSegment(self.program_id, self.fcSegment)
            });
        })());

        // CRs
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: ModuleProgramPlan.getInstance().rdv_cr_type_id,
                vos: await ModuleProgramPlan.getInstance().getCRsOfProgramSegment(self.program_id, self.fcSegment)
            });
        })());

        await Promise.all(promises);
    }
}