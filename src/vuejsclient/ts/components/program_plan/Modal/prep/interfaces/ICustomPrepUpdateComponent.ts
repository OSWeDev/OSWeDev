import IPlanRDV from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVPrep from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';

export default interface ICustomPrepUpdateComponent {
    /**
     * PROP
     */
    rdv: IPlanRDV;

    /**
     * PROP Prep
     */
    prep: IPlanRDVPrep;

    /**
     * PROP to call when the prep is ready to be saved in server (confirmation is handled by this prop)
     */
    update_prep: (prep: IPlanRDVPrep) => Promise<void>;

    /**
     * PROP to call when ready to cancel the modifications
     */
    cancel_edition: (prep: IPlanRDVPrep) => Promise<void>;

    /**
     * Method that must call update_prep and do whatever you want with the prep before update
     */
    custom_update_prep: () => Promise<void>;

    /**
     * Method that must call cancel_prep and cancel the modifications
     */
    custom_cancel_edition: () => Promise<void>;
}