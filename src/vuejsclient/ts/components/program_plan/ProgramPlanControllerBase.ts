import { EventObjectInput, View } from 'fullcalendar';
import IPlanContact from '../../../../shared/modules/ProgramPlan/interfaces/IPlanContact';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTask from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueAppBase from '../../../VueAppBase';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';

export default abstract class ProgramPlanControllerBase {

    public static getInstance() {
        return ProgramPlanControllerBase.instance;
    }

    private static instance: ProgramPlanControllerBase = null;

    public load_rdv_on_segment_change: boolean = true;

    public confirm_before_rdv_deletion: boolean = true;

    public is_valid_rdv: (rdv: IPlanRDV) => boolean;
    public is_valid_target: (target: IPlanTarget) => boolean;
    public is_valid_facilitator: (facilitator: IPlanFacilitator) => boolean;

    public reset_rdvs_debouncer: number = 500;

    public customOverviewProgramPlanComponent = null;

    protected constructor(
        public customPrepCreateComponent,
        public customPrepReadComponent,
        public customPrepUpdateComponent,
        public customCRCreateComponent,
        public customCRReadComponent,
        public customCRUpdateComponent,
        public customTargetInfosComponent,
        public customFilterComponent,
        public slot_interval: number = 12,
        public month_view: boolean = true,
        public use_print_component: boolean = true
    ) {
        ProgramPlanControllerBase.instance = this;
    }

    public getResourceName(first_name, name) {
        return name + ' ' + first_name.substring(0, 1) + '.';
    }

    /**
     * Renvoie true pour cacher les taches de ce type.
     * @param task
     */
    public hide_task(task: IPlanTask): boolean {
        return false;
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
    public populateCalendarEvent(event: EventObjectInput) {
    }

    /**
     *
     * @param event droppable item infos
     * @param elt jquery elt
     */
    public populateDroppableItem(event: EventObjectInput, elt) {
    }

    /**
     * Fonction qui permet d'avoir la main sur le RDV rendu dans FC pour mettre une icone de statut par exemple
     * @param event
     * @param element
     * @param view
     */
    public onFCEventRender(
        event: EventObjectInput,
        element,
        view: View) {

        let getRdvsByIds: { [id: number]: IPlanRDV } = VueAppBase.instance_.vueInstance.$store.getters['ProgramPlanStore/getRdvsByIds'];

        // Définir l'état et donc l'icone
        let icon = null;

        if ((!event) || (!event.rdv_id) || (!getRdvsByIds[event.rdv_id])) {
            return;
        }

        let rdv: IPlanRDV = getRdvsByIds[event.rdv_id];

        switch (rdv.state) {
            case ModuleProgramPlanBase.RDV_STATE_CONFIRMED:
                icon = "fa-circle rdv-state-confirmed";
                break;
            case ModuleProgramPlanBase.RDV_STATE_CR_OK:
                icon = "fa-circle rdv-state-crok";
                break;
            case ModuleProgramPlanBase.RDV_STATE_PREP_OK:
                icon = "fa-circle rdv-state-prepok";
                break;
            case ModuleProgramPlanBase.RDV_STATE_CREATED:
            default:
                icon = "fa-circle rdv-state-created";
        }

        let i = $('<i class="fa ' + icon + '" aria-hidden="true"/>');
        element.find('div.fc-content').prepend(i);
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

    public getContactInfosHTMLFromTarget(target_contacts: IPlanContact[]): string {
        let res: string;

        if ((!target_contacts) || (target_contacts.length <= 0)) {
            return null;
        }

        for (let i in target_contacts) {
            let target_contact = target_contacts[i];

            res = (target_contact.firstname ? ((res != '') ? '<br><hr>' : '') + target_contact.firstname : '');
            res += (target_contact.lastname ? ((res != '') ? ' ' : '') + target_contact.lastname : '');
            res += (target_contact.mobile ? ((res != '') ? '<br>' : '') + target_contact.mobile : '');
            res += (target_contact.mail ? ((res != '') ? '<br>' : '') + target_contact.mail : '');
            res += (target_contact.infos ? ((res != '') ? '<br>' : '') + target_contact.infos : '');
        }

        return res;
    }

    public async component_hook_onAsyncLoading(
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void
    ) { }

    public async component_hook_refuseReceiveRDV(
        rdv: IPlanRDV,
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void,
        get_tasks_by_ids: { [id: number]: IPlanTask }
    ): Promise<boolean> {
        return false;
    }

    public async component_hook_refuseChangeRDV(
        rdv: IPlanRDV,
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void,
        get_tasks_by_ids: { [id: number]: IPlanTask }
    ): Promise<boolean> {
        return false;
    }

    public async component_hook_refuseTargetOnLoading(
        target: IPlanTarget,
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void
    ): Promise<boolean> {
        return false;
    }
}