export default interface IRange<T> {

    min: T;
    max: T;

    min_inclusiv: boolean;
    max_inclusiv: boolean;
}