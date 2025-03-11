import EventsController from "../../../../shared/modules/Eventify/EventsController";
import ModulesManager from "../../../../shared/modules/ModulesManager";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import ConfigurationService from "../../../env/ConfigurationService";
import BGThreadNotAliveError from "../../Fork/errors/BGThreadNotAliveError";
import RegisteredForkedTasksController from "../../Fork/RegisteredForkedTasksController";
import BGThreadLoadBalancerServerController from "../BGThreadLoadBalancerServerController";
import BGThreadServerDataManager from "../BGThreadServerDataManager";
import LoadBalancedBGThreadBase from "../LoadBalancedBGThreadBase";
import BGThreadLoadBalancer from "../vos/BGThreadLoadBalancer";

export const EVENT_NAME_ForkServerController_ready: string = 'BGThreadServerController.ForkServerController_ready';

export default class RunsOnBgThreadDataController {
    public static exec_self_on_bgthread_and_return_value_method: (
        defaults_to_this_thread: boolean,
        thrower: any,
        task_uid: string,
        resolver: any,
        ...task_params: any[]) => Promise<boolean> = null;
}

// On stocke l'info des workers pour lesquels des taches sont en attente, de manière à cibler en premier lieu idéalement ceux qui sont libres
let workers_busy: { [worker_name: string]: number } = {};

// On se fait un stock des promesses qui attendent le retour du ping quand tous les workers sont utilisés sur un loadbalancer
let waiting_for_ping_promises: { [worker_name: string]: Promise<any> } = {};

type AsyncMethod = (...args: any[]) => Promise<any>;
/**
 * ATTENTION : la méthode décorée est obligatoirement async !
 * Decorator indicating and handling that the method should be executed on a bgthread
 * Optimized : if the method is called from the right thread, it will be executed directly and the annotation will be removed so that the method is executed directly next time
 */
