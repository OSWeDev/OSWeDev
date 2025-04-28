import IPlanRDVCR from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDV from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';

export default interface ICustomCRCreateComponent {
    /**
     * PROP
     */
    rdv: IPlanRDV;

    /**
     * PROP to call when the cr is ready to be saved in server (confirmation is handled by this prop)
     */
    create_cr: (cr: IPlanRDVCR, no_confirmation? : boolean) => Promise<void>;

    /**
     * Method that must call create_cr and do whatever you want with the cr before saving
     */
    custom_create_cr: () => Promise<void>;
}