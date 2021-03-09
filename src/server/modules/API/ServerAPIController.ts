import IAPIController from '../../../shared/modules/API/interfaces/IAPIController';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';

export default class ServerAPIController implements IAPIController {

    public static getInstance(): ServerAPIController {
        if (!ServerAPIController.instance) {
            ServerAPIController.instance = new ServerAPIController();
        }
        return ServerAPIController.instance;
    }

    private static instance: ServerAPIController = null;


    public get_shared_api_handler<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[] = null,
        precondition: (...params) => boolean = null,
        precondition_default_value: any = null,
        registered_apis: { [api_name: string]: APIDefinition<any, any> } = {},
        sanitize_result: (res: any, ...params) => any = null,
    ): (...params) => Promise<U> {

        return async (...params) => {
            let apiDefinition: APIDefinition<T, U> = registered_apis[api_name];

            if ((!apiDefinition) || !apiDefinition.SERVER_HANDLER) {

                throw new Error('API server handler undefined:' + api_name + ':');
            }

            if (sanitize_params) {
                params = sanitize_params(...params);
            }

            if (precondition && !precondition(...params)) {

                if (sanitize_result) {
                    return sanitize_result(precondition_default_value, ...params);
                }

                return precondition_default_value;
            }

            let res = await apiDefinition.SERVER_HANDLER(...params);

            if (sanitize_result) {
                res = sanitize_result(res, ...params);
            }

            return res;
        };
    }
}