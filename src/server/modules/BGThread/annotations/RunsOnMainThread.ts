import { isMainThread } from "worker_threads";
import ModulesManager from "../../../../shared/modules/ModulesManager";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import RegisteredForkedTasksController from "../../Fork/RegisteredForkedTasksController";


export default class RunsOnMainThreadDataController {
    public static exec_self_on_main_process_and_return_value_method: (thrower: any, task_uid: string, resolver: any, ...task_params: any[]) => Promise<boolean> = null;
}

type AsyncMethod = (...args: any[]) => Promise<any>;
/**
 * ATTENTION : la méthode décorée est obligatoirement async !
 * Decorator indicating and handling that the method should be executed on the main thread
 * Optimized : if the method is called from the main thread, it will be executed directly and the annotation will be removed so that the method is executed directly next time
 * @param instanceGetter Getter for the instance of the class on which the method is called, null by default for static methods
 */
export function RunsOnMainThread(instanceGetter: () => any = null) {
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

        if (isMainThread) {
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

        descriptor.value = async function (...args: any[]) { // Attention si on déclare la fonction avec la flèche on perd le this
            if (!isMainThread) {

                // Not on main process: execute the method on the main process
                return new Promise(async (resolve, reject) => {
                    try {
                        await RunsOnMainThreadDataController.exec_self_on_main_process_and_return_value_method(
                            reject,
                            task_UID, // Using the method name as the task UID
                            resolve,
                            ...args
                        );
                    } catch (error) {
                        ConsoleHandler.error('Error in RunsOnMainThread: ' + error);
                        reject(error);
                    }
                });
            } else {
                // On main process: replace the method on this instance with the original method
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