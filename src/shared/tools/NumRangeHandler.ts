import NumRange from '../modules/DataRender/vos/NumRange';
import RangeHandler from './RangeHandler';
import NumSegmentHandler from './NumSegmentHandler';
import NumSegment from '../modules/DataRender/vos/NumSegment';

export default class NumRangeHandler extends RangeHandler<number> {


    public static getInstance(): NumRangeHandler {
        if (!NumRangeHandler.instance) {
            NumRangeHandler.instance = new NumRangeHandler();
        }
        return NumRangeHandler.instance;
    }

    private static instance: NumRangeHandler = null;

    public createNew(start: number = null, end: number = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): NumRange {
        return NumRange.createNew(start, end, start_inclusiv, end_inclusiv);
    }

    public cloneFrom(from: NumRange): NumRange {
        return NumRange.cloneFrom(from);
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param range_a
     * @param range_b
     */
    public getCardinal(range: NumRange, segment_type: number = NumSegment.TYPE_INT): number {
        if (!range) {
            return null;
        }

        let min: number = this.getSegmentedMin(range, segment_type);
        let max: number = this.getSegmentedMax(range, segment_type);

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

    public foreach(range: NumRange, callback: (value: number) => void, segment_type: number = NumSegment.TYPE_INT) {
        let min = this.getSegmentedMin(range, segment_type);
        let max = this.getSegmentedMax(range, segment_type);

        if ((min == null) || (max == null) || (typeof min == 'undefined') || (typeof max == 'undefined')) {
            return;
        }

        switch (segment_type) {
            default:
                min = Math.ceil(min);
                max = Math.floor(max);
        }

        for (let i = min; i <= max; i++) {
            callback(i);
        }
    }
}

