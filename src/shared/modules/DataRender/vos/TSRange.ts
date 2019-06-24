import moment = require('moment');
import IRange from '../interfaces/IRange';

export default class TSRange implements IRange<moment.Moment> {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param min_inclusiv defaults to true
     * @param max_inclusiv defaults to true
     */
    public static createNew(min: moment.Moment = null, max: moment.Moment = null, min_inclusiv: boolean = true, max_inclusiv: boolean = true): TSRange {
        if ((!min) || (!max) || (min && max && min.isAfter(max))) {
            return null;
        }

        if ((min == max) || (min && max && min.isSame(max))) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        let res: TSRange = new TSRange();

        res.max = moment(max);
        res.max_inclusiv = max_inclusiv;
        res.min = moment(min);
        res.min_inclusiv = min_inclusiv;

        return res;
    }

    public static cloneFrom(from: TSRange): TSRange {
        let res: TSRange = new TSRange();

        res.max = moment(from.max);
        res.max_inclusiv = from.max_inclusiv;
        res.min = moment(from.min);
        res.min_inclusiv = from.min_inclusiv;

        return res;
    }

    public min: moment.Moment;
    public max: moment.Moment;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    private constructor() { }
}