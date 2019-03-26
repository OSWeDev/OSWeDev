import IPlanRDV from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVPrep from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';

export default interface ICustomPrepReadComponent {
    /**
     * PROP
     */
    rdv: IPlanRDV;

    /**
     * PROP
     */
    prep: IPlanRDVPrep;
}