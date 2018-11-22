import { EventObjectInput } from 'fullcalendar';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';

export default abstract class ProgramPlanControllerBase {

    public static getInstance() {
        return ProgramPlanControllerBase.instance;
    }

    private static instance: ProgramPlanControllerBase = null;

    protected constructor(
        public customCRCreateComponent,
        public customCRReadComponent,
        public customCRUpdateComponent,
    ) {
        ProgramPlanControllerBase.instance = this;
    }

    public getResourceName(first_name, name) {
        return name + ' ' + first_name.substring(0, 1) + '.';
    }

    /**
     * Permet de rajouter/surcharger des paramètres de l'évènement fullcalendar avant ajout au calendrier
     * @param event Evènement en cours de configuration pour ajout sur fullcalendar. Contient déjà :{
     *       id: rdv.id,
     *       target_id: etablissement.id,
     *       resourceId: facilitator.id,
     *       start: rdv.start_time,
     *       end: rdv.end_time,
     *       title: etablissement.name,
     *       state: rdv.state
     *   }
     */
    public populateCalendarEvent(event: EventObjectInput, getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } }) {
    }

    /**
     *
     * @param event droppable item infos
     * @param elt jquery elt
     */
    public populateDroppableItem(event: EventObjectInput, elt, getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } }) {
    }

    /**
     * Renvoie une instance de RDV
     */
    public abstract getRDVNewInstance(): IPlanRDV;

    public getAddressHTMLFromTarget(target: IPlanTarget): string {
        let res: string;

        if ((!target) || (!target.address)) {
            return null;
        }

        res = target.address + (target.cp ? '<br>' + target.cp : '') + (target.city ? '<br>' + target.city : '') + (target.country ? '<br>' + target.country : '');
        return res;
    }

    public getContactInfosHTMLFromTarget(target: IPlanTarget): string {
        let res: string;

        if ((!target) || ((!target.contact_infos) && (!target.contact_firstname) && (!target.contact_lastname) && (!target.contact_mail) && (!target.contact_mobile))) {
            return null;
        }

        res = (target.contact_firstname ? target.contact_firstname : '');
        res += (target.contact_lastname ? ((res != '') ? ' ' : '') + target.contact_lastname : '');
        res += (target.contact_mobile ? ((res != '') ? '<br>' : '') + target.contact_mobile : '');
        res += (target.contact_mail ? ((res != '') ? '<br>' : '') + target.contact_mail : '');
        res += (target.contact_infos ? ((res != '') ? '<br>' : '') + target.contact_infos : '');
        return res;
    }
}