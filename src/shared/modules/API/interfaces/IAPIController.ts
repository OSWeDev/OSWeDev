export default interface IAPIController {
    handleAPI<T, U>(api_name: string, ...api_params): Promise<U>;
}