import * as moment from 'moment';
import { Moment } from 'moment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import DateHandler from './DateHandler';
import RangeHandler from './RangeHandler';
import TimeSegmentHandler from './TimeSegmentHandler';
import IRange from '../modules/DataRender/interfaces/IRange';

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
    public getCardinal(range: TSRange, segment_type: number = TimeSegment.TYPE_DAY): number {
        if (!range) {
            return null;
        }

        let min: Moment = this.getSegmentedMin(range, segment_type);
        let max: Moment = this.getSegmentedMax(range, segment_type);

        switch (segment_type) {
            case TimeSegment.TYPE_DAY:
                return max.diff(min, 'day') + 1;
            case TimeSegment.TYPE_MONTH:
                return max.diff(min, 'month') + 1;
            case TimeSegment.TYPE_WEEK:
                return max.diff(min, 'week') + 1;
            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
            case TimeSegment.TYPE_YEAR:
                return max.diff(min, 'year') + 1;
        }

        return null;
    }

    /**
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
     * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
     * @param ranges
     */
    public getMinSurroundingRange(ranges: TSRange[]): TSRange {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: TSRange = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            if (!res) {
                res = this.createNew(range.min, range.max, range.min_inclusiv, range.max_inclusiv);
                continue;
            }

            if ((res.min_inclusiv && range.min.isBefore(res.min)) || ((!res.min_inclusiv) && range.min.isSameOrBefore(res.min))) {
                res.min = moment(range.min);
                res.min_inclusiv = range.min_inclusiv;
            }

            if ((res.max_inclusiv && range.max.isAfter(res.max)) || ((!res.max_inclusiv) && range.max.isSameOrAfter(res.max))) {
                res.max = moment(range.max);
                res.max_inclusiv = range.max_inclusiv;
            }
        }

        return res;
    }

    public createNew<U extends IRange<Moment>>(start: Moment = null, end: Moment = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): U {
        return TSRange.createNew(start, end, start_inclusiv, end_inclusiv) as U;
    }

    public cloneFrom<U extends IRange<Moment>>(from: U): U {
        return TSRange.cloneFrom(from) as U;
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
            if (!input) {
                return null;
            }

            let resn = parseFloat(input);

            if (isNaN(resn)) {
                return null;
            }

            let res = moment(resn);

            if (!res.isValid()) {
                return null;
            }

            return res;
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

        if (((!range.max_inclusiv) && (range.max.isSame(moment(range_min_ts.dateIndex))) || (range.max.isBefore(moment(range_min_ts.dateIndex))))) {
            return null;
        }

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

        if (((!range.min_inclusiv) && (range.min.isSame(moment(range_max_ts.dateIndex))) || (range.min.isAfter(moment(range_max_ts.dateIndex))))) {
            return null;
        }

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

    public isSupp(range: TSRange, a: Moment, b: Moment): boolean {
        return a.isAfter(b);
    }

    public isInf(range: TSRange, a: Moment, b: Moment): boolean {
        return a.isBefore(b);
    }

    public equals(range: TSRange, a: Moment, b: Moment): boolean {
        return a.isSame(b);
    }


    public max(range: TSRange, a: Moment, b: Moment): Moment {
        return moment.max(a, b);
    }

    public min(range: TSRange, a: Moment, b: Moment): Moment {
        return moment.min(a, b);
    }
}