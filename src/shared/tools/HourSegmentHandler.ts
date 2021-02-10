import * as moment from 'moment';
import { Moment } from 'moment';
import HourSegment from '../modules/DataRender/vos/HourSegment';
import HourRange from '../modules/DataRender/vos/HourRange';
import RangeHandler from './RangeHandler';
import { deepEqual, deepStrictEqual } from 'assert';

export default class HourSegmentHandler {

    /* istanbul ignore next: nothing to test here */
    public static getInstance(): HourSegmentHandler {
        if (!HourSegmentHandler.instance) {
            HourSegmentHandler.instance = new HourSegmentHandler();
        }
        return HourSegmentHandler.instance;
    }

    private static instance: HourSegmentHandler = null;

    private constructor() { }

    public getBiggestHourSegmentationType(segment_type_a: number, segment_type_b: number): number {
        if (segment_type_a == null || segment_type_b == null) {
            return null;
        }
        return Math.min(segment_type_a, segment_type_b);
    }

    public getSmallestHourSegmentationType(segment_type_a: number, segment_type_b: number): number {
        if (segment_type_a == null || segment_type_b == null) {
            return null;
        }
        return Math.max(segment_type_a, segment_type_b);
    }

    /**
     *
     * @param start
     * @param end
     * @param time_segment_type
     */
    public getAllSegments(start: moment.Duration, end: moment.Duration, time_segment_type: number, exclude_end: boolean = false): HourSegment[] {

        if ((!start) || (!end) || (time_segment_type == null) || (typeof time_segment_type === 'undefined')) {
            return null;
        }

        let res: HourSegment[] = [];

        let time: moment.Duration = this.getStartHour(start, time_segment_type);

        let stop_at: moment.Duration = this.getStartHour(end, time_segment_type);
        let stop_atms: number = stop_at.asMilliseconds();

        let segment: HourSegment = this.getCorrespondingHourSegment(time, time_segment_type);
        let timems: number = segment.index.asMilliseconds();

        while (((!exclude_end) && (timems <= stop_atms)) || (exclude_end && (timems < stop_atms))) {

            res.push(HourSegment.createNew(segment.index.clone(), segment.type));
            this.incHourSegment(segment);

            timems = segment.index.asMilliseconds();
        }

        return res;
    }

    /**
     * TODO TU ASAP
     * @param hourSegment
     * @param type_cumul Type > au Hoursegment.type (YEAR si le segment est MONTH par exemple au minimum)
     * @returns Corresponding CumulHourSegment
     */
    public getParentHourSegment(hourSegment: HourSegment): HourSegment {

        if (hourSegment == null || typeof hourSegment == "undefined") {
            return null;
        }
        let type: number = null;
        let ms: number = null;

        switch (hourSegment.type) {
            case HourSegment.TYPE_HOUR:
                // Impossible de gérer ce cas;
                return null;
            case HourSegment.TYPE_MINUTE:
                type = HourSegment.TYPE_HOUR;
                ms = Math.floor(hourSegment.index.asHours()) * 60 * 60 * 1000;
                break;
            case HourSegment.TYPE_SECOND:
                type = HourSegment.TYPE_MINUTE;
                ms = Math.floor(hourSegment.index.asMinutes()) * 60 * 1000;
                break;
            case HourSegment.TYPE_MS:
            default:
                type = HourSegment.TYPE_SECOND;
                ms = Math.floor(hourSegment.index.asSeconds()) * 1000;
        }

        let res: HourSegment = HourSegment.createNew(moment.duration(ms), type);

        return res;
    }

    /**
     *
     * @param hourSegment
     * @returns Corresponding CumulHourSegment
     */
    public getCumulHourSegments(hourSegment: HourSegment): HourSegment[] {

        if (!hourSegment) {
            return null;
        }

        let res: HourSegment[] = [];
        let parentHourSegment: HourSegment = this.getParentHourSegment(hourSegment);

        if (!parentHourSegment) {
            return null;
        }

        let start_period = this.getStartHourSegment(parentHourSegment);
        let end_period = this.getEndHourSegment(hourSegment);

        return this.getAllSegments(start_period, end_period, hourSegment.type, true);
    }

    /**
     * ATTENTION le param est directement modifié, sans copie
     * @param time
     * @param segment_type
     * @param offset
     */
    public incElt(time: moment.Duration, segment_type: number, offset: number): void {
        if (time == null || segment_type == null) {
            return null;
        }

        time.add(offset, this.getCorrespondingMomentUnitOfTime(segment_type));
    }

