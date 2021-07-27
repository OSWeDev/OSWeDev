
import * as moment from 'moment';
import { performance } from "perf_hooks";
import TimeSegment from "../../DataRender/vos/TimeSegment";

export default class Dates {

    /**
     * @returns current timestamp in secs
     */
    public static now(): number {
        return Math.floor((performance.timeOrigin + performance.now()) / 1000);
    }

    /**
     * @param date timestamp in secs to update
     * @param nb offset
     * @param segmentation type of offset, based on TimeSegment.TYPE_*
     * @returns updated date
     */
    public static add(date: number, nb: number, segmentation: number = TimeSegment.TYPE_SECOND): number {

        switch (segmentation) {

            case TimeSegment.TYPE_DAY:
                return 60 * 60 * 24 * nb + date;
            case TimeSegment.TYPE_HOUR:
                return 60 * 60 * nb + date;
            case TimeSegment.TYPE_MINUTE:
                return 60 * nb + date;
            case TimeSegment.TYPE_MONTH:
                /**
                 * Je vois pas comment éviter de passer par un moment à ce stade ou un Date
                 */
                let date_ms = new Date(date);
                return Math.floor(date_ms.setMonth(date_ms.getMonth() + nb) / 1000);
            // case TimeSegment.TYPE_MS:
            //     return nb/1000 + date;
            case TimeSegment.TYPE_SECOND:
                return 60 * nb + date;
            case TimeSegment.TYPE_WEEK:
                return 60 * 60 * 24 * 7 * nb + date;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                let date_ys = new Date(date);
                return Math.floor(date_ys.setFullYear(date_ys.getFullYear() + nb) / 1000);

            default:
                return null;
        }
    }

    /**
     * StartOf necessite un passage par un calendrier donc on utilise MomentJs pour ce calcul pour le moment
     *  cas particulier des jours où on peut faire un %86400, des heures %3600, des secondes %60, des semaines % 592200
     * En startOf le TYPE_ROLLING_YEAR_MONTH_START est au début du mois, mais on add 1 year si on add
     * @param date timestamp in secs to update
     * @param segmentation type of segmentation, based on TimeSegment.TYPE_*
     * @returns updated date
     */
    public static startOf(date: number, segmentation: number): number {

        switch (segmentation) {

            case TimeSegment.TYPE_DAY:
                return date - date % 86400;
            case TimeSegment.TYPE_HOUR:
                return date - date % 3600;
            case TimeSegment.TYPE_MINUTE:
                return date - date % 60;
            case TimeSegment.TYPE_MONTH:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                let mm = moment(date).utc(true);
                return mm.startOf('month').unix();
            case TimeSegment.TYPE_SECOND:
                return date; // useless as f*ck don't call this
            case TimeSegment.TYPE_WEEK:
                return date + ((date - 345600) % 604800); // 01/01/70 = jeudi
            case TimeSegment.TYPE_YEAR:
                let my = moment(date).utc(true);
                return my.startOf('year').unix();

            default:
                return null;
        }
    }

    /**
     * EndOf necessite un passage par un calendrier donc on utilise MomentJs pour ce calcul pour le moment
     *  cas particulier des jours où on peut faire un %86400, des heures %3600, des secondes %60, des semaines % 592200
     * @param date timestamp in secs to update
     * @param segmentation type of segmentation, based on TimeSegment.TYPE_*
     * @returns updated date
     */
    public static endOf(date: number, segmentation: number): number {

        switch (segmentation) {

            case TimeSegment.TYPE_DAY:
                return date - date % 86400 + 86400 - 1;
            case TimeSegment.TYPE_HOUR:
                return date - date % 3600 + 3600 - 1;
            case TimeSegment.TYPE_MINUTE:
                return date - date % 60 + 60 - 1;
            case TimeSegment.TYPE_MONTH:
                let mm = moment(date).utc(true);
                return mm.endOf('month').unix();
            case TimeSegment.TYPE_SECOND:
                return date; // useless as f*ck don't call this
            case TimeSegment.TYPE_WEEK:
                return date - date % 592200 + 592200 - 1;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                let mryms = moment(date).utc(true);
                return mryms.endOf('month').add(1, 'year').unix();
            case TimeSegment.TYPE_YEAR:
                let my = moment(date).utc(true);
                return my.endOf('year').unix();

            default:
                return null;
        }
    }

    public static format(date: number, formatstr: string): string {
        if (!date) {
            return null;
        }

        let mm = moment(date).utc(true);
        return mm.format(formatstr);
    }

    /**
     * @param a left
     * @param b right
     * @param segmentation type of segmentation, based on TimeSegment.TYPE_* - aplied to a and b before diff
     * @param do_not_floor - defaults to false
     * @returns diff value between a and b
     */
    public static diff(a: number, b: number, segmentation: number, do_not_floor: boolean = false): number {

        let a_ = a;
        let b_ = b;

        switch (segmentation) {

            case TimeSegment.TYPE_DAY:
                return (a_ - a_ % 86400) - (b_ - b_ % 86400);
            case TimeSegment.TYPE_HOUR:
                return (a_ - a_ % 3600) - (b_ - b_ % 3600);
            case TimeSegment.TYPE_MINUTE:
                return (a_ - a_ % 60) - (b_ - b_ % 60);
            case TimeSegment.TYPE_MONTH:
                let mma = moment(a).utc(true);
                let mmb = moment(b).utc(true);
                return mma.diff(mmb, 'month', do_not_floor);
            case TimeSegment.TYPE_SECOND:
                return a_ - b_;
            case TimeSegment.TYPE_WEEK:
                return (a_ - a_ % 592200) - (b_ - b_ % 592200);
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                let mya = moment(a).utc(true);
                let myb = moment(b).utc(true);
                return mya.diff(myb, 'year', do_not_floor);

            default:
                return null;
        }
    }

    public static isSame(a: number, b: number, segmentation: number): boolean {
        return this.diff(a, b, segmentation) == 0;
    }
}