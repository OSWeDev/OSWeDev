import * as $ from 'jquery';
import 'jqueryui';
import { Component, Prop } from 'vue-property-decorator';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';

@Component({
    template: require('./ProgramPlanComponentRDV.pug')
})
export default class ProgramPlanComponentRDV extends VueComponentBase {

    @Prop()
    private event_name: string;
    @Prop()
    private event_id: number;
    @Prop()
    private event_type: string;

    @Prop({ default: null })
    private program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    private program_plan_controller: ProgramPlanControllerBase;

    private mounted() {

        // store data so the calendar knows to render an event upon drop
        let event: any = {};

        event.title = this.event_name;
        event._type = this.event_type;

        if (event._type == this.program_plan_shared_module.task_type_id) {
            event.task_id = this.event_id;
        } else if (event._type == this.program_plan_shared_module.task_type_type_id) {
            event.task_type_id = this.event_id;
        } else {
            event.target_id = this.event_id;
        }

        event.allDay = false;
        event.editable = true;

        event.rdvpris = false;

        event.stick = true; // maintain when user navigates (see docs on the renderEvent method)

        this.program_plan_controller.populateDroppableItem(event, $(this.$el));

        $(this.$el).data('event', event);

        // make the event draggable using jQuery UI
        $(this.$el).draggable({
            cursor: "pointer",
            zIndex: 10000,
            revert: true, // will cause the event to go back to its
            revertDuration: 0, //  original position after the drag
            cursorAt: { top: -5, left: -5 }
        });
    }
}