import moment = require('moment');
import IRange from '../interfaces/IRange';
import TSRangeHandler from '../../../tools/TSRangeHandler';
import TimeSegment from './TimeSegment';
import TimeSegmentHandler from '../../../tools/TimeSegmentHandler';

export default class TSRange implements IRange<moment.Moment> {

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param min_inclusiv defaults to true
     * @param max_inclusiv defaults to true
     */
    public static createNew(min: moment.Moment, max: moment.Moment, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): TSRange {
        if ((!min) || (!max) || (min && max && min.isAfter(max))) {
            return null;
        }

        if ((min == max) || (min && max && min.isSame(max))) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        let res: TSRange = new TSRange();

        res.segment_type = segment_type;

        let end_range = TSRange.getSegmentedMax(min, min_inclusiv, max, max_inclusiv, segment_type);
        let start_range = TSRange.getSegmentedMin(min, min_inclusiv, max, max_inclusiv, segment_type);

        if ((start_range == null) || (end_range == null)) {
            return null;
        }

        TimeSegmentHandler.getInstance().incMoment(end_range, segment_type, 1);

        res.max = end_range;
        res.max_inclusiv = false;
        res.min = start_range;
        res.min_inclusiv = true;

        return res;
    }

    /**
     * TODO ASAP TU
     */
    public static getSegmentedMin(min: moment.Moment, min_inclusiv: boolean, max: moment.Moment, max_inclusiv: boolean, segment_type: number): moment.Moment {


        if ((min == null) || (typeof min == 'undefined')) {
            return null;
        }

        if ((max == null) || (typeof max == 'undefined')) {
            return null;
        }

        let range_min_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(min, segment_type);
        let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(max, segment_type);

        if (range_min_ts.date.isAfter(range_max_ts.date)) {
            return null;
        }

        if ((!max_inclusiv) && (range_min_ts.date.isSameOrAfter(max))) {
            return null;
        }

        return range_min_ts.date;
    }

    /**
     * TODO ASAP TU
     */
    public static getSegmentedMax(min: moment.Moment, min_inclusiv: boolean, max: moment.Moment, max_inclusiv: boolean, segment_type: number): moment.Moment {

        if ((min == null) || (typeof min == 'undefined')) {
            return null;
        }

        if ((max == null) || (typeof max == 'undefined')) {
            return null;
        }

        let range_max_ts: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(max, segment_type);

        if ((!max_inclusiv) && (range_max_ts.date.isSame(max))) {
            TimeSegmentHandler.getInstance().decTimeSegment(range_max_ts);
        }

        let range_max_end: moment.Moment = TimeSegmentHandler.getInstance().getEndTimeSegment(range_max_ts);

        if (range_max_end.isBefore(min)) {
            return null;
        }

        if ((!min_inclusiv) && (range_max_end.isSameOrBefore(min))) {
            return null;
        }

        return range_max_ts.date;
    }

    public static cloneFrom(from: TSRange): TSRange {
        let res: TSRange = new TSRange();

        res.max = moment(from.max);
        res.max_inclusiv = from.max_inclusiv;
        res.min = moment(from.min);
        res.min_inclusiv = from.min_inclusiv;
        res.segment_type = from.segment_type;

        return res;
    }

    public min: moment.Moment;
    public max: moment.Moment;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    public segment_type: number;

    private constructor() { }
}