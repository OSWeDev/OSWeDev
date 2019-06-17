import * as moment from 'moment';
import { Moment } from 'moment';
import TSRange from '../modules/DataRender/vos/TSRange';
import RangeHandler from './RangeHandler';
import DateHandler from './DateHandler';

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

        if (range_a.max_inclusiv && (!range_b.max_inclusiv)) {
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

        if (range_a.min_inclusiv && (!range_b.max_inclusiv)) {
            return range_a.min.isSameOrBefore(range_b.max);
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

        if (range_a.min_inclusiv != range_b.max_inclusiv) {
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

        if (range_a.max_inclusiv && (!range_b.min_inclusiv)) {
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
        return DateHandler.getInstance().formatDateTimeForAPI(range.min);
    }

    public getFormattedMaxForAPI(range: TSRange): string {
        return DateHandler.getInstance().formatDateTimeForAPI(range.max);
    }

    public getValueFromFormattedMinOrMaxAPI(input: string): Moment {
        try {
            return moment(parseFloat(input));
        } catch (error) {
        }
        return null;
    }
}