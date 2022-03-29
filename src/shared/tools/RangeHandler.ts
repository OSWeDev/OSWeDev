import cloneDeep = require('lodash/cloneDeep');
import IRange from '../modules/DataRender/interfaces/IRange';
import ISegment from '../modules/DataRender/interfaces/ISegment';
import HourRange from '../modules/DataRender/vos/HourRange';
import HourSegment from '../modules/DataRender/vos/HourSegment';
import NumRange from '../modules/DataRender/vos/NumRange';
import NumSegment from '../modules/DataRender/vos/NumSegment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import Dates from '../modules/FormatDatesNombres/Dates/Dates';
import Durations from '../modules/FormatDatesNombres/Dates/Durations';
import IDistantVOBase from '../modules/IDistantVOBase';
import RangesCutResult from '../modules/Matroid/vos/RangesCutResult';
import ModuleTableField from '../modules/ModuleTableField';
import ConsoleHandler from './ConsoleHandler';
import HourSegmentHandler from './HourSegmentHandler';
import MatroidIndexHandler from './MatroidIndexHandler';
import NumSegmentHandler from './NumSegmentHandler';
import TimeSegmentHandler from './TimeSegmentHandler';

export default class RangeHandler {

    /**
     * DIRTY [ou pas?] Pseudo max int pour int8 en bdd (théotiquement -9223372036854775808 to 9223372036854775807
     */
    public static MIN_INT: number = Number.MIN_SAFE_INTEGER;
    public static MAX_INT: number = Number.MAX_SAFE_INTEGER;

    /**
     * DIRTY [ou pas?] Pseudo max int pour int8 en bdd (théotiquement -9223372036854775808 to 9223372036854775807
     *  /1000 par sécurité doute sur les conversions, anyway peu de chance que ça impact anything
     */
    public static MIN_TS: number = -9151488000;
    public static MAX_TS: number = 8993721599;

    /**
     * DIRTY [ou pas?] Pseudo max int pour int8 en bdd appliqué aux duration (théotiquement -9223372036854775808 to 9223372036854775807
     */
    public static MIN_HOUR: number = -9151488000;
    public static MAX_HOUR: number = 8993721599;

    public static getInstance(): RangeHandler {
        if (!RangeHandler.instance) {
            RangeHandler.instance = new RangeHandler();
        }
        return RangeHandler.instance;
    }


    protected static RANGE_MATCHER_API = /([0-9]+)(\[|\()("((?:\\"|[^"])*)"|[^"]*),("((?:\\"|[^"])*)"|[^"]*)(\]|\))/;
    protected static RANGE_MATCHER_BDD = /(\[|\()("((?:\\"|[^"])*)"|[^"]*),("((?:\\"|[^"])*)"|[^"]*)(\]|\))/;

    private static instance: RangeHandler = null;

    private constructor() { }

    /**
     * TODO FIXME TU
     */
    public get_left_open_min_value(range_type: number): number {
        switch (range_type) {
            case TSRange.RANGE_TYPE:
                return RangeHandler.MIN_TS;
            case NumRange.RANGE_TYPE:
                return RangeHandler.MIN_INT;
            case HourRange.RANGE_TYPE:
                return RangeHandler.MIN_HOUR;
        }
        return null;
    }

    /**
     * TODO FIXME TU
     */
    public get_right_open_max_value(range_type: number): number {
        switch (range_type) {
            case TSRange.RANGE_TYPE:
                return RangeHandler.MAX_TS;
            case NumRange.RANGE_TYPE:
                return RangeHandler.MAX_INT;
            case HourRange.RANGE_TYPE:
                return RangeHandler.MAX_HOUR;
        }
        return null;
    }

    public get_ids_ranges_from_list(ids: number[]): NumRange[] {

        if ((!ids) || (!ids.length)) {
            return null;
        }

        let res: NumRange[] = [];

        let copy: number[] = Array.from(ids);
        copy.sort((a, b) => {
            return a - b;
        });

        let current_range_min: number = null;
        let current_range_max: number = null;
        for (let i in copy) {
            let e = copy[i];

            if (current_range_max == null) {
                current_range_min = e;
                current_range_max = e + 1;
                continue;
            }

            if (current_range_max != e) {
                res.push(this.createNew(NumRange.RANGE_TYPE, current_range_min, current_range_max, true, false, NumSegment.TYPE_INT));

                current_range_min = e;
                current_range_max = e + 1;
                continue;
            }

            current_range_max++;
        }

        if (current_range_min != null) {
            res.push(this.createNew(NumRange.RANGE_TYPE, current_range_min, current_range_max, true, false, NumSegment.TYPE_INT));
        }

        return res;
    }

    public is_max_range(range: IRange): boolean {

        if (!range) {
            return false;
        }

        return range.min_inclusiv && this.is_left_open(range) && (!range.max_inclusiv) && this.is_right_open(range);
    }

    /**
     * @param range le range à tester
     * @returns is_left_open(range) || is_right_open(range)
     */
    public is_one_max_range(range: IRange): boolean {

        if (!range) {
            return false;
        }

        return this.is_left_open(range) || this.is_right_open(range);
    }

    public is_left_open(range: IRange): boolean {
        if (!range) {
            return false;
        }
        switch (range.range_type) {
            case TSRange.RANGE_TYPE:
                let segmented_min: number = this.getSegmentedMin(range);
                // min_inclusive or not
                return segmented_min === RangeHandler.MIN_TS
                    || segmented_min === Dates.add(RangeHandler.MIN_TS, 1, range.segment_type);
            case NumRange.RANGE_TYPE:
                return range.min == RangeHandler.MIN_INT;
            case HourRange.RANGE_TYPE:
                return range.min == RangeHandler.MIN_HOUR;
        }
        return false;
    }

    public is_right_open(range: IRange): boolean {
        if (!range) {
            return false;
        }
        switch (range.range_type) {
            case TSRange.RANGE_TYPE:
                let segmented_max: number = this.getSegmentedMax(range);
                // max_inclusive or not
                return segmented_max === Dates.startOf(RangeHandler.MAX_TS, range.segment_type)
                    || segmented_max === Dates.startOf(Dates.add(RangeHandler.MAX_TS, -1, range.segment_type), range.segment_type);
            case NumRange.RANGE_TYPE:
                return range.max == RangeHandler.MAX_INT;
            case HourRange.RANGE_TYPE:
                return range.max == RangeHandler.MAX_HOUR;
        }
        return false;
    }

    /**
     * Renvoi une liste (union) de ranges optimisée pour correspondre au nouveau segment_type
     * si le segment_type est le même que celui actuellement en place dans le param, on renvoie le param
     * sinon on change le segment_type et on adapte le range. On renvoie l'union des ranges modifiés
     * @param ranges
     * @param target_segment_type
     * @param strict force exacte segmentation_type in result, not just minimum type
     */
    public get_ranges_according_to_segment_type(ranges: IRange[], target_segment_type: number, strict: boolean = false): IRange[] {

        let has_changed: boolean = false;
        let res: IRange[] = [];

        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            let comparison: number = null;
            switch (range.range_type) {
                case TSRange.RANGE_TYPE:
                    comparison = TimeSegmentHandler.getInstance().compareSegmentTypes(range.segment_type, target_segment_type);
                    break;
                case NumRange.RANGE_TYPE:
                    comparison = NumSegmentHandler.getInstance().compareSegmentTypes(range.segment_type, target_segment_type);
                    break;
                case HourRange.RANGE_TYPE:
                    comparison = HourSegmentHandler.getInstance().compareSegmentTypes(range.segment_type, target_segment_type);
                    break;
            }

            if ((strict && !comparison) || ((!strict) && (comparison >= 0))) {
                res.push(range);
                continue;
            }

            res.push(this.createNew(
                range.range_type,
                this.getSegmentedMin(range, target_segment_type),
                this.getSegmentedMax(range, target_segment_type),
                true,
                true,
                target_segment_type));
            has_changed = true;
        }

