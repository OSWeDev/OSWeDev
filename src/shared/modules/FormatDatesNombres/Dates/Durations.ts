
import moment = require("moment");
import ConsoleHandler from "../../../tools/ConsoleHandler";
import HourSegment from "../../DataRender/vos/HourSegment";
import Dates from "./Dates";

export default class Durations {

    public static from_segmentation(nb: number, segmentation: number = HourSegment.TYPE_SECOND): number {

        if (nb == null) {
            return 0;
        }

        if (isNaN(nb)) {
            return NaN;
        }

        return this.add(0, nb, segmentation);
    }

    public static parse(date: string | number, unit: moment.unitOfTime.DurationConstructor = null): number {
        try {
            if (!date) {
                return null;
            }
            return moment.unix(moment.duration(date, unit).asSeconds()).unix();
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return null;
    }

    /**
     * @param duration timestamp in secs to update
     * @param nb offset
     * @param segmentation type of offset, based on HourSegment.TYPE_*
     * @returns updated date
     */
    public static add(duration: number, nb: number, segmentation: number = HourSegment.TYPE_SECOND): number {

        if (isNaN(nb) || (nb == null)) {
            return duration;
        }

        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                return Math.floor(60 * 60 * nb + duration);
            case HourSegment.TYPE_MINUTE:
                return Math.floor(60 * nb + duration);
            case HourSegment.TYPE_SECOND:
                return Math.floor(nb + duration);

            case HourSegment.TYPE_YEAR:
            case HourSegment.TYPE_ROLLING_YEAR_MONTH_START:
                let date_ys = new Date(duration * 1000);
                return Math.floor(date_ys.setUTCFullYear(date_ys.getUTCFullYear() + nb) / 1000);
            case HourSegment.TYPE_MONTH:
                let date_ms = new Date(duration * 1000);
                return Math.floor(date_ms.setUTCMonth(date_ms.getUTCMonth() + nb) / 1000);
            case HourSegment.TYPE_WEEK:
                return Math.floor(60 * 60 * 24 * 7 * nb + duration);
            case HourSegment.TYPE_DAY:
                return Math.floor(60 * 60 * 24 * nb + duration);

            default:
                return Math.floor(nb + duration);
        }
    }

    public static format(duration: number, formatstr: string): string {
        if (!duration) {
            return null;
        }

        let mm = moment.unix(duration).utc();
        return mm.format(formatstr);
    }

    /**
     * @param a left
     * @param b right
     * @param segmentation type of segmentation, based on HourSegment.TYPE_* - aplied to a and b before diff
     * @param precise - defaults to false
     * @returns diff value between a and b
     */
    public static diff(a: number, b: number, segmentation: number = HourSegment.TYPE_SECOND, precise: boolean = false): number {

        let coef = 0;

        switch (segmentation) {

            case HourSegment.TYPE_DAY:
                coef = 86400;
                break;
            case HourSegment.TYPE_HOUR:
                coef = 3600;
                break;
            case HourSegment.TYPE_MINUTE:
                coef = 60;
                break;
            case HourSegment.TYPE_MONTH:
                let mma = moment.unix(a).utc();
                let mmb = moment.unix(b).utc();
                return mma.diff(mmb, 'month', precise);
            case HourSegment.TYPE_WEEK:
                coef = 604800;
                break;
            case HourSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case HourSegment.TYPE_YEAR:
                let mya = moment.unix(a).utc();
                let myb = moment.unix(b).utc();
                return mya.diff(myb, 'year', precise);
            case HourSegment.TYPE_SECOND:
                return a - b;

            default:
                return a - b;
        }

        let start_a = Dates.startOf(a, segmentation);
        let start_b = Dates.startOf(b, segmentation);
        return precise ? ((start_a / coef) - (start_b / coef) + ((a - start_a) / coef) - ((b - start_b) / coef)) : Math.floor(a / coef) - Math.floor(b / coef);
    }

    public static as(duration: number, segmentation: number): number {
        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                return duration / 3600;
            case HourSegment.TYPE_MINUTE:
                return duration / 60;
            case HourSegment.TYPE_SECOND:
                return duration;

            case HourSegment.TYPE_YEAR:
            case HourSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return duration / (365 * 60 * 60 * 24); // Un choix, différent de moment, on prend 30 jours pour un mois sur une Duration, moment prend 0.9993360575508051*365
            case HourSegment.TYPE_MONTH:
                return duration / (30 * 60 * 60 * 24); // Un choix, différent de moment, on prend 30 jours pour un mois sur une Duration, moment prend 30.436875
            case HourSegment.TYPE_WEEK:
                return duration / (60 * 60 * 24 * 7);
            case HourSegment.TYPE_DAY:
                return duration / (60 * 60 * 24);

            default:
                return null;
        }
    }

    /**
     * @param duration duration to get or set
     * @param set_hours if omitted the function return the current hours in the day, else it sets it and return the updated time.
     *  If > 23, it bubbles on the day
     */
    public static hours(duration: number, set_hours?: number): number {
        return Dates.hour(duration, set_hours);
    }

    /**
     * @param duration duration to get or set
     * @param set_minutes if omitted the function return the current minutes in the hour, else it sets it and return the updated time.
     *  If > 59, it bubbles on the hour
     */
    public static minutes(duration: number, set_minutes?: number): number {
        return Dates.minute(duration, set_minutes);
    }

    /**
     * @param duration duration to get or set
     * @param set_seconds if omitted the function return the current seconds in the minute, else it sets it and return the updated time.
     *  If > 59, it bubbles on the minute
     */
    public static seconds(duration: number, set_seconds?: number): number {
        return Dates.second(duration, set_seconds);
    }
}