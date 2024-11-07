
export default interface IAPIController {
    sah<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[],
        precondition: (...params) => boolean,
        precondition_default_value: any,
        sanitize_result: (res: any, ...params) => any,
        use_notif_for_result: boolean): (...params) => Promise<U>;
}