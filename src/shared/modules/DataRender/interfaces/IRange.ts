export default interface IRange {

    range_type: number;

    min: number;
    max: number;

    min_inclusiv: boolean;
    max_inclusiv: boolean;

    segment_type: number;
}