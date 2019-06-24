import * as moment from 'moment';
import { Moment } from 'moment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import DateHandler from './DateHandler';
import RangeHandler from './RangeHandler';
import TimeSegmentHandler from './TimeSegmentHandler';

export default class TSRangeHandler extends RangeHandler<Moment> {
    public static getInstance(): TSRangeHandler {
        if (!TSRangeHandler.instance) {
            TSRangeHandler.instance = new TSRangeHandler();
        }
        return TSRangeHandler.instance;
    }

    private static instance: TSRangeHandler = null;

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public ranges_are_contiguous_or_intersect(range_a: TSRange, range_b: TSRange): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (this.range_intersects_range(range_a, range_b)) {
            return true;
        }

        // Reste à tester les ensembles contigus
        if (range_a.min_inclusiv != range_b.max_inclusiv) {
            if (range_a.min.isSame(range_b.max)) {
                return true;
            }
        }
        if (range_b.min_inclusiv != range_a.max_inclusiv) {
            if (range_b.min.isSame(range_a.max)) {
                return true;
            }
        }

        return false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.min_inclusiv && (!range_b.min_inclusiv)) {
            return range_a.min.isSameOrBefore(range_b.min);
        }
        return range_a.min.isBefore(range_b.min);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.min_inclusiv != range_b.min_inclusiv) {
            return false;
        }
        return range_a.min.isSame(range_b.min);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.max_inclusiv) && range_b.max_inclusiv) {
            return range_a.max.isSameOrBefore(range_b.max);
        }
        return range_a.max.isBefore(range_b.max);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.max_inclusiv != range_b.max_inclusiv) {
            return false;
        }
        return range_a.max.isSame(range_b.max);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartABeforeEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        return range_a.min.isBefore(range_b.max);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isStartASameEndB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.min_inclusiv) || (!range_b.max_inclusiv)) {
            return false;
        }
        return range_a.min.isSame(range_b.max);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB(range_a: TSRange, range_b: TSRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.max_inclusiv) || (!range_b.min_inclusiv)) {
            return range_a.max.isSameOrBefore(range_b.min);
        }
        return range_a.max.isBefore(range_b.min);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
     * @param ranges
     */
    public getMinSurroundingRange(ranges: TSRange[]): TSRange {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: TSRange = TSRange.createNew();

        for (let i in ranges) {
            let range = ranges[i];

            if (!res.min) {
                res.min = moment(range.min);
                res.min_inclusiv = range.min_inclusiv;
            } else {

                if ((res.min_inclusiv && range.min.isBefore(res.min)) || ((!res.min_inclusiv) && range.min.isSameOrBefore(res.min))) {
                    res.min = moment(range.min);
                    res.min_inclusiv = range.min_inclusiv;
                }
            }

            if (!res.max) {
                res.max = moment(range.max);
                res.max_inclusiv = range.max_inclusiv;
            } else {

                if ((res.max_inclusiv && range.max.isAfter(res.max)) || ((!res.max_inclusiv) && range.max.isSameOrAfter(res.max))) {
                    res.max = moment(range.max);
                    res.max_inclusiv = range.max_inclusiv;
                }
            }
        }

        return res;
    }

    public createNew(start: Moment = null, end: Moment = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): TSRange {
        return TSRange.createNew(start, end, start_inclusiv, end_inclusiv);
    }

    public cloneFrom(from: TSRange): TSRange {
        return TSRange.cloneFrom(from);
    }

    public getFormattedMinForAPI(range: TSRange): string {
        if (!range) {
            return null;
        }

        return DateHandler.getInstance().formatDateTimeForAPI(range.min);
    }

    public getFormattedMaxForAPI(range: TSRange): string {
        if (!range) {
            return null;
        }

        return DateHandler.getInstance().formatDateTimeForAPI(range.max);
    }

    public getValueFromFormattedMinOrMaxAPI(input: string): Moment {
        try {
            return moment(parseFloat(input));
        } catch (error) {
        }
        return null;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin(range: TSRange, segment_type: number = TimeSegment.TYPE_DAY): Moment {


        if (!range) {
            return null;
        }

        let range_min_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.min, segment_type);
        let range_min_moment: Moment = moment(range_min_ts.dateIndex);

        if (range_min_moment.isBefore(range.min)) {
            range_min_ts = TimeSegmentHandler.getInstance().getPreviousTimeSegment(range_min_ts, segment_type, -1);
            range_min_moment = moment(range_min_ts.dateIndex);
        }

        if (range_min_moment.isAfter(range.max)) {
            return null;
        }

        if ((!range.max_inclusiv) && (range_min_moment.isSameOrAfter(range.max))) {
            return null;
        }

        if (range.min_inclusiv) {
            return range_min_moment;
        }

        if (range_min_moment.isAfter(range.min)) {
            return range_min_moment;
        }

        range_min_ts = TimeSegmentHandler.getInstance().getPreviousTimeSegment(range_min_ts, segment_type, -1);
        return moment(range_min_ts.dateIndex);
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax(range: TSRange, segment_type: number = TimeSegment.TYPE_DAY): Moment {

        if (!range) {
            return null;
        }

        let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.max, segment_type);
        let range_max_moment: Moment = moment(range_max_ts.dateIndex);


        if (range_max_moment.isBefore(range.min)) {
            return null;
        }

        if ((!range.min_inclusiv) && (range_max_moment.isSameOrBefore(range.min))) {
            return null;
        }

        if (range.max_inclusiv) {
            return range_max_moment;
        }

        if (range_max_moment.isBefore(range.max)) {
            return range_max_moment;
        }

        range_max_ts = TimeSegmentHandler.getInstance().getPreviousTimeSegment(range_max_ts, segment_type);
        return moment(range_max_ts.dateIndex);
    }


    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin_from_ranges(ranges: TSRange[], segment_type: number = TimeSegment.TYPE_DAY): Moment {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: Moment = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_min = this.getSegmentedMin(range, segment_type);

            if (res == null) {
                res = range_min;
            } else {
                res = moment.min(range_min, res);
            }
        }

        return res;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax_from_ranges(ranges: TSRange[], segment_type: number = TimeSegment.TYPE_DAY): Moment {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: Moment = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_max = this.getSegmentedMax(range, segment_type);

            if (res == null) {
                res = range_max;
            } else {
                res = moment.max(range_max, res);
            }
        }

        return res;
    }


    public foreach(range: TSRange, callback: (value: Moment) => void, segment_type: number = TimeSegment.TYPE_DAY) {

        let actual_moment: Moment = this.getSegmentedMin(range, segment_type);
        let end_moment: Moment = this.getSegmentedMax(range, segment_type);

        if ((actual_moment == null) || (end_moment == null) || (typeof actual_moment == 'undefined') || (typeof end_moment == 'undefined')) {
            return;
        }

        while (actual_moment && actual_moment.isSameOrBefore(end_moment)) {

            callback(actual_moment);
            actual_moment = moment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(actual_moment, segment_type, 1).dateIndex);
        }
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param elt
     * @param range
     */
    public is_elt_inf_min(a: Moment, range: TSRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.min_inclusiv) {
            return moment(a).isBefore(range.min);
        }
        return moment(a).isSameOrBefore(range.min);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param elt
     * @param range
     */
    public is_elt_sup_max(a: Moment, range: TSRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.max_inclusiv) {
            return moment(a).isAfter(range.max);
        }
        return moment(a).isSameOrAfter(range.max);
    }
}