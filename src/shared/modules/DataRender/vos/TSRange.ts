import moment = require('moment');
import IRange from '../interfaces/IRange';

export default class TSRange implements IRange<moment.Moment> {

    public static createNew(start: moment.Moment = null, end: moment.Moment = null, start_inclusiv: boolean = null, end_inclusiv: boolean = null): TSRange {
        let res: TSRange = new TSRange();

        res.end = end;
        res.end_inclusiv = end_inclusiv;
        res.start = start;
        res.start_inclusiv = start_inclusiv;

        return res;
    }

    public static cloneFrom(from: TSRange): TSRange {
        let res: TSRange = new TSRange();

        res.end = moment(from.end);
        res.end_inclusiv = from.end_inclusiv;
        res.start = moment(from.start);
        res.start_inclusiv = from.start_inclusiv;

        return res;
    }

    public start: moment.Moment;
    public end: moment.Moment;

    public start_inclusiv: boolean;
    public end_inclusiv: boolean;

    private constructor() { }
}