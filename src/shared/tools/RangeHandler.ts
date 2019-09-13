import * as clonedeep from 'lodash/cloneDeep';
import IRange from '../modules/DataRender/interfaces/IRange';
import RangesCutResult from '../modules/Matroid/vos/RangesCutResult';

export default abstract class RangeHandler<T> {

    public static isValid<T>(range: IRange<T>): boolean {
        if ((!range) || (range.min == null) || (range.max == null) || (typeof range.min == 'undefined') || (typeof range.max == 'undefined') || (typeof range.min_inclusiv == 'undefined') || (typeof range.max_inclusiv == 'undefined')) {
            return false;
        }
        return true;
    }

    protected static RANGE_MATCHER_API = /([0-9]+)(\[|\()("((?:\\"|[^"])*)"|[^"]*),("((?:\\"|[^"])*)"|[^"]*)(\]|\))/;
    protected static RANGE_MATCHER_BDD = /(\[|\()("((?:\\"|[^"])*)"|[^"]*),("((?:\\"|[^"])*)"|[^"]*)(\]|\))/;

    protected constructor() { }

    /**
     * TODO FIXME ASAP TU
     */
    public range_includes_range(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if (!range_b) {
            return false;
        }

        if (!range_a) {
            return false;
        }

        let segmented_min_a: T = this.getSegmentedMin(range_a);
        let segmented_min_b: T = this.getSegmentedMin(range_b);
        let segmented_max_a: T = this.getSegmentedMax(range_a);
        let segmented_max_b: T = this.getSegmentedMax(range_b);

        if (this.isSupp(range_a, segmented_min_a, segmented_min_b)) {
            return false;
        }

        if (this.isInf(range_a, segmented_max_a, segmented_max_b)) {
            return false;
        }

        return true;
    }

