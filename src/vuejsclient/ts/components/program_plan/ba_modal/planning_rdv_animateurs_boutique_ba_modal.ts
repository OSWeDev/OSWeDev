import * as moment from 'moment';
import ModuleAjaxCache from 'oswedev/dist/shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleTable from 'oswedev/dist/shared/modules/ModuleTable';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModulePlanningRdvAnimateursBoutique from '../../../../../../shared/modules/PlanningRdvAnimateursBoutique/ModulePlanningRdvAnimateursBoutique';
import MixedinVue from '../../../../../ts/mixins/MixedinVue';
import VueFieldComponent from '../../../common/field/field';
import VuePlanningRDVAnimateursBoutiqueBaInfosComponent from '../ba_infos/planning_rdv_animateurs_boutique_ba_infos';
import VuePlanningRDVAnimateursBoutiqueCrFieldComponent from '../cr_field/planning_rdv_animateurs_boutique_cr_field';
import PlanningRDVAnimateursBoutiqueController from '../planning_rdv_animateurs_boutique_controller';
import VuePlanningRDVAnimateursBoutiqueComponent from '../_base/planning_rdv_animateurs_boutique';
import ModuleDAO from 'oswedev/dist/shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from 'oswedev/dist/shared/modules/DAO/vos/InsertOrDeleteQueryResult';

@Component({
    template: require('./planning_rdv_animateurs_boutique_ba_modal.pug'),
    components: {
        "field": VueFieldComponent,
        "ba-infos": VuePlanningRDVAnimateursBoutiqueBaInfosComponent,
        "cr-field": VuePlanningRDVAnimateursBoutiqueCrFieldComponent
    }
})
export default class VuePlanningRDVAnimateursBoutiqueBaModalComponent extends MixedinVue {

    @Prop({
        default: null
    })
    private ba;
    @Prop({
        default: null
    })
    private animateurname;
    @Prop({
        default: null
    })
    private managername;
    @Prop({
        default: null
    })
    private selected_event;
    @Prop({
        default: false
    })
    private caneditplanning;
    @Prop({
        default: null
    })
    private animation_rdvs;
    @Prop({
        default: null
    })
    private animation_crs;
    @Prop({
        default: null
    })
    private user;

    private newcr_objectifvisite = "";
    private newcr_actionsmenees = "";
    private newcr_plandaction = "";
    private newcr_divers = "";
    private newcr_pointschiffres = "";
    private newcr_resultats = "";
    private seemore = false;

    private crs = null;

    private edited_cr = null;
    private editcr_seemore = false;
    private newcr_seemore = false;
    private canaddcr = true;

    private rdvpris = this.selected_event.rdvpris;

    private animation_rdv_datatable: ModuleTable<any> = ModulePlanningRdvAnimateursBoutique.getInstance().getDataTableBySuffixPrefixDatabase("animation_rdv");
    private animation_cr_datatable: ModuleTable<any> = ModulePlanningRdvAnimateursBoutique.getInstance().getDataTableBySuffixPrefixDatabase("animation_cr");

    private parent: VuePlanningRDVAnimateursBoutiqueComponent = null;

    private created() {
        this.parent = this.$parent as VuePlanningRDVAnimateursBoutiqueComponent;
    }

    @Watch('animation_crs')
    private onchange_animation_crs() {
        this.setCrs();
    }

    @Watch('crs')
    private onchange_crs() {
        this.updateCanaddcr();
    }

    @Watch('selected_event')
    private onchange_selected_event() {
        this.setCrs();
        this.updateCanaddcr();
        this.rdvpris = this.selected_event.rdvpris;
    }

    @Watch('rdvpris')
    private async onchange_rdvpris() {
        if (this.rdvpris != this.selected_event.rdvpris) {

            // Il faut sauvegarder l'info
            this.selected_event._type = "module_planning_rdv_animateurs_boutique_animation_rdv";
            this.selected_event.rdvpris = this.rdvpris;
            this.selected_event.animateur_id = this.selected_event.resourceId;
            this.selected_event.boutique_animee_id = this.selected_event.ba_id;
            this.selected_event.date_debut = this.selected_event.start;
            this.selected_event.date_fin = this.selected_event.end;

            let self = this;

            ModuleAjaxCache.getInstance().invalidateUsingURLRegexp(new RegExp('/ref/api/' + this.animation_rdv_datatable.name + '/?(.*)?', 'i'));

            await ModuleDAO.getInstance().insertOrUpdateVOs([this.selected_event]);
        }
    }

