
import * as moment from 'moment';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import TimeSegment from "../../DataRender/vos/TimeSegment";

export default class Dates {

    public static parse(date: string, format: string = null): number {
        try {
            if (!date) {
                return null;
            }
            return moment(date, format).utc(true).unix();
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return null;
    }

    /**
     * @returns current timestamp in secs
     */
    public static now(): number {
        if (!Dates.p) {

            // server side
            Dates.p = require("perf_hooks").performance;
        }

        return Math.floor(((Dates.p.timeOrigin ? Dates.p.timeOrigin : Dates.p.timing.navigationStart) + Dates.p.now()) / 1000);
    }

    /**
     * @param date timestamp in secs to update
     * @param nb offset
     * @param segmentation type of offset, based on TimeSegment.TYPE_*
     * @returns updated date
     */
    public static add(date: number, nb: number, segmentation: number = TimeSegment.TYPE_SECOND): number {

        if (isNaN(nb) || (nb == null)) {
            return date;
        }

        switch (segmentation) {

            case TimeSegment.TYPE_DAY:
                return Math.floor(60 * 60 * 24 * nb + date);
            case TimeSegment.TYPE_HOUR:
                return Math.floor(60 * 60 * nb + date);
            case TimeSegment.TYPE_MINUTE:
                return Math.floor(60 * nb + date);
            case TimeSegment.TYPE_MONTH:
                /**
                 * Je vois pas comment éviter de passer par un moment à ce stade ou un Date
                 */
                let date_ms = new Date(date * 1000);
                return Math.floor(date_ms.setUTCMonth(date_ms.getUTCMonth() + nb) / 1000);
            case TimeSegment.TYPE_SECOND:
                return Math.floor(nb + date);
            case TimeSegment.TYPE_WEEK:
                return Math.floor(60 * 60 * 24 * 7 * nb + date);
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                let date_ys = new Date(date * 1000);
                return Math.floor(date_ys.setUTCFullYear(date_ys.getUTCFullYear() + nb) / 1000);

            default:
                return Math.floor(nb + date);
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
                return date - ((date - 345600) % 604800); // 01/01/70 = jeudi
            case TimeSegment.TYPE_YEAR:
                let my = moment.unix(date).utc();
                return my.startOf('year').unix();

            default:
                return date;
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
                return date - ((date - 345600) % 604800) + 604800 - 1;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                let mryms = moment.unix(date).utc();
                return mryms.endOf('month').add(1, 'year').unix();
            case TimeSegment.TYPE_YEAR:
                let my = moment.unix(date).utc();
                return my.endOf('year').unix();

            default:
                return date;
        }
    }

    public static format(date: number, formatstr: string, localized: boolean = true): string {
        if (!date) {
            return null;
        }

        let mm = localized ? moment.unix(date) : moment.unix(date).utc();
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

        let coef = 0;

        switch (segmentation) {

            case TimeSegment.TYPE_DAY:
                coef = 86400;
                break;
            case TimeSegment.TYPE_HOUR:
                coef = 3600;
                break;
            case TimeSegment.TYPE_MINUTE:
                coef = 60;
                break;
            case TimeSegment.TYPE_MONTH:
                let mma = moment.unix(a).utc();
                let mmb = moment.unix(b).utc();
                return mma.diff(mmb, 'month', do_not_floor);
            case TimeSegment.TYPE_SECOND:
                return a - b;
            case TimeSegment.TYPE_WEEK:
                coef = 604800;
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                let mya = moment.unix(a).utc();
                let myb = moment.unix(b).utc();
                return mya.diff(myb, 'year', do_not_floor);

            default:
                return null;
        }

        let start_a = Dates.startOf(a, segmentation);
        let start_b = Dates.startOf(b, segmentation);
        return do_not_floor ? ((start_a / coef) - (start_b / coef) + ((a - start_a) / coef) - ((b - start_b) / coef)) : Math.floor(a / coef) - Math.floor(b / coef);
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

        if (isNaN(date) || (date == null)) {
            date = Dates.now();
        }

        if (set_hour == null) {
            return Math.floor((date % 86400) / 3600);
        }

        if (isNaN(set_hour)) {
            return date;
        }

        return date + (set_hour - Dates.hour(date)) * 3600;
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

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_minute == null) {
            return Math.floor((date % 3600) / 60);
        }

        if (isNaN(set_minute)) {
            return date;
        }

        return date + (set_minute - Dates.minute(date)) * 60;
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

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_seconds == null) {
            return Math.floor(date % 60);
        }

        if (isNaN(set_seconds)) {
            return date;
        }

        return date + (set_seconds - Dates.second(date));
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

        if (isNaN(date) || date == null) {
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

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_date == null) {
            return moment.unix(date).utc().date();
        }

        if (isNaN(set_date)) {
            return date;
        }

        return moment.unix(date).utc().date(set_date).unix();
    }

    /**
     * @param date date to get or set
     * @param set_day if omitted the function return the current day in the week (0 = sunday), else it sets it and return the updated time.
     */
    public static day(date?: number, set_day?: number): number {

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_day == null) {
            return (Math.floor((date % 604800) / 86400) + 4) % 7; // 0 == jeudi 01/01/1970
        }

        if (isNaN(set_day)) {
            return date;
        }

        return date + (set_day - Dates.day(date)) * 86400;
    }

    /**
     * @param date date to get or set
     * @param set_isoWeekday if omitted the function return the current isoWeekday in the week (1=monday, 7=sunday), else it sets it and return the updated time.
     */
    public static isoWeekday(date?: number, set_isoWeekday?: number): number {

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_isoWeekday == null) {
            return (Math.floor((date % 604800) / 86400) + 4 - 1) % 7 + 1; // 0 == jeudi 01/01/1970
        }

        if (isNaN(set_isoWeekday)) {
            return date;
        }

        return date + (set_isoWeekday - Dates.isoWeekday(date)) * 86400;
    }

    /**
     * @param date date to get or set
     * @param set_isoWeek if omitted the function return the current isoWeek in the week (1=monday, 7=sunday), else it sets it and return the updated time.
     */
    public static isoWeek(date?: number, set_isoWeek?: number): number {

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_isoWeek == null) {
            return moment.unix(date).utc().isoWeek();
        }

        if (isNaN(set_isoWeek)) {
            return date;
        }

        return moment.unix(date).utc().isoWeek(set_isoWeek).unix();
    }

    /**
     * @param date date to get or set
     * @param set_month if omitted the function return the current month in the year, else it sets it (0 to 11) and return the updated time.
     *  Bubbles on the year
     */
    public static month(date?: number, set_month?: number): number {

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_month == null) {
            return moment.unix(date).utc().month();
        }

        if (isNaN(set_month)) {
            return date;
        }

        return moment.unix(date).utc().month(set_month).unix();
    }

    /**
     * @param date date to get or set
     * @param set_year if omitted the function return the current year, else it sets it and return the updated time.
     */
    public static year(date?: number, set_year?: number): number {

        if (isNaN(date) || date == null) {
            date = Dates.now();
        }

        if (set_year == null) {
            return moment.unix(date).utc().year();
        }

        if (isNaN(set_year)) {
            return date;
        }

        return moment.unix(date).utc().year(set_year).unix();
    }

    private static p = (() => {
        try {
            return performance;
        } catch (e) {
            return null;
        }
    })();
}