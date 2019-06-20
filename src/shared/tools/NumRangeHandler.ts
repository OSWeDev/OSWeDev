import NumRange from '../modules/DataRender/vos/NumRange';
import RangeHandler from './RangeHandler';

export default class NumRangeHandler extends RangeHandler<number> {

    public static SEGMENTATION_UNITE: number = 0;

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

    public getValueFromFormattedMinOrMaxAPI(input: string): number {
        try {
            return parseFloat(input);
        } catch (error) {
        }
        return null;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin(range: NumRange, segment_type?: number): number {

        if (!range) {
            return null;
        }

        if (range.min_inclusiv) {
            return range.min;
        }

        return range.min + 1;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est [4,5) ça veut dire 4 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMax(range: NumRange, segment_type?: number): number {
        if (!range) {
            return null;
        }

        if (range.max_inclusiv) {
            return range.max;
        }

        return range.max - 1;
    }

    /**
     * On considère qu'on est sur une segmentation unité donc si l'ensemble c'est (4,5] ça veut dire 5 en fait
     * @param range
     * @param segment_type pas utilisé pour le moment, on pourra l'utiliser pour un incrément décimal par exemple
     */
    public getSegmentedMin_from_ranges(ranges: NumRange[], segment_type?: number): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: number = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_min = this.getSegmentedMin(range, segment_type);

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
    public getSegmentedMax_from_ranges(ranges: NumRange[], segment_type?: number): number {

        if ((!ranges) || (!ranges.length)) {
            return null;
        }

        let res: number = null;

        for (let i in ranges) {
            let range = ranges[i];
            let range_max = this.getSegmentedMax(range, segment_type);

            if (res == null) {
                res = range_max;
            } else {
                res = Math.max(range_max, res);
            }
        }

        return res;
    }

    public foreach(range: NumRange, callback: (value: number) => void, segment_type?: number) {
        for (let i = this.getSegmentedMin(range, segment_type); i <= this.getSegmentedMax(range, segment_type); i++) {
            callback(i);
        }
    }
}

