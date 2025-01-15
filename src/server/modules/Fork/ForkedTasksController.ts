import { isMainThread, parentPort, threadId } from 'worker_threads';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import BGThreadServerDataManager from '../BGThread/BGThreadServerDataManager';
import BGThreadNotAliveError from './errors/BGThreadNotAliveError';
import ForkMessageController from './ForkMessageController';
import ForkServerController from './ForkServerController';
import BGThreadProcessTaskForkMessage from './messages/BGThreadProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import MainProcessForwardToBGThreadForkMessage from './messages/MainProcessForwardToBGThreadForkMessage';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import RegisteredForkedTasksController from './RegisteredForkedTasksController';
import ForkMessageCallbackWrapper from './vos/ForkMessageCallbackWrapper';

/**
 * ForkedTasksController
 *
 * - How to create a real sub-procress (multi-threads) using NodeJS
 * https://www.digitalocean.com/community/tutorials/how-to-use-multithreading-in-node-js#offloading-a-cpu-bound-task-with-the-worker-threads-module
 */
export default class ForkedTasksController {

    /**
     * Local thread cache -----
     */
    public static registered_task_result_wrappers: { [result_task_uid: number]: ForkMessageCallbackWrapper } = {};

    public static broadexec_with_valid_promise_for_await_TASK_UID: string = 'ForkedTasksController.broadexec_with_valid_promise_for_await';

    private static result_task_prefix_thread_uid: number = process.pid;
    private static result_task_uid: number = 1;

    public static init() {
        ThreadHandler.set_interval(
            'ForkedTasksController.handle_fork_message_callback_timeout',
            ForkedTasksController.handle_fork_message_callback_timeout.bind(this),
            10000,
            'ForkedTasksController.handle_fork_message_callback_timeout',
            true,
        );
    }

    /**
     * Objectif : Exécuter la fonction sur tous les threads, et le plus vite possible (et en synchrone) en local
     *  donc on envoie un message pour tous les autres threads, mais on indique bien que nous c'est fait
     * TODO FIXME est_il utile d'avoir une version qui await pas vraiment l'exécution de la tache sur les autres threads avant de resolve ?
     *  @see broadexec_with_valid_promise_for_await
     * @param task_uid
     * @param task_params
     */
    public static async broadexec(task_uid: string, ...task_params): Promise<boolean> {
        if (!isMainThread) {
            // ForkMessageController.send(new BroadcastWrapperForkMessage(new MainProcessTaskForkMessage(task_uid, task_params)).except_self());

            // Si on est pas sur le thread parent, on doit d'abord le lancer en local, puis envoyer aux autres threads
            await RegisteredForkedTasksController.registered_tasks[task_uid](...task_params);
            await ForkMessageController.send(new BroadcastWrapperForkMessage(
                new MainProcessTaskForkMessage(
                    task_uid,
                    task_params,
                    StackContext.get_active_context(),
                    threadId,
                )).except_self(), parentPort);

            return true;
        } else {

            // Si on est sur le thread parent, le broadcast s'occupe de lancer la tache en local aussi
            return ForkMessageController.broadcast(new MainProcessTaskForkMessage(
                task_uid,
                task_params,
                StackContext.get_active_context(),
                threadId,
            ));
        }
    }

