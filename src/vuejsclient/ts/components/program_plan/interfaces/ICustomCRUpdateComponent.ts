import IPlanRDVCR from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';

export default interface ICustomCRUpdateComponent {
    /**
     * PROP
     */
    rdv: IPlanRDV;

    /**
     * PROP CR
     */
    cr: IPlanRDVCR;

    /**
     * PROP to call when the cr is ready to be saved in server (confirmation is handled by this prop)
     */
    update_cr: (cr: IPlanRDVCR) => Promise<void>;
}