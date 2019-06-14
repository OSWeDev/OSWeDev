import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import { Moment } from 'moment';
import * as moment from 'moment';
import DateHandler from './DateHandler';
import TSRange from '../modules/DataRender/vos/TSRange';
import RangeHandler from './RangeHandler';

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
        if (range_a.start_inclusiv != range_b.end_inclusiv) {
            if (range_a.start.isSame(range_b.end)) {
                return true;
            }
        }
        if (range_b.start_inclusiv != range_a.end_inclusiv) {
            if (range_b.start.isSame(range_a.end)) {
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

        if (range_a.start_inclusiv && (!range_b.start_inclusiv)) {
            return range_a.start.isSameOrBefore(range_b.start);
        }
        return range_a.start.isBefore(range_b.start);
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

        if (range_a.start_inclusiv != range_b.start_inclusiv) {
            return false;
        }
        return range_a.start.isSame(range_b.start);
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

        if (range_a.end_inclusiv && (!range_b.end_inclusiv)) {
            return range_a.end.isSameOrBefore(range_b.end);
        }
        return range_a.end.isBefore(range_b.end);
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

        if (range_a.end_inclusiv != range_b.end_inclusiv) {
            return false;
        }
        return range_a.end.isSame(range_b.end);
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

        if (range_a.start_inclusiv && (!range_b.end_inclusiv)) {
            return range_a.start.isSameOrBefore(range_b.end);
        }
        return range_a.start.isBefore(range_b.end);
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

        if (range_a.start_inclusiv != range_b.end_inclusiv) {
            return false;
        }
        return range_a.start.isSame(range_b.end);
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

        if (range_a.end_inclusiv && (!range_b.start_inclusiv)) {
            return range_a.end.isSameOrBefore(range_b.start);
        }
        return range_a.end.isBefore(range_b.start);
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

            if (!res.start) {
                res.start = moment(range.start);
                res.start_inclusiv = range.start_inclusiv;
            } else {

                if ((res.start_inclusiv && range.start.isBefore(res.start)) || ((!res.start_inclusiv) && range.start.isSameOrBefore(res.start))) {
                    res.start = moment(range.start);
                    res.start_inclusiv = range.start_inclusiv;
                }
            }

            if (!res.end) {
                res.end = moment(range.end);
                res.end_inclusiv = range.end_inclusiv;
            } else {

                if ((res.end_inclusiv && range.end.isAfter(res.end)) || ((!res.end_inclusiv) && range.end.isSameOrAfter(res.end))) {
                    res.end = moment(range.end);
                    res.end_inclusiv = range.end_inclusiv;
                }
            }
        }

        return res;
    }

    protected createNew(start: Moment = null, end: Moment = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): TSRange {
        return TSRange.createNew(start, end, start_inclusiv, end_inclusiv);
    }

    protected cloneFrom(from: TSRange): TSRange {
        return TSRange.cloneFrom(from);
    }
}

