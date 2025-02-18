/* istanbul ignore file: nothing to test here */

import EventsController from "../modules/Eventify/EventsController";
import Dates from "../modules/FormatDatesNombres/Dates/Dates";
import { StatThisMapKeys } from "../modules/Stats/annotations/StatThisMapKeys";
import StatsController from "../modules/Stats/StatsController";
import DBDisconnectionManager from "./DBDisconnectionManager";

interface IIntervalConf {
    actif: boolean;
    reason: string;
    timeout: number;
    pause_on_db_disconnection: boolean;
    currently_running: boolean;
}

export default class ThreadHandler {

    @StatThisMapKeys('ThreadHandler')
    private static intervals_confs: { [uid: string]: IIntervalConf } = {};

    private constructor() {
    }

    /**
     * @param timeout en ms
     * @param reason_ID La raison de l'attente, pour les stats
     * @param pause_on_db_disconnection Si true, on attend que la DB soit reconnectée avant de faire le sleep
     * @returns Un objet contenant une promesse et une fonction `cancel` pour annuler le sleep
     */
    public static sleep(timeout: number, reason_ID: string, pause_on_db_disconnection: boolean = false) {
        StatsController.register_stat_COMPTEUR('ThreadHandler', 'sleep', reason_ID);

        const date_in_ms = Dates.now_ms();
        let cancel: (() => void) | null = null;

        const promise = new Promise<void>((resolve) => {
            const timeout_obj = setTimeout(async () => {
                if (pause_on_db_disconnection && DBDisconnectionManager.instance?.db_is_disconnected) {
                    await DBDisconnectionManager.instance.wait_for_reconnection();
                    await ThreadHandler.sleep(timeout, 'sleep.pause_on_db_disconnection', pause_on_db_disconnection);
                }

                const date_out_ms = Dates.now_ms();
                StatsController.register_stat_DUREE('ThreadHandler', 'sleep', reason_ID, date_out_ms - date_in_ms);

                resolve();
            }, timeout);

            cancel = () => {
                clearTimeout(timeout_obj);
                resolve();
            };
        });

        return {
            promise,
            cancel: () => cancel?.(), // permet de cancel le sleep et donc de resolve la promesse asap
            then: (resolve: (value: void) => void) => promise.then(resolve) // Permet la compatibilité avec le await directement sur le sleep
        };
    }

    /**
     * Un setInterval, qui est conscient de la déconnexion de la DB au besoin, et surtout qui défini bien un temps d'attente ENTRE les appels de la fonction
     *  donc entre la fin de l'appel précédent et le début de l'appel suivant (et non pas on lance la fonction tous les x ms, même si la fonction est longue à s'exécuter)
     * @param UID Un identifiant unique pour le thread => permet de le retrouver et de le stopper ou de remplacer la fonction
     * @param func La fonction à exécuter (async)
     * @param timeout en ms
     * @param reason_ID La raison de l'attente, pour les stats
     * @param pause_on_db_disconnection Si true, on attend que la DB soit reconnectée avant de faire le sleep
     * @returns interval_uid du setInterval lié, pour pouvoir le clear
     */
    public static set_interval(UID: string, func: () => void | Promise<void>, timeout: number, reason_ID: string, pause_on_db_disconnection: boolean = false) {

        StatsController.register_stat_COMPTEUR('ThreadHandler', 'set_interval', reason_ID);

        if (!ThreadHandler.intervals_confs[UID]) {
            ThreadHandler.intervals_confs[UID] = {
                actif: true,
                reason: reason_ID,
                timeout: timeout,
                pause_on_db_disconnection: pause_on_db_disconnection,
                currently_running: false
            };
        } else {
            ThreadHandler.intervals_confs[UID].actif = true;
            ThreadHandler.intervals_confs[UID].reason = reason_ID;
            ThreadHandler.intervals_confs[UID].timeout = timeout;
            ThreadHandler.intervals_confs[UID].pause_on_db_disconnection = pause_on_db_disconnection;
        }

        if (!ThreadHandler.intervals_confs[UID] || !ThreadHandler.intervals_confs[UID].currently_running) {

            ThreadHandler.intervals_confs[UID].currently_running = true;

            ThreadHandler.sleep(timeout, reason_ID, pause_on_db_disconnection).then(async () => {

                while (ThreadHandler.intervals_confs[UID].actif) {

                    if (EventsController.hook_stack_incompatible) {
                        await EventsController.hook_stack_incompatible(func, null, 'ThreadHandler.set_interval');
                    } else {
                        await func();
                    }
                    await ThreadHandler.sleep(ThreadHandler.intervals_confs[UID].timeout, ThreadHandler.intervals_confs[UID].reason, ThreadHandler.intervals_confs[UID].pause_on_db_disconnection);
                }
                ThreadHandler.intervals_confs[UID].currently_running = false;
            });
        }
    }

    public static clear_interval(uid: string) {
        delete ThreadHandler.intervals_confs[uid];
    }
}