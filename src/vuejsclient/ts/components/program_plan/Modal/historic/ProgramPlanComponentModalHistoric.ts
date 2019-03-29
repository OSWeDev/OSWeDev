import * as moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDVPrep from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import ModuleProgramPlanBase from '../../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import ProgramPlanComponentModalCR from '../cr/ProgramPlanComponentModalCR';
import ProgramPlanComponentModalPrep from '../prep/ProgramPlanComponentModalPrep';
import "./ProgramPlanComponentModalHistoric.scss";

@Component({
    template: require('./ProgramPlanComponentModalHistoric.pug'),
    components: {
        VueFieldComponent,
        ProgramPlanComponentModalPrep,
        ProgramPlanComponentModalCR
    }
})
export default class ProgramPlanComponentModalHistoric extends VueComponentBase {

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

    @ModuleProgramPlanAction
    public addRdvsByIds: (rdvs_by_ids: { [id: number]: IPlanRDV }) => void;

    @ModuleProgramPlanAction
    public addCrsByIds: (crs_by_ids: { [id: number]: IPlanRDVCR }) => void;

    @ModuleProgramPlanAction
    public addPrepsByIds: (preps_by_ids: { [id: number]: IPlanRDVPrep }) => void;


    @Prop({
        default: null
    })
    private selected_rdv: IPlanRDV;
    @Prop()
    private can_edit: boolean;

    @Watch('selected_rdv', { immediate: true })
    private async onChangeSelectedRDV() {

        if (!this.selected_rdv) {
            return;
        }

        let self = this;

        let rdvs: IPlanRDV[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDV>(ModuleProgramPlanBase.getInstance().rdv_type_id, 'target_id', [this.selected_rdv.target_id]);

        if (rdvs.length > 5) {
            rdvs.splice(5, rdvs.length);
        }

        let rdvs_by_ids: { [id: number]: IPlanRDV } = VOsTypesManager.getInstance().vosArray_to_vosByIds(rdvs);
        self.addRdvsByIds(rdvs_by_ids);
        let rdvs_ids: number[] = ObjectHandler.getInstance().getNumberMapIndexes(rdvs_by_ids);

        let promises: Array<Promise<any>> = [];

        promises.push((async () => {
            let vos: IPlanRDVPrep[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVPrep>(ModuleProgramPlanBase.getInstance().rdv_prep_type_id, 'rdv_id', rdvs_ids);
            self.addPrepsByIds(vos);
        })());
        promises.push((async () => {
            let vos: IPlanRDVCR[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanRDVCR>(ModuleProgramPlanBase.getInstance().rdv_cr_type_id, 'rdv_id', rdvs_ids);
            self.addCrsByIds(vos);
        })());

        await Promise.all(promises);
    }

    get rdv_historics(): IPlanRDV[] {

        if (!this.selected_rdv) {
            return [];
        }

        let res: IPlanRDV[] = [];

        for (let i in this.getRdvsByIds) {
            let rdv = this.getRdvsByIds[i];

            if (rdv.target_id != this.selected_rdv.target_id) {
                continue;
            }

            if (moment(rdv.start_time).isSameOrAfter(this.selected_rdv.start_time)) {
                continue;
            }

            res.push(rdv);
        }

        res.sort((a: IPlanRDV, b: IPlanRDV) => moment(b.start_time).diff(moment(a.start_time)));

        return res;
    }

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

        return ProgramPlanControllerBase.getInstance().getResourceName(facilitator.firstname, facilitator.lastname);
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

        return ProgramPlanControllerBase.getInstance().getResourceName(manager.firstname, manager.lastname);
    }
}