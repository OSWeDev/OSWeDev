import * as $ from 'jquery';
import 'jqueryui';
import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';
import { ModuleDAOGetter } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { ModuleProgramPlanGetter } from '../store/ProgramPlanStore';
import IPlanFacilitator from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanPartner from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';

@Component({
    template: require('./ProgramPlanComponentRDV.pug')
})
export default class ProgramPlanComponentRDV extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

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

        ProgramPlanControllerBase.getInstance().populateDroppableItem(
            event,
            $(this.$el),
            this.getEnseignesByIds, this.getTargetsByIds, this.getFacilitatorsByIds, this.getManagersByIds, this.getRdvsByIds, this.getCrsByIds);

        $(this.$el).data('event', event);

        // make the event draggable using jQuery UI
        $(this.$el).draggable({
            zIndex: 10000,
            revert: true, // will cause the event to go back to its
            revertDuration: 0 //  original position after the drag
        });
    }
}