    get animateurAndManagerName() {
        return this.animateurname + (this.managername ? " / " + this.managername : "");
    }

    get GmapQ() {
        if (this.selected_event && this.ba.adresse) {
            // Trick : on doit strip le HTML puis réencoder l'adresse en HTML (mais sans balides <p> ou <b> ... )
            return $('<div/>').text($('<div/>').html(this.ba.adresse.replace(/<br>/ig, '\n')).text()).html();
        }
    }

    private mounted() {
        $(this.$refs.bamodal).modal('show');
        this.setCrs();
    }

    private setCrs() {
        this.crs = (this.animation_crs && this.selected_event && this.selected_event.id) ? this.getOrderedcrs(this.animation_crs[this.selected_event.ba_id]) : null;
    }

    private updateCanaddcr() {
        this.canaddcr = true;

        if ((!this.selected_event) || (!this.crs)) {
            return;
        }

        for (let i in this.crs) {
            let cr = this.crs[i];

            if (cr.animation_rdv_id == this.selected_event.id) {
                this.canaddcr = false;
                return;
            }
        }
    }

    private editCR(cr) {
        this.edited_cr = cr;
        this.newcr_seemore = true;
    }

    private cancelEditCR() {
        this.edited_cr = null;
        this.newcr_seemore = false;
    }

    private closeBAModal() {
        let event_id = this.selected_event.id;

        $(this.$refs.bamodal).modal('hide');
        this.parent.selected_event = null;
        this.$emit('closebamodal', event_id, this.rdvpris);
    }

    private getOrderedcrs(crs) {
        if (!crs) {
            return crs;
        }

        let res = new Array();

        for (let i in crs) {
            res.push(crs[i]);
        }

        let self = this;

        res.sort(function (a, b) {
            // JNE : FIXME : TODO : Check remplacement de - par diff lors du passage à typescript
            return moment(self.animation_rdvs[b.animation_rdv_id].date_debut).diff(moment(self.animation_rdvs[a.animation_rdv_id].date_debut));
        });

        return res;
    }

    private async deleteCR(cr) {
        if (!cr.id) {
            // Impossible théoriquement
            return;
        }

        var ask = confirm("Confirmer la suppression ?");
        if (!ask) {
            return;
        }

        cr._type = "module_planning_rdv_animateurs_boutique_animation_cr";

        let self = this;


        ModuleAjaxCache.getInstance().invalidateUsingURLRegexp(new RegExp('/ref/api/' + this.animation_cr_datatable.name + '/?(.*)?', 'i'));

        await ModuleDAO.getInstance().deleteVOs([cr]);

        // Supprimer le cr des tables
        let tmpcrs = self.animation_rdvs[self.selected_event.id].animation_crs;
        for (let i in tmpcrs) {
            if (tmpcrs[i].id == cr.id) {
                self.animation_rdvs[self.selected_event.id].animation_crs.splice(i, 1);
                break;
            }
        }

        delete self.animation_crs[self.animation_rdvs[self.selected_event.id].boutique_animee_id][cr.id];
        self.crs = self.getOrderedcrs(self.animation_crs[self.animation_rdvs[self.selected_event.id].boutique_animee_id]);
        self.$snotify.warning(self.t("client.planning-store-visits.bamodal.supprimercr-ok"));
    }

    private async updateCR() {
        this.edited_cr._type = "module_planning_rdv_animateurs_boutique_animation_cr";

        let self = this;
        ModuleAjaxCache.getInstance().invalidateUsingURLRegexp(new RegExp('/ref/api/' + this.animation_cr_datatable.name + '/?(.*)?', 'i'));

        await ModuleDAO.getInstance().insertOrUpdateVOs([this.edited_cr]);

        self.cancelEditCR();
        self.$snotify.warning(self.t("client.planning-store-visits.bamodal.editcr-ok"));
    }

