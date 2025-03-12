import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import IAPIController from '../../../shared/modules/API/interfaces/IAPIController';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import { StatThisMapKeys } from '../../../shared/modules/Stats/annotations/StatThisMapKeys';
import { RunsOnMainThread } from '../BGThread/annotations/RunsOnMainThread';
import PushDataServerController from '../PushData/PushDataServerController';
import APICallResWrapper from './vos/APICallResWrapper';

export default class ServerAPIController implements IAPIController {

    private static instance: ServerAPIController = null;

    @StatThisMapKeys('ServerAPIController')
    public static api_calls: { [api_call_id: number]: APICallResWrapper } = {};

    // istanbul ignore next: nothing to test
    public static getInstance(): ServerAPIController {
        if (!ServerAPIController.instance) {
            ServerAPIController.instance = new ServerAPIController();
        }
        return ServerAPIController.instance;
    }

    /**
     * Permet de renvoyer une redirection si les headers n'ont pas déjà été envoyés
     * @param call_id L'id de l'appel API
     * @param url L'url de redirection
     * @returns true si la redirection a été envoyée, false sinon
     */
    @RunsOnMainThread()
    public static async send_redirect_if_headers_not_already_sent(call_id: number, url: string): Promise<boolean> {
        const api_call = ServerAPIController.api_calls[call_id];
        const res = api_call?.res;

        if (!res) {
            return false;
        }

        if (res.headersSent) {
            // Si on a déjà renvoyé un redirect ou une réponse, on renvoie via une notif
            await PushDataServerController.notify_do_redirect(api_call.notif_result_uid, api_call.notif_result_tab_id, url);
            return true;
        }


        res.redirect(url);
        return true;
    }

    public sah<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[] = null,
        precondition: (...params) => boolean = null,
        precondition_default_value: any = null,
        sanitize_result: (res: any, ...params) => any = null,
        use_notif_for_result: boolean = false
    ): (...params) => Promise<U> {

        return async (...params) => {
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
        };
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