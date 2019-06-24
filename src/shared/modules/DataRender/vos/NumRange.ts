import IRange from '../interfaces/IRange';

export default class NumRange implements IRange<number> {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param min_inclusiv defaults to true
     * @param max_inclusiv defaults to true
     */
    public static createNew(min: number = null, max: number = null, min_inclusiv: boolean = true, max_inclusiv: boolean = true): NumRange {

        if (min == max) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        if (min > max) {
            return null;
        }

        let res: NumRange = new NumRange();

        res.max = max;
        res.max_inclusiv = max_inclusiv;
        res.min = min;
        res.min_inclusiv = min_inclusiv;

        return res;
    }

    public static cloneFrom(from: NumRange): NumRange {
        let res: NumRange = new NumRange();

        res.max = from.max;
        res.max_inclusiv = from.max_inclusiv;
        res.min = from.min;
        res.min_inclusiv = from.min_inclusiv;

        return res;
    }

    public min: number;
    public max: number;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    private constructor() { }
}