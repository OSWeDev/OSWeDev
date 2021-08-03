
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
                return nb + date;
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
                let mm = moment.unix(date).utc();
                return mm.startOf('month').unix();
            case TimeSegment.TYPE_SECOND:
                return date; // useless as f*ck don't call this
            case TimeSegment.TYPE_WEEK:
                return date + ((date - 345600) % 604800); // 01/01/70 = jeudi
            case TimeSegment.TYPE_YEAR:
                let my = moment.unix(date).utc();
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
                let mm = moment.unix(date).utc();
                return mm.endOf('month').unix();
            case TimeSegment.TYPE_SECOND:
                return date; // useless as f*ck don't call this
            case TimeSegment.TYPE_WEEK:
                return date - date % 592200 + 592200 - 1;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                let mryms = moment.unix(date).utc();
                return mryms.endOf('month').add(1, 'year').unix();
            case TimeSegment.TYPE_YEAR:
                let my = moment.unix(date).utc();
                return my.endOf('year').unix();

            default:
                return null;
        }
    }

    public static format(date: number, formatstr: string): string {
        if (!date) {
            return null;
        }

        let mm = moment.unix(date).utc();
        return mm.format(formatstr);
    }

    /**
     * @param a left
     * @param b right
     * @param segmentation type of segmentation, based on TimeSegment.TYPE_* - aplied to a and b before diff
     * @param do_not_floor - defaults to false
     * @returns diff value between a and b
     */
    public static diff(a: number, b: number, segmentation: number = TimeSegment.TYPE_SECOND, do_not_floor: boolean = false): number {

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
                let mma = moment.unix(a).utc();
                let mmb = moment.unix(b).utc();
                return mma.diff(mmb, 'month', do_not_floor);
            case TimeSegment.TYPE_SECOND:
                return a_ - b_;
            case TimeSegment.TYPE_WEEK:
                return (a_ - a_ % 592200) - (b_ - b_ % 592200);
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                let mya = moment.unix(a).utc();
                let myb = moment.unix(b).utc();
                return mya.diff(myb, 'year', do_not_floor);

            default:
                return null;
        }
    }

    /**
     * @param a
     * @param b
     * @param segmentation
     * @returns true if the diff according to the segmentation is 0
     */
    public static isSame(a: number, b: number, segmentation: number): boolean {
        return this.diff(a, b, segmentation) == 0;
    }

    /**
     * @param a
     * @param b
     * @param segmentation
     * @returns true if the diff according to the segmentation is < 0
     */
    public static isBefore(a: number, b: number, segmentation: number): boolean {
        return this.diff(a, b, segmentation) < 0;
    }

    /**
     * @param a
     * @param b
     * @param segmentation
     * @returns true if the diff according to the segmentation is <= 0
     */
    public static isSameOrBefore(a: number, b: number, segmentation: number): boolean {
        return this.diff(a, b, segmentation) <= 0;
    }

    /**
     * @param a
     * @param b
     * @param segmentation
     * @returns true if the diff according to the segmentation is > 0
     */
    public static isAfter(a: number, b: number, segmentation: number): boolean {
        return this.diff(a, b, segmentation) > 0;
    }

    /**
     * @param a
     * @param b
     * @param segmentation
     * @returns true if the diff according to the segmentation is >= 0
     */
    public static isSameOrAfter(a: number, b: number, segmentation: number): boolean {
        return this.diff(a, b, segmentation) >= 0;
    }

    /**
     * Exclusive test
     * @param date
     * @param start
     * @param end
     * @returns true if the diff according to the segmentation is > 0 for start and < 0 for end
     */
    public static isBetween(date: number, start: number, end: number): boolean {
        return (this.diff(date, start) > 0) && (this.diff(date, end) < 0);
    }

    /**
     * @param date date to get or set. If none, Dates.now() is used
     * @param set_hour if omitted the function return the current hours in the day, else it sets it and return the updated time.
     *  If > 23, it bubbles on the day
     */
    public static hour(date?: number, set_hour?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_hour == null) {
            return Math.floor((date % 86400) / 3600);
        }

        return Dates.startOf(date, TimeSegment.TYPE_DAY) + set_hour * 3600;
    }

    /**
     * Prefer hour for Dates
     */
    public static hours(date?: number, set_hours?: number): number {
        return Dates.hour(date, set_hours);
    }

    /**
     * @param date date to get or set
     * @param set_minute if omitted the function return the current minutes in the hour, else it sets it and return the updated time.
     *  If > 59, it bubbles on the hour
     */
    public static minute(date?: number, set_minute?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_minute == null) {
            return Math.floor((date % 3600) / 60);
        }

        return Dates.startOf(date, TimeSegment.TYPE_HOUR) + set_minute * 60;
    }

    /**
     * Alias of minute
     */
    public static minutes(date?: number, set_minutes?: number): number {
        return Dates.minute(date, set_minutes);
    }

    /**
     * @param date date to get or set
     * @param set_seconds if omitted the function return the current seconds in the minute, else it sets it and return the updated time.
     *  If > 59, it bubbles on the minute
     */
    public static second(date?: number, set_seconds?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_seconds == null) {
            return Math.floor(date % 60);
        }

        return Dates.startOf(date, TimeSegment.TYPE_MINUTE) + set_seconds;
    }

    /**
     * Alias of second
     */
    public static seconds(date?: number, set_seconds?: number): number {
        return Dates.second(date, set_seconds);
    }

    /**
     * As ISO 8601 String  example: 2013-02-04T22:44:30.652Z
     */
    public static toISOString(date: number) {

        if (date == null) {
            return null;
        }
        return new Date(date * 1000).toISOString();
    }

    /**
     * @param date date to get or set
     * @param set_date if omitted the function return the current date in the month, else it sets it and return the updated time.
     *  Bubbles on the month
     */
    public static date(date?: number, set_date?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_date == null) {
            return moment.unix(date).utc().date();
        }

        return moment.unix(date).utc().date(set_date).unix();
    }

    /**
     * @param date date to get or set
     * @param set_day if omitted the function return the current day in the week (0 = sunday), else it sets it and return the updated time.
     */
    public static day(date?: number, set_day?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_day == null) {
            return Math.floor((date % 604800) / 86400) + 4 % 7; // 0 == jeudi 01/01/1970
        }

        let current = this.day(date);

        return (set_day - current) * 86400 + date;
    }

    /**
     * @param date date to get or set
     * @param set_isoWeekday if omitted the function return the current isoWeekday in the week (0 = monday), else it sets it and return the updated time.
     */
    public static isoWeekday(date?: number, set_isoWeekday?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_isoWeekday == null) {
            return Math.floor((date % 604800) / 86400) + 3 % 7; // 0 == jeudi 01/01/1970
        }

        let current = this.isoWeekday(date);

        return (set_isoWeekday - current) * 86400 + date;
    }

    /**
     * @param date date to get or set
     * @param set_month if omitted the function return the current month in the year, else it sets it (0 to 11) and return the updated time.
     *  Bubbles on the year
     */
    public static month(date?: number, set_month?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_month == null) {
            return moment.unix(date).utc().month();
        }

        return moment.unix(date).utc().month(set_month).unix();
    }

    /**
     * @param date date to get or set
     * @param set_year if omitted the function return the current year, else it sets it and return the updated time.
     */
    public static year(date?: number, set_year?: number): number {

        if (date == null) {
            date = Dates.now();
        }

        if (set_year == null) {
            return moment.unix(date).utc().year();
        }

        return moment.unix(date).utc().year(set_year).unix();
    }
}