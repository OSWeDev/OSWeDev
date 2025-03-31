import EventsController from "../../../../shared/modules/Eventify/EventsController";
import ModulesManager from "../../../../shared/modules/ModulesManager";
import RegisteredForkedTasksController from "../../Fork/RegisteredForkedTasksController";
import BGThreadServerDataManager from "../BGThreadServerDataManager";
import { do_exec_function_on_bgthread_name, EVENT_NAME_ForkServerController_ready } from "./RunsOnBGThread";

type AsyncMethod = (...args: any[]) => Promise<any>;

/*
 * ATTENTION : la méthode décorée est obligatoirement async !
 * Decorator indicating and handling that the method should be executed on a bgthread
 * The bgthread is defined dynamically by the first parameter of the decorated method
 */
export function RunsOnParameterizedBGThread(instanceGetter: () => any, defaults_to_this_thread: boolean = false) {
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
        });

        descriptor.value = async function (...args: any[]) { // Attention si on déclare la fonction avec la flèche on perd le this

            if ((!args) || (!args[0]) || (typeof args[0] != 'string')) {
                throw new Error("Le premier paramètre doit être défini pour déterminer le nom du bgthread cible de cet appel.");
            }

            const bgthread = args[0];

            if (!BGThreadServerDataManager.valid_bgthreads_names[bgthread]) { // not on the right bgthread

                return do_exec_function_on_bgthread_name(
                    this,
                    bgthread,
                    defaults_to_this_thread,
                    originalMethod,
                    task_UID,
                    ...args
                );
            } else {
                // On right bgthread : just call the method

                // Call the original method
                const res = await originalMethod.apply(this, args);
                return res;
            }
        };

        return descriptor; // Retourner le descriptor modifié
    };
}
