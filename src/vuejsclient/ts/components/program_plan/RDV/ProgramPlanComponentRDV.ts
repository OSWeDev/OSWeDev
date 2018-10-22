import * as $ from 'jquery';
import 'jqueryui';
import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';
import { ModuleDAOGetter } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';

@Component({
    template: require('./ProgramPlanComponentRDV.pug')
})
export default class ProgramPlanComponentRDV extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @Prop()
    private target: IPlanTarget;
    @Prop()
    private enseigne: IPlanEnseigne;

    private mounted() {

        // store data so the calendar knows to render an event upon drop
        let event: any = {};

        event.title = this.target.name;
        event.target_id = this.target.id;

        event.allDay = false;
        event.editable = true;

        event.rdvpris = false;

        event.stick = true; // maintain when user navigates (see docs on the renderEvent method)

        ProgramPlanControllerBase.getInstance().populateDroppableItem(event, $(this.$el), this.getStoredDatas);

        $(this.$el).data('event', event);

        // make the event draggable using jQuery UI
        $(this.$el).draggable({
            zIndex: 10000,
            revert: true, // will cause the event to go back to its
            revertDuration: 0 //  original position after the drag
        });
    }
}