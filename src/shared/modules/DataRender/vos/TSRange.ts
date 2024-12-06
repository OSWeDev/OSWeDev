import TimeSegmentHandler from '../../../tools/TimeSegmentHandler';
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IRange from '../interfaces/IRange';
import TimeSegment from './TimeSegment';


export default class TSRange implements IRange {


    public static RANGE_TYPE: number = 2;

    public min: number;
    public max: number;

    public min_inclusiv: boolean;
    public max_inclusiv: boolean;

    public segment_type: number;
    public range_type: number = TSRange.RANGE_TYPE;

    /**
     * Ignore this property - only used for type checking
     */
    private is_ts_range: boolean = true;

    private constructor() { }

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     * @param min_inclusiv defaults to true
     * @param max_inclusiv defaults to true
     */
    public static createNew(min: number, max: number, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): TSRange {
        if ((min == null) || (max == null) || (min && max && (min > max))) {
            return null;
        }

        if (min == max) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        if (segment_type == null) {
            return null;
        }

        const res: TSRange = new TSRange();

        res.segment_type = segment_type;

        let end_range = TSRange.getSegmentedMax(min, min_inclusiv, max, max_inclusiv, segment_type);
        const start_range = TSRange.getSegmentedMin(min, min_inclusiv, max, max_inclusiv, segment_type);

        if ((start_range == null) || (end_range == null)) {
            return null;
        }

        if (start_range > end_range) {
            return null;
        }

        end_range = Dates.add(end_range, 1, segment_type);

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

        const range_min_ts: TimeSegment = TimeSegmentHandler.getCorrespondingTimeSegment(min, segment_type);

        if (!min_inclusiv) {
            TimeSegmentHandler.incTimeSegment(range_min_ts);
        }

        const range_max_ts: TimeSegment = TimeSegmentHandler.getCorrespondingTimeSegment(max, segment_type);

        if (range_min_ts.index > range_max_ts.index) {
            return null;
        }

        if ((!max_inclusiv) && (range_min_ts.index >= max)) {
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

        const range_max_ts: TimeSegment = TimeSegmentHandler.getCorrespondingTimeSegment(max, segment_type);

        if ((!max_inclusiv) && TimeSegmentHandler.isEltInSegment(max, range_max_ts)) {
            TimeSegmentHandler.decTimeSegment(range_max_ts);
        }

        const range_max_end: number = TimeSegmentHandler.getEndTimeSegment(range_max_ts);

        if (range_max_end < min) {
            return null;
        }

        if ((!min_inclusiv) && (range_max_end <= min)) {
            return null;
        }

        return range_max_ts.index;
    }

    public static cloneFrom(from: TSRange): TSRange {
        const res: TSRange = new TSRange();

        res.max = from.max;
        res.max_inclusiv = from.max_inclusiv;
        res.min = from.min;
        res.min_inclusiv = from.min_inclusiv;
        res.segment_type = from.segment_type;

        return res;
    }
}