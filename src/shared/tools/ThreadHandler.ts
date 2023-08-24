/* istanbul ignore file: nothing to test here */

import Dates from "../modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../modules/Stats/StatsController";

export default class ThreadHandler {

    /**
     * @param timeout en ms
     */
    public static async sleep(timeout: number, reason_ID: string): Promise<void> {

        StatsController.register_stat_COMPTEUR('ThreadHandler', 'sleep', reason_ID);

        let date_in_ms = Dates.now_ms();
        return new Promise<any>((resolve) => {
            setTimeout(() => {

                let date_out_ms = Dates.now_ms();
                StatsController.register_stat_DUREE('ThreadHandler', 'sleep', reason_ID, date_out_ms - date_in_ms);

                resolve("sleep");
            }, timeout);
        });
    }

    private constructor() {
    }
}