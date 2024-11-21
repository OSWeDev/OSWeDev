import { isMainThread } from "worker_threads";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import RegisteredForkedTasksController from "../../Fork/RegisteredForkedTasksController";


export default class RunsOnMainThreadDataController {
    public static exec_self_on_main_process_and_return_value_method: (thrower: any, task_uid: string, resolver: any, ...task_params: any[]) => Promise<boolean> = null;
}

/**
 * Decorator indicating and handling that the method should be executed on the main thread
 * Optimized : if the method is called from the main thread, it will be executed directly and the annotation will be removed so that the method is executed directly next time
 */
export function RunsOnMainThread(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    //TODO register the method as a task on the main thread, with a UID based on the method name and the class name
    const task_UID = target.constructor.name + '.' + propertyKey;

    if (isMainThread) {
        RegisteredForkedTasksController.register_task(task_UID, originalMethod.bind(target));
    }

    descriptor.value = async function (...args: any[]) {
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
            return originalMethod.apply(this, args);
        }
    };
}
