import EventsController from '../../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { StatThisArrayLength } from '../../../../../shared/modules/Stats/annotations/StatThisArrayLength';
import StatsController from '../../../../../shared/modules/Stats/StatsController';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import ForkedTasksController from '../../../Fork/ForkedTasksController';
import CurrentVarDAGHolder from '../../CurrentVarDAGHolder';
import VarDAGNode from '../../vos/VarDAGNode';
import VarsProcessBase from './VarsProcessBase';

export default class VarsComputationHole {

    public static TASK_NAME_exec_in_computation_hole = 'Var.exec_in_computation_hole';

    public static waiting_for_computation_hole_RELEASED_EVENT_NAME: string = 'VarsComputationHole.waiting_for_computation_hole_RELEASED_EVENT_NAME';

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
    public static events_to_emit_post_hole: { [event_name: string]: boolean } = {};
    public static redo_in_a_hole_semaphore: boolean = false;

    public static ask_for_hole_termination: boolean = false;

    public static last_check_waiting_for_hole_indexes_and_states: { [index: string]: number } = {};

    private static currently_waiting_for_hole_semaphore: boolean = false;
    @StatThisArrayLength("VarsComputationHole")
    private static current_cbs_stack: Array<() => any> = [];

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
    public static async exec_in_computation_hole(cb: () => any): Promise<boolean> {

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
            const asked_for_hole_termination = await VarsComputationHole.wrap_handle_hole();
            if (ConfigurationService.node_configuration.debug_vars_invalidation) {
                ConsoleHandler.log('VarsComputationHole:wait_for_hole:wrap_handle_hole:OUT:' + VarsComputationHole.redo_in_a_hole_semaphore + ':' + VarsComputationHole.current_cbs_stack.length);
            }

            if (VarsComputationHole.redo_in_a_hole_semaphore && VarsComputationHole.current_cbs_stack.length) {

                VarsComputationHole.release_waiting_for_hole();

                if (asked_for_hole_termination) {
                    // On marque une pause plus longue si on a demandé explicitement une pause
                    await ThreadHandler.sleep(1000, 'VarsComputationHole.wait_for_hole.pause_between_holes');
                } else {
                    await ThreadHandler.sleep(10, 'VarsComputationHole.wait_for_hole.pause_between_holes');
                }
            }
        } while (VarsComputationHole.redo_in_a_hole_semaphore && VarsComputationHole.current_cbs_stack.length);
        VarsComputationHole.redo_in_a_hole_semaphore = false;

