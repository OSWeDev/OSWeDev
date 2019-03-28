import IPlanRDV from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVPrep from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';

export default interface ICustomPrepCreateComponent {
    /**
     * PROP
     */
    rdv: IPlanRDV;

    /**
     * PROP to call when the prep is ready to be saved in server (confirmation is handled by this prop)
     */
    create_prep: (prep: IPlanRDVPrep) => Promise<void>;

    /**
     * Method that must call create_prep and do whatever you want with the prep before saving
     */
    custom_create_prep: () => Promise<void>;
}