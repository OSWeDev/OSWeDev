import * as clonedeep from 'lodash/cloneDeep';
import { Moment } from 'moment';
import moment = require('moment');
import IRange from '../modules/DataRender/interfaces/IRange';
import ISegment from '../modules/DataRender/interfaces/ISegment';
import NumRange from '../modules/DataRender/vos/NumRange';
import NumSegment from '../modules/DataRender/vos/NumSegment';
import TimeSegment from '../modules/DataRender/vos/TimeSegment';
import TSRange from '../modules/DataRender/vos/TSRange';
import RangesCutResult from '../modules/Matroid/vos/RangesCutResult';
import DateHandler from './DateHandler';
import NumSegmentHandler from './NumSegmentHandler';
import TimeSegmentHandler from './TimeSegmentHandler';

export default class RangeHandler {

    /**
     * DIRTY [ou pas?] Pseudo max int pour int8 en bdd (théotiquement -9223372036854775808 to 9223372036854775807
     */
    public static MIN_INT: number = -9223372036854775800;
    public static MAX_INT: number = 9223372036854775800;

    /**
     * DIRTY [ou pas?] Pseudo max int pour int8 en bdd (théotiquement -9223372036854775808 to 9223372036854775807
     *  /1000 par sécurité doute sur les conversions, anyway peu de chance que ça impact anything
     */
    public static MIN_TS: Moment = moment(-9223372036854);
    public static MAX_TS: Moment = moment(9223372036854);

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

