import { Component, Prop } from 'vue-property-decorator';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import ModuleProgramPlanBase from '../../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import ProgramPlanTools from '../../ProgramPlanTools';
import { ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import ProgramPlanComponentModalCR from '../cr/ProgramPlanComponentModalCR';
import ProgramPlanComponentModalPrep from '../prep/ProgramPlanComponentModalPrep';
import "./ProgramPlanComponentModalHistoric.scss";

@Component({
    template: require('./ProgramPlanComponentModalHistoric.pug'),
    components: {
        Vuefieldcomponent: VueFieldComponent,
        Programplancomponentmodalprep: ProgramPlanComponentModalPrep,
        Programplancomponentmodalcr: ProgramPlanComponentModalCR
    }
})
export default class ProgramPlanComponentModalHistoric extends VueComponentBase {

    @ModuleProgramPlanGetter
    public selected_rdv_historics: IPlanRDV[];

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
    public getPrepsByIds: { [id: number]: IPlanRDVCR };

    @Prop({ default: null })
    private program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    private program_plan_controller: ProgramPlanControllerBase;


    @Prop()
    private can_edit: boolean;

    private facilitatorAndManagerName(rdv_historic: IPlanRDV): string {
        return this.facilitatorName(rdv_historic) + (this.managerName(rdv_historic) ? " / " + this.managerName(rdv_historic) : "");
    }

    private facilitatorName(rdv_historic: IPlanRDV): string {
        if (!rdv_historic) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[rdv_historic.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        return ProgramPlanTools.getResourceName(facilitator.firstname, facilitator.lastname);
    }

    private managerName(rdv_historic: IPlanRDV): string {
        if (!rdv_historic) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[rdv_historic.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id] as IPlanManager;
        if (!manager) {
            return null;
        }

        return ProgramPlanTools.getResourceName(manager.firstname, manager.lastname);
    }
}