        // if (!has_changed) {
        //     return ranges;
        // }
        return this.getRangesUnion(res);
    }

    /**
     * On part d'un ensemble continu de ranges, et on en sort le plus petit ensemble couvrant le segment_type (supérieur) indiqué en param
     *  Par exemple on a du 01/01/2020 au 10/01/2020 et du 02/02/2020 au 03/02/2020 en segment type DAY, on passe en MONTH, on renvoie 01/2020 - 02/2020
     */
    public get_contiguous_ranges_on_new_segment_type(ranges: IRange[], target_segment_type: number): IRange[] {

        return [
            RangeHandler.getInstance().createNew(
                TSRange.RANGE_TYPE,
                RangeHandler.getInstance().getSegmentedMin_from_ranges(ranges, target_segment_type),
                RangeHandler.getInstance().getSegmentedMax_from_ranges(ranges, target_segment_type),
                true,
                true,
                target_segment_type
            )
        ];
    }

    public get_all_segmented_elements_from_range(range: IRange): number[] {

        if (!range) {
            return null;
        }

        let res: number[] = [];

        this.foreach_sync(range, (e: number) => {
            res.push(e);
        }, range.segment_type);

        return res;
    }

    public get_all_segmented_elements_from_ranges(ranges: IRange[]): number[] {

        if (!ranges) {
            return null;
        }

        let res: number[] = [];

        for (let i in ranges) {
            let range = ranges[i];

            this.foreach_sync(range, (e: number) => {
                res.push(e);
            }, range.segment_type);
        }

        return res;
    }

    public isValid(range: IRange): boolean {
        if ((!range) || (typeof range.min_inclusiv == 'undefined') || (typeof range.max_inclusiv == 'undefined')) {
            return false;
        }

        if (!this.is_valid_elt(range.range_type, range.min)) {
            return false;
        }

        if (!this.is_valid_elt(range.range_type, range.max)) {
            return false;
        }

        return true;
    }

    public range_includes_ranges(range_a: IRange, ranges_b: IRange[], segment_type: number = null): boolean {
        if (!ranges_b) {
            return true;
        }

        for (let i in ranges_b) {
            if (!this.range_includes_range(range_a, ranges_b[i], segment_type)) {
                return false;
            }
        }
        return true;
    }

    public range_includes_range(range_a: IRange, range_b: IRange, segment_type: number = null): boolean {
        if (!range_a) {
            return false;
        }

        if (!range_b) {
            return true;
        }

        let segmented_min_a: number = this.getSegmentedMin(range_a, segment_type);
        let segmented_min_b: number = this.getSegmentedMin(range_b, segment_type);
        let segmented_max_a: number = this.getSegmentedMax(range_a, segment_type);
        let segmented_max_b: number = this.getSegmentedMax(range_b, segment_type);

        if (this.is_elt_sup_elt(range_a.range_type, segmented_min_a, segmented_min_b)) {
            return false;
        }

        if (this.is_elt_inf_elt(range_a.range_type, segmented_max_a, segmented_max_b)) {
            return false;
        }

        return true;
    }

    /**
     * On essaie de réduire le nombre d'ensemble si certains s'entrecoupent
     * @param ranges
     */
    public getRangesUnion(ranges: IRange[]): IRange[] {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        /**
         * A - on ordonne par minimum
         * B - pour i allant de 0 à ranges.length
         *      - on check le dernier range ajouté dans res (B)
         *          - si le min du ranges[i] (A) est <= au max de (B)
         *              - alors B.max = A.max
         *          - sinon on ajoute A au res et B = A
         */

        let cloned = ranges.filter((c) => !!c);
        cloned = this.cloneArrayFrom(cloned);
        cloned.sort((rangea: IRange, rangeb: IRange) => {

            if (!rangea) {
                return null;
            }
            if (!rangeb) {
                return null;
            }

            return (rangea.min) - (rangeb.min);
        });

        let res: IRange[] = [];
        let i = 0;
        let B: IRange = null;
        let A: IRange = null;

        while (i < cloned.length) {
            A = cloned[i];
            if (B && (A.min <= B.max)) {
                B.max = Math.max(B.max, A.max);
            } else {
                res.push(A);
                B = A;
            }
            i++;
        }
        return (res && res.length) ? res : null;
    }

    /**
     * On a que des ranges normés, donc on optimise
     * @param range_a
     * @param range_b
     */
    public ranges_are_contiguous_or_intersect(range_a: IRange, range_b: IRange): boolean {

        if ((!range_a) || (!range_b) || (range_a.range_type != range_b.range_type)) {
            return false;
        }

        return (((range_a.min >= range_b.min) && (range_a.min <= range_b.max)) ||
            ((range_a.max >= range_b.min) && (range_a.max <= range_b.max)));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB(range_a: IRange, range_b: IRange, segment_type?: number): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMin(range_a, segment_type), this.getSegmentedMin(range_b, segment_type));
    }


    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB(range_a: IRange, range_b: IRange, segment_type?: number): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.getSegmentedMin(range_a, segment_type), this.getSegmentedMin(range_b, segment_type));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB(range_a: IRange, range_b: IRange, segment_type?: number): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMax(range_a, segment_type), this.getSegmentedMax(range_b, segment_type));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB(range_a: IRange, range_b: IRange, segment_type?: number): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.getSegmentedMax(range_a, segment_type), this.getSegmentedMax(range_b, segment_type));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeEndB(range_a: IRange, range_b: IRange, segment_type?: number): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMin(range_a, segment_type), this.getSegmentedMax(range_b, segment_type));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameEndB(range_a: IRange, range_b: IRange, segment_type?: number): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.getSegmentedMin(range_a, segment_type), this.getSegmentedMax(range_b, segment_type));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB(range_a: IRange, range_b: IRange, segment_type: number = null): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMax(range_a, segment_type), this.getSegmentedMin(range_b, segment_type));
    }


    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeOrSameStartB_optimized_normalized(range_a: IRange, range_b: IRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return !this.is_elt_sup_elt(range_a.range_type, range_a.min, range_b.min);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeOrSameEndB_optimized_normalized(range_a: IRange, range_b: IRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, range_a.min, range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB_optimized_normalized(range_a: IRange, range_b: IRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, range_a.min, range_b.min);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB_optimized_normalized(range_a: IRange, range_b: IRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, range_a.min, range_b.min);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB_optimized_normalized(range_a: IRange, range_b: IRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, range_a.max, range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB_optimized_normalized(range_a: IRange, range_b: IRange): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, range_a.max, range_b.max);
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB_optimized_normalized(range_a: IRange, range_b: IRange, segment_type: number = null): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return !this.is_elt_sup_elt(range_a.range_type, range_a.max, range_b.min);
    }


    public ranges_intersect_themselves(ranges_a: IRange[]): boolean {

        if ((!ranges_a) || (!ranges_a.length)) {
            return false;
        }

        for (let i: number = 0; i < (ranges_a.length - 1); i++) {
            let range_a = ranges_a[i];

            for (let j: number = i + 1; j < ranges_a.length; j++) {
                let range_b = ranges_a[j];

                if (this.range_intersects_range(range_a, range_b)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public range_intersects_range(range_a: IRange, range_b: IRange): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (this.isStartABeforeOrSameStartB_optimized_normalized(range_a, range_b) &&
            this.isStartABeforeOrSameEndB_optimized_normalized(range_b, range_a)) {
            return true;
        }

        if (this.isStartABeforeOrSameStartB_optimized_normalized(range_b, range_a) &&
            this.isStartABeforeOrSameEndB_optimized_normalized(range_a, range_b)) {
            return true;
        }

        return false;
    }

    public any_range_intersects_any_range(ranges_a: IRange[], ranges_b: IRange[]): boolean {

        if ((!ranges_b) || (!ranges_a) || (!ranges_b.length) || (!ranges_a.length)) {
            return false;
        }

        for (let i in ranges_a) {
            let range_a = ranges_a[i];

            if (this.range_intersects_any_range(range_a, ranges_b)) {
                return true;
            }
        }

        return false;
    }

    public get_ranges_any_range_intersects_any_range(ranges_a: IRange[], ranges_b: IRange[]): IRange[] {
        let ranges: IRange[] = [];

        if ((!ranges_b) || (!ranges_a) || (!ranges_b.length) || (!ranges_a.length)) {
            return null;
        }

        for (let i in ranges_a) {
            let range_a = ranges_a[i];

            if (this.range_intersects_any_range(range_a, ranges_b)) {
                let to_push: boolean = true;

                for (let j in ranges) {
                    if (this.is_same(range_a, ranges[j])) {
                        to_push = false;
                    }
                }

                if (to_push) {
                    ranges.push(range_a);
                }
            }
        }

        return ranges.length > 0 ? ranges : null;
    }

    /**
     * @param range_a
     * @param ranges
     */
    public elt_intersects_any_range(a: number, ranges: IRange[]): boolean {

        if ((!ranges) || (a == null) || (typeof a === 'undefined') || (!ranges.length)) {
            return false;
        }

        for (let i in ranges) {
            let range_b = ranges[i];

            if (this.elt_intersects_range(a, range_b)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param range_a
     * @param ranges
     */
    public elt_intersects_range(a: number, range: IRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (this.is_elt_inf_elt(range.range_type, a, range.min)) {
            return false;
        }

        if (this.is_elt_sup_elt(range.range_type, a, range.max)) {
            return false;
        }

        if (this.is_elt_equals_elt(range.range_type, a, range.min) && !range.min_inclusiv) {
            return false;
        }

        if (this.is_elt_equals_elt(range.range_type, a, range.max) && !range.max_inclusiv) {
            return false;
        }

        return true;
    }

    /**
     * @param elt
     * @param range
     */
    public is_elt_inf_min(a: number, range: IRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.min_inclusiv) {
            return this.is_elt_inf_elt(range.range_type, a, range.min);
        }
        return this.is_elt_equals_or_inf_elt(range.range_type, a, range.min);
    }

    /**
     * @param elt
     * @param range
     */
    public is_elt_sup_max(a: number, range: IRange): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.max_inclusiv) {
            return this.is_elt_sup_elt(range.range_type, a, range.max);
        }
        return this.is_elt_equals_or_sup_elt(range.range_type, a, range.max);
    }

    /**
     * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
     * @param ranges
     */
    public getMinSurroundingRange(ranges: IRange[]): IRange {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: IRange = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            if (!res) {
                res = this.createNew(range.range_type, range.min, range.max, range.min_inclusiv, range.max_inclusiv, range.segment_type);
                continue;
            }

            if (this.is_elt_inf_elt(range.range_type, range.min, res.min)) {
                res.min = range.min;
            }

            if (this.is_elt_equals_or_sup_elt(range.range_type, range.max, res.max)) {
                res.max = range.max;
            }
        }

        return res;
    }

    public cloneArrayFrom<T, U extends IRange>(from: U[]): U[] {

        if (!from) {
            return null;
        }

        let res: U[] = [];

        for (let i in from) {
            res.push(this.cloneFrom(from[i]) as U);
        }

        this.sort_ranges(res);
        return res;
    }

    public getIndex(range: IRange): string {
        return MatroidIndexHandler.getInstance().get_normalized_range(range);
    }

    public humanize(range: IRange): string {

        if ((!range) || (!this.isValid(range))) {
            return null;
        }

        let res: string = "";

        res += (range.min_inclusiv ? '[' : '(');
        switch (range.range_type) {
            case NumRange.RANGE_TYPE:
                res += range.min;
                break;
            case HourRange.RANGE_TYPE:
                res += Durations.hours(range.min) + ':' + Durations.minutes(range.min);
                break;
            case TSRange.RANGE_TYPE:
                res += Dates.format(range.min, 'DD/MM/Y');
                break;
        }
        res += ',';
        switch (range.range_type) {
            case NumRange.RANGE_TYPE:
                res += range.max;
                break;
            case HourRange.RANGE_TYPE:
                res += Durations.hours(range.max) + ':' + Durations.minutes(range.max);
                break;
            case TSRange.RANGE_TYPE:
                res += Dates.format(range.max, 'DD/MM/Y');
                break;
        }
        res += (range.max_inclusiv ? ']' : ')');

        return res;
    }

    public rangesFromIndex(index: string, range_type: number): IRange[] {
        return MatroidIndexHandler.getInstance().from_normalized_ranges(index, range_type);
    }

    public getIndexRanges(ranges: IRange[]): string {
        return MatroidIndexHandler.getInstance().get_normalized_ranges(ranges);
    }

    /**
     * On ordonne pour uniformiser les indexs par exemple, en prenant le formatted_min de chaque range
     * @param ranges
     */
    public sort_ranges(ranges: IRange[]) {

        if ((!ranges) || (!ranges.length)) {
            return;
        }
        ranges.sort((a: IRange, b: IRange) => {

            let min_a = this.getSegmentedMin(a);
            let min_b = this.getSegmentedMin(b);

            if (this.is_elt_equals_elt(a.range_type, min_a, min_b)) {
                return 0;
            }

            if (this.is_elt_inf_elt(a.range_type, min_a, min_b)) {
                return -1;
            }

            return 1;
        });
    }

    public humanizeRanges(ranges: IRange[]): string {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: string = "[";

        for (let i in ranges) {
            let range = ranges[i];

            let range_index = this.humanize(range);

            if (!range_index) {
                return null;
            }

            res += (res == '[' ? '' : ',');
            res += range_index;
        }
        res += ']';

        return res;
    }

    public getCardinalFromArray(ranges: IRange[], segment_type?: number): number {

        if (!ranges) {
            return null;
        }

        let res: number = 0;

        for (let i in ranges) {
            res += this.getCardinal(ranges[i], segment_type);
        }
        return res;
    }

    public async foreach_ranges(ranges: IRange[], callback: (value: number) => Promise<void> | void, segment_type?: number, min_inclusiv: number = null, max_inclusiv: number = null) {

        for (let i in ranges) {
            await this.foreach(ranges[i], callback, segment_type, min_inclusiv, max_inclusiv);
        }
    }

    /**
     * Les elts sont chargés en // on await le tableau
     * @param ranges
     * @param callback
     * @param segment_type
     * @param min_inclusiv
     * @param max_inclusiv
     */
    public async foreach_ranges_batch_await(ranges: IRange[], callback: (value: number) => Promise<void> | void, segment_type?: number, min_inclusiv: number = null, max_inclusiv: number = null, batch_size: number = 50) {

        let promises = [];
        for (let i in ranges) {

            if (promises && (promises.length >= batch_size)) {
                await Promise.all(promises);
                promises = [];
            }

            promises.push(this.foreach_batch_await(ranges[i], callback, segment_type, min_inclusiv, max_inclusiv));
        }

        if (promises.length) {
            await Promise.all(promises);
        }
    }

    public foreach_ranges_sync(ranges: IRange[], callback_sync: (value: number) => void | void, segment_type?: number, min_inclusiv: number = null, max_inclusiv: number = null) {
        for (let i in ranges) {
            this.foreach_sync(ranges[i], callback_sync, segment_type, min_inclusiv, max_inclusiv);
        }
    }

    /**
     * TODO FIXME ASAP VARS TU => refondre le cut range qui ne connait pas le segment_type et qui doit donc pas se baser dessus
     * @param range_cutter
     * @param range_to_cut
     */
    public cut_range<T, U extends IRange>(range_cutter: U, range_to_cut: U): RangesCutResult<U> {

        if (!range_to_cut) {
            return null;
        }

        if ((!range_cutter) || (!this.range_intersects_range(range_cutter, range_to_cut))) {
            return new RangesCutResult(null, [this.cloneFrom(range_to_cut)]);
        }

        let avant: U = this.cloneFrom(range_to_cut);
        let coupe: U = this.cloneFrom(range_to_cut);
        let apres: U = this.cloneFrom(range_to_cut);

        /**
         * ATTENTION il faut aussi prendre la segmentation la plus petite des 2 entre cutter et to_cut
         */
        let min_segment_type = this.get_smallest_segment_type_from_ranges([range_to_cut, range_cutter]);
        avant.segment_type = min_segment_type;
        coupe.segment_type = min_segment_type;
        apres.segment_type = min_segment_type;

        if (this.isStartABeforeStartB_optimized_normalized(range_to_cut, range_cutter)) {
            // SC > STC
            coupe.min = cloneDeep(range_cutter.min);
            coupe.min_inclusiv = range_cutter.min_inclusiv;

            avant.min = cloneDeep(range_to_cut.min);
            avant.min_inclusiv = range_to_cut.min_inclusiv;

            avant.max = cloneDeep(range_cutter.min);
            avant.max_inclusiv = !range_cutter.min_inclusiv;
        } else {
            // SC <= STC
            coupe.min = cloneDeep(range_to_cut.min);
            coupe.min_inclusiv = range_to_cut.min_inclusiv;
            avant = null;
        }

        if (this.isStartASameEndB(range_cutter, range_to_cut, min_segment_type)) {
            // SC = ETC
            coupe.min = cloneDeep(range_cutter.min);
            coupe.min_inclusiv = range_cutter.min_inclusiv;

            coupe.max = cloneDeep(range_cutter.min);
            coupe.max_inclusiv = range_cutter.min_inclusiv;

            if (!!avant) {
                avant.min = cloneDeep(range_to_cut.min);
                avant.min_inclusiv = range_to_cut.min_inclusiv;

                avant.max = cloneDeep(range_cutter.min);
                avant.max_inclusiv = !range_cutter.min_inclusiv;
            }

            apres = null;
        }

        if (this.isStartASameEndB(range_to_cut, range_cutter, min_segment_type)) {
            // STC = EC
            coupe.min = cloneDeep(range_to_cut.min);
            coupe.min_inclusiv = range_to_cut.min_inclusiv;

            coupe.max = cloneDeep(range_to_cut.min);
            coupe.max_inclusiv = range_to_cut.min_inclusiv;

            avant = null;

            if (!!apres) {
                apres.min = cloneDeep(range_cutter.max);
                apres.min_inclusiv = !range_cutter.max_inclusiv;

                apres.max = cloneDeep(range_to_cut.max);
                apres.max_inclusiv = range_to_cut.max_inclusiv;
            }
        }

        if (this.isEndABeforeEndB_optimized_normalized(range_cutter, range_to_cut)) {
            // EC < ETC
            coupe.max = cloneDeep(range_cutter.max);
            coupe.max_inclusiv = range_cutter.max_inclusiv;

            if (!!apres) {
                apres.min = cloneDeep(range_cutter.max);
                apres.min_inclusiv = !range_cutter.max_inclusiv;

                apres.max = cloneDeep(range_to_cut.max);
                apres.max_inclusiv = range_to_cut.max_inclusiv;
            }
        } else {
            // SC <= STC
            coupe.max = cloneDeep(range_to_cut.max);
            coupe.max_inclusiv = range_to_cut.max_inclusiv;
            apres = null;
        }

        if ((!avant) && (!apres) && (!coupe)) {
            return null;
        }

        if ((!avant) && (!apres)) {
            return new RangesCutResult([coupe], null);
        }

        let remaining_items = [];
        if (!!avant) {
            remaining_items.push(avant);
        }
        if (!!apres) {
            remaining_items.push(apres);
        }

        if (!coupe) {
            return new RangesCutResult(null, remaining_items);
        }
        return new RangesCutResult([coupe], remaining_items);
    }

    public create_single_elt_range(range_type: number, elt: number, segment_type: number): IRange {

        switch (range_type) {

            case NumRange.RANGE_TYPE:
                return this.create_single_elt_NumRange(elt, segment_type) as any as IRange;
            case HourRange.RANGE_TYPE:
                return this.create_single_elt_HourRange(elt, segment_type) as any as IRange;
            case TSRange.RANGE_TYPE:
                return this.create_single_elt_TSRange(elt, segment_type) as any as IRange;
        }

        return null;
    }

    public create_single_elt_HourRange(elt: number, segment_type: number): HourRange {
        return this.createNew(HourRange.RANGE_TYPE, elt, elt, true, true, segment_type);
    }

    public create_single_elt_NumRange(elt: number, segment_type: number): NumRange {
        return this.createNew(NumRange.RANGE_TYPE, elt, elt, true, true, segment_type);
    }

    public create_single_elt_TSRange(elt: number, segment_type: number): TSRange {
        return this.createNew(TSRange.RANGE_TYPE, elt, elt, true, true, segment_type);
    }

    public create_multiple_NumRange_from_ids(ids: number[], segment_type: number): NumRange[] {
        if ((!ids) || (!ids.length)) {
            return null;
        }

        if (ids.length == 1) {
            return [this.createNew(NumRange.RANGE_TYPE, ids[0], ids[0], true, true, segment_type)];
        }

        // on ordonne les ids du plus petit au plus grand
        ids.sort((a: number, b: number) => {
            if (a < b) { return -1; }
            if (a > b) { return 1; }
            return 0;
        });

        // on les parcourt pour créer des ranges, si (B != A + 1) on créer un nv range
        let res: NumRange[] = [];
        let min: number = null;
        let max: number = null;

        for (let id of ids) {
            if (!min) {
                min = id;
            }
            if ((max != null) && (id != max + 1)) {
                // on va changer de range
                // on commence par créer le range précédent puis on reset le min et max
                res.push(this.createNew(NumRange.RANGE_TYPE, min, max, true, true, segment_type));
                min = id;
            }
            max = id;
        }
        // on crée le dernier range
        res.push(this.createNew(NumRange.RANGE_TYPE, min, max, true, true, segment_type));

        return res;
    }

    /**
     * ATTENTION les ranges sont considérés comme indépendants entre eux. Sinon cela n'a pas de sens.
     * @param range_cutter
     * @param ranges_to_cut
     */
    public cut_ranges<T, U extends IRange>(range_cutter: U, ranges_to_cut: U[]): RangesCutResult<U> {

        let res: RangesCutResult<U> = null;

        for (let i in ranges_to_cut) {
            let range_to_cut = ranges_to_cut[i];

            res = this.addCutResults(res, this.cut_range(range_cutter, range_to_cut));
        }

        return res;
    }

    public cuts_ranges<T, U extends IRange>(ranges_cutter: U[], ranges_to_cut: U[]): RangesCutResult<U> {

        if (!ranges_to_cut) {
            return null;
        }

        let res: RangesCutResult<U> = new RangesCutResult(null, cloneDeep(ranges_to_cut));

        for (let i in ranges_cutter) {
            let range_cutter = ranges_cutter[i];

            let temp_res = this.cut_ranges(range_cutter, res.remaining_items);
            res.remaining_items = temp_res ? temp_res.remaining_items : null;
            res.chopped_items = temp_res ? (res.chopped_items ? (temp_res.chopped_items ? res.chopped_items.concat(temp_res.chopped_items) : null) : temp_res.chopped_items) : res.chopped_items;
        }

        res.remaining_items = this.getRangesUnion(res.remaining_items) as U[];
        res.chopped_items = this.getRangesUnion(res.chopped_items) as U[];

        return (res && (res.chopped_items || res.remaining_items)) ? res : null;
    }

    public addCutResults<T, U extends IRange>(a: RangesCutResult<U>, b: RangesCutResult<U>): RangesCutResult<U> {

        if (!a) {
            return b;
        }

        if (!b) {
            return a;
        }

        let chopped = a.chopped_items ? a.chopped_items.concat(b.chopped_items) : b.chopped_items;
        let remaining = a.remaining_items ? a.remaining_items.concat(b.remaining_items) : b.remaining_items;

        return new RangesCutResult(chopped, remaining);
    }

    /**
     * Returns new ranges, iso previous but shifted of the given segment amounts
     */
    public get_ranges_shifted_by_x_segments(ranges: IRange[], shift_value: number, shift_segment_type: number): IRange[] {

        if ((!ranges) || (!ranges[0])) {
            return null;
        }

        let res: IRange[] = [];

        for (let i in ranges) {
            let range = ranges[i];

            res.push(this.get_range_shifted_by_x_segments(range, shift_value, shift_segment_type));
        }
        return res;
    }

    public get_ids_ranges_from_vos(vos: IDistantVOBase[] | { [id: number]: IDistantVOBase }): NumRange[] {
        let ids = [];

        for (let i in vos) {
            let vo = vos[i];

            ids.push(vo.id);
        }

        return this.get_ids_ranges_from_list(ids);
    }

    public is_same(a: IRange, b: IRange): boolean {
        if ((!a) || (!b)) {
            return false;
        }

        if ((a.min != b.min) || (a.max != b.max)) {
            return false;
        }

        return true;
    }

    public are_same(as: IRange[], bs: IRange[]): boolean {
        if ((!as) || (!bs)) {
            return false;
        }

        if (as.length != bs.length) {
            return false;
        }

        let remaining_bs = Array.from(bs);
        for (let i in as) {

            let a = as[i];

            let found: number = null;
            for (let j in remaining_bs) {

                let b = remaining_bs[j];

                if (this.is_same(a, b)) {
                    found = parseInt(j.toString());
                    break;
                }
            }

            if (found == null) {
                return false;
            }

            remaining_bs.splice(found, 1);
        }

        return true;
    }


    public getRangeType(table_field: ModuleTableField<any>): number {
        switch (table_field.field_type) {
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
                return NumRange.RANGE_TYPE;

            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tsrange:
                return TSRange.RANGE_TYPE;

            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return HourRange.RANGE_TYPE;

            default:
                return null;
        }
    }

    public getMaxRange(table_field: ModuleTableField<any>): IRange {
        switch (table_field.field_type) {
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
                return this.getMaxNumRange() as any as IRange;

            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tsrange:
                return this.getMaxTSRange() as any as IRange;

            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
                return this.getMaxHourRange() as any as IRange;

            default:
                return null;
        }
    }

    public getMaxNumRange(): NumRange {
        return this.createNew(NumRange.RANGE_TYPE, RangeHandler.MIN_INT, RangeHandler.MAX_INT, true, false, NumSegment.TYPE_INT);
    }

    public getMaxTSRange(): TSRange {
        return this.createNew(TSRange.RANGE_TYPE, RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, false, TimeSegment.TYPE_SECOND);
    }

    public getMaxHourRange(): HourRange {
        return this.createNew(HourRange.RANGE_TYPE, RangeHandler.MIN_HOUR, RangeHandler.MAX_HOUR, true, false, HourSegment.TYPE_SECOND);
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public get_range_shifted_by_x_segments(range: IRange, shift_value: number, shift_segment_type: number): IRange {

        if (!range) {
            return null;
        }

        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                switch (shift_segment_type) {
                    case NumSegment.TYPE_INT:
                    default:
                        return this.createNew(range.range_type, (range.min) + shift_value, (range.max) + shift_value, range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange;
                }

            case HourRange.RANGE_TYPE:
                return this.createNew(range.range_type, Durations.add(range.min, shift_value, shift_segment_type), Durations.add(range.max, shift_value, shift_segment_type), range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange;

            case TSRange.RANGE_TYPE:
                return this.createNew(range.range_type, Dates.add(range.min, shift_value, shift_segment_type), Dates.add(range.max, shift_value, shift_segment_type), range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange;
        }
    }

    public cloneFrom<T, U extends IRange>(from: U): U {
        if (!from) {
            return null;
        }

        switch (from.range_type) {

            case NumRange.RANGE_TYPE:
                return NumRange.cloneFrom(from as any as NumRange) as any as U;

            case HourRange.RANGE_TYPE:
                return HourRange.cloneFrom(from as any as HourRange) as any as U;

            case TSRange.RANGE_TYPE:
                return TSRange.cloneFrom(from as any as TSRange) as any as U;
        }
    }

    public translate_to_api(ranges: NumRange[]): string {
        return this.getIndexRanges(ranges);
    }

    public translate_range_to_api(range: NumRange): string {
        return this.getIndex(range);
    }

    public translate_from_api<U extends NumRange>(range_type: number, ranges: string): U[] {
        return MatroidIndexHandler.getInstance().from_normalized_ranges(ranges, range_type) as U[];
    }

    public translate_to_bdd(ranges: IRange[]): any {

        let res = null;

        if (!ranges) {
            return res;
        }

        res = '{';
        for (let i in ranges) {
            let range = ranges[i];

            if (res != '{') {
                res += ',';
            }

            res += '"';
            res += this.translate_range_to_bdd(range);
            res += '"';
        }
        res += '}';

        return res;
    }

    public translate_range_to_bdd(range: IRange): string {

        if (!range) {
            return '';
        }
        let res = (range.min_inclusiv ? '[' : '(');

        res += range.min;
        res += ',';
        res += range.max;
        res += range.max_inclusiv ? ']' : ')';

        return res;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public getCardinal(range: IRange, segment_type: number = null): number {
        if (!range) {
            return null;
        }

        segment_type = (segment_type == null) ? range.segment_type : segment_type;

        let min: number = this.getSegmentedMin(range, segment_type);
        let max: number = this.getSegmentedMax(range, segment_type);

        if ((min == null) || (max == null)) {
            return null;
        }

        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                return ((max) - (min)) + 1;
            case HourRange.RANGE_TYPE:
                return Durations.diff(max, min, segment_type) + 1;
            case TSRange.RANGE_TYPE:
                return Dates.diff(max, min, segment_type) + 1;
        }

        return null;
    }

    /**
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin(range: IRange, segment_type: number = null, offset: number = 0, return_min_value: boolean = true): number {

        if (!range) {
            return null;
        }

        segment_type = (segment_type == null) ? range.segment_type : segment_type;

        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                let range_min_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.min, segment_type);

                if (this.is_elt_sup_elt(range.range_type, range_min_num.index, range.max)) {
                    return null;
                }

                if ((!range.max_inclusiv) && this.is_elt_equals_or_sup_elt(range.range_type, range_min_num.index, range.max)) {
                    return null;
                }

                if (!!offset) {
                    NumSegmentHandler.getInstance().incNumSegment(range_min_num, segment_type, offset);
                }

                if (!return_min_value && this.is_left_open(range)) {
                    return null;
                }

                return range_min_num.index;

            case HourRange.RANGE_TYPE:
                let range_min_h: ISegment = this.get_segment(range.range_type, range.min, segment_type);
                let range_max_h: ISegment = this.get_segment(range.range_type, range.max, segment_type);

                if (Durations.as(range_min_h.index, HourSegment.TYPE_SECOND) > Durations.as(range_max_h.index, HourSegment.TYPE_SECOND)) {
                    return null;
                }

                if ((!range.max_inclusiv) && (Durations.as(range_min_h.index, HourSegment.TYPE_SECOND) >= Durations.as(range.max, HourSegment.TYPE_SECOND))) {
                    return null;
                }

                if (!!offset) {
                    range_min_h.index = Dates.add(range_min_h.index, offset, segment_type);
                }

                if (!return_min_value && this.is_left_open(range)) {
                    return null;
                }

                return range_min_h.index;

            case TSRange.RANGE_TYPE:
                let range_min_ts: ISegment = this.get_segment(range.range_type, range.min, segment_type);
                let range_max_ts: ISegment = this.get_segment(range.range_type, range.max, segment_type);

                if (range_min_ts.index > range_max_ts.index) {
                    return null;
                }

                if ((!range.max_inclusiv) && (range_min_ts.index >= range.max)) {
                    return null;
                }

                if (!!offset) {
                    (range_min_ts.index) = Dates.add(range_min_ts.index, offset, segment_type);
                }

                // Si on est sur un max range et qu'on veut pas retourner la valeur, on retourne null
                if (!return_min_value && this.is_left_open(range)) {
                    return null;
                }

                return range_min_ts.index;
        }
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax(range: IRange, segment_type: number = null, offset: number = 0, return_max_value: boolean = true): number {

        if (!range) {
            return null;
        }

        segment_type = (segment_type == null) ? range.segment_type : segment_type;

        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                let range_max_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.max, segment_type);

                if ((!range.max_inclusiv) && this.is_elt_equals_elt(range.range_type, range_max_num.index, range.max)) {
                    range_max_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_max_num, segment_type);
                }

                let range_max_end: number = NumSegmentHandler.getInstance().getEndNumSegment(range_max_num);

                if (this.is_elt_inf_elt(range.range_type, range_max_end, range.min)) {
                    return null;
                }

                if ((!range.min_inclusiv) && this.is_elt_equals_or_inf_elt(range.range_type, range_max_end, range.min)) {
                    return null;
                }

                if (!!offset) {
                    NumSegmentHandler.getInstance().incNumSegment(range_max_num, segment_type, offset);
                }

                // Si on est sur un max range et qu'on veut pas retourner la valeur, on retourne null
                if (!return_max_value && this.is_right_open(range)) {
                    return null;
                }

                return range_max_num.index;

            case HourRange.RANGE_TYPE:
                let range_max_seg: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(range.max, segment_type);

                if ((!range.max_inclusiv) && this.is_elt_equals_elt(range.range_type, range_max_seg.index, range.max)) {
                    range_max_seg = HourSegmentHandler.getInstance().getPreviousHourSegment(range_max_seg, segment_type);
                }

                let range_max_d: number = HourSegmentHandler.getInstance().getEndHourSegment(range_max_seg);

                if (this.is_elt_inf_elt(range.range_type, range_max_d, range.min)) {
                    return null;
                }

                if ((!range.min_inclusiv) && this.is_elt_equals_or_inf_elt(range.range_type, range_max_d, range.min)) {
                    return null;
                }

                if (!!offset) {
                    HourSegmentHandler.getInstance().incHourSegment(range_max_seg, segment_type, offset);
                }

                // Si on est sur un max range et qu'on veut pas retourner la valeur, on retourne null
                if (!return_max_value && this.is_right_open(range)) {
                    return null;
                }

                return range_max_seg.index;


            case TSRange.RANGE_TYPE:
                let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.max, segment_type);

                if ((!range.max_inclusiv) && (range_max_ts.index == range.max)) {
                    TimeSegmentHandler.getInstance().decTimeSegment(range_max_ts);
                }

                let range_max_end_moment: number = TimeSegmentHandler.getInstance().getEndTimeSegment(range_max_ts);

                if (range_max_end_moment < range.min) {
                    return null;
                }

                if ((!range.min_inclusiv) && (range_max_end_moment <= range.min)) {
                    return null;
                }

                if (!!offset) {
                    TimeSegmentHandler.getInstance().incTimeSegment(range_max_ts, segment_type, offset);
                }

                // Si on est sur un max range et qu'on veut pas retourner la valeur, on retourne null
                if (!return_max_value && this.is_right_open(range)) {
                    return null;
                }

                return range_max_ts.index;
        }
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin_from_ranges(ranges: IRange[], segment_type: number = null, offset: number = 0): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let first_range = ranges.find((range: IRange) => !!range);

        if (!first_range) {
            return null;
        }

        segment_type = (segment_type == null) ? first_range.segment_type : segment_type;

        let res: number = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_min = this.getSegmentedMin(range, segment_type);

            if ((range_min == null) || (typeof range_min == 'undefined')) {
                continue;
            }

            if (res == null) {
                res = range_min;
            } else {
                res = Math.min(range_min, res);
            }
        }

        if (!!offset) {
            res = this.inc_elt(first_range.range_type, res, segment_type, offset);
        }

        return res;
    }


    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax_from_ranges(ranges: IRange[], segment_type: number = null, offset: number = 0): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let first_range = ranges.find((range: IRange) => !!range);

        if (!first_range) {
            return null;
        }

        segment_type = (segment_type == null) ? first_range.segment_type : segment_type;

        let res: number = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            let range_max = this.getSegmentedMax(range, segment_type);

            if ((range_max == null) || (typeof range_max == 'undefined')) {
                continue;
            }

            if (res == null) {
                res = range_max;
            } else {
                res = Math.max(range_max, res);
            }
        }

        if (!!offset) {
            res = this.inc_elt(first_range.range_type, res, segment_type, offset);
        }

        return res;
    }

    /**
     * ATTENTION très gourmand en perf très rapidement, il ne faut utiliser que sur de très petits ensembles
     * Le segment_type est forcé à int
     */
    public get_combinaisons(range_type: number, combinaisons: IRange[][], combinaison_actuelle: IRange[], elts: number[], index: number, cardinal: number) {

        if (cardinal <= 0) {
            if ((!!combinaison_actuelle) && (!!combinaison_actuelle.length)) {
                combinaisons.push(combinaison_actuelle);
            }
            return;
        }

        cardinal--;

        for (let i = index; i < (elts.length - cardinal); i++) {

            let deploy_combinaison: IRange[] = (combinaison_actuelle && combinaison_actuelle.length) ? RangeHandler.getInstance().cloneArrayFrom(combinaison_actuelle) : [];

            deploy_combinaison.push(this.create_single_elt_range(range_type, elts[i], NumSegment.TYPE_INT));

            this.get_combinaisons(range_type, combinaisons, deploy_combinaison, elts, i + 1, cardinal);
        }
    }

    public foreach_sync(range: IRange, callback_sync: (value: number) => void | void, segment_type: number = null, min_inclusiv: number = null, max_inclusiv: number = null) {
        if (!range) {
            return;
        }

        /**
         * Ajout contrôle range ouvert
         */
        if (this.is_one_max_range(range)) {
            ConsoleHandler.getInstance().error('foreach_sync on open range:' + this.getIndex(range));
            return;
        }

        segment_type = (segment_type == null) ? range.segment_type : segment_type;

        let min: number = this.getSegmentedMin(range, segment_type);
        let max: number = this.getSegmentedMax(range, segment_type);

        if ((!this.is_valid_elt(range.range_type, range.min)) || (!this.is_valid_elt(range.range_type, range.max))) {
            return;
        }

        if (this.is_valid_elt(range.range_type, min_inclusiv)) {

            min_inclusiv = this.get_segment(range.range_type, min_inclusiv, segment_type).index;
            if (this.is_elt_sup_elt(range.range_type, min_inclusiv, min)) {
                min = min_inclusiv;
            }
        }
        if (this.is_valid_elt(range.range_type, max_inclusiv)) {

            max_inclusiv = this.get_segment(range.range_type, max_inclusiv, segment_type).index;
            if (this.is_elt_inf_elt(range.range_type, max_inclusiv, max)) {
                max = max_inclusiv;
            }
        }
        if (this.is_elt_sup_elt(range.range_type, min, max)) {
            return;
        }

        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                for (let i = min; i <= max; (i)++) {
                    callback_sync(i);
                }
                return;

            case HourRange.RANGE_TYPE:
                while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                    callback_sync(min);
                    min = Dates.add(min, 1, segment_type);
                }
                return;

            case TSRange.RANGE_TYPE:
                while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                    callback_sync(min);
                    min = Dates.add(min, 1, segment_type);
                }
                return;
        }
    }

    public async foreach(range: IRange, callback: (value: number) => Promise<void> | void, segment_type: number = null, min_inclusiv: number = null, max_inclusiv: number = null) {
        if (!range) {
            return;
        }

        /**
         * Ajout contrôle range ouvert
         */
        if (this.is_one_max_range(range)) {
            ConsoleHandler.getInstance().error('foreach on open range:' + this.getIndex(range));
            return;
        }

        segment_type = (segment_type == null) ? range.segment_type : segment_type;

        let min: number = this.getSegmentedMin(range, segment_type);
        let max: number = this.getSegmentedMax(range, segment_type);

        if ((!this.is_valid_elt(range.range_type, range.min)) || (!this.is_valid_elt(range.range_type, range.max))) {
            return;
        }

        if ((!this.is_valid_elt(range.range_type, min)) || (!this.is_valid_elt(range.range_type, max))) {
            return;
        }

        if (this.is_valid_elt(range.range_type, min_inclusiv)) {

            min_inclusiv = this.get_segment(range.range_type, min_inclusiv, segment_type).index;
            if (this.is_elt_sup_elt(range.range_type, min_inclusiv, min)) {
                min = min_inclusiv;
            }
        }
        if (this.is_valid_elt(range.range_type, max_inclusiv)) {

            max_inclusiv = this.get_segment(range.range_type, max_inclusiv, segment_type).index;
            if (this.is_elt_inf_elt(range.range_type, max_inclusiv, max)) {
                max = max_inclusiv;
            }
        }
        if (this.is_elt_sup_elt(range.range_type, min, max)) {
            return;
        }

        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                for (let i = min; i <= max; (i)++) {
                    await callback(i);
                }
                return;

            case HourRange.RANGE_TYPE:
                while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                    await callback(min);
                    min = Dates.add(min, 1, segment_type);
                }
                return;

            case TSRange.RANGE_TYPE:
                while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                    await callback(min);
                    min = Dates.add(min, 1, segment_type);
                }
                return;
        }
    }

    public async foreach_batch_await(range: IRange, callback: (value: number) => Promise<void> | void, segment_type: number = null, min_inclusiv: number = null, max_inclusiv: number = null) {
        if (!range) {
            return;
        }

        /**
         * Ajout contrôle range ouvert
         */
        if (this.is_one_max_range(range)) {
            ConsoleHandler.getInstance().error('foreach_batch_await on open range:' + this.getIndex(range));
            return;
        }

        segment_type = (segment_type == null) ? range.segment_type : segment_type;

        let min: number = this.getSegmentedMin(range, segment_type);
        let max: number = this.getSegmentedMax(range, segment_type);

        if ((!this.is_valid_elt(range.range_type, range.min)) || (!this.is_valid_elt(range.range_type, range.max))) {
            return;
        }

        if (this.is_valid_elt(range.range_type, min_inclusiv)) {

            min_inclusiv = this.get_segment(range.range_type, min_inclusiv, segment_type).index;
            if (this.is_elt_sup_elt(range.range_type, min_inclusiv, min)) {
                min = min_inclusiv;
            }
        }
        if (this.is_valid_elt(range.range_type, max_inclusiv)) {

            max_inclusiv = this.get_segment(range.range_type, max_inclusiv, segment_type).index;
            if (this.is_elt_inf_elt(range.range_type, max_inclusiv, max)) {
                max = max_inclusiv;
            }
        }
        if (this.is_elt_sup_elt(range.range_type, min, max)) {
            return;
        }

        let promises = [];
        switch (range.range_type) {

            case NumRange.RANGE_TYPE:
                for (let i = min; i <= max; (i)++) {
                    promises.push(callback(i));
                }
                break;

            case HourRange.RANGE_TYPE:
                while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                    promises.push(callback(min));
                    min = Dates.add(min, 1, segment_type);
                }
                break;

            case TSRange.RANGE_TYPE:
                while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                    promises.push(callback(min));
                    min = Dates.add(min, 1, segment_type);
                }
                break;
        }
        await Promise.all(promises);
    }

    /**
     * ATTENTION : utiliser avec des ranges normalisés (donc le min correspond au min du range et le max est après le dernier segment inclu)
     *  (min_inclusive && !max_inclusiv)
     * @param range_a RANGE NORMALISE OBLIGATOIREMENT
     * @param range_b RANGE NORMALISE OBLIGATOIREMENT
     */
    public range_intersects_range_optimized_normalized(range_a: IRange, range_b: IRange): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        let start_a = range_a.min;
        let start_b = range_b.min;

        let end_a: any = range_a.max;
        let end_b: any = range_b.max;

        if ((start_a <= start_b) && (start_b < end_a)) {
            return true;
        }

        if ((start_b <= start_a) && (start_a < end_b)) {
            return true;
        }

        return false;
    }



    /**
     * ATTENTION uniquement sur des ensembles de ranges qui sont normalisés, de même type
     * @param range_a
     * @param ranges
     */
    public range_intersects_any_range(range_a: IRange, ranges: IRange[]): boolean {

        if ((!ranges) || (!range_a) || (!ranges.length)) {
            return false;
        }

        for (let i in ranges) {
            let range_b = ranges[i];

            if (this.range_intersects_range(range_a, range_b)) {
                return true;
            }
        }

        return false;
    }

    public createNew<T, U extends IRange>(range_type: number, start: number, end: number, start_inclusiv: boolean, end_inclusiv: boolean, segment_type: number): U {
        if ((start == null) || (end == null)) {
            return null;
        }

        switch (range_type) {

            case NumRange.RANGE_TYPE:
                return NumRange.createNew(start, end, start_inclusiv, end_inclusiv, segment_type) as any as U;

            case HourRange.RANGE_TYPE:
                return HourRange.createNew(start, end, start_inclusiv, end_inclusiv, segment_type) as any as U;

            case TSRange.RANGE_TYPE:
                return TSRange.createNew(start, end, start_inclusiv, end_inclusiv, segment_type) as any as U;
        }
    }

    /**
     * Renvoie le plus petit segment_type parmi ceux en param (par exemple si on a un range minute et un année, on renvoie minute)
     * @param ranges
     */
    public get_smallest_segment_type_from_ranges(ranges: IRange[]): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let min: number = null;
        for (let i in ranges) {
            let range = ranges[i];

            if (min == null) {
                min = range.segment_type;
                continue;
            }

            switch (ranges[i].range_type) {
                case NumRange.RANGE_TYPE:
                    min = NumSegmentHandler.getInstance().getSmallestNumSegmentationType(min, range.segment_type);
                    break;

                case HourRange.RANGE_TYPE:
                    min = HourSegmentHandler.getInstance().getSmallestHourSegmentationType(min, range.segment_type);
                    break;

                case TSRange.RANGE_TYPE:
                    min = TimeSegmentHandler.getInstance().getSmallestTimeSegmentationType(min, range.segment_type);
                    break;
            }
        }
        return min;
    }

    public get_smallest_segment_type_for_range_type(range_type: number): number {

        if (range_type == null) {
            return null;
        }

        switch (range_type) {
            case NumRange.RANGE_TYPE:
                return NumSegment.TYPE_INT;

            case HourRange.RANGE_TYPE:
                return HourSegment.TYPE_SECOND;

            case TSRange.RANGE_TYPE:
                return TimeSegment.TYPE_SECOND;
        }
        return null;
    }

    /**
     * TODO TU ASAP FIXME VARS
     * @deprecated
     */
    public translate_from_bdd<U extends NumRange>(range_type: number, ranges: string[], segmentation_type: number): U[] {

        let res: U[] = [];
        try {

            // Cas étrange des int8range[] qui arrivent en string et pas en array. On gère ici tant pis
            // TODO FIXME comprendre la source du pb
            if (!ranges) {
                return null;
            }

            if (!Array.isArray(ranges)) {
                let tmp_ranges = ((ranges as string).replace(/[{}"]/, '')).split(',');
                ranges = [];
                for (let i = 0; i < (tmp_ranges.length / 2); i++) {

                    ranges.push(tmp_ranges[i * 2] + ',' + tmp_ranges[(i * 2) + 1]);
                }
            }

            for (let i in ranges) {
                let range = ranges[i];

                // TODO FIXME ASAP : ALORS là c'est du pif total, on a pas l'info du tout en base, donc on peut pas conserver le segment_type......
                //  on prend les plus petits segments possibles, a priori ça pose 'moins' de soucis [?]
                switch (range_type) {
                    case NumRange.RANGE_TYPE:
                        res.push(this.parseRangeBDD(range_type, range, segmentation_type));
                        break;
                    case TSRange.RANGE_TYPE:
                        res.push(this.parseRangeBDD(range_type, range, segmentation_type));
                        break;
                    case HourRange.RANGE_TYPE:
                        res.push(this.parseRangeBDD(range_type, range, segmentation_type));
                        break;
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if ((!res) || (!res.length)) {
            return null;
        }
        this.sort_ranges(res);
        return res;
    }

    /**
     * Strongly inspired by https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
     * @param rangeLiteral
     * @deprecated
     */
    public parseRangeBDD<T, U extends IRange>(range_type: number, rangeLiteral: string, segment_type: number): U {
        var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_BDD);

        if (!matches) {
            return null;
        }

        try {

            switch (range_type) {

                case HourRange.RANGE_TYPE:

                    let lowerHourRange = this.parseRangeSegment(matches[2], matches[3]);
                    let upperHourRange = this.parseRangeSegment(matches[4], matches[5]);

                    return this.createNew(
                        range_type,
                        parseFloat(lowerHourRange),
                        parseFloat(upperHourRange),
                        matches[1] == '[',
                        matches[6] == ']',
                        segment_type) as any as U;

                case NumRange.RANGE_TYPE:

                    let lowerNumRange = this.parseRangeSegment(matches[2], matches[3]);
                    let upperNumRange = this.parseRangeSegment(matches[4], matches[5]);

                    return this.createNew(
                        range_type,
                        parseFloat(lowerNumRange),
                        parseFloat(upperNumRange),
                        matches[1] == '[',
                        matches[6] == ']',
                        segment_type) as any as U;

                case TSRange.RANGE_TYPE:
                    var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_BDD);

                    if (!matches) {
                        return null;
                    }

                    let lowerTSRange = parseInt(matches[2]);
                    let upperTSRange = parseInt(matches[4]);
                    return this.createNew(
                        range_type,
                        lowerTSRange,
                        upperTSRange,
                        matches[1] == '[',
                        matches[6] == ']',
                        segment_type) as any as U;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        return null;
    }

    private is_elt_equals_elt(range_type: number, a: number, b: number): boolean {

        return a == b;
    }

    private is_elt_inf_elt(range_type: number, a: number, b: number): boolean {
        if ((a == null) || (b == null)) {
            return false;
        }

        return a < b;
    }

    private is_elt_sup_elt(range_type: number, a: number, b: number): boolean {

        if ((a == null) || (b == null)) {
            return false;
        }

        return a > b;
    }

    private is_elt_equals_or_inf_elt(range_type: number, a: number, b: number): boolean {

        if (a === b) {
            return true;
        }

        if ((a == null) || (b == null)) {
            return false;
        }

        return a <= b;
    }

    private is_elt_equals_or_sup_elt(range_type: number, a: number, b: number): boolean {

        if (a === b) {
            return true;
        }

        if ((a == null) || (b == null)) {
            return false;
        }

        return a >= b;
    }

    private is_valid_elt(range_type: number, elt: number): boolean {
        return (elt != null) && (typeof elt != 'undefined') && !isNaN(elt);
    }

    private get_segment(range_type: number, elt: number, segment_type: number): ISegment {
        switch (range_type) {

            case NumRange.RANGE_TYPE:
                return NumSegmentHandler.getInstance().getCorrespondingNumSegment(elt, segment_type) as any as ISegment;

            case HourRange.RANGE_TYPE:
                return HourSegmentHandler.getInstance().getCorrespondingHourSegment(elt, segment_type) as any as ISegment;

            case TSRange.RANGE_TYPE:
                return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(elt, segment_type) as any as ISegment;
        }
    }

    private inc_segment(range_type: number, segment: ISegment, segment_type: number, offset: number) {
        switch (range_type) {

            case NumRange.RANGE_TYPE:
                NumSegmentHandler.getInstance().incNumSegment(segment as any as NumSegment, segment_type, offset);
                break;

            case HourRange.RANGE_TYPE:
                HourSegmentHandler.getInstance().incHourSegment(segment as any as HourSegment, segment_type, offset);
                break;

            case TSRange.RANGE_TYPE:
                TimeSegmentHandler.getInstance().incTimeSegment(segment as any as TimeSegment, segment_type, offset);
                break;
        }
    }

    /**
     *
     * @param range_type
     * @param elt Directement modifié s'il s'agit d'un moment
     * @param segment_type
     * @param offset
     */
    private inc_elt(range_type: number, elt: number, segment_type: number, offset: number): number {
        switch (range_type) {

            case NumRange.RANGE_TYPE:
                return NumSegmentHandler.getInstance().incNum(elt, segment_type, offset);

            case HourRange.RANGE_TYPE:
                elt = Dates.add(elt, offset, segment_type);
                return elt;

            case TSRange.RANGE_TYPE:
                elt = Dates.add(elt, offset, segment_type);
                return elt;
        }
    }

    /**
     * @deprecated TODO FIXME DELETE RETROCOMPATIBILITE TEMPORAIRE
     */
    private parseRangeSegment(whole, quoted) {
        if (quoted) {
            return quoted.replace(/\\(.)/g, "$1");
        }
        if (whole === "") {
            return null;
        }
        return whole;
    }
}

