/* istanbul ignore file: nothing to test here */

import TimeSegment from "../modules/DataRender/vos/TimeSegment";
import Dates from "../modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../modules/Stats/StatsController";
import StatsTypeVO from "../modules/Stats/vos/StatsTypeVO";
import StatVO from "../modules/Stats/vos/StatVO";

export default class ThreadHandler {

    /**
     * @param timeout en ms
     */
    public static async sleep(timeout: number, reason_ID: string): Promise<void> {

        StatsController.register_stat('ThreadHandler', 'sleep', reason_ID, StatsTypeVO.TYPE_COMPTEUR,
            1, StatVO.AGGREGATOR_SUM, TimeSegment.TYPE_MINUTE);

        let date_in_ms = Dates.now_ms();
        return new Promise<any>((resolve) => {
            setTimeout(() => {

                let date_out_ms = Dates.now_ms();
                StatsController.register_stats('ThreadHandler', 'sleep', reason_ID, StatsTypeVO.TYPE_DUREE,
                    date_out_ms - date_in_ms,
                    [StatVO.AGGREGATOR_MAX, StatVO.AGGREGATOR_MEAN, StatVO.AGGREGATOR_MIN, StatVO.AGGREGATOR_SUM],
                    TimeSegment.TYPE_MINUTE);

                resolve(null);
            }, timeout);
        });
    }

    private constructor() {
    }
}