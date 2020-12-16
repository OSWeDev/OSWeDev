export default interface IAPIController {
    get_shared_api_handler<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[],
        precondition: (...params) => boolean,
        precondition_default_value: any): (...params) => Promise<U>;
}