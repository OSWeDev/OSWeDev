import IRange from '../modules/DataRender/interfaces/IRange';

export default abstract class RangeHandler<T> {

    protected constructor() { }

    /**
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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

    /**
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param ranges
     */
    public elt_intersects_any_range(a: T, ranges: Array<IRange<T>>): boolean {

        if ((!ranges) || (a == null) || (typeof a === 'undefined') || (!ranges.length)) {
            return false;
        }

        let fakeRange = this.createNew(a, a, true, true);
        return this.range_intersects_any_range(fakeRange, ranges);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param ranges
     */
    public elt_intersects_range(a: T, range: IRange<T>): boolean {

        if ((!range) || (a == null) || (typeof a === 'undefined')) {
            return false;
        }

        let fakeRange = this.createNew(a, a, true, true);
        return this.range_intersects_range(fakeRange, range);
    }

    /**
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
     * FIXME TODO ASAP WITH TU
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
                res = this.createNew(range.min, range.max, range.min_inclusiv, range.max_inclusiv);
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

    public abstract createNew(start?: T, end?: T, start_inclusiv?: boolean, end_inclusiv?: boolean): IRange<T>;
    public abstract cloneFrom(from: IRange<T>): IRange<T>;

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

    public abstract getSegmentedMin_from_ranges(ranges: Array<IRange<T>>, segment_type?: number): T;
    public abstract getSegmentedMax_from_ranges(ranges: Array<IRange<T>>, segment_type?: number): T;

    public abstract foreach(range: IRange<T>, callback: (value: T) => void, segment_type?: number);

    public foreach_ranges(ranges: Array<IRange<T>>, callback: (value: T) => void, segment_type?: number) {
        for (let i in ranges) {
            this.foreach(ranges[i], callback, segment_type);
        }
    }
}

