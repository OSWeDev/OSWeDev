import { EventObjectInput, View } from 'fullcalendar';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTask from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import IPlanTaskType from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import VueAppBase from '../../../VueAppBase';
import ContextQueryVO from '../../../../../dist/shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';

export default abstract class ProgramPlanControllerBase {

    public static getInstance(name: string) {
        return ProgramPlanControllerBase.controller_by_name[name];
    }

    protected static controller_by_name: { [name: string]: ProgramPlanControllerBase } = {};

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
        public use_print_component: boolean = true,
        public show_calendar: boolean = true,
        public show_targets_pp: boolean = true,
        public show_rdv_historic: boolean = true,
        public show_confirmation_create_cr: boolean = true,
        public show_confirmation_update_cr: boolean = true,
    ) {
        ProgramPlanControllerBase.controller_by_name[name] = this;
    }

    public abstract event_overlap_hook(stillEvent, movingEvent): boolean;

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

        const getRdvsByIds: { [id: number]: IPlanRDV } = VueAppBase.instance_.vueInstance.$store.getters['ProgramPlanStore/getRdvsByIds'];

        // Définir l'état et donc l'icone
        let icon = null;

        if ((!event) || (!event.rdv_id) || (!getRdvsByIds[event.rdv_id])) {
            return;
        }

        const rdv: IPlanRDV = getRdvsByIds[event.rdv_id];

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

        const i = $('<i class="fa ' + icon + '" aria-hidden="true"/>');
        element.find('div.fc-content').prepend(i);
    }

    public async refuse_rdv_on_edit_add(
        rdv: IPlanRDV,
        get_tasks_by_ids: { [id: number]: IPlanTask },
        get_task_types_by_ids: { [id: number]: IPlanTaskType }
    ): Promise<boolean> {

        try {
            const task: IPlanTask = get_tasks_by_ids[rdv.task_id];
            const task_type: IPlanTaskType = get_task_types_by_ids[task.task_type_id];

            // Si on est sur un task_type qui ordonne les rdvs, on check qu'on les pose dans le bon ordre
            if (task_type.order_tasks_on_same_target) {
                // il faut faire un chargement de tous les RDVs de cette target et de ce task_type_id
                // dans le cas d'un choix auto on interdit de remettre un RDV avant un RDV existant
                const all_rdvs: IPlanRDV[] = await query(this.programplan_shared_module.rdv_type_id)
                    .filter_is_false(field_names<IPlanRDV>().archived)
                    .filter_by_num_eq(field_names<IPlanRDV>().target_id, rdv.target_id)
                    .select_vos<IPlanRDV>();

                let max_weight: number = -1;
                let max_weight_task: IPlanTask = null;
                let nb_maxed_weight: number = 0;

                for (const i in all_rdvs) {
                    const all_rdv = all_rdvs[i];

                    if (all_rdv.id == rdv.id) {
                        continue;
                    }

                    const all_rdv_task = get_tasks_by_ids[all_rdv.task_id];

                    if (!all_rdv_task) {
                        continue;
                    }

                    if (all_rdv_task.task_type_id != task_type.id) {
                        continue;
                    }

                    if (all_rdv.start_time > rdv.start_time) {
                        VueAppBase.instance_.vueInstance.snotify.error(
                            VueAppBase.instance_.vueInstance.label('programplan.fc.create.has_more_recent_task__denied')
                        );

                        return true;
                    }

                    if (all_rdv_task.weight > max_weight) {
                        max_weight = all_rdv_task.weight;
                        max_weight_task = all_rdv_task;
                        nb_maxed_weight = 0;
                    }
                    nb_maxed_weight++;
                }

                // Il nous faut toutes les tâches possible dans ce type par poids
                const task_type_tasks: IPlanTask[] = [];
                for (const j in get_tasks_by_ids) {
                    const task_ = get_tasks_by_ids[j];

                    if (task_.task_type_id == task_type.id) {
                        task_type_tasks.push(task_);
                    }
                }

                WeightHandler.getInstance().sortByWeight(task_type_tasks);

                if ((!task_type_tasks) || (!task_type_tasks.length)) {
                    VueAppBase.instance_.vueInstance.snotify.error(
                        VueAppBase.instance_.vueInstance.label('programplan.fc.create.error')
                    );

                    ConsoleHandler.error("!task_type_tasks.length");

                    return true;
                }

                let new_task: IPlanTask = null;
                if (max_weight < 0) {
                    new_task = task_type_tasks[0];
                } else {

                    if (max_weight_task.limit_on_same_target <= nb_maxed_weight) {
                        new_task = WeightHandler.getInstance().findNextHeavierItemByWeight(task_type_tasks, max_weight);
                    }
                }

                if (!new_task) {
                    VueAppBase.instance_.vueInstance.snotify.error(
                        VueAppBase.instance_.vueInstance.label('programplan.fc.create.no_task_left')
                    );

                    ConsoleHandler.error("!task");

                    return true;
                }

                if (new_task.id != rdv.task_id) {
                    VueAppBase.instance_.vueInstance.snotify.error(
                        VueAppBase.instance_.vueInstance.label('programplan.fc.create.error')
                    );

                    ConsoleHandler.error("task.id != rdv.task_id");

                    return true;
                }
            }
            return false;
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return true;
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

    public component_target_context_query_fiter_hook(): ContextQueryVO {
        return null;
    }
}