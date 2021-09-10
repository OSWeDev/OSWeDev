
import moment = require("moment");
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
     * @param do_not_floor - defaults to false
     * @returns diff value between a and b
     */
    public static diff(a: number, b: number, segmentation: number = HourSegment.TYPE_SECOND, do_not_floor: boolean = false): number {

        let coef = 0;

        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                coef = 3600;
                break;
            case HourSegment.TYPE_MINUTE:
                coef = 60;
                break;
            case HourSegment.TYPE_SECOND:
                return a - b;

            default:
                return a - b;
        }

        let start_a = Dates.startOf(a, segmentation);
        let start_b = Dates.startOf(b, segmentation);
        return do_not_floor ? ((start_a / coef) - (start_b / coef) + ((a - start_a) / coef) - ((b - start_b) / coef)) : Math.floor(a / coef) - Math.floor(b / coef);
    }

    public static as(duration: number, segmentation: number): number {
        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                return duration / 3600;
            case HourSegment.TYPE_MINUTE:
                return duration / 60;
            case HourSegment.TYPE_SECOND:
                return duration;
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