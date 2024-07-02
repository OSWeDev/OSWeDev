import HourSegmentHandler from '../../../tools/HourSegmentHandler';
import Durations from '../../FormatDatesNombres/Dates/Durations';
import IRange from '../interfaces/IRange';
import HourSegment from './HourSegment';


export default class HourRange implements IRange {


    public static RANGE_TYPE: number = 3;

    public static createNew(min: number, max: number, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): HourRange {
        if ((!min) || (!max) || (min && max && (Durations.as(min, HourSegment.TYPE_SECOND) > Durations.as(max, HourSegment.TYPE_SECOND)))) {
            return null;
        }

        if ((min == max) || (min && max && (Durations.as(min, HourSegment.TYPE_SECOND) == Durations.as(max, HourSegment.TYPE_SECOND)))) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        if (segment_type == null) {
            return null;
        }

        const res: HourRange = new HourRange();

        res.segment_type = segment_type;

        let end_range = HourRange.getSegmentedMax(min, min_inclusiv, max, max_inclusiv, segment_type);
        const start_range = HourRange.getSegmentedMin(min, min_inclusiv, max, max_inclusiv, segment_type);

        if ((start_range == null) || (end_range == null)) {
            return null;
        }

        end_range = Durations.add(end_range, 1, segment_type);

        res.max = end_range;
        res.max_inclusiv = false;
        res.min = start_range;
        res.min_inclusiv = true;

        return res;
    }

    /**
     * TODO ASAP TU
     */
    public static getSegmentedMin(min: number, min_inclusiv: boolean, max: number, max_inclusiv: boolean, segment_type: number): number {


        if ((min === null) || (typeof min == 'undefined')) {
            return null;
        }

        if ((max === null) || (typeof max == 'undefined')) {
            return null;
        }

        const range_min_ts: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(min, segment_type);

        if (!min_inclusiv) {
            HourSegmentHandler.incHourSegment(range_min_ts);
        }

        const range_max_ts: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(max, segment_type);

        if (Durations.as(range_min_ts.index, HourSegment.TYPE_SECOND) > Durations.as(range_max_ts.index, HourSegment.TYPE_SECOND)) {
            return null;
        }

        if ((!max_inclusiv) && (Durations.as(range_min_ts.index, HourSegment.TYPE_SECOND) >= Durations.as(max, HourSegment.TYPE_SECOND))) {
            return null;
        }

        return range_min_ts.index;
    }

    /**
     * TODO ASAP TU
     */
    public static getSegmentedMax(min: number, min_inclusiv: boolean, max: number, max_inclusiv: boolean, segment_type: number): number {

        if ((min === null) || (typeof min == 'undefined')) {
            return null;
        }

        if ((max === null) || (typeof max == 'undefined')) {
            return null;
        }

        const range_max_ts: HourSegment = HourSegmentHandler.getCorrespondingHourSegment(max, segment_type);

        if ((!max_inclusiv) && HourSegmentHandler.isEltInSegment(max, range_max_ts)) {
            HourSegmentHandler.decHourSegment(range_max_ts);
        }

        const range_max_end: number = HourSegmentHandler.getEndHourSegment(range_max_ts);

        if (Durations.as(range_max_end, HourSegment.TYPE_SECOND) < Durations.as(min, HourSegment.TYPE_SECOND)) {
            return null;
        }

        if ((!min_inclusiv) && (Durations.as(range_max_end, HourSegment.TYPE_SECOND) <= Durations.as(min, HourSegment.TYPE_SECOND))) {
            return null;
        }

        return range_max_ts.index;
    }

    public static cloneFrom(from: HourRange): HourRange {

        if ((!from) || (!from.max) || (!from.min)) {
            return null;
        }

        const res: HourRange = new HourRange();

        res.max = from.max;
        res.max_inclusiv = from.max_inclusiv;
        res.min = from.min;
        res.min_inclusiv = from.min_inclusiv;
        res.segment_type = from.segment_type;

        return res;
    }

    public min: number;
    public max: number;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    public segment_type: number;
    public range_type: number = HourRange.RANGE_TYPE;

    private constructor() { }
}