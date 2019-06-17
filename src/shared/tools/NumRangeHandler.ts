import NumRange from '../modules/DataRender/vos/NumRange';
import RangeHandler from './RangeHandler';

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

    public getValueFromFormattedMinOrMaxAPI(input: string): number {
        try {
            return parseFloat(input);
        } catch (error) {
        }
        return null;
    }
}

