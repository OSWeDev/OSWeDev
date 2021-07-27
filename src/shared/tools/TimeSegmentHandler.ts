

import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import Dates from '../modules/FormatDatesNombres/Dates/Dates';
import RangeHandler from './RangeHandler';

export default class TimeSegmentHandler {
    public static getInstance(): TimeSegmentHandler {
        if (!TimeSegmentHandler.instance) {
            TimeSegmentHandler.instance = new TimeSegmentHandler();
        }
        return TimeSegmentHandler.instance;
    }

    private static instance: TimeSegmentHandler = null;

    private constructor() { }

    /**
     * Renvoi 1 si le semgent_type a est plus grand que b, -1 si plus petit, 0 si égaux
     *  Cas particulier on renvoie toujours -1 si b est YEAR ou rolling_year pour indiquer qu'il faut toujours
     *  utiliser le segment b si cest la question initiale
     * @param segment_type_a
     * @param segment_type_b
     */
    public compareSegmentTypes(segment_type_a: number, segment_type_b: number): number {
        if (segment_type_a == segment_type_b) {
            return 0;
        }

        if ((segment_type_b == TimeSegment.TYPE_YEAR) || (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)) {
            return -1;
        }

        switch (segment_type_a) {
            case TimeSegment.TYPE_YEAR:
                return 1;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return 1;
            case TimeSegment.TYPE_MONTH:
                return 1;

            case TimeSegment.TYPE_WEEK:
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return -1;
                }
                return 1;

            case TimeSegment.TYPE_DAY:
                if ((segment_type_b == TimeSegment.TYPE_MONTH) ||
                    (segment_type_b == TimeSegment.TYPE_WEEK)) {
                    return -1;
                }
                return 1;

            case TimeSegment.TYPE_HOUR:
                if ((segment_type_b == TimeSegment.TYPE_MONTH) ||
                    (segment_type_b == TimeSegment.TYPE_WEEK) ||
                    (segment_type_b == TimeSegment.TYPE_DAY)) {
                    return -1;
                }
                return 1;
            case TimeSegment.TYPE_MINUTE:
                if ((segment_type_b == TimeSegment.TYPE_MONTH) ||
                    (segment_type_b == TimeSegment.TYPE_WEEK) ||
                    (segment_type_b == TimeSegment.TYPE_DAY) ||
                    (segment_type_b == TimeSegment.TYPE_HOUR)) {
                    return -1;
                }
                return 1;
            case TimeSegment.TYPE_SECOND:
                if ((segment_type_b == TimeSegment.TYPE_MONTH) ||
                    (segment_type_b == TimeSegment.TYPE_WEEK) ||
                    (segment_type_b == TimeSegment.TYPE_DAY) ||
                    (segment_type_b == TimeSegment.TYPE_MINUTE) ||
                    (segment_type_b == TimeSegment.TYPE_HOUR)) {
                    return -1;
                }
                return 1;
        }

