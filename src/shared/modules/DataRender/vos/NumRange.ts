import NumSegmentHandler from '../../../tools/NumSegmentHandler';
import IRange from '../interfaces/IRange';
import NumSegment from './NumSegment';

export default class NumRange implements IRange {

    public static RANGE_TYPE: number = 1;

    /**
     * Test d'incohérence sur des ensembles qui indiqueraient inclure le min mais pas le max et où min == max (ou inversement)
     */
    public static createNew(min: number, max: number, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): NumRange {

        if (typeof min === 'undefined') {
            return null;
        }

        if (typeof max === 'undefined') {
            return null;
        }

        if (min === null) {
            return null;
        }

        if (max === null) {
            return null;
        }

        if (min == max) {
            if ((!min_inclusiv) || (!max_inclusiv)) {
                return null;
            }
        }

        if (min > max) {
            return null;
        }

        if (segment_type == null) {
            return null;
        }

        const res: NumRange = new NumRange();

        res.segment_type = segment_type;

        let end_range = NumRange.getSegmentedMax(min, min_inclusiv, max, max_inclusiv, segment_type);
        const start_range = NumRange.getSegmentedMin(min, min_inclusiv, max, max_inclusiv, segment_type);

        if ((start_range == null) || (end_range == null)) {
            return null;
        }

        if (start_range > end_range) {
            return null;
        }

        const tmp_end = NumSegmentHandler.incNum(end_range, segment_type, 1);

        end_range = tmp_end;

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

        const range_min_ts: NumSegment = NumSegmentHandler.getCorrespondingNumSegment(min, segment_type);

        if (!min_inclusiv) {
            NumSegmentHandler.incNumSegment(range_min_ts);
        }

        const range_max_ts: NumSegment = NumSegmentHandler.getCorrespondingNumSegment(max, segment_type);

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

        const range_max_segment: NumSegment = NumSegmentHandler.getCorrespondingNumSegment(max, segment_type);

        if ((!max_inclusiv) && NumSegmentHandler.isEltInSegment(max, range_max_segment)) {
            NumSegmentHandler.decNumSegment(range_max_segment);
        }

        const range_max_end: number = NumSegmentHandler.getEndNumSegment(range_max_segment);

        if (range_max_end < min) {
            return null;
        }

        if ((!min_inclusiv) && (range_max_end <= min)) {
            return null;
        }

        return range_max_segment.index;
    }

    public static cloneFrom(from: NumRange): NumRange {
        const res: NumRange = new NumRange();

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
    public range_type: number = NumRange.RANGE_TYPE;

    private constructor() { }
}