export function RunsOnBgThread(bgthread: string, instanceGetter: () => any, defaults_to_this_thread: boolean = false) {
    return function <T extends AsyncMethod>(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor): TypedPropertyDescriptor<T> {

        if (ModulesManager.isGenerator) {
            // Sur le générateur on n'a qu'un seul thread dans tous les cas
            return descriptor;
        }

        const originalMethod = descriptor.value;

        // Vérification runtime : si la fonction n’est pas async, on bloque => valide uniquement côté serveur
        if (ModulesManager.isServerSide && originalMethod.constructor.name !== 'AsyncFunction') {
            throw new Error(
                `La méthode "${propertyKey}" doit impérativement être déclarée "async".`
            );
        }

        //TODO register the method as a task on the main thread, with a UID based on the method name and the class name
        const task_UID = target.constructor.name + '.' + propertyKey;

        EventsController.on_next_event(EVENT_NAME_ForkServerController_ready, () => {
            if (BGThreadServerDataManager.valid_bgthreads_names[bgthread]) { // on the bg right bgthread
                RegisteredForkedTasksController.register_task(task_UID,
                    instanceGetter ? (...args: any[]) => {
                        /**
                         * On utilise une méthode intermédiaire pour binder le this une fois l'instance dispo, ce qui n'est pas le cas lors de l'application de l'annotation sur le prototype
                         *  et on en profite pour modifier le register_task pour qu'il prenne la méthode bindée à l'avenir
                         */
                        const boundMethod = originalMethod.bind(instanceGetter());
                        RegisteredForkedTasksController.register_task(task_UID, boundMethod);
                        return boundMethod.apply(instanceGetter(), args);
                    } : originalMethod.bind(target));
            }
        });

        descriptor.value = async function (...args: any[]) { // Attention si on déclare la fonction avec la flèche on perd le this
            if (!BGThreadServerDataManager.valid_bgthreads_names[bgthread]) { // not on the right bgthread

                // Execute the method on the right process
                return new Promise(async (resolve, reject) => {
                    try {

                        if (!RunsOnBgThreadDataController.exec_self_on_bgthread_and_return_value_method) {
                            // On ne peut pas renvoyer sur un bgthread si on n'en a pas
                            // Exécuter la tâche ici
                            return resolve(await originalMethod.apply(this, args));
                        }

                        /**
                         * On gère les bgthreads loadbalancés, en sélectionnant ici le bon worker
                         */

                        // Si on cible déjà un bgthread loadbalancé - donc on trouve LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX -, inutile de chercher un worker il est déjà défini
                        let bgthread_name = bgthread;
                        let is_load_balancing = false;
                        if (bgthread_name.indexOf(LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX) < 0) {

                            const load_balancer: BGThreadLoadBalancer = BGThreadLoadBalancerServerController.loadbalancers_by_bg_thread_name[bgthread];
                            if (load_balancer) {

                                is_load_balancing = true;

                                bgthread_name = bgthread + LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX + load_balancer.current_worker_index;
                                const first_bgthread_name = bgthread_name;

                                // On commence par essayer de définir un bgthread qui n'est pas occupé
                                let tries = 0;
                                while ((tries < load_balancer.nb_workers) && (!!workers_busy[bgthread_name])) {

                                    if (ConfigurationService.node_configuration.load_balancing_debug_log) {
                                        ConsoleHandler.log('LoadBalancing function call task_UID "' + task_UID + '" - worker "' + bgthread_name + '" is busy, trying next');
                                    }

                                    load_balancer.current_worker_index++;
                                    if (load_balancer.current_worker_index >= load_balancer.nb_workers) {
                                        load_balancer.current_worker_index = 0;
                                    }

                                    bgthread_name = bgthread + LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX + load_balancer.current_worker_index;

                                    tries++;
                                }

                                /**
                                 * Si on est revenu sur le premier, on change de mode de décision, et on fait une race sur un ping qu'on demande aux workers
                                 * Le premier qui répond est celui auquel on envoie la tâche.
                                 * On stocke les promises pour tous les workers dans waiting_for_ping_promises, et on ne fait un ping que si on n'a pas déjà une promise en attente pour le worker
                                 */
                                if (bgthread_name == first_bgthread_name) {

                                    if (ConfigurationService.node_configuration.load_balancing_debug_log) {
                                        ConsoleHandler.log('LoadBalancing function call task_UID "' + task_UID + '" - all workers busy - racing for ping');
                                    }

                                    const promises = [];
                                    for (let i = 0; i < load_balancer.nb_workers; i++) {
                                        const worker_name = bgthread + LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX + i;

                                        if (!waiting_for_ping_promises[worker_name]) {
                                            waiting_for_ping_promises[worker_name] = BGThreadLoadBalancerServerController.get_worker_latency(worker_name).then((latency: number) => {
                                                if (ConfigurationService.node_configuration.load_balancing_debug_log) {
                                                    ConsoleHandler.log('LoadBalancing function call task_UID "' + task_UID + '" - worker "' + worker_name + '" pinged in ' + latency + 'ms and won the race');
                                                }
                                                delete waiting_for_ping_promises[worker_name];
                                                bgthread_name = worker_name;
                                            });
                                        }
                                        promises.push(waiting_for_ping_promises[worker_name]);
                                    }
                                    await Promise.race(promises);
                                }

                                if (ConfigurationService.node_configuration.load_balancing_debug_log) {
                                    ConsoleHandler.log('LoadBalancing function call to worker "' + bgthread_name + '" for task_UID "' + task_UID + '"');
                                }
                            }
                        }

                        // On wrap les resolve et reject si on est sur un load balancer pour pouvoir update le workers_busy
                        let resolve_wrapper = resolve;
                        let reject_wrapper = reject;
                        if (is_load_balancing) {
                            resolve_wrapper = (res) => {
                                workers_busy[bgthread_name]--;
                                resolve(res);
                            };

                            reject_wrapper = (err) => {
                                workers_busy[bgthread_name]--;
                                reject(err);
                            };

                            if (!workers_busy[bgthread_name]) {
                                workers_busy[bgthread_name] = 1;
                            } else {
                                workers_busy[bgthread_name]++;
                            }
                        }


                        if (!await RunsOnBgThreadDataController.exec_self_on_bgthread_and_return_value_method(
                            defaults_to_this_thread,
                            reject_wrapper,
                            bgthread_name,
                            task_UID, // Using the method name as the task UID
                            resolve_wrapper,
                            ...args
                        )) {
                            // cas normal
                            return;
                        }


                        if (defaults_to_this_thread) {
                            // Exécuter la tâche ici
                            return resolve(await originalMethod.apply(this, args));
                        } else {
                            reject('RunsOnBgThread failed to send task to bgthread');
                        }

                    } catch (error) {

                        if (defaults_to_this_thread && error && error.message && (error._type == BGThreadNotAliveError.ERROR_TYPE)) {
                            // On peut relancer sur le thread local directement dans ce cas, mais uniquement cette fois et on doit retenter sur le bgthread la prochaine fois
                            return resolve(await originalMethod.apply(this, args));
                        }

                        ConsoleHandler.error('Error in RunsOnBgThread: ' + error);
                        reject(error);
                    }
                });
            } else {
                // On right bgthread : replace the method on this instance with the original method
                Object.defineProperty(this, propertyKey, {
                    value: originalMethod,
                    configurable: true,
                    writable: true
                });
                // Call the original method
                const res = await originalMethod.apply(this, args);
                return res;
            }
        };

        return descriptor; // Retourner le descriptor modifié
    };
}
