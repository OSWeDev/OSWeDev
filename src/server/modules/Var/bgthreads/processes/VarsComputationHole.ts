import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ForkedTasksController from '../../../Fork/ForkedTasksController';

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
    public static processes_waiting_for_computation_hole_end: { [process_name: string]: boolean } = {};

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

            let wrapped_cb = async () => {
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

    private static current_cbs_stack: Array<() => {}> = [];
    private static currently_waiting_for_hole_semaphore: boolean = false;
    private static currently_in_a_hole_semaphore: boolean = false;

    private static async wait_for_hole() {

        if (VarsComputationHole.currently_in_a_hole_semaphore || VarsComputationHole.currently_waiting_for_hole_semaphore || !VarsComputationHole.current_cbs_stack.length) {
            return;
        }

        VarsComputationHole.currently_waiting_for_hole_semaphore = true;

        VarsComputationHole.waiting_for_computation_hole = true;

        await VarsComputationHole.wait_for_everyone_to_be_ready();

        await VarsComputationHole.handle_hole();

        await VarsComputationHole.free_everyone();

        VarsComputationHole.waiting_for_computation_hole = false;
    }

    private static async handle_hole() {

        VarsComputationHole.currently_waiting_for_hole_semaphore = false;
        VarsComputationHole.currently_in_a_hole_semaphore = true;

        // On fait les cbs à la suite, pas en // par ce que si on demande un trou c'est probablement pour être seul sur l'arbre
        while (VarsComputationHole.current_cbs_stack.length) {
            let cb = VarsComputationHole.current_cbs_stack.shift();
            await cb();
        }

        VarsComputationHole.currently_in_a_hole_semaphore = false;
    }

    private static async wait_for_everyone_to_be_ready(): Promise<void> {

        while (true) {

            let all_ready = true;
            for (let i in VarsComputationHole.processes_waiting_for_computation_hole_end) {
                if (!VarsComputationHole.processes_waiting_for_computation_hole_end[i]) {
                    all_ready = false;
                    break;
                }
            }

            if (all_ready) {
                break;
            }

            await ThreadHandler.sleep(2, 'VarsComputationHole:wait_for_everyone_to_be_ready');
        }
    }

    private static async free_everyone(): Promise<void> {

        for (let i in VarsComputationHole.processes_waiting_for_computation_hole_end) {
            VarsComputationHole.processes_waiting_for_computation_hole_end[i] = false;
        }
    }

    protected constructor() { }
}