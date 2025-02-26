import EventsController from "../../../../shared/modules/Eventify/EventsController";
import ModulesManager from "../../../../shared/modules/ModulesManager";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import BGThreadNotAliveError from "../../Fork/errors/BGThreadNotAliveError";
import RegisteredForkedTasksController from "../../Fork/RegisteredForkedTasksController";
import BGThreadServerDataManager from "../BGThreadServerDataManager";

export const EVENT_NAME_ForkServerController_ready: string = 'BGThreadServerController.ForkServerController_ready';

export default class RunsOnBgThreadDataController {
    public static exec_self_on_bgthread_and_return_value_method: (
        defaults_to_this_thread: boolean,
        thrower: any,
        task_uid: string,
        resolver: any,
        ...task_params: any[]) => Promise<boolean> = null;
}

/**
 * Decorator indicating and handling that the method should be executed on a bgthread
 * Optimized : if the method is called from the right thread, it will be executed directly and the annotation will be removed so that the method is executed directly next time
 */
type AsyncMethod = (...args: any[]) => Promise<any>;

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

        // Vérification runtime : si la fonction n’est pas async, on bloque
        if (originalMethod.constructor.name !== 'AsyncFunction') {
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

        descriptor.value = async function (...args: any[]) {
            if (!BGThreadServerDataManager.valid_bgthreads_names[bgthread]) { // not on the right bgthread

                // Execute the method on the right process
                return new Promise(async (resolve, reject) => {
                    try {

                        if (!RunsOnBgThreadDataController.exec_self_on_bgthread_and_return_value_method) {
                            // On ne peut pas renvoyer sur un bgthread si on n'en a pas
                            // Exécuter la tâche ici
                            return resolve(await originalMethod.apply(this, args));
                        }

                        if (!await RunsOnBgThreadDataController.exec_self_on_bgthread_and_return_value_method(
                            defaults_to_this_thread,
                            reject,
                            bgthread,
                            task_UID, // Using the method name as the task UID
                            resolve,
                            ...args
                        )) {
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
