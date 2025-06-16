import IPlanRDVCR from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDV from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';

export default interface ICustomCRReadComponent {
    /**
     * PROP
     */
    rdv: IPlanRDV;

    /**
     * PROP
     */
    cr: IPlanRDVCR;

    oselia_opened: boolean;

    /**
     * PROP
     */
    set_cr_html_content: (html: string) => void;
}