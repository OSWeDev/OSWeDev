import { Component, Prop } from 'vue-property-decorator';
import MixedinVue from '../../../../../ts/mixins/MixedinVue';
import VuePlanningRDVAnimateursBoutiqueVisitsBaComponent from '../visits_ba/planning_rdv_animateurs_boutique_visits_ba';

@Component({
    template: require('./planning_rdv_animateurs_boutique_ba_listing.pug'),
    components: {
        "draggable-planning-store-visits-ba": VuePlanningRDVAnimateursBoutiqueVisitsBaComponent
    }
})
export default class VuePlanningRDVAnimateursBoutiqueBaListingComponent extends MixedinVue {

    @Prop()
    private bas;
    @Prop()
    private bams;
    @Prop()
    private bascpts;
    @Prop()
    private enseignes;

    private isOpen = false;
    private filtre_boutiques = null;

    get filtered_ordered_boutiques() {
        let res = [];
        let tester = (this.filtre_boutiques ? new RegExp('.*' + this.filtre_boutiques + '.*', 'i') : new RegExp('.*', 'i'));

        for (let i in this.bas) {
            if (tester.test(this.bas[i].nom)) {
                res.push(this.bas[i]);
            }
        }

        let self = this;

        res.sort(function (a, b) {

            // On cherche ceux pour lesquels il manque le plus de RDV par rapport à ceux placés et à la cible
            let BAMa = self.getBamForBa(a);
            BAMa = BAMa ? BAMa.cible : 0;
            let CPTa = self.getBaCptForBa(a).rdvs;
            let NEEDa = ((BAMa - CPTa) > 0 ? (BAMa - CPTa) : 0);

            let BAMb = self.getBamForBa(b);
            BAMb = BAMb ? BAMb.cible : 0;
            let CPTb = self.getBaCptForBa(b).rdvs;
            let NEEDb = ((BAMb - CPTb) > 0 ? (BAMb - CPTb) : 0);

            return NEEDb - NEEDa;
        });

        if (res.length > 9) {
            res.splice(9, res.length - 9);
        }

        return res;
    }

    private getEnseigneForBa(ba) {
        if ((!ba) || (!ba.enseigne_id) || (!this.enseignes)) {
            return null;
        }

        return this.enseignes[ba.enseigne_id];
    }

    private getBamForBa(ba) {
        // On check le mois sélectionné sur le calendrier
        // Puis en cherche le bam correspond
        let date: any = $('#calendar-planning-store-visits').fullCalendar('getDate');

        if ((!date) || ($('#calendar-planning-store-visits')['selector'] == date.selector)) {
            return {
                cible: 0
            };
        }

        let mois = date.month() + 1;
        let annee = date.year();

        if (this.bams && this.bams[ba.id] && this.bams[ba.id][annee] && this.bams[ba.id][annee][mois]) {
            return this.bams[ba.id][annee][mois];
        }

        return {
            cible: 0
        };
    }

    private getBaCptForBa(ba) {
        // On check le mois sélectionné sur le calendrier
        // Puis en cherche le bacpt correspond
        let date: any = $('#calendar-planning-store-visits').fullCalendar('getDate');

        if ((!date) || ($('#calendar-planning-store-visits')['selector'] == date.selector)) {
            return {
                rdvs: 0
            };
        }

        let mois = date.month() + 1;
        let annee = date.year();

        if (this.bascpts && this.bascpts[ba.id] && this.bascpts[ba.id][annee] && this.bascpts[ba.id][annee][mois]) {

            return this.bascpts[ba.id][annee][mois];
        }

        return {
            rdvs: 0
        };
    }
}