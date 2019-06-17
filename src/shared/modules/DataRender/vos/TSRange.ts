import moment = require('moment');
import IRange from '../interfaces/IRange';

export default class TSRange implements IRange<moment.Moment> {

    public static createNew(min: moment.Moment = null, max: moment.Moment = null, min_inclusiv: boolean = null, max_inclusiv: boolean = null): TSRange {
        let res: TSRange = new TSRange();

        res.max = max;
        res.max_inclusiv = max_inclusiv;
        res.min = min;
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