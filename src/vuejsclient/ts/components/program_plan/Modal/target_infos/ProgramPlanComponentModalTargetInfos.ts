import * as $ from 'jquery';
import * as moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import IPlanContact from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanContact';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTargetContact from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetContact';
import ModuleProgramPlanBase from '../../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import { ModuleDAOGetter } from '../../../dao/store/DaoStore';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import "./ProgramPlanComponentModalTargetInfos.scss";
import ProgramPlanComponentHTMLInfos from '../../HTMLInfos/ProgramPlanComponentHTMLInfos';
import IPlanTargetGroupContact from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTargetGroupContact';

@Component({
    template: require('./ProgramPlanComponentModalTargetInfos.pug'),
    components: {
        VueFieldComponent,
        ProgramPlanComponentHTMLInfos
    }
})
export default class ProgramPlanComponentModalTargetInfos extends VueComponentBase {

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

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleProgramPlanAction
    public setCrById: (cr: IPlanRDVCR) => void;

    @ModuleProgramPlanAction
    public updateCr: (cr: IPlanRDVCR) => void;

    @ModuleProgramPlanAction
    public removeCr: (id: number) => void;

    @ModuleProgramPlanGetter
    public selected_rdv: IPlanRDV;
    private target_contacts: IPlanContact[] = [];

    get customTargetInfosComponent() {
        return ProgramPlanControllerBase.getInstance().customTargetInfosComponent;
    }

    @Watch('selected_rdv', { immediate: true })
    private async onChangeSelectedRDV() {
        let target_contact_links: IPlanTargetContact[] = [];
        if (!!ModuleProgramPlanBase.getInstance().target_contact_type_id) {
            target_contact_links = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanTargetContact>(
                ModuleProgramPlanBase.getInstance().target_contact_type_id, "target_id", [this.selected_rdv.target_id]);
        }

        let target_group_contact_links: IPlanTargetGroupContact[] = [];
        if (!!ModuleProgramPlanBase.getInstance().target_group_contact_type_id) {
            target_group_contact_links = await ModuleDAO.getInstance().getVosByRefFieldIds<IPlanTargetGroupContact>(
                ModuleProgramPlanBase.getInstance().target_group_contact_type_id, "target_group_id", [this.target.group_id]);
        }

        let contacts_ids: number[] = [];

        for (let i in target_contact_links) {
            let target_contact_link = target_contact_links[i];

            if (contacts_ids.indexOf(target_contact_link.contact_id) < 0) {
                contacts_ids.push(target_contact_link.contact_id);
            }
        }

        for (let i in target_group_contact_links) {
            let target_group_contact_link = target_group_contact_links[i];

            if (contacts_ids.indexOf(target_group_contact_link.contact_id) < 0) {
                contacts_ids.push(target_group_contact_link.contact_id);
            }
        }

        this.target_contacts = await ModuleDAO.getInstance().getVosByIds<IPlanContact>(
            ModuleProgramPlanBase.getInstance().contact_type_id, contacts_ids);
    }

    get target(): IPlanTarget {
        if ((!this.selected_rdv) || (!this.selected_rdv.target_id)) {
            return null;
        }

        return this.getTargetsByIds[this.selected_rdv.target_id] as IPlanTarget;
    }

    get facilitatorAndManagerName() {
        return this.facilitatorName + (this.managerName ? " / " + this.managerName : "");
    }

    get facilitatorName() {
        if (!this.selected_rdv) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[this.selected_rdv.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        return ProgramPlanControllerBase.getInstance().getResourceName(facilitator.firstname, facilitator.lastname);
    }

    get managerName() {
        if (!this.selected_rdv) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[this.selected_rdv.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id] as IPlanManager;
        if (!manager) {
            return null;
        }

        return ProgramPlanControllerBase.getInstance().getResourceName(manager.firstname, manager.lastname);
    }

    get GmapQ() {
        let address: string = this.targetAddressHTML;
        if (!address) {
            return null;
        }

        // Trick : on doit strip le HTML puis réencoder l'adresse en HTML (mais sans balides <p> ou <b> ... )
        return $('<div/>').text($('<div/>').html(address.replace(/<br>/ig, ' ').replace(/\n/ig, ' ').replace(/\r/ig, '').replace(/  /ig, ' ')).text()).html();
    }

    get targetAddressHTML(): string {
        if ((!this.selected_rdv) || (!this.selected_rdv.target_id)) {
            return null;
        }

        let target: IPlanTarget = this.getTargetsByIds[this.selected_rdv.target_id] as IPlanTarget;
        let address: string = ProgramPlanControllerBase.getInstance().getAddressHTMLFromTarget(target);
        return address;
    }

    get targetContactInfosHTML(): string {
        if ((!this.selected_rdv) || (!this.selected_rdv.target_id)) {
            return null;
        }

        let contactInfos: string = ProgramPlanControllerBase.getInstance().getContactInfosHTMLFromTarget(this.target_contacts);
        return contactInfos;
    }
}