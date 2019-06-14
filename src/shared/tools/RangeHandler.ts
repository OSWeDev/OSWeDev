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

        let res: Array<IRange<T>> = [];
        let hasContiguousRanges: boolean = false;
        for (let i in ranges) {
            let range = ranges[i];

            if ((!res) || (!res.length)) {
                res.push(this.cloneFrom(range));
                continue;
            }

            let got_contiguous: boolean = false;
            for (let j in res) {
                let resrange: IRange<T> = res[j];

                if (this.ranges_are_contiguous_or_intersect(resrange, range)) {
                    res[j] = this.getMinSurroundingRange([resrange, range]);
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
        if (range_a.start_inclusiv != range_b.end_inclusiv) {
            if (range_a.start == range_b.end) {
                return true;
            }
        }
        if (range_b.start_inclusiv != range_a.end_inclusiv) {
            if (range_b.start == range_a.end) {
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

        if (range_a.start_inclusiv && (!range_b.start_inclusiv)) {
            return range_a.start <= range_b.start;
        }
        return range_a.start < range_b.start;
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

        if (range_a.start_inclusiv != range_b.start_inclusiv) {
            return false;
        }
        return range_a.start == range_b.start;
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

        if (range_a.end_inclusiv && (!range_b.end_inclusiv)) {
            return range_a.end <= range_b.end;
        }
        return range_a.end < range_b.end;
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

        if (range_a.end_inclusiv != range_b.end_inclusiv) {
            return false;
        }
        return range_a.end == range_b.end;
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

        if (range_a.start_inclusiv && (!range_b.end_inclusiv)) {
            return range_a.start <= range_b.end;
        }
        return range_a.start < range_b.end;
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

        if (range_a.start_inclusiv != range_b.end_inclusiv) {
            return false;
        }
        return range_a.start == range_b.end;
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

        if (range_a.end_inclusiv && (!range_b.start_inclusiv)) {
            return range_a.end <= range_b.start;
        }
        return range_a.end < range_b.start;
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
    public range_intersects_ranges(range_a: IRange<T>, ranges: Array<IRange<T>>): boolean {

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

        if ((!ranges) || (!a) || (!ranges.length)) {
            return false;
        }

        let fakeRange = this.createNew(a, a, true, true);
        return this.range_intersects_ranges(fakeRange, ranges);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param ranges
     */
    public elt_intersects_range(a: T, range: IRange<T>): boolean {

        if ((!range) || (!a)) {
            return false;
        }

        let fakeRange = this.createNew(a, a, true, true);
        return this.range_intersects_range(fakeRange, range);
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

        let res: IRange<T> = this.createNew();

        for (let i in ranges) {
            let range = ranges[i];

            if (!res.start) {
                res.start = range.start;
                res.start_inclusiv = range.start_inclusiv;
            } else {

                if ((res.start_inclusiv && (range.start < res.start)) || ((!res.start_inclusiv) && (range.start <= res.start))) {
                    res.start = range.start;
                    res.start_inclusiv = range.start_inclusiv;
                }
            }

            if (!res.end) {
                res.end = range.end;
                res.end_inclusiv = range.end_inclusiv;
            } else {

                if ((res.end_inclusiv && (range.end > res.end)) || ((!res.end_inclusiv) && (range.end >= res.end))) {
                    res.end = range.end;
                    res.end_inclusiv = range.end_inclusiv;
                }
            }
        }

        return res;
    }

    protected abstract createNew(start?: T, end?: T, start_inclusiv?: boolean, end_inclusiv?: boolean): IRange<T>;
    protected abstract cloneFrom(from: IRange<T>): IRange<T>;
}

