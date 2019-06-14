export default interface IRange<T> {

    start: T;
    end: T;

    start_inclusiv: boolean;
    end_inclusiv: boolean;
}