    /**
     * ATTENTION la date est directement modifiée, sans copie
     * @param date
     * @param segment_type
     * @param offset
     */
    public decMoment(date: moment.Duration, segment_type: number, offset: number): void {
        this.incElt(date, segment_type, -offset);
    }

    /**
     *
     * @param hourSegment
     * @returns Inclusive lower bound of the HourSegment
     */
    public getStartHourSegment(hourSegment: HourSegment): moment.Duration {

        if ((!hourSegment) || (!hourSegment.index)) {
            return null;
        }

        return this.getStartHour(hourSegment.index, hourSegment.type);
    }

    /**
     * @param hourSegment
     * @returns Inclusive lower bound of the HourSegment
     */
    public getStartHour(time: moment.Duration, segment_type: number): moment.Duration {

        if (!time || segment_type == null) {
            return null;
        }

        switch (segment_type) {
            case HourSegment.TYPE_HOUR:
                return moment.duration(Math.floor(time.asHours()) * 60 * 60 * 1000);
            case HourSegment.TYPE_MINUTE:
                return moment.duration(Math.floor(time.asMinutes()) * 60 * 1000);
            case HourSegment.TYPE_SECOND:
                return moment.duration(Math.floor(time.asSeconds()) * 1000);
            case HourSegment.TYPE_MS:
            default:
                return time.clone();
        }
    }

    /**
     *
     * @param hourSegment
     * @returns Exclusive upper bound of the HourSegment
     */
    public getEndHourSegment(hourSegment: HourSegment): moment.Duration {

        if ((!hourSegment) || (!hourSegment.index) || (hourSegment.type == null)) {
            return null;
        }

        let start: moment.Duration = this.getStartHourSegment(hourSegment);
        switch (hourSegment.type) {
            case HourSegment.TYPE_HOUR:
                start.add(1, 'hour');
                return start;
            case HourSegment.TYPE_MINUTE:
                start.add(1, 'minute');
                return start;
            case HourSegment.TYPE_SECOND:
                start.add(1, 'second');
                return start;
            case HourSegment.TYPE_MS:
            default:
                start.add(1, 'ms');
                return start;
        }
    }

    /**
     *
     * @param hourSegment
     * @param type_inclusion choose the granularity of the inclusive bound (day or month)
     * @returns Inclusive upper bound of the HourSegment (according to type_inclusion segmentation (last day of month, but not last second...))
     */
    public getInclusiveEndHourSegment(hourSegment: HourSegment, type_inclusion: number = HourSegment.TYPE_MS): moment.Duration {

        if (!hourSegment || !hourSegment.index || hourSegment.type == null) {
            return null;
        }

        let end: moment.Duration = this.getEndHourSegment(hourSegment);
        switch (type_inclusion) {
            case HourSegment.TYPE_HOUR:
                end.add(-1, 'hour');
                return end;
            case HourSegment.TYPE_MINUTE:
                end.add(-1, 'minute');
                return end;
            case HourSegment.TYPE_SECOND:
                end.add(-1, 'second');
                return end;
            case HourSegment.TYPE_MS:
            default:
                end.add(-1, 'ms');
                return end;
        }
    }

    public getPreviousHourSegments(hourSegments: HourSegment[], type: number = null, offset: number = 1): HourSegment[] {

        if (!hourSegments) {
            return null;
        }

        let res: HourSegment[] = [];

        for (let i in hourSegments) {
            res.push(this.getPreviousHourSegment(hourSegments[i], type, offset));
        }
        return res;
    }

    /**
     *
     * @param hourSegment
     * @param type defaults to the type of the HourSegment provided as first argument
     * @param offset defaults to 1. Use -1 to get the next segment for example
     * @returns new HourSegment
     */
    public getPreviousHourSegment(hourSegment: HourSegment, type: number = null, offset: number = 1): HourSegment {
        if (!hourSegment || !hourSegment.index || hourSegment.type == null) {
            return null;
        }

        if (type == null) {
            type = hourSegment.type;
        }

        let start: moment.Duration = this.getStartHourSegment(hourSegment);
        this.incElt(start, type, -offset);

        return HourSegment.createNew(start, hourSegment.type);
    }

    /**
     * ATTENTION : modifie le segment sans copie
     * @param hourSegment
     * @param type defaults to the type of the HourSegment provided as first argument
     * @param offset defaults to 1.
     */
    public decHourSegment(hourSegment: HourSegment, type: number = null, offset: number = 1): void {
        if (!hourSegment) {
            return null;
        }

        type = ((type == null) || (typeof type === "undefined")) ? hourSegment.type : type;
        this.decMoment(hourSegment.index, type, offset);
    }

