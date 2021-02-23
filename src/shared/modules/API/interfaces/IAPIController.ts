import APIDefinition from "../vos/APIDefinition";

export default interface IAPIController {
    get_shared_api_handler<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[],
        precondition: (...params) => boolean,
        precondition_default_value: any,
        registered_apis: { [api_name: string]: APIDefinition<any, any> },
        sanitize_result: (res: any) => any): (...params) => Promise<U>;
}