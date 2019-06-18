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
        if (range.max_inclusiv) {
            return range.max;
        }

        return range.max - 1;
    }

    public foreach(range: NumRange, callback: (value: number) => void, segment_type?: number) {
        for (let i = this.getSegmentedMin(range, segment_type); i <= this.getSegmentedMax(range, segment_type); i++) {
            callback(i);
        }
    }
}

