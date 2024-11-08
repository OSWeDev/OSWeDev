/* istanbul ignore file: nothing to test here */

import ForkedTasksController from "../../server/modules/Fork/ForkedTasksController";
import ForkServerController from "../../server/modules/Fork/ForkServerController";
import Dates from "../modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../modules/Stats/StatsController";
import DBDisconnectionManager from "./DBDisconnectionManager";

/**
 * Decorator indicating and handling that the method should be executed on the main thread
 * Optimized : if the method is called from the main thread, it will be executed directly and the annotation will be removed so that the method is executed directly next time
 */
export function RunsOnMainThread(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    //TODO register the method as a task on the main thread, with a UID based on the method name and the class name
    const task_UID = target.constructor.name + '.' + propertyKey;

    if (ForkServerController.is_main_process()) {
        ForkedTasksController.register_task(task_UID, originalMethod.bind(target));
    }

    descriptor.value = async function (...args: any[]) {
        if (!ForkServerController.is_main_process()) {
            // Not on main process: execute the method on the main process
            return await ForkedTasksController.exec_self_on_main_process_and_return_value(
                (error: any) => { throw error; },
                task_UID, // Using the method name as the task UID
                (value: any) => value,
                args
            );
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

export default class ThreadHandler {

    /**
     * @param timeout en ms
     * @param reason_ID La raison de l'attente, pour les stats
     * @param pause_on_db_disconnection Si true, on attend que la DB soit reconnectée avant de faire le sleep
     */
    public static async sleep(timeout: number, reason_ID: string, pause_on_db_disconnection: boolean = false): Promise<NodeJS.Timeout> {

        StatsController.register_stat_COMPTEUR('ThreadHandler', 'sleep', reason_ID);

        const date_in_ms = Dates.now_ms();
        return new Promise<NodeJS.Timeout>((resolve) => {
            const timeout_obj = setTimeout(async () => {

                if (pause_on_db_disconnection && DBDisconnectionManager.instance && DBDisconnectionManager.instance.db_is_disconnected) {
                    await DBDisconnectionManager.instance.wait_for_reconnection();
                    await ThreadHandler.sleep(timeout, 'sleep.pause_on_db_disconnection', pause_on_db_disconnection);
                }

                const date_out_ms = Dates.now_ms();
                StatsController.register_stat_DUREE('ThreadHandler', 'sleep', reason_ID, date_out_ms - date_in_ms);

                resolve(timeout_obj);
            }, timeout);
        });
    }

    /**
     * Un setInterval, qui est conscient de la déconnexion de la DB au besoin, et surtout qui défini bien un temps d'attente ENTRE les appels de la fonction
     *  donc entre la fin de l'appel précédent et le début de l'appel suivant (et non pas on lance la fonction tous les x ms, même si la fonction est longue à s'exécuter)
     * @param func La fonction à exécuter (async)
     * @param timeout en ms
     * @param reason_ID La raison de l'attente, pour les stats
     * @param pause_on_db_disconnection Si true, on attend que la DB soit reconnectée avant de faire le sleep
     * @returns interval_uid du setInterval lié, pour pouvoir le clear
     */
    public static set_interval(func: () => Promise<void>, timeout: number, reason_ID: string, pause_on_db_disconnection: boolean = false): number {

        StatsController.register_stat_COMPTEUR('ThreadHandler', 'set_interval', reason_ID);

        const interval_uid = ThreadHandler.current_interval_uid++;
        ThreadHandler.intervals[interval_uid] = true;
        ThreadHandler.sleep(timeout, reason_ID, pause_on_db_disconnection).then(async () => {

            while (ThreadHandler.intervals[interval_uid]) {
                await func();
                await ThreadHandler.sleep(timeout, reason_ID, pause_on_db_disconnection);
            }
        });

        return interval_uid;
    }

    public static clear_interval(interval_uid: number) {
        delete ThreadHandler.intervals[interval_uid];
    }

    private static current_interval_uid: number = 0;
    private static intervals: { [interval_uid: number]: boolean } = {};

    private constructor() {
    }
}