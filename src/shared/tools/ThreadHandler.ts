/* istanbul ignore file: nothing to test here */

import Dates from "../modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../modules/Stats/StatsController";
import DBDisconnectionManager from "./DBDisconnectionManager";

export default class ThreadHandler {

    /**
     * @param timeout en ms
     * @param reason_ID La raison de l'attente, pour les stats
     * @param pause_on_db_disconnection Si true, on attend que la DB soit reconnectée avant de faire le sleep
     */
    public static async sleep(timeout: number, reason_ID: string, pause_on_db_disconnection: boolean = false): Promise<void> {

        StatsController.register_stat_COMPTEUR('ThreadHandler', 'sleep', reason_ID);

        const date_in_ms = Dates.now_ms();
        return new Promise<any>((resolve) => {
            setTimeout(async () => {

                if (pause_on_db_disconnection && DBDisconnectionManager.instance && DBDisconnectionManager.instance.db_is_disconnected) {
                    await DBDisconnectionManager.instance.wait_for_reconnection();
                    await ThreadHandler.sleep(timeout, 'sleep.pause_on_db_disconnection', pause_on_db_disconnection);
                }

                const date_out_ms = Dates.now_ms();
                StatsController.register_stat_DUREE('ThreadHandler', 'sleep', reason_ID, date_out_ms - date_in_ms);

                resolve("sleep");
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