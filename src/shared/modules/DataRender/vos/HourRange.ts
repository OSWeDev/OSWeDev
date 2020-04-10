const moment = require('moment');
import HourSegmentHandler from '../../../tools/HourSegmentHandler';
import IRange from '../interfaces/IRange';
import HourSegment from './HourSegment';
import { Duration } from 'moment';

export default class HourRange implements IRange<Duration> {


    public static RANGE_TYPE: number = 3;

    public static createNew(min: Duration, max: Duration, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): HourRange {
        if ((!min) || (!max) || (min && max && (min.as('milliseconds') > max.as('milliseconds')))) {
            return null;
        }

        if ((min == max) || (min && max && (min.as('milliseconds') == max.as('milliseconds')))) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        let res: HourRange = new HourRange();

        res.segment_type = segment_type;

        let end_range = HourRange.getSegmentedMax(min, min_inclusiv, max, max_inclusiv, segment_type);
        let start_range = HourRange.getSegmentedMin(min, min_inclusiv, max, max_inclusiv, segment_type);

        if ((start_range == null) || (end_range == null)) {
            return null;
        }

        HourSegmentHandler.getInstance().incElt(end_range, segment_type, 1);

        res.max = end_range;
        res.max_inclusiv = false;
        res.min = start_range;
        res.min_inclusiv = true;

        return res;
    }

    /**
     * TODO ASAP TU
     */
    public static getSegmentedMin(min: Duration, min_inclusiv: boolean, max: Duration, max_inclusiv: boolean, segment_type: number): Duration {


        if ((min == null) || (typeof min == 'undefined')) {
            return null;
        }

        if ((max == null) || (typeof max == 'undefined')) {
            return null;
        }

        let range_min_ts: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(min, segment_type);

        if (!min_inclusiv) {
            HourSegmentHandler.getInstance().incHourSegment(range_min_ts);
        }

        let range_max_ts: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(max, segment_type);

        if (range_min_ts.index.asMilliseconds() > range_max_ts.index.asMilliseconds()) {
            return null;
        }

        if ((!max_inclusiv) && (range_min_ts.index.asMilliseconds() >= max.asMilliseconds())) {
            return null;
        }

        return range_min_ts.index;
    }

    /**
     * TODO ASAP TU
     */
    public static getSegmentedMax(min: Duration, min_inclusiv: boolean, max: Duration, max_inclusiv: boolean, segment_type: number): Duration {

        if ((min == null) || (typeof min == 'undefined')) {
            return null;
        }

        if ((max == null) || (typeof max == 'undefined')) {
            return null;
        }

        let range_max_ts: HourSegment = HourSegmentHandler.getInstance().getCorrespondingHourSegment(max, segment_type);

        if ((!max_inclusiv) && HourSegmentHandler.getInstance().isEltInSegment(max, range_max_ts)) {
            HourSegmentHandler.getInstance().decHourSegment(range_max_ts);
        }

        let range_max_end: Duration = HourSegmentHandler.getInstance().getEndHourSegment(range_max_ts);

        if (range_max_end.asMilliseconds() < min.asMilliseconds()) {
            return null;
        }

        if ((!min_inclusiv) && (range_max_end.asMilliseconds() <= min.asMilliseconds())) {
            return null;
        }

        return range_max_ts.index;
    }

    public static cloneFrom(from: HourRange): HourRange {

        if ((!from) || (!from.max) || (!from.min)) {
            return null;
        }

        let res: HourRange = new HourRange();

        res.max = from.max.clone();
        res.max_inclusiv = from.max_inclusiv;
        res.min = from.min.clone();
        res.min_inclusiv = from.min_inclusiv;
        res.segment_type = from.segment_type;

        return res;
    }

    public min: Duration;
    public max: Duration;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    public segment_type: number;
    public range_type: number = HourRange.RANGE_TYPE;

    private constructor() { }
}