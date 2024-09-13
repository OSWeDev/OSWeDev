import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import ForkedTasksController from '../../../Fork/ForkedTasksController';
import CurrentVarDAGHolder from '../../CurrentVarDAGHolder';

export default class VarsComputationHole {

    public static TASK_NAME_exec_in_computation_hole = 'Var.exec_in_computation_hole';

    /**
     * Quand on veut invalider, le process d'invalidation doit indiquer qu'il attend un espace pour invalider (waiting_for_invalidation = true),
     *  les autres process doivent indiquer qu'ils sont prêt pour l'invalidation dès que possible (processes_waiting_for_invalidation_end[process_name] = true) et
     *  attendre la fin de l'invalidation. Le process d'invalidation doit indiquer qu'il a fini l'invalidation (waiting_for_invalidation = false).
     *  Enfin les autres process doivent indiquer qu'ils ne sont plus en attente de l'invalidation (processes_waiting_for_invalidation_end[process_name] = false)
     *  et reprendre leur travail.
    */
    public static waiting_for_computation_hole: boolean = false;
    // public static processes_waiting_for_computation_hole_end: { [process_name: string]: boolean } = {};
    public static currently_in_a_hole_semaphore: boolean = false;
    public static redo_in_a_hole_semaphore: boolean = false;

    public static ask_for_hole_termination: boolean = false;

    private static current_cbs_stack: Array<() => {}> = [];
    private static currently_waiting_for_hole_semaphore: boolean = false;

    protected constructor() { }

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsComputationHole.TASK_NAME_exec_in_computation_hole, VarsComputationHole.exec_in_computation_hole.bind(VarsComputationHole));
    }

    /**
     * Objectif : lancer un comportement dans un trou forcé d'exec des vars
     * Fonction ayant pour but d'être appelée sur le thread de computation des vars
     * On crée un trou - en demandant à tout le monde de se mettre en pause
     * Les cbs sont empilés tant qu'on a des demande qui arrivent
     * Quand le trou est disponible, on dépile les cbs dans l'ordre
     * Et enfin on remet tout le monde en route
     * ATTENTION : Ne doit être appelé que sur le thread de computation des vars
     */
    public static async exec_in_computation_hole(cb: () => {}): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            const wrapped_cb = async () => {
                try {
                    await cb();
                } catch (error) {
                    ConsoleHandler.error('ModuleVarServer:exec_in_computation_hole:wrapped_cb:' + error);
                }
                resolve(true);
            };

            VarsComputationHole.current_cbs_stack.push(wrapped_cb);

            await VarsComputationHole.wait_for_hole();
        });
    }

    private static async wait_for_hole() {

        if (VarsComputationHole.currently_in_a_hole_semaphore || VarsComputationHole.currently_waiting_for_hole_semaphore || !VarsComputationHole.current_cbs_stack.length) {
            VarsComputationHole.redo_in_a_hole_semaphore = true;
            return;
        }

        VarsComputationHole.currently_waiting_for_hole_semaphore = true;

        do {
            VarsComputationHole.waiting_for_computation_hole = true;

            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsComputationHole:wait_for_hole:wrap_handle_hole:IN');
            }
            VarsComputationHole.redo_in_a_hole_semaphore = false;
            await VarsComputationHole.wrap_handle_hole();
            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsComputationHole:wait_for_hole:wrap_handle_hole:OUT:' + VarsComputationHole.redo_in_a_hole_semaphore + ':' + VarsComputationHole.current_cbs_stack.length);
            }

            if (VarsComputationHole.redo_in_a_hole_semaphore && VarsComputationHole.current_cbs_stack.length) {

                VarsComputationHole.waiting_for_computation_hole = false;
                await ThreadHandler.sleep(100, 'VarsComputationHole.wait_for_hole.pause_between_holes');
            }
        } while (VarsComputationHole.redo_in_a_hole_semaphore && VarsComputationHole.current_cbs_stack.length);
        VarsComputationHole.redo_in_a_hole_semaphore = false;

        VarsComputationHole.waiting_for_computation_hole = false;
    }

    private static async wrap_handle_hole() {
        try {

            try {
                if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                    ConsoleHandler.log('VarsComputationHole:wrap_handle_hole:wait_for_everyone_to_be_ready:IN');
                }
                await VarsComputationHole.wait_for_everyone_to_be_ready();
                if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                    ConsoleHandler.log('VarsComputationHole:wrap_handle_hole:wait_for_everyone_to_be_ready:OUT');
                }
            } catch (error) {
                ConsoleHandler.error('VarsComputationHole:wrap_handle_hole:wait_for_everyone_to_be_ready:' + error);
            }
            await VarsComputationHole.handle_hole();

            // await VarsComputationHole.free_everyone();
        } catch (error) {
            ConsoleHandler.error('VarsComputationHole:wrap_handle_hole:' + error);
        }
    }

    private static async handle_hole() {

        VarsComputationHole.currently_in_a_hole_semaphore = true;
        VarsComputationHole.currently_waiting_for_hole_semaphore = false;

        VarsComputationHole.ask_for_hole_termination = false;

        // On fait les cbs à la suite, pas en // par ce que si on demande un trou c'est probablement pour être seul sur l'arbre
        while (VarsComputationHole.current_cbs_stack.length) {
            const cb = VarsComputationHole.current_cbs_stack.shift();
            await cb();

            if (VarsComputationHole.ask_for_hole_termination) {
                break;
            }
        }
        VarsComputationHole.ask_for_hole_termination = false;

        VarsComputationHole.currently_in_a_hole_semaphore = false;
    }

    private static async wait_for_everyone_to_be_ready(): Promise<void> {

        let start_date = Dates.now();
        // while (true) {
        while (CurrentVarDAGHolder.current_vardag && CurrentVarDAGHolder.current_vardag.nodes && CurrentVarDAGHolder.current_vardag.nb_nodes) {

            // let all_ready = true;
            // for (const i in VarsComputationHole.processes_waiting_for_computation_hole_end) {
            //     if (!VarsComputationHole.processes_waiting_for_computation_hole_end[i]) {
            //         all_ready = false;
            //         break;
            //     }
            // }

            // if (all_ready) {
            //     break;
            // }

            await ThreadHandler.sleep(2, 'VarsComputationHole:wait_for_everyone_to_be_ready');

            if (Dates.now() - start_date > 60) {
                ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT');
                start_date = Dates.now();
                for (const i in CurrentVarDAGHolder.current_vardag.nodes) {
                    const node = CurrentVarDAGHolder.current_vardag.nodes[i];

                    ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:node:' + node.var_data.index + ':' + Object.keys(node.tags).join(','));
                }
            }
        }
    }

    // private static async free_everyone(): Promise<void> {

    //     for (const i in VarsComputationHole.processes_waiting_for_computation_hole_end) {
    //         VarsComputationHole.processes_waiting_for_computation_hole_end[i] = false;
    //     }
    // }
}