    /**
     * Objectif : Exécuter la fonction sur tous les threads, et le plus vite possible (et en synchrone) en local
     *  donc on envoie un message pour tous les autres threads, mais on indique bien que nous c'est fait
     * @param task_uid
     * @param task_params
     */
    public static async broadexec_with_valid_promise_for_await(task_uid: string, ...task_params): Promise<void> {

        return new Promise(async (resolve, reject) => {
            try {

                if (!isMainThread) {

                    return await ForkedTasksController.exec_self_on_main_process_and_return_value(
                        reject,
                        ForkedTasksController.broadexec_with_valid_promise_for_await_TASK_UID,
                        resolve,
                        [task_uid, ...task_params]);
                } else {

                    const promises = [];
                    const done_bgt_uid: { [uid: number]: boolean } = {};
                    const forks = ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType];

                    for (const fork_name in forks) {

                        const fork = forks[fork_name];

                        if (!fork) {
                            continue;
                        }

                        if (done_bgt_uid[fork.uid]) {
                            continue;
                        }
                        done_bgt_uid[fork.uid] = true;

                        if (!fork.worker) {
                            continue;
                        }

                        promises.push(new Promise(async (res, rej) => {

                            await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                                false,
                                rej,
                                fork_name,
                                task_uid,
                                res,
                                ...task_params
                            );
                        }));
                    }
                    promises.push(RegisteredForkedTasksController.registered_tasks[task_uid](...task_params));

                    await Promise.all(promises);

                    resolve();
                }
            } catch (error) {
                ConsoleHandler.error('broadexec_with_valid_promise_for_await error: ' + error);
                reject(error);
            }
        });
    }

    /**
     * Objectif : Exécuter la fonction sur le thread principal et récupérer la valeur de retour.
     *  On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * @param task_uid
     * @param task_params
     * @param resolver fonction resolve issue de la promise de la fonction que l'on souhaite exécuter côté main process
     */
    public static async exec_self_on_main_process_and_return_value(thrower, task_uid: string, resolver, ...task_params): Promise<boolean> {
        if (!isMainThread) {

            const result_task_uid = ForkedTasksController.get_result_task_uid();
            ForkedTasksController.registered_task_result_wrappers[result_task_uid] = new ForkMessageCallbackWrapper(
                resolver,
                thrower,
                task_uid,
                task_params,
            );

            // On doit envoyer la demande d'éxécution ET un ID de callback pour récupérer le résultat
            if (!await ForkMessageController.send(
                new MainProcessTaskForkMessage(
                    task_uid,
                    task_params,
                    StackContext.get_active_context(),
                    threadId,
                    result_task_uid,
                ), parentPort)) {

                delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                ConsoleHandler.error('exec_self_on_bgthread_and_return_value:Un message n\'a pas pu être envoyé:' + task_uid + ':');
                thrower("Failed to send message to exec_self_on_main_process_and_return_value :" + task_uid + ':' + JSON.stringify(task_params));
            }
            return false;
        }
        return true;
    }

    /**
     * Objectif : Exécuter la fonction sur le thread principal. On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * DELETE ME Post suppression StackContext: Does not need StackContext
     * @param task_uid
     * @param task_params
     */
    public static async exec_self_on_main_process(task_uid: string, ...task_params): Promise<boolean> {
        if (!isMainThread) {
            await ForkMessageController.send(new MainProcessTaskForkMessage(
                task_uid,
                task_params,
                StackContext.get_active_context(),
                threadId,
            ), parentPort);
            return false;
        }
        return true;
    }

    /**
     * Objectif : Exécuter la fonction sur un thread particulier. On envoie la demande à tous au besoin, sinon on exécute directement
     * @param bgthread le nom de la tache de type bgthread, dont on va chercher le thread actuel
     * @param task_uid
     * @param task_params
     */
    public static async exec_self_on_bgthread(bgthread: string, task_uid: string, ...task_params): Promise<boolean> {
        if (!BGThreadServerDataManager.valid_bgthreads_names[bgthread]) {
            const bg_thread_process_task_fork_message = new BGThreadProcessTaskForkMessage(
                bgthread,
                task_uid,
                task_params,
                StackContext.get_active_context(),
                threadId,
            );

            await ForkMessageController.broadcast(
                bg_thread_process_task_fork_message
            );

            return false;
        }
        return true;
    }

    /**
     * Objectif : Exécuter une tâche sur le bgthread et récupérer la valeur de retour.
     *  Dans tous les cas on exécute la tâche directement depuis son nom de tâche et non en revoyant qu'on est sur le bon thread (exemple de exec_self_on_bgthread_and_return_value)
     *  Usage différent donc qui ne doit pas être mis en début de fonction A pour changer de thread au besoin, mais qui est utilisé pour exécuter une tâche B sur un thread particulier,
     *  await le résultat et continuer la fonction actuelle A sur le thread où l'on se trouve depuis le début et dont on ne bouge pas pour cette fonction
     *  On génère une Promise pour wrap l'appel à la fonction exec_self_on_bgthread_and_return_value et simplifier l'utilisation
     * @param task_uid
     * @param task_params
     */
    public static async exec_task_on_bgthread_and_return_value<T>(defaults_to_this_thread: boolean, bgthread: string, task_uid: string, ...task_params): Promise<T> {

        // Si on est sur le bon thread, on exécute
        if (BGThreadServerDataManager.valid_bgthreads_names[bgthread]) {
            // Exécuter la tâche ici
            return RegisteredForkedTasksController.registered_tasks[task_uid](...task_params) as T;
        }

        // Exécuter la tâche sur le bgthread
        return new Promise(async (resolve, reject) => {
            const rejection_wrapper = (error) => {
                ConsoleHandler.error('exec_task_on_bgthread_and_return_value error: ' + error);
                switch (error._type) {
                    case BGThreadNotAliveError.ERROR_TYPE:

                        if (defaults_to_this_thread) {
                            // Si le BG thread est pas dispo pour le moment, on fait sur le thread actuel, exécuter la tâche ici
                            resolve(RegisteredForkedTasksController.registered_tasks[task_uid](...task_params) as T);
                            break;
                        }
                        reject(error);
                        break;

                    default:
                        reject(error);
                        break;
                }
            };

            try {
                if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(defaults_to_this_thread, rejection_wrapper, bgthread, task_uid, resolve, ...task_params)) {
                    return;
                }

                if (defaults_to_this_thread) {
                    // Exécuter la tâche ici
                    return resolve(RegisteredForkedTasksController.registered_tasks[task_uid](...task_params) as T);
                } else {
                    reject('exec_task_on_bgthread_and_return_value: Should not be called on child process. See exec_async_task_on_main_process.');
                }

            } catch (error) {
                ConsoleHandler.error('exec_task_on_bgthread_and_return_value error: ' + error);
                reject(error);
            }
        });
    }

    /**
     * Objectif : Exécuter la fonction sur le bgthread et récupérer la valeur de retour.
     *  On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * @param thrower
     * @param task_uid
     * @param task_params
     * @param resolver fonction resolve issue de la promise de la fonction que l'on souhaite exécuter côté main process
     */
    public static async exec_self_on_bgthread_and_return_value(defaults_to_this_thread: boolean, thrower, bgthread: string, task_uid: string, resolver, ...task_params): Promise<boolean> {
        if (!BGThreadServerDataManager.valid_bgthreads_names[bgthread]) {

            const result_task_uid = ForkedTasksController.get_result_task_uid();
            ForkedTasksController.registered_task_result_wrappers[result_task_uid] = new ForkMessageCallbackWrapper(
                resolver,
                thrower,
                task_uid,
                task_params,
            );

            // Si on est sur le thread principal, on doit checker qu'on peut envoyer le message au bgthread (donc qu'il a démarré) et le faire,
            //  sinon on throw directement
            if (isMainThread) {

                if ((!ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType]) ||
                    (!ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread])) {

                    // Sauf si on peut defaults_to_this_thread
                    if (defaults_to_this_thread) {
                        return true;
                    }

                    delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                    ConsoleHandler.error("Unable to find target for this message :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
                    thrower("Unable to find target for this message :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
                    return false;
                }

                let fork = ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread];

                if (!ForkServerController.forks_alive[fork.uid]) {

                    delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                    // cas du message qui ne part pas par ce que le bgthread est pas alive : si on est en defaults_to_this_thread, on fait sur le thread actuel
                    if (defaults_to_this_thread &&
                        ((!ForkServerController.forks_alive[fork.uid]) || (ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread] != fork))
                    ) {
                        return true;
                    }

                    ConsoleHandler.warn("Target not ALIVE for this message :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
                    thrower(new BGThreadNotAliveError("Target not ALIVE for this message :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params), bgthread));
                    return false;
                }

                if (!await ForkMessageController.send(
                    new BGThreadProcessTaskForkMessage(
                        bgthread,
                        task_uid,
                        task_params,
                        StackContext.get_active_context(),
                        threadId,
                        result_task_uid,
                    ),
                    fork.worker,
                    fork)) {

                    ConsoleHandler.error('exec_self_on_bgthread_and_return_value:Un message n\'a pas pu être envoyé :' + task_uid + ':');

                    if ((!ForkServerController.forks_alive[fork.uid]) || (ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread] != fork)) {
                        ConsoleHandler.error('exec_self_on_bgthread_and_return_value:Un message n\'a pas pu être envoyé, fork not alive ou fork changed :' + task_uid + ':' + bgthread + ': Waiting 90 seconds before retrying');
                        await ThreadHandler.sleep(90000, 'exec_self_on_bgthread_and_return_value:Un message n\'a pas pu être envoyé, fork not alive ou fork changed');

                        fork = ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread];

                        if (!ForkServerController.forks_alive[fork.uid]) {
                            delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                            ConsoleHandler.error("POST RETRY: Target not ALIVE for this message :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
                            thrower(new BGThreadNotAliveError("POST RETRY: Target not ALIVE for this message :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params), bgthread));
                            return false;
                        }

                        if (!await ForkMessageController.send(
                            new BGThreadProcessTaskForkMessage(
                                bgthread,
                                task_uid,
                                task_params,
                                StackContext.get_active_context(),
                                threadId,
                                result_task_uid,
                            ),
                            fork.worker,
                            fork)) {
                            ConsoleHandler.error('POST RETRY: exec_self_on_bgthread_and_return_value:Un message n\'a pas pu être envoyé :' + task_uid + ':');
                            delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                            thrower("POST RETRY: Failed to send message to bgthread :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
                        }
                    } else {
                        delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                        thrower("Failed to send message to bgthread :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
                    }
                }

                return false;
            }

            // Si on est sur un bgthread (et donc pas le bon à ce stade) on envoie une demande au thread principal d'envoie de message au bgthread
            // On doit envoyer la demande d'éxécution ET un ID de callback pour récupérer le résultat
            if (!await ForkMessageController.send(
                new MainProcessForwardToBGThreadForkMessage(
                    bgthread,
                    task_uid,
                    task_params,
                    StackContext.get_active_context(),
                    result_task_uid,
                ),
                parentPort)) {
                delete ForkedTasksController.registered_task_result_wrappers[result_task_uid];
                ConsoleHandler.error('exec_self_on_bgthread_and_return_value:2:Un message n\'a pas pu être envoyé :' + task_uid + ':');
                thrower("Failed to send message to main thread :" + bgthread + ':' + task_uid + ':' + JSON.stringify(task_params));
            }
            return false;
        }
        return true;
    }

    public static assert_is_main_process() {
        if (!isMainThread) {
            throw new Error('Should not be called on child process. See exec_async_task_on_main_process.');
        }
    }

    public static get_result_task_uid(): string {
        return ForkedTasksController.result_task_prefix_thread_uid + '_' + (ForkedTasksController.result_task_uid++);
    }

    /**
     * @deprecated use RegisteredForkedTasksController.register_task instead
     * @param task_uid
     * @param handler
     */
    public static register_task(task_uid: string, handler: (...task_params) => any) {
        RegisteredForkedTasksController.registered_tasks[task_uid] = handler;
    }

    /**
     * ----- Local thread cache
     */

    // /**
    //  * Méthode qui permet d'encapsuler l'appel à une méthode pour la réaliser sur le process main
    //  * ATTENTION on attend aucun retour, et on attend pas l'exécution donc on est en asynchrone pur sur ces taches
    //  * @param task_uid Identifiant pour cette fonction, unique parmi les tasks qui passent par des messages
    //  * @param task_handler La méthode cible si on est sur le bon process
    //  * @param task_params Les paramères à appliquer
    //  */
    // public static exec_async_task_on_main_process(task_uid: string, ...task_params) {
    //     if (isMainThread) {
    //         RegisteredForkedTasksController.registered_tasks[task_uid](...task_params);
    //         return;
    //     }

    //     ForkMessageController.send(new MainProcessTaskForkMessage(task_uid, task_params));
    // }

    /**
     * Méthode qui gère de nettoyer les appels en attente d'autres threads en fonction du timeout
     * assigné à chaque demande
     */
    private static handle_fork_message_callback_timeout() {

        const to_delete = [];

        let nb_waiting = 0;
        let time_waiting = 0;
        let max_time_waiting = 0;
        const now = Dates.now();

        for (const i in ForkedTasksController.registered_task_result_wrappers) {
            const wrapper = ForkedTasksController.registered_task_result_wrappers[i];

            if ((wrapper.creation_time + wrapper.timeout) < now) {
                to_delete.push(i);
            }

            if (ConfigurationService.node_configuration.debug_waiting_registered_task_result_wrappers) {
                if ((wrapper.creation_time + ConfigurationService.node_configuration.debug_waiting_registered_task_result_wrappers_threshold) < now) {
                    nb_waiting++;
                    time_waiting += (now - wrapper.creation_time);

                    max_time_waiting = Math.max(max_time_waiting, (now - wrapper.creation_time));

                    if (ConfigurationService.node_configuration.debug_waiting_registered_task_result_wrappers_verbose_result_task_uid) {
                        ConsoleHandler.warn('Waiting for task result:' + wrapper.task_uid + ' for ' + (now - wrapper.creation_time) + ' s');
                        continue;
                    }
                }
            }
        }

        if (ConfigurationService.node_configuration.debug_waiting_registered_task_result_wrappers) {
            if (nb_waiting > 0) {
                ConsoleHandler.warn('Waiting for task result:' + nb_waiting + ' for ' + Math.round(time_waiting / nb_waiting) + ' s on average - ' + max_time_waiting + ' s max');
            }
        }

        for (const i in to_delete) {
            const callback_id = to_delete[i];
            const wrapper = ForkedTasksController.registered_task_result_wrappers[callback_id];
            const thrower = wrapper.thrower;
            thrower('MSG has timedout:' + wrapper.timeout + ' secs');
            delete ForkedTasksController.registered_task_result_wrappers[callback_id];
        }
    }
}