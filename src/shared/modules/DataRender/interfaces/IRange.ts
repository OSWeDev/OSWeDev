export default interface IRange<T> {

    range_type: number;

    min: T;
    max: T;

    min_inclusiv: boolean;
    max_inclusiv: boolean;

    segment_type: number;
}