        VarsComputationHole.release_waiting_for_hole();
    }

    private static release_waiting_for_hole() {

        if (!VarsComputationHole.waiting_for_computation_hole) {
            return;
        }

        VarsComputationHole.waiting_for_computation_hole = false;
        EventsController.emit_event(EventifyEventInstanceVO.new_event(VarsComputationHole.waiting_for_computation_hole_RELEASED_EVENT_NAME));


        /**
         * On ajoute le déclenchement des events à la fin de l'execution du cb
         */
        for (const event_name in VarsComputationHole.events_to_emit_post_hole) {
            EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name));
        }
    }

    private static async wrap_handle_hole(): Promise<boolean> {
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

            return await VarsComputationHole.handle_hole();
        } catch (error) {
            ConsoleHandler.error('VarsComputationHole:wrap_handle_hole:' + error);
        }

        return true;
    }

    private static async handle_hole(): Promise<boolean> {

        VarsComputationHole.currently_in_a_hole_semaphore = true;
        VarsComputationHole.currently_waiting_for_hole_semaphore = false;

        VarsComputationHole.ask_for_hole_termination = false;

        let asked_for_hole_termination = false;

        // On fait les cbs à la suite, pas en // par ce que si on demande un trou c'est probablement pour être seul sur l'arbre
        while (VarsComputationHole.current_cbs_stack.length) {
            const cb = VarsComputationHole.current_cbs_stack.shift();
            await cb();

            if (VarsComputationHole.ask_for_hole_termination) {
                asked_for_hole_termination = true;
                break;
            }
        }
        VarsComputationHole.ask_for_hole_termination = false;

        VarsComputationHole.currently_in_a_hole_semaphore = false;

        return asked_for_hole_termination;
    }

    private static async wait_for_everyone_to_be_ready(): Promise<void> {

        const real_start_date = Dates.now();
        let first_timeout = true;

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
            const nb_secs = Math.floor(Dates.now() - real_start_date);
            if (Math.floor(Dates.now() - start_date) > 10) {
                ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT: ' + nb_secs + 's');

                // Si on est sur la première attente, on rempli juste la map de last_check_waiting_for_hole_indexes_and_states et sinon on peut checker si la liste est identique
                let reinsert_all = !first_timeout; // si first_timeout, on réinsère personne, sinon on check l'arbre pour savoir et par défaut si tout est identique on réinsère tout le monde
                if (!first_timeout) {

                    if (CurrentVarDAGHolder.current_vardag.nb_nodes != Object.keys(VarsComputationHole.last_check_waiting_for_hole_indexes_and_states).length) {
                        reinsert_all = false;
                    } else {
                        for (const i in CurrentVarDAGHolder.current_vardag.nodes) {
                            const node = CurrentVarDAGHolder.current_vardag.nodes[i];
                            if (VarsComputationHole.last_check_waiting_for_hole_indexes_and_states[node.var_data.index] != node.current_step) {
                                // Ya une évolution dans l'arbre, on attend encore
                                reinsert_all = false;
                                break;
                            }
                        }
                    }
                }
                first_timeout = false;

                // C'est ptetre pas l'idée du siècle de réinsérer des noeuds, par ce que si on arrive pas à finir dans les temps, on se rajoute de la charge potentiellement.... typiquement l'insert en base qui prenait 11 secs => réinsert...
                // et en même temps 11 secs c'est juste trop
                if (reinsert_all) {
                    StatsController.register_stat_COMPTEUR('VarsComputationHole', 'wait_for_everyone_to_be_ready', 'reinsert_all');
                    ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:reinsert_all');
                    const promises = [];
                    for (const i in CurrentVarDAGHolder.current_vardag.nodes) {
                        const node = CurrentVarDAGHolder.current_vardag.nodes[i];
                        node.unlinkFromDAG(true);
                        promises.push(VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, node.var_data, false));

                        if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                            ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:reinsert_all:node:' + node.var_data.index + ':' + Object.keys(node.tags).join(','));
                        }

                    }
                    await all_promises(promises);

                    first_timeout = true;
                    VarsComputationHole.last_check_waiting_for_hole_indexes_and_states = {};
                    start_date = Dates.now();
                    continue;
                }

                // On commence par mettre à jour la liste des états
                VarsComputationHole.last_check_waiting_for_hole_indexes_and_states = {};
                for (const i in CurrentVarDAGHolder.current_vardag.nodes) {
                    const node = CurrentVarDAGHolder.current_vardag.nodes[i];
                    VarsComputationHole.last_check_waiting_for_hole_indexes_and_states[node.var_data.index] = node.current_step;
                }

                start_date = Dates.now();
                const nodes_to_reinsert: VarDAGNode[] = [];
                const event_to_call: { [event_name: string]: boolean } = {};
                for (const i in CurrentVarDAGHolder.current_vardag.nodes) {
                    const node = CurrentVarDAGHolder.current_vardag.nodes[i];

                    // Si le noeud n'a pas d'état en cours, on doit indiquer une grosse erreur, et tenter de le réinsérer
                    const tags = Object.keys(node.tags).join(',');
                    if (!tags || !tags.length) {
                        ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:node:' + node.var_data.index + ':no_state:reinsert');
                        nodes_to_reinsert.push(node);
                    }

                    // On tente aussi de relancer un event en fonction de l'état du noeud des fois que le système soit bloqué à ce niveau
                    for (const event_name in node.tags) {
                        const work_event_name = VarsProcessBase.registered_processes_work_event_name_by_tag_in[event_name];
                        if (!work_event_name) {
                            continue;
                        }

                        event_to_call[work_event_name] = true;
                    }

                    if (ConfigurationService.node_configuration.debug_vars_current_tree) {
                        ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:node:' + node.var_data.index + ':' + tags);
                    }
                }

                const promises = [];
                for (const i in nodes_to_reinsert) {
                    const node: VarDAGNode = nodes_to_reinsert[i];
                    node.unlinkFromDAG(true);

                    ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:node:' + node.var_data.index + ':reinsert');
                    promises.push(VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, node.var_data, false));
                }
                await all_promises(promises);

                for (const event_name in event_to_call) {
                    ConsoleHandler.error('VarsComputationHole:wait_for_everyone_to_be_ready:TIMEOUT:FORCING EVENT:' + event_name);

                    /**
                     * On log les listeners de l'event d'abord pour voir dans quel état on est
                     */
                    for (const i in EventsController.registered_listeners[event_name]) {
                        const listener = EventsController.registered_listeners[event_name][i];

                        listener.log();
                    }

                    EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name));
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