    /**
     * ATTENTION : modifie le segment sans copie
     * @param hourSegment
     * @param type defaults to the type of the HourSegment provided as first argument
     * @param offset defaults to 1.
     */
    public incHourSegment(hourSegment: HourSegment, type: number = null, offset: number = 1): void {
        if (!hourSegment) {
            return null;
        }

        type = ((type == null) || (typeof type === "undefined")) ? hourSegment.type : type;
        this.incElt(hourSegment.index, type, offset);
    }

    public getCorrespondingHourSegments(dates: moment.Duration[], type: number, offset: number = 0): HourSegment[] {
        let res: HourSegment[] = [];

        for (let i in dates) {
            res.push(this.getCorrespondingHourSegment(dates[i], type, offset));
        }
        return res;
    }

    public getCorrespondingHourSegment(time: moment.Duration, type: number, offset: number = 0): HourSegment {
        if (time == null) {
            return null;
        }

        if ((type == null) || (typeof type === 'undefined')) {
            type = HourSegment.TYPE_MS;
        }

        let res: HourSegment = HourSegment.createNew(this.getStartHour(time, type), type);

        if (offset) {
            this.incHourSegment(res, res.type, offset);
        }

        return res;
    }

    public isEltInSegment(date: moment.Duration, hour_segment: HourSegment): boolean {
        if ((!date) || (!hour_segment)) {
            return false;
        }

        let end: moment.Duration = this.getEndHourSegment(hour_segment);
        let ms = date.asMilliseconds();

        return (ms >= hour_segment.index.asMilliseconds()) && (ms < end.asMilliseconds());
    }

    /**
     * @param ts1
     * @param ts2
     * @param type Par défaut on prend le plus grand ensemble
     */
    public isInSameSegmentType(ts1: HourSegment, ts2: HourSegment, type: number = null): boolean {

        if ((!ts1) || (!ts2)) {
            return false;
        }

        if ((type == null) || (typeof type === "undefined")) {
            type = Math.min(ts1.type, ts2.type);
        }

        let start: moment.Duration = this.getStartHour(ts1.index, type);
        let end: moment.Duration = start.clone();
        this.incElt(end, type, 1);

        let ms = ts2.index.asMilliseconds();

        return (ms >= start.asMilliseconds()) && (ms < end.asMilliseconds());
    }

    public segmentsAreEquivalent(ts1: HourSegment, ts2: HourSegment): boolean {
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

        if (ts1.index.asMilliseconds() != ts2.index.asMilliseconds()) {
            return false;
        }

        return true;
    }

    public get_ts_ranges(segments: HourSegment[]): HourRange[] {
        return RangeHandler.getInstance().getRangesUnion(this.get_hour_ranges_(segments));
    }

    public get_surrounding_ts_range(segments: HourSegment[]): HourRange {
        return RangeHandler.getInstance().getMinSurroundingRange(this.get_hour_ranges_(segments));
    }

    public get_segment_from_range_start(ts_range: HourRange, segment_type: number): HourSegment {
        if (!ts_range) {
            return null;
        }

        if (segment_type == null) {
            segment_type = HourSegment.TYPE_MINUTE;
        }

        let min = RangeHandler.getInstance().getSegmentedMin(ts_range, segment_type);
        return this.getCorrespondingHourSegment(min, segment_type);
    }

    public get_segment_from_range_end(ts_range: HourRange, segment_type: number): HourSegment {
        if (!ts_range) {
            return null;
        }

        if (segment_type == null) {
            segment_type = HourSegment.TYPE_MINUTE;
        }

        let max = RangeHandler.getInstance().getSegmentedMax(ts_range, segment_type);
        return this.getCorrespondingHourSegment(max, segment_type);
    }

    public getCorrespondingMomentUnitOfTime(segment_type: number): moment.unitOfTime.Base {
        switch (segment_type) {
            case HourSegment.TYPE_HOUR:
                return 'hour';
            case HourSegment.TYPE_MINUTE:
                return 'minute';
            case HourSegment.TYPE_SECOND:
                return 'second';
            case HourSegment.TYPE_MS:
                return 'ms';
        }
        return null;
    }

    private get_hour_ranges_(segments: HourSegment[]): HourRange[] {
        let res: HourRange[] = [];

        for (let i in segments) {
            let range: HourRange = HourRange.createNew(
                HourSegmentHandler.getInstance().getStartHourSegment(segments[i]),
                HourSegmentHandler.getInstance().getEndHourSegment(segments[i]),
                true,
                false,
                segments[i].type);
            res.push(range);
        }

        return res;
    }
}