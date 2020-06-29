import { EventObjectInput, View } from 'fullcalendar';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTask from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueAppBase from '../../../VueAppBase';

export default abstract class ProgramPlanControllerBase {

    public static getInstance(name: string) {
        return ProgramPlanControllerBase.controller_by_name[name];
    }

    private static controller_by_name: { [name: string]: ProgramPlanControllerBase } = {};

    public load_rdv_on_segment_change: boolean = true;

    public confirm_before_rdv_deletion: boolean = true;

    public is_valid_rdv: (rdv: IPlanRDV) => boolean;
    public is_valid_target: (target: IPlanTarget) => boolean;
    public is_valid_facilitator: (facilitator: IPlanFacilitator) => boolean;

    public reset_rdvs_debouncer: number = 500;

    public resourceAreaWidth: string = '400px';
    public resourceColumns_target_name_width: string = '65%';
    public resourceColumns_facilitator_name_width: string = '35%';

    public customOverviewProgramPlanComponent = null;

    public constructor(
        public name: string,
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
        ProgramPlanControllerBase.controller_by_name[name] = this;
    }

    get shared_module(): Module {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module;
    }

    get programplan_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
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
            case this.programplan_shared_module.RDV_STATE_CONFIRMED:
                icon = "fa-circle rdv-state-confirmed";
                break;
            case this.programplan_shared_module.RDV_STATE_CR_OK:
                icon = "fa-circle rdv-state-crok";
                break;
            case this.programplan_shared_module.RDV_STATE_PREP_OK:
                icon = "fa-circle rdv-state-prepok";
                break;
            case this.programplan_shared_module.RDV_STATE_CREATED:
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