        return null;
    }

    public getBiggestTimeSegmentationType(segment_type_a: number, segment_type_b: number): number {
        switch (segment_type_a) {
            case TimeSegment.TYPE_YEAR:
                return TimeSegment.TYPE_YEAR;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
            case TimeSegment.TYPE_MONTH:
                if (segment_type_b == TimeSegment.TYPE_YEAR) {
                    return TimeSegment.TYPE_YEAR;
                }
                if (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) {
                    return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
                }
                return TimeSegment.TYPE_MONTH;
            case TimeSegment.TYPE_WEEK:
                if (segment_type_b == TimeSegment.TYPE_YEAR) {
                    return TimeSegment.TYPE_YEAR;
                }
                if (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) {
                    return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                return TimeSegment.TYPE_WEEK;
            case TimeSegment.TYPE_DAY:
                if (segment_type_b == TimeSegment.TYPE_YEAR) {
                    return TimeSegment.TYPE_YEAR;
                }
                if (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) {
                    return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                return TimeSegment.TYPE_DAY;
            case TimeSegment.TYPE_HOUR:
                if (segment_type_b == TimeSegment.TYPE_YEAR) {
                    return TimeSegment.TYPE_YEAR;
                }
                if (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) {
                    return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                return TimeSegment.TYPE_HOUR;
            case TimeSegment.TYPE_MINUTE:
                if (segment_type_b == TimeSegment.TYPE_YEAR) {
                    return TimeSegment.TYPE_YEAR;
                }
                if (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) {
                    return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                return TimeSegment.TYPE_MINUTE;
            case TimeSegment.TYPE_SECOND:
                if (segment_type_b == TimeSegment.TYPE_YEAR) {
                    return TimeSegment.TYPE_YEAR;
                }
                if (segment_type_b == TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) {
                    return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                return TimeSegment.TYPE_HOUR;
        }
    }

    public getSmallestTimeSegmentationType(segment_type_a: number, segment_type_b: number): number {
        switch (segment_type_a) {
            case TimeSegment.TYPE_SECOND:
                return TimeSegment.TYPE_SECOND;
            case TimeSegment.TYPE_MINUTE:
                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                return TimeSegment.TYPE_MINUTE;
            case TimeSegment.TYPE_HOUR:
                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                return TimeSegment.TYPE_HOUR;

            case TimeSegment.TYPE_DAY:
                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                return TimeSegment.TYPE_DAY;
            case TimeSegment.TYPE_WEEK:
                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                return TimeSegment.TYPE_WEEK;
            case TimeSegment.TYPE_MONTH:

                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                return TimeSegment.TYPE_MONTH;
            case TimeSegment.TYPE_YEAR:

                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                return TimeSegment.TYPE_YEAR;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:

                if (segment_type_b == TimeSegment.TYPE_SECOND) {
                    return TimeSegment.TYPE_SECOND;
                }
                if (segment_type_b == TimeSegment.TYPE_MINUTE) {
                    return TimeSegment.TYPE_MINUTE;
                }
                if (segment_type_b == TimeSegment.TYPE_HOUR) {
                    return TimeSegment.TYPE_HOUR;
                }
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                if (segment_type_b == TimeSegment.TYPE_MONTH) {
                    return TimeSegment.TYPE_MONTH;
                }
                return TimeSegment.TYPE_ROLLING_YEAR_MONTH_START;
        }
    }

    /**
     *
     * @param start
     * @param end
     * @param time_segment_type
     */
    public getAllDataTimeSegments(start: number, end: number, time_segment_type: number, exclude_end: boolean = false): TimeSegment[] {

        if ((!start) || (!end) || (time_segment_type == null) || (typeof time_segment_type === 'undefined')) {
            return null;
        }

        let res: TimeSegment[] = [];

        let date: number = Dates.startOf(start, time_segment_type);
        let stop_at: number = Dates.startOf(end, time_segment_type);

        while (((!exclude_end) && (date <= stop_at)) || (exclude_end && ((date < stop_at) ||
            (Dates.isSame(date, stop_at, TimeSegment.TYPE_DAY) && Dates.isSame(stop_at, start, TimeSegment.TYPE_DAY))))) {

            let timeSegment: TimeSegment = TimeSegment.createNew(date, time_segment_type);
            res.push(timeSegment);

            date = Dates.add(date, 1, time_segment_type);
        }

        return res;
    }

    /**
     *
     * @param timeSegment
     * @param type_cumul Type > au timesegment.type (YEAR si le segment est MONTH par exemple au minimum)
     * @returns Corresponding CumulTimeSegment
     */
    public getParentTimeSegment(timeSegment: TimeSegment): TimeSegment {
        let type: number = null;

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                // Impossible de gérer ce cas;
                return null;
            case TimeSegment.TYPE_MONTH:
                type = TimeSegment.TYPE_YEAR;
                break;
            case TimeSegment.TYPE_WEEK:
                type = TimeSegment.TYPE_YEAR;
                break;
            case TimeSegment.TYPE_DAY:
            default:
                type = TimeSegment.TYPE_MONTH;
                break;
            case TimeSegment.TYPE_HOUR:
                type = TimeSegment.TYPE_DAY;
                break;
            case TimeSegment.TYPE_MINUTE:
                type = TimeSegment.TYPE_HOUR;
                break;
            case TimeSegment.TYPE_SECOND:
                type = TimeSegment.TYPE_MINUTE;
                break;
        }

        return TimeSegment.createNew(Dates.startOf(timeSegment.index, type), type);
    }

    /**
     *
     * @param timeSegment
     * @returns Corresponding CumulTimeSegment
     */
    public getCumulTimeSegments(timeSegment: TimeSegment): TimeSegment[] {

        if (!timeSegment) {
            return null;
        }

        let res: TimeSegment[] = [];
        let parentTimeSegment: TimeSegment = this.getParentTimeSegment(timeSegment);

        if (!parentTimeSegment) {
            return null;
        }

        let start_period = this.getStartTimeSegment(parentTimeSegment);
        let end_period = this.getEndTimeSegment(timeSegment);

        return this.getAllDataTimeSegments(start_period, end_period, timeSegment.type, true);
    }

    public forceStartSegment(date: number, segment_type: number): void {

        return Dates.add(date, offset, segment_type);
        switch (segment_type) {
            case TimeSegment.TYPE_HOUR:
                date.startOf('hour');
                break;
            case TimeSegment.TYPE_MINUTE:
                date.startOf('minute');
                break;
            case TimeSegment.TYPE_MONTH:
                date.startOf('month');
                break;
            case TimeSegment.TYPE_MS:
                date.startOf('ms');
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                date.startOf('year');
                break;
            case TimeSegment.TYPE_SECOND:
                date.startOf('second');
                break;
            case TimeSegment.TYPE_WEEK:
                date.startOf('week');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date.startOf('day');
                break;
        }
    }

    /**
     *
     * @param timeSegment
     * @returns Inclusive lower bound of the timeSegment
     */
    public getStartTimeSegment(timeSegment: TimeSegment): Moment {
        return moment(timeSegment.index).startOf('day').utc(true);
    }

    /**
     *
     * @param timeSegment
     * @returns Exclusive upper bound of the timeSegment
     */
    public getEndTimeSegment(timeSegment: TimeSegment): Moment {

        if (!timeSegment) {
            return null;
        }

        let res: Moment = null;
        let type = this.getCorrespondingMomentUnitOfTime(timeSegment.type);

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                res = moment(timeSegment.index).startOf('day').utc(true);
                res = res.add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                res = moment(timeSegment.index).startOf('day').utc(true);
                res = res.add(1, 'month');
                break;
            case TimeSegment.TYPE_WEEK:
                res = moment(timeSegment.index).startOf('day').utc(true);
                res = res.add(1, 'week');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res = moment(timeSegment.index).startOf('day').utc(true);
                res = res.add(1, 'day');
                break;
            case TimeSegment.TYPE_HOUR:
            case TimeSegment.TYPE_MINUTE:
            case TimeSegment.TYPE_SECOND:
            case TimeSegment.TYPE_MS:
                res = moment(timeSegment.index).startOf(type).utc(true);
                res = res.add(1, type);
                break;
        }

        return res;
    }

    /**
     *
     * @param timeSegment
     * @param type_inclusion choose the granularity of the inclusive bound (day or month)
     * @returns Inclusive upper bound of the timeSegment (according to type_inclusion segmentation (last day of month, but not last second...))
     */
    public getInclusiveEndTimeSegment(timeSegment: TimeSegment, type_inclusion: number = TimeSegment.TYPE_DAY): Moment {

        if (!timeSegment) {
            return null;
        }

        let res: Moment = moment(timeSegment.dateIndex).utc(true);

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                res = res.add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                res = res.add(1, 'month');
                break;
            case TimeSegment.TYPE_WEEK:
                res = res.add(1, 'week');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res = res.add(1, 'day');
                break;
            case TimeSegment.TYPE_HOUR:
            case TimeSegment.TYPE_MINUTE:
            case TimeSegment.TYPE_SECOND:
            case TimeSegment.TYPE_MS:
                res = res.add(1, this.getCorrespondingMomentUnitOfTime(timeSegment.type));
                break;
        }

        switch (type_inclusion) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_WEEK:
                break;
            case TimeSegment.TYPE_MONTH:
                res = res.add(-1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res = res.add(-1, 'day');
                break;
            case TimeSegment.TYPE_HOUR:
            case TimeSegment.TYPE_MINUTE:
            case TimeSegment.TYPE_SECOND:
            case TimeSegment.TYPE_MS:
                res = res.add(-1, this.getCorrespondingMomentUnitOfTime(type_inclusion));
                break;
        }

        return res;
    }


    public getPreviousTimeSegments(timeSegments: TimeSegment[], type: number = null, offset: number = 1): TimeSegment[] {

        if (!timeSegments) {
            return null;
        }

        let res: TimeSegment[] = [];

        for (let i in timeSegments) {
            res.push(this.getPreviousTimeSegment(timeSegments[i], type, offset));
        }
        return res;
    }

    /**
     * @param monthSegment TimeSegment de type month (sinon renvoie null)
     * @param date Numéro du jour dans le mois [1,31]
     * @returns Le moment correspondant
     */
    public getDateInMonthSegment(monthSegment: TimeSegment, date: number): Moment {

        if ((!monthSegment) || (!date)) {
            return null;
        }

        if (monthSegment.type != TimeSegment.TYPE_MONTH) {
            return null;
        }

        // La dateIndex d'un segment mois est le premier jour du mois.
        let res: Moment = moment(monthSegment.dateIndex).utc(true);
        res.date(date);
        return res;
    }

    /**
     *
     * @param timeSegment
     * @param type defaults to the type of the timeSegment provided as first argument
     * @param offset defaults to 1. Use -1 to get the next segment for example
     * @returns new TimeSegment
     */
    public getPreviousTimeSegment(timeSegment: TimeSegment, type: number = null, offset: number = 1): TimeSegment {
        if (!timeSegment) {
            return null;
        }

        let res: TimeSegment = TimeSegment.createNew(moment(timeSegment.index).utc(true), timeSegment.type);
        type = ((type == null) || (typeof type === "undefined")) ? timeSegment.type : type;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                res.index = res.index.add(-offset, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                res.index = res.index.add(-offset, 'month');
                break;
            case TimeSegment.TYPE_WEEK:
                res.index = res.index.add(-offset, 'week');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res.index = res.index.add(-offset, 'day');
                break;
            case TimeSegment.TYPE_HOUR:
            case TimeSegment.TYPE_MINUTE:
            case TimeSegment.TYPE_SECOND:
            case TimeSegment.TYPE_MS:
                res.index = res.index.add(-offset, this.getCorrespondingMomentUnitOfTime(type));
                break;
        }

        return res;
    }

    /**
     * ATTENTION : modifie le TS sans copie
     * @param timeSegment
     * @param type defaults to the type of the timeSegment provided as first argument
     * @param offset defaults to 1.
     */
    public decTimeSegment(timeSegment: TimeSegment, type: number = null, offset: number = 1): void {
        if (!timeSegment) {
            return null;
        }

        type = ((type == null) || (typeof type === "undefined")) ? timeSegment.type : type;
        timeSegment.index = Dates.add(timeSegment.index, -offset, type);
    }

    /**
     * ATTENTION : modifie le TS sans copie
     * @param timeSegment
     * @param type defaults to the type of the timeSegment provided as first argument
     * @param offset defaults to 1.
     */
    public incTimeSegment(timeSegment: TimeSegment, type: number = null, offset: number = 1): void {
        if (!timeSegment) {
            return null;
        }

        type = ((type == null) || (typeof type === "undefined")) ? timeSegment.type : type;
        timeSegment.index = Dates.add(timeSegment.index, offset, type);
    }

    public getCorrespondingTimeSegments(dates: Moment[] | string[], type: number, offset: number = 0): TimeSegment[] {
        let res: TimeSegment[] = [];

        for (let i in dates) {
            res.push(this.getCorrespondingTimeSegment(dates[i], type, offset));
        }
        return res;
    }

    public getCorrespondingTimeSegment(date: number, type: number, offset: number = 0): TimeSegment {

        if ((type == null) || (typeof type === 'undefined')) {
            type = TimeSegment.TYPE_DAY;
        }

        let res: TimeSegment = TimeSegment.createNew(moment(date).utc(true), type);

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                res.index = res.index.startOf('year').utc(true);
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                res.index = res.index.startOf('month').utc(true);
                break;
            case TimeSegment.TYPE_MONTH:
                res.index = res.index.startOf('month').utc(true);
                break;
            case TimeSegment.TYPE_WEEK:
                res.index = res.index.startOf('isoWeek').utc(true);
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res.index = res.index.startOf('day').utc(true);
                break;
            case TimeSegment.TYPE_HOUR:
                res.index = res.index.startOf('hour').utc(true);
                break;
            case TimeSegment.TYPE_MINUTE:
                res.index = res.index.startOf('minute').utc(true);
                break;
            case TimeSegment.TYPE_SECOND:
                res.index = res.index.startOf('second').utc(true);
                break;
            case TimeSegment.TYPE_MS:
                res.index = res.index.startOf('ms').utc(true);
                break;
        }

        if (offset) {
            this.decTimeSegment(res, res.type, -offset);
        }

        return res;
    }

    public isEltInSegment(date: Moment, time_segment: TimeSegment): boolean {
        if ((!date) || (!time_segment)) {
            return false;
        }

        let end: Moment;

        switch (time_segment.type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                end = moment(time_segment.index).add(1, 'year').utc(true);
                break;
            case TimeSegment.TYPE_MONTH:
                end = moment(time_segment.index).add(1, 'month').utc(true);
                break;
            case TimeSegment.TYPE_WEEK:
                end = moment(time_segment.index).add(1, 'week').utc(true);
                break;
            case TimeSegment.TYPE_DAY:
            default:
                end = moment(time_segment.index).add(1, 'day').utc(true);
                break;
            case TimeSegment.TYPE_HOUR:
                end = moment(time_segment.index).add(1, 'hour').utc(true);
                break;
            case TimeSegment.TYPE_MINUTE:
                end = moment(time_segment.index).add(1, 'minute').utc(true);
                break;
            case TimeSegment.TYPE_SECOND:
                end = moment(time_segment.index).add(1, 'second').utc(true);
                break;
            case TimeSegment.TYPE_MS:
                end = moment(time_segment.index).add(1, 'ms').utc(true);
                break;
        }

        return date.isSameOrAfter(time_segment.index) && date.isBefore(end);
    }

    /**
     * @param ts1
     * @param ts2
     * @param type Par défaut on prend le plus grand ensemble
     */
    public isInSameSegmentType(ts1: TimeSegment, ts2: TimeSegment, type: number = null): boolean {

        if ((!ts1) || (!ts2)) {
            return false;
        }

        if ((type == null) || (typeof type === "undefined")) {
            type = Math.min(ts1.type, ts2.type);
        }

        let start: number = ts1.index;
        let end: number;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                start = Dates.startOf(start, TimeSegment.TYPE_YEAR);
                end = Dates.add(start, 1, TimeSegment.TYPE_YEAR);
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                start = Dates.startOf(start, TimeSegment.TYPE_YEAR);
                end = Dates.add(start, 1, TimeSegment.TYPE_YEAR);
                start = start.startOf('month');
                end = moment(start).add(1, 'year').utc(true);
                break;
            case TimeSegment.TYPE_MONTH:
                start = Dates.startOf(start, TimeSegment.TYPE_YEAR);
                end = Dates.add(start, 1, TimeSegment.TYPE_YEAR);
                start = start.startOf('month');
                end = moment(start).add(1, 'month').utc(true);
                break;
            case TimeSegment.TYPE_WEEK:
                start = Dates.startOf(start, TimeSegment.TYPE_is);
                end = Dates.add(start, 1, TimeSegment.TYPE_YEAR);
                start = start.startOf('isoWeek');
                end = moment(start).add(1, 'week').utc(true);
                break;
            case TimeSegment.TYPE_DAY:
            default:
                start = Dates.startOf(start, TimeSegment.TYPE_DAY);
                end = Dates.add(start, 1, TimeSegment.TYPE_DAY);
                break;
            case TimeSegment.TYPE_HOUR:
                start = Dates.startOf(start, TimeSegment.TYPE_HOUR);
                end = Dates.add(start, 1, TimeSegment.TYPE_HOUR);
                break;
            case TimeSegment.TYPE_MINUTE:
                start = Dates.startOf(start, TimeSegment.TYPE_MINUTE);
                end = Dates.add(start, 1, TimeSegment.TYPE_MINUTE);
                break;
            case TimeSegment.TYPE_SECOND:
                start = Dates.startOf(start, TimeSegment.TYPE_SECOND);
                end = Dates.add(start, 1, TimeSegment.TYPE_SECOND);
                break;
        }

        return ts2.index.isSameOrAfter(start) && ts2.index.isBefore(end);
    }

    public segmentsAreEquivalent(ts1: TimeSegment, ts2: TimeSegment): boolean {

        if ((!ts1) && ts2) {
            return false;
        }

        if (ts1 && (!ts2)) {
            return false;
        }

        if ((!ts1) && (!ts2)) {
            return true;
        }

        if (ts1.type != ts2.type) {
            return false;
        }

        if (!ts1.index.isSame(ts2.index)) {
            return false;
        }

        return true;
    }

    public get_date_indexes(segments: TimeSegment[]): string[] {
        let res: string[] = [];

        for (let i in segments) {
            res.push(segments[i].dateIndex);
        }

        return res;
    }

    public get_ts_ranges(segments: TimeSegment[]): TSRange[] {
        return RangeHandler.getInstance().getRangesUnion(this.get_ts_ranges_(segments));
    }

    public get_surrounding_ts_range(segments: TimeSegment[]): TSRange {
        return RangeHandler.getInstance().getMinSurroundingRange(this.get_ts_ranges_(segments));
    }

    public get_segment_from_range_start(ts_range: TSRange, segment_type: number): TimeSegment {
        if (!ts_range) {
            return null;
        }

        let min = RangeHandler.getInstance().getSegmentedMin(ts_range, segment_type);
        return this.getCorrespondingTimeSegment(min, segment_type);
    }

    public get_segment_from_range_end(ts_range: TSRange, segment_type: number): TimeSegment {
        if (!ts_range) {
            return null;
        }

        let max = RangeHandler.getInstance().getSegmentedMax(ts_range, segment_type);
        return this.getCorrespondingTimeSegment(max, segment_type);
    }

    public getCorrespondingMomentUnitOfTime(segment_type: number): moment.unitOfTime.Base {
        switch (segment_type) {
            case TimeSegment.TYPE_DAY:
                return 'day';
            case TimeSegment.TYPE_WEEK:
                return 'week';
            case TimeSegment.TYPE_MONTH:
                return 'month';
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                return 'year';
            case TimeSegment.TYPE_HOUR:
                return 'hour';
            case TimeSegment.TYPE_MINUTE:
                return 'minute';
            case TimeSegment.TYPE_SECOND:
                return 'second';
        }
        return null;
    }

    private get_ts_ranges_(segments: TimeSegment[]): TSRange[] {
        let res: TSRange[] = [];

        for (let i in segments) {
            let range: TSRange = TSRange.createNew(
                TimeSegmentHandler.getInstance().getStartTimeSegment(segments[i]),
                TimeSegmentHandler.getInstance().getEndTimeSegment(segments[i]),
                true,
                false,
                segments[i].type);
            res.push(range);
        }

        return res;
    }
}