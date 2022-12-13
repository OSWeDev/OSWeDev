

import { unitOfTime } from 'moment';
import HourRange from '../modules/DataRender/vos/HourRange';
import HourSegment from '../modules/DataRender/vos/HourSegment';
import Durations from '../modules/FormatDatesNombres/Dates/Durations';
import RangeHandler from './RangeHandler';

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
     * Renvoi 1 si le semgent_type a est plus grand que b, -1 si plus petit, 0 si égaux
     * @param segment_type_a
     * @param segment_type_b
     */
    public compareSegmentTypes(segment_type_a: number, segment_type_b: number): number {
        if (segment_type_a == segment_type_b) {
            return 0;
        }

        if (segment_type_b == HourSegment.TYPE_HOUR) {
            return -1;
        }

        switch (segment_type_a) {
            case HourSegment.TYPE_HOUR:
                return 1;
            case HourSegment.TYPE_MINUTE:
                if (segment_type_b == HourSegment.TYPE_HOUR) {
                    return -1;
                }
                return 1;
            case HourSegment.TYPE_SECOND:
                if ((segment_type_b == HourSegment.TYPE_MINUTE) ||
                    (segment_type_b == HourSegment.TYPE_HOUR)) {
                    return -1;
                }
                return 1;
        }

        return null;
    }

    /**
     *
     * @param start
     * @param end
     * @param time_segment_type
     */
    public getAllSegments(start: number, end: number, time_segment_type: number, exclude_end: boolean = false): HourSegment[] {

        if ((!start) || (!end) || (time_segment_type === null) || (typeof time_segment_type === 'undefined')) {
            return null;
        }

        let res: HourSegment[] = [];

        let time: number = this.getStartHour(start, time_segment_type);

        let stop_at: number = this.getStartHour(end, time_segment_type);

        let segment: HourSegment = this.getCorrespondingHourSegment(time, time_segment_type);
        let timesecs: number = segment.index;

        while (((!exclude_end) && (timesecs <= stop_at)) || (exclude_end && (timesecs < stop_at))) {

            res.push(HourSegment.createNew(segment.index, segment.type));
            this.incHourSegment(segment);

            timesecs = segment.index;
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
        let sec: number = null;

        switch (hourSegment.type) {
            case HourSegment.TYPE_HOUR:
                // Impossible de gérer ce cas;
                return null;
            case HourSegment.TYPE_MINUTE:
                type = HourSegment.TYPE_HOUR;
                sec = Math.floor(Durations.as(hourSegment.index, HourSegment.TYPE_HOUR)) * 60 * 60;
                break;
            case HourSegment.TYPE_SECOND:
                type = HourSegment.TYPE_MINUTE;
                sec = Math.floor(Durations.as(hourSegment.index, HourSegment.TYPE_MINUTE)) * 60;
                break;
        }

        let res: HourSegment = HourSegment.createNew(sec, type);

        return res;
    }

    /**
     *
     * @param hourSegment
     * @returns Corresponding CumulHourSegment
     */
    public getCumulHourSegments(hourSegment: HourSegment): HourSegment[] {

        if (hourSegment == null) {
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
     *
     * @param hourSegment
     * @returns Inclusive lower bound of the HourSegment
     */
    public getStartHourSegment(hourSegment: HourSegment): number {

        if ((!hourSegment) || (!hourSegment.index)) {
            return null;
        }

        return this.getStartHour(hourSegment.index, hourSegment.type);
    }

    /**
     * @param hourSegment
     * @returns Inclusive lower bound of the HourSegment
     */
    public getStartHour(time: number, segment_type: number): number {

        if (!time || segment_type == null) {
            return null;
        }

        switch (segment_type) {
            case HourSegment.TYPE_HOUR:
                return Math.floor(Durations.as(time, segment_type)) * 60 * 60;
            case HourSegment.TYPE_MINUTE:
                return Math.floor(Durations.as(time, segment_type)) * 60;
            case HourSegment.TYPE_SECOND:
                return Math.floor(Durations.as(time, segment_type));
        }
        return null;
    }

    /**
     *
     * @param hourSegment
     * @returns Exclusive upper bound of the HourSegment
     */
    public getEndHourSegment(hourSegment: HourSegment): number {

        if ((!hourSegment) || (!hourSegment.index) || (hourSegment.type == null)) {
            return null;
        }

        let start: number = this.getStartHourSegment(hourSegment);
        return Durations.add(start, 1, hourSegment.type);
    }

    /**
     *
     * @param hourSegment
     * @param type_inclusion choose the granularity of the inclusive bound (day or month)
     * @returns Inclusive upper bound of the HourSegment (according to type_inclusion segmentation (last day of month, but not last second...))
     */
    public getInclusiveEndHourSegment(hourSegment: HourSegment, type_inclusion: number = HourSegment.TYPE_SECOND): number {

        if (!hourSegment || !hourSegment.index || hourSegment.type == null) {
            return null;
        }

        let end: number = this.getEndHourSegment(hourSegment);
        return Durations.add(end, -1, type_inclusion);
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

        let start: number = this.getStartHourSegment(hourSegment);
        start = Durations.add(start, -offset, type);

        return HourSegment.createNew(start, hourSegment.type);
    }

    /**
     * ATTENTION : modifie le segment sans copie
     * @param hourSegment
     * @param type defaults to the type of the HourSegment provided as first argument
     * @param offset defaults to 1.
     */
    public decHourSegment(hourSegment: HourSegment, type: number = null, offset: number = 1): void {
        if (hourSegment == null) {
            return null;
        }

        type = ((type === null) || (typeof type === "undefined")) ? hourSegment.type : type;
        hourSegment.index = Durations.add(hourSegment.index, -offset, type);
    }

    /**
     * ATTENTION : modifie le segment sans copie
     * @param hourSegment
     * @param type defaults to the type of the HourSegment provided as first argument
     * @param offset defaults to 1.
     */
    public incHourSegment(hourSegment: HourSegment, type: number = null, offset: number = 1): void {
        if (hourSegment == null) {
            return null;
        }

        type = ((type === null) || (typeof type === "undefined")) ? hourSegment.type : type;
        hourSegment.index = Durations.add(hourSegment.index, offset, type);
    }

    public getCorrespondingHourSegments(dates: number[], type: number, offset: number = 0): HourSegment[] {
        let res: HourSegment[] = [];

        for (let i in dates) {
            res.push(this.getCorrespondingHourSegment(dates[i], type, offset));
        }
        return res;
    }

    public getCorrespondingHourSegment(time: number, type: number, offset: number = 0): HourSegment {
        if (time == null) {
            return null;
        }

        if ((type === null) || (typeof type === 'undefined')) {
            type = HourSegment.TYPE_SECOND;
        }

        let res: HourSegment = HourSegment.createNew(this.getStartHour(time, type), type);

        if (offset) {
            this.incHourSegment(res, res.type, offset);
        }

        return res;
    }

    public isEltInSegment(date: number, hour_segment: HourSegment): boolean {
        if ((!date) || (!hour_segment)) {
            return false;
        }

        let end: number = this.getEndHourSegment(hour_segment);

        return (date >= hour_segment.index) && (date < end);
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

        if ((type === null) || (typeof type === "undefined")) {
            type = Math.min(ts1.type, ts2.type);
        }

        let start: number = this.getStartHour(ts1.index, type);
        let end: number = start;
        end = Durations.add(end, 1, type);

        return (ts2.index >= start) && (ts2.index < end);
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

        if (ts1.index != ts2.index) {
            return false;
        }

        return true;
    }

    public get_ts_ranges(segments: HourSegment[]): HourRange[] {
        return RangeHandler.getRangesUnion(this.get_hour_ranges_(segments));
    }

    public get_surrounding_ts_range(segments: HourSegment[]): HourRange {
        return RangeHandler.getMinSurroundingRange(this.get_hour_ranges_(segments));
    }

    public get_segment_from_range_start(ts_range: HourRange, segment_type: number): HourSegment {
        if (!ts_range) {
            return null;
        }

        if (segment_type == null) {
            segment_type = HourSegment.TYPE_MINUTE;
        }

        let min = RangeHandler.getSegmentedMin(ts_range, segment_type);
        return this.getCorrespondingHourSegment(min, segment_type);
    }

    public get_segment_from_range_end(ts_range: HourRange, segment_type: number): HourSegment {
        if (!ts_range) {
            return null;
        }

        if (segment_type == null) {
            segment_type = HourSegment.TYPE_MINUTE;
        }

        let max = RangeHandler.getSegmentedMax(ts_range, segment_type);
        return this.getCorrespondingHourSegment(max, segment_type);
    }

    public getCorrespondingMomentUnitOfTime(segment_type: number): unitOfTime.Base {
        switch (segment_type) {
            case HourSegment.TYPE_HOUR:
                return 'hour';
            case HourSegment.TYPE_MINUTE:
                return 'minute';
            case HourSegment.TYPE_SECOND:
                return 'second';
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