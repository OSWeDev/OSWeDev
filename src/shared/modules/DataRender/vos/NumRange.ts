import IRange from '../interfaces/IRange';

export default class NumRange implements IRange<number> {

    public static createNew(start: number = null, end: number = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): NumRange {
        let res: NumRange = new NumRange();

        res.end = end;
        res.end_inclusiv = end_inclusiv;
        res.start = start;
        res.start_inclusiv = start_inclusiv;

        return res;
    }

    public static cloneFrom(from: NumRange): NumRange {
        let res: NumRange = new NumRange();

        res.end = from.end;
        res.end_inclusiv = from.end_inclusiv;
        res.start = from.start;
        res.start_inclusiv = from.start_inclusiv;

        return res;
    }

    public start: number;
    public end: number;

    public start_inclusiv: boolean;
    public end_inclusiv: boolean;

    private constructor() { }
}