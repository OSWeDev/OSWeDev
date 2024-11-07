import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import IAPIController from '../../../shared/modules/API/interfaces/IAPIController';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import EventsController from '../../../shared/modules/Eventify/EventsController';

export default class ServerAPIController implements IAPIController {

    public static API_REGISTERED_EVENT: string = 'API_REGISTERED';

    private static instance: ServerAPIController = null;

    // istanbul ignore next: nothing to test
    public static getInstance(): ServerAPIController {
        if (!ServerAPIController.instance) {
            ServerAPIController.instance = new ServerAPIController();
        }
        return ServerAPIController.instance;
    }

    public async sah<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[] = null,
        precondition: (...params) => boolean = null,
        precondition_default_value: any = null,
        sanitize_result: (res: any, ...params) => any = null,
        use_notif_for_result: boolean = false
    ): Promise<(...params) => Promise<U>> {

        return new Promise((resolve, reject) => {

            EventsController.on_next_event(ServerAPIController.API_REGISTERED_EVENT + '_' + api_name, async () => {

                if ((!sanitize_params) && (!precondition) && (!sanitize_result)) {
                    resolve(APIControllerWrapper.registered_apis[api_name].SERVER_HANDLER);
                    return;
                }

                resolve(async (...params) => {
                    const apiDefinition: APIDefinition<T, U> = APIControllerWrapper.registered_apis[api_name];

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

                    if (!sanitize_result) {
                        return apiDefinition.SERVER_HANDLER(...params);
                    }

                    let res = await apiDefinition.SERVER_HANDLER(...params);

                    res = sanitize_result(res, ...params);

                    return res;
                });
            });
        });
    }

    // public get_shared_api_handler<T, U>(
    //     api_name: string,
    //     sanitize_params: (...params) => any[] = null,
    //     precondition: (...params) => boolean = null,
    //     precondition_default_value: any = null,
    //     registered_apis: { [api_name: string]: APIDefinition<any, any> } = {},
    //     sanitize_result: (res: any, ...params) => any = null,
    //     use_notif_for_result: boolean = false
    // ): (...params) => Promise<U> {

    //     TODO nécessite que le server api handler soit déjà init ...
    //     if ((!sanitize_params) && (!precondition) && (!sanitize_result)) {
    //         return registered_apis[api_name].SERVER_HANDLER;
    //     }

    //     return async (...params) => {
    //         const apiDefinition: APIDefinition<T, U> = registered_apis[api_name];

    //         if ((!apiDefinition) || !apiDefinition.SERVER_HANDLER) {

    //             throw new Error('API server handler undefined:' + api_name + ':');
    //         }

    //         if (sanitize_params) {
    //             params = sanitize_params(...params);
    //         }

    //         if (precondition && !precondition(...params)) {

    //             if (sanitize_result) {
    //                 return sanitize_result(precondition_default_value, ...params);
    //             }

    //             return precondition_default_value;
    //         }

    //         let res = await apiDefinition.SERVER_HANDLER(...params);

    //         if (sanitize_result) {
    //             res = sanitize_result(res, ...params);
    //         }

    //         return res;
    //     };
    // }
}