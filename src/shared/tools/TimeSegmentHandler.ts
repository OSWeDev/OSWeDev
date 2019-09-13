import * as moment from 'moment';
import { Moment } from 'moment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import TSRangeHandler from './TSRangeHandler';

export default class TimeSegmentHandler {
    public static getInstance(): TimeSegmentHandler {
        if (!TimeSegmentHandler.instance) {
            TimeSegmentHandler.instance = new TimeSegmentHandler();
        }
        return TimeSegmentHandler.instance;
    }

    private static instance: TimeSegmentHandler = null;

    private constructor() { }

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
        }
    }

    public getSmallestTimeSegmentationType(segment_type_a: number, segment_type_b: number): number {
        switch (segment_type_a) {
            case TimeSegment.TYPE_DAY:
                return TimeSegment.TYPE_DAY;
            case TimeSegment.TYPE_WEEK:
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                return TimeSegment.TYPE_WEEK;
            case TimeSegment.TYPE_MONTH:
                if (segment_type_b == TimeSegment.TYPE_DAY) {
                    return TimeSegment.TYPE_DAY;
                }
                if (segment_type_b == TimeSegment.TYPE_WEEK) {
                    return TimeSegment.TYPE_WEEK;
                }
                return TimeSegment.TYPE_MONTH;
            case TimeSegment.TYPE_YEAR:
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
    public getAllDataTimeSegments(start: Moment, end: Moment, time_segment_type: number, exclude_end: boolean = false): TimeSegment[] {

        if ((!start) || (!end) || (time_segment_type == null) || (typeof time_segment_type === 'undefined')) {
            return null;
        }

        let res: TimeSegment[] = [];
        let date: Moment = moment(start);
        let stop_at: Moment = moment(end);

        switch (time_segment_type) {
            case TimeSegment.TYPE_YEAR:
                date = date.startOf('year');
                stop_at = stop_at.startOf('year');
                break;
            case TimeSegment.TYPE_MONTH:
                date = date.startOf('month');
                stop_at = stop_at.startOf('month');
                break;
            case TimeSegment.TYPE_WEEK:
                date = date.startOf('isoWeek');
                stop_at = stop_at.startOf('isoWeek');
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                date = date.startOf('month');
                stop_at = stop_at.startOf('month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date = date.startOf('day');
                stop_at = stop_at.startOf('day');
        }

        while (((!exclude_end) && date.isSameOrBefore(stop_at)) || (exclude_end && (date.isBefore(stop_at) || (date.isSame(stop_at, 'day') && stop_at.isSame(start, 'day'))))) {

            let timeSegment: TimeSegment = TimeSegment.createNew(date, time_segment_type);
            res.push(timeSegment);

            switch (time_segment_type) {
                case TimeSegment.TYPE_YEAR:
                case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                    date = moment(date).add(1, 'year');
                    break;
                case TimeSegment.TYPE_MONTH:
                    date = moment(date).add(1, 'month');
                    break;
                case TimeSegment.TYPE_WEEK:
                    date = moment(date).add(1, 'week');
                    break;
                case TimeSegment.TYPE_DAY:
                default:
                    date = moment(date).add(1, 'day');
            }
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
        let date_segment: Moment = moment(timeSegment.date);
        let type: number = null;
        let date: Moment = null;

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                // Impossible de gérer ce cas;
                return null;
            case TimeSegment.TYPE_MONTH:
                type = TimeSegment.TYPE_YEAR;
                date = date_segment.startOf('year');
                break;
            case TimeSegment.TYPE_WEEK:
                type = TimeSegment.TYPE_YEAR;
                date = date_segment.startOf('year');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                type = TimeSegment.TYPE_MONTH;
                date = date_segment.startOf('month');
        }

        let res: TimeSegment = TimeSegment.createNew(date, type);

        return res;
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

    /**
     * ATTENTION la date est directement modifiée, sans copie
     * @param date
     * @param segment_type
     * @param offset
     */
    public incMoment(date: Moment, segment_type: number, offset: number): void {

        switch (segment_type) {
            case TimeSegment.TYPE_HOUR:
                date.add(offset, 'hour');
                break;
            case TimeSegment.TYPE_MINUTE:
                date.add(offset, 'minute');
                break;
            case TimeSegment.TYPE_MONTH:
                date.add(offset, 'month');
                break;
            case TimeSegment.TYPE_MS:
                date.add(offset, 'ms');
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                date.add(offset, 'year');
                break;
            case TimeSegment.TYPE_SECOND:
                date.add(offset, 'second');
                break;
            case TimeSegment.TYPE_WEEK:
                date.add(offset, 'week');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date.add(offset, 'day');
                break;
        }
    }

    /**
     * ATTENTION la date est directement modifiée, sans copie
     * @param date
     * @param segment_type
     * @param offset
     */
    public decMoment(date: Moment, segment_type: number, offset: number): void {
        this.incMoment(date, segment_type, -offset);
    }

    /**
     *
     * @param timeSegment
     * @returns Inclusive lower bound of the timeSegment
     */
    public getStartTimeSegment(timeSegment: TimeSegment): Moment {
        return moment(timeSegment.date).startOf('day').utc(true);
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

        let res: Moment = moment(timeSegment.date).startOf('day').utc(true);

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

        let res: Moment = moment(timeSegment.dateIndex);

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
        let res: Moment = moment(monthSegment.dateIndex);
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

        let res: TimeSegment = TimeSegment.createNew(moment(timeSegment.date), timeSegment.type);
        type = ((type == null) || (typeof type === "undefined")) ? timeSegment.type : type;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                res.date = res.date.add(-offset, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                res.date = res.date.add(-offset, 'month');
                break;
            case TimeSegment.TYPE_WEEK:
                res.date = res.date.add(-offset, 'week');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res.date = res.date.add(-offset, 'day');
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
        this.decMoment(timeSegment.date, type, offset);
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
        this.incMoment(timeSegment.date, type, offset);
    }

    public getCorrespondingTimeSegments(dates: Moment[] | string[], type: number, offset: number = 0): TimeSegment[] {
        let res: TimeSegment[] = [];

        for (let i in dates) {
            res.push(this.getCorrespondingTimeSegment(dates[i], type, offset));
        }
        return res;
    }

    public getCorrespondingTimeSegment(date: Moment | string, type: number, offset: number = 0): TimeSegment {

        if ((type == null) || (typeof type === 'undefined')) {
            type = TimeSegment.TYPE_DAY;
        }

        let res: TimeSegment = TimeSegment.createNew(moment(date), type);

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                res.date = res.date.startOf('year').utc(true);
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                res.date = res.date.startOf('month').utc(true);
                break;
            case TimeSegment.TYPE_MONTH:
                res.date = res.date.startOf('month').utc(true);
                break;
            case TimeSegment.TYPE_WEEK:
                res.date = res.date.startOf('isoWeek').utc(true);
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res.date = res.date.startOf('day').utc(true);
        }

        if (offset) {
            this.decTimeSegment(res, res.type, -offset);
        }

        return res;
    }

    public isMomentInTimeSegment(date: Moment, time_segment: TimeSegment): boolean {
        if ((!date) || (!time_segment)) {
            return false;
        }

        let end: Moment;

        switch (time_segment.type) {
            case TimeSegment.TYPE_YEAR:
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                end = moment(time_segment.date).add(1, 'year').utc(true);
                break;
            case TimeSegment.TYPE_MONTH:
                end = moment(time_segment.date).add(1, 'month').utc(true);
                break;
            case TimeSegment.TYPE_WEEK:
                end = moment(time_segment.date).add(1, 'week').utc(true);
                break;
            case TimeSegment.TYPE_DAY:
            default:
                end = moment(time_segment.date).add(1, 'day').utc(true);
        }

        return date.isSameOrAfter(time_segment.date) && date.isBefore(end);
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

        let start: Moment = moment(ts1.date);
        let end: Moment;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                start = start.startOf('year');
                end = moment(start).add(1, 'year').utc(true);
                break;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                start = start.startOf('month');
                end = moment(start).add(1, 'year').utc(true);
                break;
            case TimeSegment.TYPE_MONTH:
                start = start.startOf('month');
                end = moment(start).add(1, 'month').utc(true);
                break;
            case TimeSegment.TYPE_WEEK:
                start = start.startOf('isoWeek');
                end = moment(start).add(1, 'week').utc(true);
                break;
            case TimeSegment.TYPE_DAY:
            default:
                start = start.startOf('day');
                end = moment(start).add(1, 'day').utc(true);
        }

        return ts2.date.isSameOrAfter(start) && ts2.date.isBefore(end);
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

        if (!ts1.date.isSame(ts2.date)) {
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
        return TSRangeHandler.getInstance().getRangesUnion(this.get_ts_ranges_(segments));
    }

    public get_surrounding_ts_range(segments: TimeSegment[]): TSRange {
        return TSRangeHandler.getInstance().getMinSurroundingRange(this.get_ts_ranges_(segments));
    }

    public get_segment_from_range_start(ts_range: TSRange, segment_type: number): TimeSegment {
        if (!ts_range) {
            return null;
        }

        let min = TSRangeHandler.getInstance().getSegmentedMin(ts_range, segment_type);
        return this.getCorrespondingTimeSegment(min, segment_type);
    }

    public get_segment_from_range_end(ts_range: TSRange, segment_type: number): TimeSegment {
        if (!ts_range) {
            return null;
        }

        let max = TSRangeHandler.getInstance().getSegmentedMax(ts_range, segment_type);
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