import EventsController from "../../../../shared/modules/Eventify/EventsController";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import ForkedTasksController from "../../Fork/ForkedTasksController";
import RegisteredForkedTasksController from "../../Fork/RegisteredForkedTasksController";
import BGThreadServerController from "../BGThreadServerController";


export const EVENT_NAME_ForkServerController_ready: string = 'BGThreadServerController.ForkServerController_ready';

/**
 * Decorator indicating and handling that the method should be executed on a bgthread
 * Optimized : if the method is called from the right thread, it will be executed directly and the annotation will be removed so that the method is executed directly next time
 */
export function RunsOnBgThread(bgthread: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        //TODO register the method as a task on the main thread, with a UID based on the method name and the class name
        const task_UID = target.constructor.name + '.' + propertyKey;

        EventsController.on_next_event(EVENT_NAME_ForkServerController_ready, () => {
            if (BGThreadServerController.valid_bgthreads_names[bgthread]) { // on the bg right bgthread
                RegisteredForkedTasksController.register_task(task_UID, originalMethod.bind(target));
            }
        });

        descriptor.value = async function (...args: any[]) {
            if (!BGThreadServerController.valid_bgthreads_names[bgthread]) { // not on the right bgthread

                // Execute the method on the right process
                return new Promise(async (resolve, reject) => {
                    try {

                        await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                            reject,
                            bgthread,
                            task_UID, // Using the method name as the task UID
                            resolve,
                            ...args
                        );
                    } catch (error) {
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
                return originalMethod.apply(this, args);
            }
        };
    };
}
