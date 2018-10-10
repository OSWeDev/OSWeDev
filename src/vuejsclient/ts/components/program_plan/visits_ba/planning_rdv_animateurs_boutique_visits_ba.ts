import { Component, Prop } from 'vue-property-decorator';
import MixedinVue from '../../../../../ts/mixins/MixedinVue';

@Component({
    template: require('./planning_rdv_animateurs_boutique_visits_ba.pug')
})
export default class VuePlanningRDVAnimateursBoutiqueVisitsBaComponent extends MixedinVue {

    @Prop()
    private ba;
    @Prop()
    private bam;
    @Prop()
    private bacpt;
    @Prop()
    private enseigne;

    get ba_name() {
        return this.ba.nom;
    }

    get ba_compteur() {
        return this.bacpt.rdvs + "/" + this.bam.cible;
    }

    private mounted() {

        // store data so the calendar knows to render an event upon drop
        let event: any = {};

        event.title = this.ba.nom;
        event.ba_id = this.ba.id;
        //event.backgroundColor = taskType.color;

        /*if (event.task.is_normal) {
          event.textColor = 'black';
          event.borderColor = 'black';
          event.className = 'text-center normal-task';
        } else {
          event.textColor = 'yellow';
          event.borderColor = 'yellow';
          event.className = 'text-center other-task';
        }*/

        event.allDay = false;
        event.editable = true;

        event.rdvpris = false;

        event.stick = true; // maintain when user navigates (see docs on the renderEvent method)

        //$(this.$el).attr('style', 'background-color:' + this.task_type.color);
        $(this.$el).attr('style', 'color:' + this.enseigne.color);
        event.textColor = this.enseigne.color;
        $(this.$el).attr('style', 'background-color:' + this.enseigne.bgcolor);
        event.backgroundColor = this.enseigne.bgcolor;

        $(this.$el).data('event', event);

        // make the event draggable using jQuery UI
        $(this.$el).draggable({
            zIndex: 10000,
            revert: true, // will cause the event to go back to its
            revertDuration: 0 //  original position after the drag
        });
    }
}