    private async ajouterCR() {
        // TODO les crs d'un RDV sont les CRs de tous les RDVs sur ce magasin

        // On sauve un nouveau CR, si les champs sont remplis sinon alert
        let cr: any = {
            animation_rdv_id: this.selected_event.id,
            user_id: this.user.id,
            objectif: this.newcr_objectifvisite,
            actions: this.newcr_actionsmenees,
            plan_action: this.newcr_plandaction,
            divers: this.newcr_divers,
            resultats: this.newcr_resultats,
            pointschiffres: this.newcr_pointschiffres,
            _type: "module_planning_rdv_animateurs_boutique_animation_cr"
        };

        let self = this;
        ModuleAjaxCache.getInstance().invalidateUsingURLRegexp(new RegExp('/ref/api/' + this.animation_cr_datatable.name + '/?(.*)?', 'i'));

        let ids: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().insertOrUpdateVO(cr);
        if (ids && ids.length) {
            if (!cr.id) {
                cr.id = ids[0].id;

                // On ajoute le cr sur le RDV associé
                self.animation_rdvs[self.selected_event.id].animation_crs.push(cr);
                self.animation_crs[self.animation_rdvs[self.selected_event.id].boutique_animee_id][cr.id] = cr;
                self.crs = self.getOrderedcrs(self.animation_crs[self.animation_rdvs[self.selected_event.id].boutique_animee_id]);
                self.$snotify(self.t("client.planning-store-visits.bamodal.ajoutercr-ok"));
            }

        }
    }

    private getCRRapporteur(cr) {
        // On a pas forcément les infos pour le voir, puisque les crs sont pas filtrés par rapport à la liste des managers / animateurs
        // Donc si on a pas le nom, on renvoit null et on esquive cette partie sur la modal

        // TODO:FIXME JNE traduction en TS ya un soucis à ce niveau a priori les managers et animateurs existent pas ...
        let user = null;

        for (let i in this['managers']) {
            if (this['managers'][i].user_id == cr.user_id) {
                user = this['managers'][i];
                break;
            }
        }

        if (!user) {
            for (let i in this['animateurs']) {
                if (this['animateurs'][i].user_id == cr.user_id) {
                    user = this['animateurs'][i];
                    break;
                }
            }
        }

        if (user) {
            return PlanningRDVAnimateursBoutiqueController.getInstance().getResourceName(user.prenom, user.nom);
        }
        return null;
    }

    private getCRContent(cr) {
        return cr.cr;
    }

    private deleteSelectedEvent() {
        if (this.selected_event) {

            let event = this.selected_event;

            // C'est donc un update à gérer
            if (!this.parent.deletedEvents) {
                this.parent.deletedEvents = [];
            }

            let needAddDeleted = true;
            for (let i in this.parent.addedEvents) {
                let addedEvent = this.parent.addedEvents[i];

                if (addedEvent._id == event._id) {
                    // On supprime un élément qu'on vient de créer inutile de s'en occuper
                    this.parent.addedEvents.splice(parseInt(i.toString()), 1);
                    needAddDeleted = false;
                    break;
                }
            }

            for (let i in this.parent.updatedEvents) {
                let updatedEvent = this.parent.updatedEvents[i];

                if (updatedEvent._id == event._id) {
                    // On supprime un élément qu'on a modifié, on oublie cette info devenue inutile
                    this.parent.updatedEvents.splice(parseInt(i.toString()), 1);
                    break;
                }
            }

            if (needAddDeleted) {
                this.parent.deletedEvents.push(this.parent.cloneEvent(event));
                this.parent.needSaving = true;
            }

            this.parent.needSaving =
                (this.parent.updatedEvents && !!this.parent.updatedEvents.length) ||
                (this.parent.deletedEvents && !!this.parent.deletedEvents.length) ||
                (this.parent.addedEvents && !!this.parent.addedEvents.length);

            $("#calendar-planning-store-visits").fullCalendar('removeEvents', event._id);

            delete this.parent.animation_rdvs[event._id];
            if (this.parent.boutiques_animees && this.parent.boutiques_animees[event.boutique_animee_id]) {
                for (let i in this.parent.boutiques_animees[event.boutique_animee_id].animation_rdvs) {
                    if (this.parent.boutiques_animees[event.boutique_animee_id].animation_rdvs[i]._id == event._id) {
                        delete this.parent.boutiques_animees[event.boutique_animee_id].animation_rdvs[i];
                    }
                }
            }

            this.parent.updateBascpts();
            this.closeBAModal();
        }
    }

    private getCRDate(cr) {
        if (cr && cr.animation_rdv_id) {
            return moment(this.animation_rdvs[cr.animation_rdv_id].date_debut).format("DD/MM/Y");
        }
        return "";
    }
}