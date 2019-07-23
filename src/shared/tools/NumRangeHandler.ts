import NumRange from '../modules/DataRender/vos/NumRange';
import RangeHandler from './RangeHandler';
import NumSegmentHandler from './NumSegmentHandler';
import NumSegment from '../modules/DataRender/vos/NumSegment';
import IRange from '../modules/DataRender/interfaces/IRange';

export default class NumRangeHandler extends RangeHandler<number> {

    public static getInstance(): NumRangeHandler {
        if (!NumRangeHandler.instance) {
            NumRangeHandler.instance = new NumRangeHandler();
        }
        return NumRangeHandler.instance;
    }

    private static instance: NumRangeHandler = null;

    /**
     * TODO TU ASAP FIXME VARS
     */
    public get_range_shifted_by_x_segments(range: NumRange, shift_value: number, shift_segment_type: number): NumRange {

        if (!range) {
            return null;
        }

        switch (shift_segment_type) {
            case NumSegment.TYPE_INT:
            default:
                return this.createNew(range.min + shift_value, range.max + shift_value, range.min_inclusiv, range.max_inclusiv);
        }
    }

    public createNew<U extends IRange<number>>(start: number = null, end: number = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): U {
        return NumRange.createNew(start, end, start_inclusiv, end_inclusiv) as U;
    }

    public cloneFrom<U extends IRange<number>>(from: U): U {
        return NumRange.cloneFrom(from) as U;
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
            elt += range.min_inclusiv ? '[' : '(';
            elt += range.min;
            elt += ',';
            elt += range.max;
            elt += range.max_inclusiv ? ']' : ')';

            res.push(elt);
        }

        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_from_api<U extends NumRange>(ranges: string[]): U[] {

        let res: U[] = [];
        try {

            for (let i in ranges) {
                let range = ranges[i];

                res.push(this.parseRange(range));
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
            res += range.min;
            res += ',';
            res += range.max;
            res += range.max_inclusiv ? ']' : ')';

            res += '"';
        }
        res += "}";

        return res;
    }

    /**
     * TODO TU ASAP FIXME VARS
     */
    public translate_from_bdd<U extends NumRange>(ranges: string[]): U[] {

        let res: U[] = [];
        try {

            for (let i in ranges) {
                let range = ranges[i];

                res.push(this.parseRange(range));
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
    public parseRange<U extends NumRange>(rangeLiteral: string): U {
        var matches = rangeLiteral.match(RangeHandler.RANGE_MATCHER);

        if (!matches) {
            return null;
        }

        var lower = this.parseRangeSegment(matches[2], matches[3]);
        var upper = this.parseRangeSegment(matches[4], matches[5]);

        return this.createNew(
            parseFloat(lower),
            parseFloat(upper),
            matches[1] == '[',
            matches[6] == ']');
    }


    /**
     * @param range_a
     * @param range_b
     */
    public getCardinal(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {
        if (!range) {
            return null;
        }

        let min: number = this.getSegmentedMin(range, segment_type);
        let max: number = this.getSegmentedMax(range, segment_type);

        if ((min == null) || (max == null)) {
            return null;
        }

        switch (segment_type) {
            case NumSegment.TYPE_INT:
                return (max - min) + 1;
        }

        return null;
    }

    public getValueFromFormattedMinOrMaxAPI(input: string): number {
        try {
            let res = parseFloat(input);

            if (isNaN(res)) {
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
    public getSegmentedMin(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {

        if (!range) {
            return null;
        }

        let range_min_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.min, segment_type);

        if (range_min_num.num < range.min) {
            range_min_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_min_num, segment_type, -1);
        }

        if (range_min_num.num > range.max) {
            return null;
        }

        if ((!range.max_inclusiv) && (range_min_num.num >= range.max)) {
            return null;
        }

        if (range.min_inclusiv) {
            return range_min_num.num;
        }

        if (range_min_num.num > range.min) {
            return range_min_num.num;
        }

        range_min_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_min_num, segment_type, -1);

        if (((!range.max_inclusiv) && (range.max == range_min_num.num)) || (range.max < range_min_num.num)) {
            return null;
        }

        return range_min_num.num;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {
        if (!range) {
            return null;
        }

        let range_max_num: NumSegment = NumSegmentHandler.getInstance().getCorrespondingNumSegment(range.max, segment_type);


        if (range_max_num.num < range.min) {
            return null;
        }

        if ((!range.min_inclusiv) && (range_max_num.num <= range.min)) {
            return null;
        }

        if (range.max_inclusiv) {
            return range_max_num.num;
        }

        if (range_max_num.num < range.max) {
            return range_max_num.num;
        }

        range_max_num = NumSegmentHandler.getInstance().getPreviousNumSegment(range_max_num, segment_type);

        if (((!range.min_inclusiv) && (range.min == range_max_num.num)) || (range.min > range_max_num.num)) {
            return null;
        }

        return range_max_num.num;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin_from_ranges(ranges: NumRange[], segment_type: number = NumSegment.TYPE_INT): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

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

        return res;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax_from_ranges(ranges: NumRange[], segment_type: number = NumSegment.TYPE_INT): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: number = null;

        for (let i in ranges) {
            let range = ranges[i];
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

        return res;
    }

    public foreach(range: NumRange, callback: (value: number) => void, segment_type: number = NumSegment.TYPE_INT, min_inclusiv: number = null, max_inclusiv: number = null) {
        let min = this.getSegmentedMin(range, segment_type);
        let max = this.getSegmentedMax(range, segment_type);

        if ((min == null) || (max == null) || (typeof min == 'undefined') || (typeof max == 'undefined')) {
            return;
        }

        if ((typeof min_inclusiv != 'undefined') && (min_inclusiv != null) && (!isNaN(min_inclusiv)) && (min_inclusiv > min)) {
            min = min_inclusiv;
        }
        if ((typeof max_inclusiv != 'undefined') && (max_inclusiv != null) && (!isNaN(max_inclusiv)) && (max_inclusiv < max)) {
            max = max_inclusiv;
        }
        if (min > max) {
            return;
        }

        for (let i = min; i <= max; i++) {
            callback(i);
        }
    }

    public isSupp(range: NumRange, a: number, b: number): boolean {
        return a > b;
    }

    public isInf(range: NumRange, a: number, b: number): boolean {
        return a < b;
    }

    public equals(range: NumRange, a: number, b: number): boolean {
        return a == b;
    }


    public max(range: NumRange, a: number, b: number): number {
        return Math.max(a, b);
    }

    public min(range: NumRange, a: number, b: number): number {
        return Math.min(a, b);
    }

}