    /**
     * On essaie de réduire le nombre d'ensemble si certains s'entrecoupent
     * @param ranges
     */
    public getRangesUnion(ranges: Array<IRange<T>>): Array<IRange<T>> {

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
    public ranges_are_contiguous_or_intersect(range_a: IRange<T>, range_b: IRange<T>): boolean {

        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (this.range_intersects_range(range_a, range_b)) {
            return true;
        }

        // Reste à tester les ensembles contigus
        if (range_a.min_inclusiv != range_b.max_inclusiv) {
            if (range_a.min == range_b.max) {
                return true;
            }
        }
        if (range_b.min_inclusiv != range_a.max_inclusiv) {
            if (range_b.min == range_a.max) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeStartB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.min_inclusiv && (!range_b.min_inclusiv)) {
            return range_a.min <= range_b.min;
        }
        return range_a.min < range_b.min;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameStartB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.min_inclusiv != range_b.min_inclusiv) {
            return false;
        }
        return range_a.min == range_b.min;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeEndB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.max_inclusiv) && range_b.max_inclusiv) {
            return range_a.max <= range_b.max;
        }
        return range_a.max < range_b.max;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndASameEndB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if (range_a.max_inclusiv != range_b.max_inclusiv) {
            return false;
        }
        return range_a.max == range_b.max;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartABeforeEndB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        return range_a.min < range_b.max;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isStartASameEndB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.min_inclusiv) || (!range_b.max_inclusiv)) {
            return false;
        }
        return range_a.min == range_b.max;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public isEndABeforeStartB(range_a: IRange<T>, range_b: IRange<T>): boolean {
        if ((!range_a) || (!range_b)) {
            return false;
        }

        if ((!range_a.max_inclusiv) || (!range_b.min_inclusiv)) {
            return range_a.max <= range_b.min;
        }
        return range_a.max < range_b.min;
    }

    /**
     * @param range_a
     * @param range_b
     */
    public range_intersects_range(range_a: IRange<T>, range_b: IRange<T>): boolean {

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

    public any_range_intersects_any_range(ranges_a: Array<IRange<T>>, ranges_b: Array<IRange<T>>): boolean {

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
    public range_intersects_any_range(range_a: IRange<T>, ranges: Array<IRange<T>>): boolean {

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
    public elt_intersects_any_range(a: T, ranges: Array<IRange<T>>): boolean {

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
    public elt_intersects_range(a: T, range: IRange<T>): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (this.isInf(range, a, range.min)) {
            return false;
        }

        if (this.isSupp(range, a, range.max)) {
            return false;
        }

        if (this.equals(range, a, range.min) && !range.min_inclusiv) {
            return false;
        }

        if (this.equals(range, a, range.max) && !range.max_inclusiv) {
            return false;
        }

        return true;
    }

    /**
     * @param elt
     * @param range
     */
    public is_elt_inf_min(a: T, range: IRange<T>): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.min_inclusiv) {
            return a < range.min;
        }
        return a <= range.min;
    }

    /**
     * @param elt
     * @param range
     */
    public is_elt_sup_max(a: T, range: IRange<T>): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        if (range.max_inclusiv) {
            return a > range.max;
        }
        return a >= range.max;
    }

    /**
     * Renvoie le plus petit ensemble permettant d'entourer les ranges passés en param
     * @param ranges
     */
    public getMinSurroundingRange(ranges: Array<IRange<T>>): IRange<T> {

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
                res = this.createNew(range.min, range.max, range.min_inclusiv, range.max_inclusiv, range.segment_type);
                continue;
            }

            if ((res.min_inclusiv && (range.min < res.min)) || ((!res.min_inclusiv) && (range.min <= res.min))) {
                res.min = range.min;
                res.min_inclusiv = range.min_inclusiv;
            }

            if ((res.max_inclusiv && (range.max > res.max)) || ((!res.max_inclusiv) && (range.max >= res.max))) {
                res.max = range.max;
                res.max_inclusiv = range.max_inclusiv;
            }
        }

        return res;
    }

    public cloneArrayFrom<U extends IRange<T>>(from: U[]): U[] {

        if (!from) {
            return null;
        }

        let res: U[] = [];

        for (let i in from) {
            res.push(this.cloneFrom(from[i]) as U);
        }
        return res;
    }

    public abstract createNew<U extends IRange<T>>(start: T, end: T, start_inclusiv: boolean, end_inclusiv: boolean, segment_type: number): U;
    public abstract cloneFrom<U extends IRange<T>>(from: U): U;

    public abstract translate_to_api<U extends IRange<T>>(ranges: U[]): string[];
    public abstract translate_from_api<U extends IRange<T>>(ranges: string[]): U[];

    public abstract translate_to_bdd<U extends IRange<T>>(ranges: U[]): string;
    public abstract translate_from_bdd<U extends IRange<T>>(ranges: string[], segment_type: number): U[];

    public abstract parseRangeBDD<U extends IRange<T>>(rangeLiteral: string, segment_type: number): U;
    public abstract parseRangeAPI<U extends IRange<T>>(rangeLiteral: string): U;

    public getIndex(range: IRange<T>): string {

        if ((!range) || (!RangeHandler.isValid(range))) {
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

    public getIndexRanges(ranges: Array<IRange<T>>): string {

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

    public getFormattedMinForAPI(range: IRange<T>): string {
        if (!range) {
            return null;
        }

        return range.min.toString();
    }

    public getFormattedMaxForAPI(range: IRange<T>): string {
        if (!range) {
            return null;
        }

        return range.max.toString();
    }

    public abstract getValueFromFormattedMinOrMaxAPI(input: string): T;

    public abstract getSegmentedMin(range: IRange<T>, segment_type?: number): T;
    public abstract getSegmentedMax(range: IRange<T>, segment_type?: number): T;

    public abstract getCardinal(range: IRange<T>, segment_type?: number): number;
    public getCardinalFromArray(ranges: Array<IRange<T>>, segment_type?: number): number {

        if (!ranges) {
            return null;
        }

        let res: number = 0;

        for (let i in ranges) {
            res += this.getCardinal(ranges[i], segment_type);
        }
        return res;
    }

    public abstract getSegmentedMin_from_ranges(ranges: Array<IRange<T>>, segment_type?: number): T;
    public abstract getSegmentedMax_from_ranges(ranges: Array<IRange<T>>, segment_type?: number): T;

    public abstract async foreach(range: IRange<T>, callback: (value: T) => Promise<void> | void, segment_type?: number, min_inclusiv?: T, max_inclusiv?: T);

    public async foreach_ranges(ranges: Array<IRange<T>>, callback: (value: T) => Promise<void> | void, segment_type?: number, min_inclusiv: T = null, max_inclusiv: T = null) {
        for (let i in ranges) {
            await this.foreach(ranges[i], callback, segment_type, min_inclusiv, max_inclusiv);
        }
    }

    /**
     * TODO FIXME ASAP VARS TU => refondre le cut range qui ne connait pas le segment_type et qui doit donc pas se baser dessus
     * @param range_cutter
     * @param range_to_cut
     */

    public cut_range<U extends IRange<any>>(range_cutter: U, range_to_cut: U): RangesCutResult<U> {

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

    // public cut_range<U extends IRange<any>>(range_cutter: U, range_to_cut: U): RangesCutResult<U> {

    //     if (!range_to_cut) {
    //         return null;
    //     }

    //     if ((!range_cutter) || (!this.range_intersects_range(range_cutter, range_to_cut))) {
    //         return new RangesCutResult(null, [this.cloneFrom(range_to_cut)]);
    //     }

    //     let res: U[] = [];

    //     let cutter_min = this.getSegmentedMin(range_cutter);
    //     let cutter_max = this.getSegmentedMax(range_cutter);
    //     let to_cut_min = this.getSegmentedMin(range_to_cut);
    //     let to_cut_max = this.getSegmentedMax(range_to_cut);

    //     if ((cutter_min == null) || (cutter_max == null)) {
    //         return new RangesCutResult(null, [this.cloneFrom(range_to_cut)]);
    //     }

    //     if ((to_cut_min == null) || (to_cut_max == null)) {
    //         return null;
    //     }

    //     let max_des_min = this.max(range_to_cut, cutter_min, to_cut_min);
    //     let min_des_max = this.min(range_to_cut, cutter_max, to_cut_max);

    //     if ((min_des_max == to_cut_max) && (max_des_min == to_cut_min)) {

    //         if (this.isStartASameStartB(range_cutter, range_to_cut) && this.isEndASameEndB(range_cutter, range_to_cut)) {
    //             return new RangesCutResult([this.cloneFrom(range_to_cut)], null);
    //         }
    //     }

    //     let is_max_des_min_supp_to_cut_min = this.isSupp(range_to_cut, max_des_min, to_cut_min);
    //     let is_min_des_max_inf_to_cut_max = this.isInf(range_to_cut, min_des_max, to_cut_max);

    //     if (is_max_des_min_supp_to_cut_min) {
    //         res.push(this.createNew(range_to_cut.min, range_cutter.min, range_to_cut.min_inclusiv, !range_cutter.min_inclusiv));
    //     }

    //     if (is_min_des_max_inf_to_cut_max) {
    //         res.push(this.createNew(
    //             this.isSupp(range_to_cut, range_cutter.max, range_to_cut.min) || this.equals(range_to_cut, range_cutter.max, range_to_cut.min) ? range_cutter.max : range_to_cut.min,
    //             range_to_cut.max,
    //             this.isSupp(range_to_cut, range_cutter.max, range_to_cut.min) || this.equals(range_to_cut, range_cutter.max, range_to_cut.min) ? !range_cutter.max_inclusiv : range_to_cut.min_inclusiv,
    //             range_to_cut.max_inclusiv));
    //     }
    //     return new RangesCutResult([this.createNew(
    //         is_max_des_min_supp_to_cut_min ? range_cutter.min : range_to_cut.min,
    //         is_min_des_max_inf_to_cut_max ? range_cutter.max : range_to_cut.max,
    //         is_max_des_min_supp_to_cut_min ? range_cutter.min_inclusiv : range_to_cut.min_inclusiv,
    //         is_min_des_max_inf_to_cut_max ? range_cutter.max_inclusiv : range_to_cut.max_inclusiv)], (res && res.length) ? res : null);
    // }

    public create_single_element_range(elt: T, segment_type: number): IRange<T> {
        return this.createNew(elt, elt, true, true, segment_type);
    }

    /**
     * ATTENTION les ranges sont considérés comme indépendants entre eux. Sinon cela n'a pas de sens.
     * @param range_cutter
     * @param ranges_to_cut
     */
    public cut_ranges<U extends IRange<any>>(range_cutter: U, ranges_to_cut: U[]): RangesCutResult<U> {

        let res: RangesCutResult<U> = null;

        for (let i in ranges_to_cut) {
            let range_to_cut = ranges_to_cut[i];

            res = this.addCutResults(res, this.cut_range(range_cutter, range_to_cut));
        }

        return res;
    }

    public cuts_ranges<U extends IRange<any>>(ranges_cutter: U[], ranges_to_cut: U[]): RangesCutResult<U> {

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

    /**
     *
     * @param range cas du fieldrange qui nécessite un typage
     * @param a
     * @param b
     */
    public abstract isSupp(range: IRange<T>, a: T, b: T): boolean;
    public abstract isInf(range: IRange<T>, a: T, b: T): boolean;
    public abstract equals(range: IRange<T>, a: T, b: T): boolean;

    public abstract max(range: IRange<T>, a: T, b: T): T;
    public abstract min(range: IRange<T>, a: T, b: T): T;

    public addCutResults<U extends IRange<T>>(a: RangesCutResult<U>, b: RangesCutResult<U>): RangesCutResult<U> {

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
    public get_ranges_shifted_by_x_segments(ranges: Array<IRange<T>>, shift_value: number, shift_segment_type: number): Array<IRange<T>> {

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

    public abstract get_range_shifted_by_x_segments(range: IRange<T>, shift_value: number, shift_segment_type: number): IRange<T>;

    public is_same(a: IRange<T>, b: IRange<T>): boolean {
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

    public are_same(as: Array<IRange<T>>, bs: Array<IRange<T>>): boolean {
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

    protected parseRangeSegment(whole, quoted) {
        if (quoted) {
            return quoted.replace(/\\(.)/g, "$1");
        }
        if (whole === "") {
            return null;
        }
        return whole;
    }

}

