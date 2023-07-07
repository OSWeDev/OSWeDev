import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ForkedTasksController from '../../../Fork/ForkedTasksController';
import VarsdatasComputerBGThread from '../VarsdatasComputerBGThread';

export default class VarsComputationHole {

    public static TASK_NAME_exec_in_computation_hole = 'Var.exec_in_computation_hole';

    public static init() {
        ForkedTasksController.register_task(VarsComputationHole.TASK_NAME_exec_in_computation_hole, this.exec_in_computation_hole.bind(this));
    }

    /**
     * Objectif : lancer un comportement dans un trou forcé d'exec des vars
     * Fonction ayant pour but d'être appelée sur le thread de computation des vars
     * On crée un trou - en demandant à tout le monde de se mettre en pause
     * Les cbs sont empilés tant qu'on a des demande qui arrivent
     * Quand le trou est disponible, on dépile les cbs dans l'ordre
     * Et enfin on remet tout le monde en route
     */
    public static async exec_in_computation_hole(cb: () => {}): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsdatasComputerBGThread.getInstance().name,
                VarsComputationHole.TASK_NAME_exec_in_computation_hole,
                resolve,
                cb)) {
                return;
            }

            let wrapped_cb = async () => {
                try {
                    await cb();
                } catch (error) {
                    ConsoleHandler.error('ModuleVarServer:exec_in_computation_hole:wrapped_cb:' + error);
                }
                resolve(true);
            };

            this.current_cbs_stack.push(wrapped_cb);

            await this.wait_for_hole();
        });
    }

    private static current_cbs_stack: Array<() => {}> = [];
    private static currently_waiting_for_hole_semaphore: boolean = false;
    private static currently_in_a_hole_semaphore: boolean = false;

    private static async wait_for_hole() {

        if (this.currently_in_a_hole_semaphore || this.currently_waiting_for_hole_semaphore || !this.current_cbs_stack.length) {
            return;
        }

        this.currently_waiting_for_hole_semaphore = true;

        VarsdatasComputerBGThread.waiting_for_computation_hole = true;

        await this.wait_for_everyone_to_be_ready();

        await this.handle_hole();

        VarsdatasComputerBGThread.waiting_for_computation_hole = false;
    }

    private static async handle_hole() {

        this.currently_waiting_for_hole_semaphore = false;
        this.currently_in_a_hole_semaphore = true;

        // On fait les cbs à la suite, pas en // par ce que si on demande un trou c'est probablement pour être seul sur l'arbre
        while (this.current_cbs_stack.length) {
            let cb = this.current_cbs_stack.shift();
            await cb();
        }

        this.currently_in_a_hole_semaphore = false;
    }

    private static async wait_for_everyone_to_be_ready(): Promise<void> {

        while (true) {

            let all_ready = true;
            for (let i in VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end) {
                if (!VarsdatasComputerBGThread.processes_waiting_for_computation_hole_end[i]) {
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


    protected constructor() { }
}