    public isValid<T>(range: IRange<T>): boolean {
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

    public range_includes_ranges<T>(range_a: IRange<T>, ranges_b: Array<IRange<T>>): boolean {
        if (!ranges_b) {
            return true;
        }

        for (let i in ranges_b) {
            if (!this.range_includes_range(range_a, ranges_b[i])) {
                return false;
            }
        }
        return true;
    }

    public range_includes_range<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if (!range_a) {
            return false;
        }

        if (!range_b) {
            return true;
        }

        let segmented_min_a: T = this.getSegmentedMin(range_a);
        let segmented_min_b: T = this.getSegmentedMin(range_b);
        let segmented_max_a: T = this.getSegmentedMax(range_a);
        let segmented_max_b: T = this.getSegmentedMax(range_b);

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
    public getRangesUnion<T>(ranges: Array<IRange<T>>): Array<IRange<T>> {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: Array<IRange<T>> = null;
        let hasContiguousRanges: boolean = false;
        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            if (!res) {
                res = [this.cloneFrom(range)];
                continue;
            }

            let got_contiguous: boolean = false;
            for (let j in res) {
                let resrange: IRange<T> = res[j];

                if (this.ranges_are_contiguous_or_intersect(resrange, range)) {
                    res[j] = this.getMinSurroundingRange([resrange, range]);
                    got_contiguous = true;
                    break;
                }
            }

            hasContiguousRanges = hasContiguousRanges || got_contiguous;
            if (!got_contiguous) {
                res.push(this.cloneFrom(range));
            }
        }

        while (hasContiguousRanges) {
            hasContiguousRanges = false;

            let newres: Array<IRange<T>> = [];
            for (let j in res) {
                let resrangej: IRange<T> = res[j];

                if (!resrangej) {
                    continue;
                }

                for (let k in res) {
                    let resrangek: IRange<T> = res[k];

                    if (k <= j) {
                        continue;
                    }

                    if (this.ranges_are_contiguous_or_intersect(resrangej, resrangek)) {
                        hasContiguousRanges = true;
                        res[j] = this.getMinSurroundingRange([resrangej, resrangek]);
                        res[k] = null;
                        break;
                    }
                }

                newres.push(this.cloneFrom(res[j]));
            }

            res = newres;
        }

        return res;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public ranges_are_contiguous_or_intersect<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.inc_elt(range_a.range_type, this.getSegmentedMax(range_a), range_a.segment_type, 1), this.getSegmentedMin(range_b)) ||
            this.is_elt_equals_elt(range_a.range_type, this.inc_elt(range_b.range_type, this.getSegmentedMax(range_b), range_b.segment_type, 1), this.getSegmentedMin(range_a));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMin(range_a), this.getSegmentedMin(range_b));
    }


    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.getSegmentedMin(range_a), this.getSegmentedMin(range_b));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMax(range_a), this.getSegmentedMax(range_b));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.getSegmentedMax(range_a), this.getSegmentedMax(range_b));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeEndB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMin(range_a), this.getSegmentedMax(range_b));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameEndB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_equals_elt(range_a.range_type, this.getSegmentedMin(range_a), this.getSegmentedMax(range_b));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.range_type != range_b.range_type) {
            return false;
        }

        return this.is_elt_inf_elt(range_a.range_type, this.getSegmentedMax(range_a), this.getSegmentedMin(range_b));
    }

    /**
     * @param range_a
     * @param range_b
     */
    public range_intersects_range<T>(range_a: IRange<T>, range_b: IRange<T>): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((this.isStartABeforeStartB(range_a, range_b) || this.isStartASameStartB(range_a, range_b)) &&
            (this.isStartABeforeEndB(range_b, range_a) || this.isStartASameEndB(range_b, range_a))) {
            return true;
        }

        if ((this.isStartABeforeStartB(range_b, range_a) || this.isStartASameStartB(range_b, range_a)) &&
            (this.isStartABeforeEndB(range_a, range_b) || this.isStartASameEndB(range_a, range_b))) {
            return true;
        }

        return false;
    }

    public any_range_intersects_any_range<T>(ranges_a: Array<IRange<T>>, ranges_b: Array<IRange<T>>): boolean {

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

    /**
     * @param range_a
     * @param ranges
     */
    public range_intersects_any_range<T>(range_a: IRange<T>, ranges: Array<IRange<T>>): boolean {

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

    /**
     * @param range_a
     * @param ranges
     */
    public elt_intersects_any_range<T>(a: T, ranges: Array<IRange<T>>): boolean {

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
    public elt_intersects_range<T>(a: T, range: IRange<T>): boolean {

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
    public is_elt_inf_min<T>(a: T, range: IRange<T>): boolean {

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
    public is_elt_sup_max<T>(a: T, range: IRange<T>): boolean {

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
    public getMinSurroundingRange<T>(ranges: Array<IRange<T>>): IRange<T> {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: IRange<T> = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (!range) {
                continue;
            }

            if (!res) {
                res = this.createNew(range.range_type, range.min, range.max, range.min_inclusiv, range.max_inclusiv, range.segment_type);
                continue;
            }

            if ((res.min_inclusiv && this.is_elt_inf_elt(range.range_type, range.min, res.min)) || ((!res.min_inclusiv) && this.is_elt_equals_or_inf_elt(range.range_type, range.min, res.min))) {
                res.min = this.clone_elt(range.range_type, range.min);
                res.min_inclusiv = range.min_inclusiv;
            }

            if ((res.max_inclusiv && this.is_elt_sup_elt(range.range_type, range.max, res.max)) || ((!res.max_inclusiv) && this.is_elt_equals_or_sup_elt(range.range_type, range.max, res.max))) {
                res.max = this.clone_elt(range.range_type, range.max);
                res.max_inclusiv = range.max_inclusiv;
            }
        }

        return res;
    }

    public cloneArrayFrom<T, U extends IRange<T>>(from: U[]): U[] {

        if (!from) {
            return null;
        }

        let res: U[] = [];

        for (let i in from) {
            res.push(this.cloneFrom(from[i]) as U);
        }
        return res;
    }

    public getIndex<T>(range: IRange<T>): string {

        if ((!range) || (!this.isValid(range))) {
            return null;
        }

        let res: string = "";

        res += (range.min_inclusiv ? '[' : '(');
        res += this.getFormattedMinForAPI(range);
        res += ',';
        res += this.getFormattedMaxForAPI(range);
        res += (range.max_inclusiv ? ']' : ')');

        return res;
    }

    public getIndexRanges<T>(ranges: Array<IRange<T>>): string {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: string = "[";

        for (let i in ranges) {
            let range = ranges[i];

            let range_index = this.getIndex(range);

            if (!range_index) {
                return null;
            }

            res += (res == '[' ? '' : ',');
            res += range_index;
        }

        return res;
    }

    public getFormattedMinForAPI<T>(range: IRange<T>): string {
        if (!range) {
            return null;
        }

        if (range.range_type == NumRange.RANGE_TYPE) {
            return range.min.toString();
        } else {
            return DateHandler.getInstance().formatDateTimeForAPI(range.min as any as Moment);
        }
    }

    public getFormattedMaxForAPI<T>(range: IRange<T>): string {
        if (!range) {
            return null;
        }

        if (range.range_type == NumRange.RANGE_TYPE) {
            return range.max.toString();
        } else {
            return DateHandler.getInstance().formatDateTimeForAPI(range.max as any as Moment);
        }
    }

    public getCardinalFromArray<T>(ranges: Array<IRange<T>>, segment_type?: number): number {

        if (!ranges) {
            return null;
        }

        let res: number = 0;

        for (let i in ranges) {
            res += this.getCardinal(ranges[i], segment_type);
        }
        return res;
    }

    public async foreach_ranges<T>(ranges: Array<IRange<T>>, callback: (value: T) => Promise<void> | void, segment_type?: number, min_inclusiv: T = null, max_inclusiv: T = null) {
        for (let i in ranges) {
            await this.foreach(ranges[i], callback, segment_type, min_inclusiv, max_inclusiv);
        }
    }

    /**
     * TODO FIXME ASAP VARS TU => refondre le cut range qui ne connait pas le segment_type et qui doit donc pas se baser dessus
     * @param range_cutter
     * @param range_to_cut
     */

    public cut_range<T, U extends IRange<T>>(range_cutter: U, range_to_cut: U): RangesCutResult<U> {

        if (!range_to_cut) {
            return null;
        }

        if ((!range_cutter) || (!this.range_intersects_range(range_cutter, range_to_cut))) {
            return new RangesCutResult(null, [this.cloneFrom(range_to_cut)]);
        }

        let avant: U = this.cloneFrom(range_to_cut);
        let coupe: U = this.cloneFrom(range_to_cut);
        let apres: U = this.cloneFrom(range_to_cut);

        if (this.isStartABeforeStartB(range_to_cut, range_cutter)) {
            // SC > STC
            coupe.min = clonedeep(range_cutter.min);
            coupe.min_inclusiv = range_cutter.min_inclusiv;

            avant.min = clonedeep(range_to_cut.min);
            avant.min_inclusiv = range_to_cut.min_inclusiv;

            avant.max = clonedeep(range_cutter.min);
            avant.max_inclusiv = !range_cutter.min_inclusiv;
        } else {
            // SC <= STC
            coupe.min = clonedeep(range_to_cut.min);
            coupe.min_inclusiv = range_to_cut.min_inclusiv;
            avant = null;
        }

        if (this.isStartASameEndB(range_cutter, range_to_cut)) {
            // SC = ETC
            coupe.min = clonedeep(range_cutter.min);
            coupe.min_inclusiv = range_cutter.min_inclusiv;

            coupe.max = clonedeep(range_cutter.min);
            coupe.max_inclusiv = range_cutter.min_inclusiv;

            if (!!avant) {
                avant.min = clonedeep(range_to_cut.min);
                avant.min_inclusiv = range_to_cut.min_inclusiv;

                avant.max = clonedeep(range_cutter.min);
                avant.max_inclusiv = !range_cutter.min_inclusiv;
            }

            apres = null;
        }

        if (this.isStartASameEndB(range_to_cut, range_cutter)) {
            // STC = EC
            coupe.min = clonedeep(range_to_cut.min);
            coupe.min_inclusiv = range_to_cut.min_inclusiv;

            coupe.max = clonedeep(range_to_cut.min);
            coupe.max_inclusiv = range_to_cut.min_inclusiv;

            avant = null;

            if (!!apres) {
                apres.min = clonedeep(range_cutter.max);
                apres.min_inclusiv = !range_cutter.max_inclusiv;

                apres.max = clonedeep(range_to_cut.max);
                apres.max_inclusiv = range_to_cut.max_inclusiv;
            }
        }

        if (this.isEndABeforeEndB(range_cutter, range_to_cut)) {
            // EC < ETC
            coupe.max = clonedeep(range_cutter.max);
            coupe.max_inclusiv = range_cutter.max_inclusiv;

            if (!!apres) {
                apres.min = clonedeep(range_cutter.max);
                apres.min_inclusiv = !range_cutter.max_inclusiv;

                apres.max = clonedeep(range_to_cut.max);
                apres.max_inclusiv = range_to_cut.max_inclusiv;
            }
        } else {
            // SC <= STC
            coupe.max = clonedeep(range_to_cut.max);
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

    public create_single_elt_range<T>(range_type: number, elt: T, segment_type: number): IRange<T> {

        if (range_type == NumRange.RANGE_TYPE) {

            return this.create_single_elt_NumRange(elt as any as number, segment_type) as any as IRange<T>;
        } else {

            return this.create_single_elt_TSRange(elt as any as Moment, segment_type) as any as IRange<T>;
        }
    }

    public create_single_elt_NumRange(elt: number, segment_type: number): NumRange {
        return this.createNew(NumRange.RANGE_TYPE, elt, elt, true, true, segment_type);
    }

    public create_single_elt_TSRange(elt: Moment, segment_type: number): TSRange {
        return this.createNew(TSRange.RANGE_TYPE, elt, elt, true, true, segment_type);
    }


    /**
     * ATTENTION les ranges sont considérés comme indépendants entre eux. Sinon cela n'a pas de sens.
     * @param range_cutter
     * @param ranges_to_cut
     */
    public cut_ranges<T, U extends IRange<T>>(range_cutter: U, ranges_to_cut: U[]): RangesCutResult<U> {

        let res: RangesCutResult<U> = null;

        for (let i in ranges_to_cut) {
            let range_to_cut = ranges_to_cut[i];

            res = this.addCutResults(res, this.cut_range(range_cutter, range_to_cut));
        }

        return res;
    }

    public cuts_ranges<T, U extends IRange<T>>(ranges_cutter: U[], ranges_to_cut: U[]): RangesCutResult<U> {

        if (!ranges_to_cut) {
            return null;
        }

        let res: RangesCutResult<U> = new RangesCutResult(null, clonedeep(ranges_to_cut));

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

    public addCutResults<T, U extends IRange<T>>(a: RangesCutResult<U>, b: RangesCutResult<U>): RangesCutResult<U> {

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
    public get_ranges_shifted_by_x_segments<T>(ranges: Array<IRange<T>>, shift_value: number, shift_segment_type: number): Array<IRange<T>> {

        if ((!ranges) || (!ranges[0])) {
            return null;
        }

        let res: Array<IRange<T>> = [];

        for (let i in ranges) {
            let range = ranges[i];

            res.push(this.get_range_shifted_by_x_segments(range, shift_value, shift_segment_type));
        }
        return res;
    }

    public is_same<T>(a: IRange<T>, b: IRange<T>): boolean {
        if ((!a) || (!b)) {
            return false;
        }

        if ((a.min != b.min) || (a.min_inclusiv != b.min_inclusiv)) {
            return false;
        }

        if ((a.max != b.max) || (a.max_inclusiv != b.max_inclusiv)) {
            return false;
        }

        return true;
    }

    public are_same<T>(as: Array<IRange<T>>, bs: Array<IRange<T>>): boolean {
        if ((!as) || (!bs)) {
            return false;
        }

        if (as.length != bs.length) {
            return false;
        }

        for (let i in as) {

            let a = as[i];

            let found: boolean = false;
            for (let j in bs) {

                let b = bs[j];

                if (this.is_same(a, b)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return false;
            }
        }

        return true;
    }











    public getMaxNumRange(): NumRange {
        return this.createNew(NumRange.RANGE_TYPE, RangeHandler.MIN_INT, RangeHandler.MAX_INT, true, true, NumSegment.TYPE_INT);
    }

    public getMaxTSRange(): TSRange {
        return this.createNew(TSRange.RANGE_TYPE, RangeHandler.MIN_TS, RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_MS);
    }


    /**
     * TODO TU ASAP FIXME VARS
     */
    public get_range_shifted_by_x_segments<T>(range: IRange<T>, shift_value: number, shift_segment_type: number): IRange<T> {

        if (!range) {
            return null;
        }

        if (range.range_type == NumRange.RANGE_TYPE) {
            switch (shift_segment_type) {
                case NumSegment.TYPE_INT:
                default:
                    return this.createNew(range.range_type, (range.min as any as number) + shift_value, (range.max as any as number) + shift_value, range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange<T>;
            }
        } else {
            switch (shift_segment_type) {
                case TimeSegment.TYPE_MONTH:
                    return this.createNew(range.range_type, moment(range.min).add(shift_value, 'month'), moment(range.max).add(shift_value, 'month'), range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange<T>;
                case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                case TimeSegment.TYPE_YEAR:
                    return this.createNew(range.range_type, moment(range.min).add(shift_value, 'year'), moment(range.max).add(shift_value, 'year'), range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange<T>;
                case TimeSegment.TYPE_WEEK:
                    return this.createNew(range.range_type, moment(range.min).add(shift_value, 'week'), moment(range.max).add(shift_value, 'week'), range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange<T>;
                case TimeSegment.TYPE_DAY:
                default:
                    return this.createNew(range.range_type, moment(range.min).add(shift_value, 'day'), moment(range.max).add(shift_value, 'day'), range.min_inclusiv, range.max_inclusiv, range.segment_type) as any as IRange<T>;
            }
        }
    }

    public cloneFrom<T, U extends IRange<T>>(from: U): U {
        if (!from) {
            return null;
        }

        if (from.range_type == NumRange.RANGE_TYPE) {
            return NumRange.cloneFrom(from as any as NumRange) as any as U;
        } else {
            return TSRange.cloneFrom(from as any as TSRange) as any as U;
        }
    }

    /**
     * TODO TU ASAP FIXME VARS
     * On passe par une version text pour simplifier
     */
    public translate_to_api(ranges: NumRange[]): string[] {
        let res: string[] = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (res == null) {
                res = [];
            }

            let elt = '';
            elt += range.segment_type;
            elt += range.min_inclusiv ? '[' : '(';

            if (range.range_type == NumRange.RANGE_TYPE) {
                elt += range.min;
            } else {
                elt += (range.min as any as Moment).unix();
            }

            elt += ',';

            if (range.range_type == NumRange.RANGE_TYPE) {
                elt += range.max;
            } else {
                elt += (range.max as any as Moment).unix();
            }

            elt += range.max_inclusiv ? ']' : ')';

            res.push(elt);
        }

        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_from_api<U extends NumRange>(range_type: number, ranges: string[]): U[] {

        let res: U[] = [];
        try {

            for (let i in ranges) {
                let range = ranges[i];

                res.push(this.parseRangeAPI(range_type, range));
            }
        } catch (error) {
        }

        if ((!res) || (!res.length)) {
            return null;
        }
        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_to_bdd(ranges: NumRange[]): string {
        let res = null;

        for (let i in ranges) {
            let range = ranges[i];

            if (res == null) {
                res = '{"';
            } else {
                res += ',"';
            }

            res += range.min_inclusiv ? '[' : '(';

            if (range.range_type == NumRange.RANGE_TYPE) {
                res += range.min;
            } else {
                res += (range.min as any as Moment).unix();
            }
            res += ',';

            if (range.range_type == NumRange.RANGE_TYPE) {
                res += range.max;
            } else {
                res += (range.max as any as Moment).unix();
            }
            res += range.max_inclusiv ? ']' : ')';

            res += '"';
        }
        res += "}";

        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_from_bdd<U extends NumRange>(range_type: number, ranges: string[]): U[] {

        let res: U[] = [];
        try {

            for (let i in ranges) {
                let range = ranges[i];

                // TODO FIXME ASAP : ALORS là c'est du pif total, on a pas l'info du tout en base, donc on peut pas conserver le segment_type......
                //  on prend les plus petits segments possibles, a priori ça pose 'moins' de soucis [?]
                if (range_type == NumRange.RANGE_TYPE) {
                    res.push(this.parseRangeBDD(range_type, range, NumSegment.TYPE_INT));
                } else {
                    res.push(this.parseRangeBDD(range_type, range, TimeSegment.TYPE_MS));
                }
            }
        } catch (error) {
        }

        if ((!res) || (!res.length)) {
            return null;
        }
        return res;
    }

    /**
     * Strongly inspired by https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
     * @param rangeLiteral
     */
    public parseRangeBDD<T, U extends IRange<T>>(range_type: number, rangeLiteral: string, segment_type: number): U {
        var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_BDD);

        if (!matches) {
            return null;
        }

        try {

            if (range_type == NumRange.RANGE_TYPE) {

                let lower = this.parseRangeSegment(matches[2], matches[3]);
                let upper = this.parseRangeSegment(matches[4], matches[5]);

                return this.createNew(
                    range_type,
                    parseFloat(lower),
                    parseFloat(upper),
                    matches[1] == '[',
                    matches[6] == ']',
                    segment_type) as any as U;

            } else {
                var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_BDD);

                if (!matches) {
                    return null;
                }

                let lower = parseInt(matches[2]) * 1000;
                let upper = parseInt(matches[4]) * 1000;
                return this.createNew(
                    range_type,
                    moment(lower),
                    moment(upper),
                    matches[1] == '[',
                    matches[6] == ']',
                    segment_type) as any as U;
            }
        } catch (error) { }
        return null;
    }

    /**
     * Strongly inspired by https://github.com/WhoopInc/node-pg-range/blob/master/lib/parser.js
     * @param rangeLiteral
     */
    public parseRangeAPI<T, U extends IRange<T>>(range_type: number, rangeLiteral: string): U {
        var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER_API);

        if (!matches) {
            return null;
        }

        try {
            let segment_type = parseInt(matches[1].toString());

            if (range_type == NumRange.RANGE_TYPE) {

                let lower = this.parseRangeSegment(matches[3], matches[4]);
                let upper = this.parseRangeSegment(matches[5], matches[6]);

                return this.createNew(
                    range_type,
                    parseFloat(lower),
                    parseFloat(upper),
                    matches[2] == '[',
                    matches[7] == ']',
                    segment_type) as any as U;
            } else {

                let lower = parseInt(matches[3]) * 1000;
                let upper = parseInt(matches[5]) * 1000;
                return this.createNew(
                    range_type,
                    moment(lower),
                    moment(upper),
                    matches[2] == '[',
                    matches[7] == ']',
                    segment_type) as any as U;
            }
        } catch (error) { }
        return null;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public getCardinal<T>(range: IRange<T>, segment_type: number = null): number {
        if (!range) {
            return null;
        }

        if (segment_type == null) {
            if (range.range_type == NumRange.RANGE_TYPE) {
                segment_type = NumSegment.TYPE_INT;
            } else {
                segment_type = TimeSegment.TYPE_DAY;
            }
        }

        let min: T = this.getSegmentedMin(range, segment_type);
        let max: T = this.getSegmentedMax(range, segment_type);

        if ((min == null) || (max == null)) {
            return null;
        }

        if (range.range_type == NumRange.RANGE_TYPE) {
            switch (segment_type) {
                case NumSegment.TYPE_INT:
                    return ((max as any as number) - (min as any as number)) + 1;
            }
        } else {
            switch (segment_type) {
                case TimeSegment.TYPE_DAY:
                    return (max as any as Moment).diff(min, 'day') + 1;
                case TimeSegment.TYPE_MONTH:
                    return (max as any as Moment).diff(min, 'month') + 1;
                case TimeSegment.TYPE_WEEK:
                    return (max as any as Moment).diff(min, 'week') + 1;
                case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                case TimeSegment.TYPE_YEAR:
                    return (max as any as Moment).diff(min, 'year') + 1;
            }
        }

        return null;
    }

    public getValueFromFormattedMinOrMaxAPI<T>(range_type: number, input: string): T {
        try {
            if ((input == null) || (typeof input == 'undefined')) {
                return null;
            }

            let res = parseFloat(input);

            if (isNaN(res)) {
                return null;
            }

            if (range_type == NumRange.RANGE_TYPE) {
                return res as any as T;

            } else {
                let resn = moment(res);

                if (!resn.isValid()) {
                    return null;
                }

                return resn as any as T;
            }
        } catch (error) {
        }
        return null;
    }


    /**
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin<T>(range: IRange<T>, segment_type: number = null, offset: number = 0): T {

        if (!range) {
            return null;
        }

        if (segment_type == null) {
            if (range.range_type == NumRange.RANGE_TYPE) {
                segment_type = NumSegment.TYPE_INT;
            } else {
                segment_type = TimeSegment.TYPE_DAY;
            }
        }

        if (range.range_type == NumRange.RANGE_TYPE) {
            let range_min_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.min as any as number, segment_type);

            if (this.is_elt_sup_elt(range.range_type, range_min_num.index, range.max as any as number)) {
                return null;
            }

            if ((!range.max_inclusiv) && this.is_elt_equals_or_sup_elt(range.range_type, range_min_num.index, range.max as any as number)) {
                return null;
            }

            return range_min_num.index + offset as any as T;
        } else {
            let range_min_ts: ISegment<Moment> = this.get_segment(range.range_type, range.min as any as Moment, segment_type);
            let range_max_ts: ISegment<Moment> = this.get_segment(range.range_type, range.max as any as Moment, segment_type);

            if (range_min_ts.index.isAfter(moment(range_max_ts.index).utc(true))) {
                return null;
            }

            if ((!range.max_inclusiv) && (range_min_ts.index.isSameOrAfter(moment(range.max).utc(true)))) {
                return null;
            }

            if (!!offset) {
                TimeSegmentHandler.getInstance().incMoment(range_min_ts.index, segment_type, offset);
            }

            return range_min_ts.index as any as T;
        }
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax<T>(range: IRange<T>, segment_type: number = null, offset: number = 0): T {

        if (!range) {
            return null;
        }

        if (segment_type == null) {
            if (range.range_type == NumRange.RANGE_TYPE) {
                segment_type = NumSegment.TYPE_INT;
            } else {
                segment_type = TimeSegment.TYPE_DAY;
            }
        }

        if (range.range_type == NumRange.RANGE_TYPE) {

            let range_max_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.max as any as number, segment_type);

            if ((!range.max_inclusiv) && this.is_elt_equals_elt(range.range_type, range_max_num.index, range.max as any as number)) {
                range_max_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_max_num, segment_type);
            }

            let range_max_end: number = NumSegmentHandler.getInstance().getEndNumSegment(range_max_num);

            if (this.is_elt_inf_elt(range.range_type, range_max_end, range.min as any as number)) {
                return null;
            }

            if ((!range.min_inclusiv) && this.is_elt_equals_or_inf_elt(range.range_type, range_max_end, range.min as any as number)) {
                return null;
            }

            return range_max_num.index as any as T;
        } else {

            let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(range.max as any as Moment, segment_type);

            if ((!range.max_inclusiv) && (range_max_ts.index.isSame(moment(range.max).utc(true)))) {
                TimeSegmentHandler.getInstance().decTimeSegment(range_max_ts);
            }

            let range_max_end_moment: Moment = TimeSegmentHandler.getInstance().getEndTimeSegment(range_max_ts);

            if (range_max_end_moment.isBefore(moment(range.min).utc(true))) {
                return null;
            }

            if ((!range.min_inclusiv) && (range_max_end_moment.isSameOrBefore(moment(range.min).utc(true)))) {
                return null;
            }

            if (!!offset) {
                TimeSegmentHandler.getInstance().incMoment(range_max_ts.index, segment_type, offset);
            }

            return range_max_ts.index as any as T;
        }
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin_from_ranges<T>(ranges: Array<IRange<T>>, segment_type: number = null, offset: number = 0): T {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        if (segment_type == null) {
            if (ranges[0].range_type == NumRange.RANGE_TYPE) {
                segment_type = NumSegment.TYPE_INT;
            } else {
                segment_type = TimeSegment.TYPE_DAY;
            }
        }

        let res: T = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_min = this.getSegmentedMin(range, segment_type);

            if ((range_min == null) || (typeof range_min == 'undefined')) {
                continue;
            }

            if (res == null) {
                res = range_min;
            } else {
                res = this.min(range.range_type, range_min, res);
            }
        }

        if (!!offset) {
            res = this.inc_elt(ranges[0].range_type, res, segment_type, offset);
        }

        return res;
    }


    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax_from_ranges<T>(ranges: Array<IRange<T>>, segment_type: number = null, offset: number = 0): T {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        if (segment_type == null) {
            if (ranges[0].range_type == NumRange.RANGE_TYPE) {
                segment_type = NumSegment.TYPE_INT;
            } else {
                segment_type = TimeSegment.TYPE_DAY;
            }
        }

        let res: T = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_max = this.getSegmentedMax(range, segment_type);

            if ((range_max == null) || (typeof range_max == 'undefined')) {
                continue;
            }

            if (res == null) {
                res = range_max;
            } else {
                res = this.max(range.range_type, range_max, res);
            }
        }

        if (!!offset) {
            res = this.inc_elt(ranges[0].range_type, res, segment_type, offset);
        }

        return res;
    }

    /**
     * ATTENTION très gourmand en perf très rapidement, il ne faut utiliser que sur de très petits ensembles
     * Le segment_type est forcé à int
     */
    public get_combinaisons<T>(range_type: number, combinaisons: Array<Array<IRange<T>>>, combinaison_actuelle: Array<IRange<T>>, elts: T[], index: number, cardinal: number) {

        if (cardinal <= 0) {
            if ((!!combinaison_actuelle) && (!!combinaison_actuelle.length)) {
                combinaisons.push(combinaison_actuelle);
            }
            return;
        }

        cardinal--;

        for (let i = index; i < (elts.length - cardinal); i++) {

            let deploy_combinaison: Array<IRange<T>> = (combinaison_actuelle && combinaison_actuelle.length) ? RangeHandler.getInstance().cloneArrayFrom(combinaison_actuelle) : [];

            deploy_combinaison.push(this.create_single_elt_range(range_type, elts[i], NumSegment.TYPE_INT));

            this.get_combinaisons(range_type, combinaisons, deploy_combinaison, elts, i + 1, cardinal);
        }
    }

    public async foreach<T>(range: IRange<T>, callback: (value: T) => Promise<void> | void, segment_type: number = null, min_inclusiv: T = null, max_inclusiv: T = null) {
        if (!range) {
            return;
        }

        if (segment_type == null) {
            if (range.range_type == NumRange.RANGE_TYPE) {
                segment_type = NumSegment.TYPE_INT;
            } else {
                segment_type = TimeSegment.TYPE_DAY;
            }
        }

        let min: T = this.getSegmentedMin(range, segment_type);
        let max: T = this.getSegmentedMax(range, segment_type);

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

        if (range.range_type == NumRange.RANGE_TYPE) {
            for (let i = min; i <= max; (i as any as number)++) {
                await callback(i);
            }
        } else {
            while (min && this.is_elt_equals_or_inf_elt(range.range_type, min, max)) {

                await callback(min);
                TimeSegmentHandler.getInstance().incMoment(min as any as Moment, segment_type, 1);
            }
        }
    }



    public createNew<T, U extends IRange<T>>(range_type: number, start: T, end: T, start_inclusiv: boolean, end_inclusiv: boolean, segment_type: number): U {
        if (range_type == NumRange.RANGE_TYPE) {
            return NumRange.createNew(start as any as number, end as any as number, start_inclusiv, end_inclusiv, segment_type) as any as U;
        } else {
            return TSRange.createNew(moment(start), moment(end), start_inclusiv, end_inclusiv, segment_type) as any as U;
        }
    }





    public max<T>(range_type: number, a: T, b: T): T {
        if (range_type == NumRange.RANGE_TYPE) {
            return Math.max(a as any as number, b as any as number) as any as T;
        } else {
            return moment.max(a as any as Moment, b as any as Moment) as any as T;
        }
    }

    public min<T>(range_type: number, a: T, b: T): T {
        if (range_type == NumRange.RANGE_TYPE) {
            return Math.min(a as any as number, b as any as number) as any as T;
        } else {
            return moment.min(a as any as Moment, b as any as Moment) as any as T;
        }
    }

    private is_elt_equals_elt<T>(range_type: number, a: T, b: T): boolean {
        if (range_type == NumRange.RANGE_TYPE) {
            return a == b;
        } else {
            return (a as any as Moment).isSame(b);
        }
    }

    private is_elt_inf_elt<T>(range_type: number, a: T, b: T): boolean {
        if (range_type == NumRange.RANGE_TYPE) {
            return a < b;
        } else {
            return (a as any as Moment).isBefore(b);
        }
    }

    private is_elt_sup_elt<T>(range_type: number, a: T, b: T): boolean {
        if (range_type == NumRange.RANGE_TYPE) {
            return a > b;
        } else {
            return (a as any as Moment).isAfter(b);
        }
    }

    private is_elt_equals_or_inf_elt<T>(range_type: number, a: T, b: T): boolean {
        if (range_type == NumRange.RANGE_TYPE) {
            return a <= b;
        } else {
            return (a as any as Moment).isSameOrBefore(b);
        }
    }

    private is_elt_equals_or_sup_elt<T>(range_type: number, a: T, b: T): boolean {
        if (range_type == NumRange.RANGE_TYPE) {
            return a >= b;
        } else {
            return (a as any as Moment).isSameOrAfter(b);
        }
    }

    private clone_elt<T>(range_type: number, elt: T): T {
        if (range_type == NumRange.RANGE_TYPE) {
            return elt;
        } else {
            if (!elt) {
                return elt;
            }
            return moment(elt) as any as T;
        }
    }

    private is_valid_elt<T>(range_type: number, elt: T): boolean {
        if (range_type == NumRange.RANGE_TYPE) {
            return (elt != null) && (typeof elt != 'undefined') && !isNaN(elt as any as number);
        } else {
            return (elt != null) && (typeof elt != 'undefined') && (elt as any as Moment).isValid();
        }
    }

    private get_segment<T>(range_type: number, elt: T, segment_type: number): ISegment<T> {
        if (range_type == NumRange.RANGE_TYPE) {
            return NumSegmentHandler.getInstance().getCorrespondingNumSegment(elt as any as number, segment_type) as any as ISegment<T>;
        } else {
            return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(elt as any as Moment, segment_type) as any as ISegment<T>;
        }
    }

    private inc_segment<T>(range_type: number, segment: ISegment<T>, segment_type: number, offset: number) {
        if (range_type == NumRange.RANGE_TYPE) {
            NumSegmentHandler.getInstance().incNumSegment(segment as any as NumSegment, segment_type, offset);
        } else {
            TimeSegmentHandler.getInstance().incTimeSegment(segment as any as TimeSegment, segment_type, offset);
        }
    }

    /**
     *
     * @param range_type
     * @param elt Directement modifié s'il s'agit d'un moment
     * @param segment_type
     * @param offset
     */
    private inc_elt<T>(range_type: number, elt: T, segment_type: number, offset: number): T {
        if (range_type == NumRange.RANGE_TYPE) {
            return NumSegmentHandler.getInstance().incNum(elt as any as number, segment_type, offset) as any as T;
        } else {
            TimeSegmentHandler.getInstance().incMoment(elt as any as Moment, segment_type, offset);
            return elt;
        }
    }

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

