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

    /**
     * PROP to call when ready to cancel the modifications
     */
    cancel_edition: (cr: IPlanRDVCR) => Promise<void>;

    /**
     * Method that must call update_cr and do whatever you want with the cr before update
     */
    custom_update_cr: () => Promise<void>;

    /**
     * Method that must call cancel_cr and cancel the modifications
     */
    custom_cancel_edition: () => Promise<void>;
}