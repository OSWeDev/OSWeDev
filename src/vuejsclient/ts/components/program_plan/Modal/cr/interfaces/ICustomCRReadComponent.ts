import IPlanRDVCR from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDV from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import ICRVersioningComponent from './ICRVersioningComponent';

export default interface ICustomCRReadComponent extends ICRVersioningComponent {
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