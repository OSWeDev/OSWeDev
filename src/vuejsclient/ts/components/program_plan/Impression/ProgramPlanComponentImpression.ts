import * as moment from 'moment';
import { Component } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import select2 from '../../../directives/select2/select2';
import { ModuleDAOGetter } from '../../DAO/store/DaoStore';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';
import { ModuleProgramPlanGetter } from '../store/ProgramPlanStore';
import './ProgramPlanComponentImpression.scss';

@Component({
    template: require('./ProgramPlanComponentImpression.pug'),
    directives: {
        select2: select2
    }
})
export default class ProgramPlanComponentImpression extends VueComponentBase {

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

    @ModuleProgramPlanGetter
    public filter_date_debut: moment.Moment;

    @ModuleProgramPlanGetter
    public filter_date_fin: moment.Moment;

    @ModuleProgramPlanGetter
    public printable_table_weeks: any;

    get nb_day_slices() {
        return Math.floor(24 / ProgramPlanControllerBase.getInstance().slot_interval);
    }
}