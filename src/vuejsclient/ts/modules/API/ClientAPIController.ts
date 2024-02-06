import CacheInvalidationRulesVO from '../../../../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import IAPIController from '../../../../shared/modules/API/interfaces/IAPIController';
import IAPIParamTranslator from '../../../../shared/modules/API/interfaces/IAPIParamTranslator';
import APIDefinition from '../../../../shared/modules/API/vos/APIDefinition';
import APINotifTypeResultVO from '../../../../shared/modules/PushData/vos/APINotifTypeResultVO';
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';

export default class ClientAPIController implements IAPIController {

    /**
     * Les promises à attendre pour avoir le résultat de la notif sur une API de type res notif
     */
    public static api_waiting_for_result_notif_promises: { [api_call_id: number]: Promise<any> } = {};
    /**
     * Les solvers des promises qui sont stockées dans api_waiting_for_result_notif_promises, appelées par PushDataVueModule
     */
    public static api_waiting_for_result_notif_solvers: { [api_call_id: number]: (value: unknown) => void } = {};
    /**
     * Les fonctions en attente de promises - Si la notif de résultat arrive avant la première réponse de l'api avec le call_id
     */
    public static api_waiting_for_result_notif_waiting_for_solvers: { [api_call_id: number]: () => void } = {};

    public static getInstance(): ClientAPIController {
        if (!ClientAPIController.instance) {
            ClientAPIController.instance = new ClientAPIController();
        }

        return ClientAPIController.instance;
    }

    private static instance: ClientAPIController = null;

    public get_shared_api_handler<T extends IAPIParamTranslator<T>, U>(
        api_name: string,
        sanitize_params: (...params) => any[] = null,
        precondition: (...params) => boolean = null,
        precondition_default_value: any = null,
        registered_apis: { [api_name: string]: APIDefinition<any, any> } = {},
        sanitize_result: (res: any, ...params) => any = null
    ): (...params) => Promise<U> {

        return async (...params) => {

            let apiDefinition: APIDefinition<T, U> = registered_apis[api_name];

            if (!apiDefinition) {

                throw new Error('API client undefined:' + api_name + ':');
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

            let res = await this.handleAPI(apiDefinition, ...params);

            if (sanitize_result) {
                res = sanitize_result(res, ...params);
            }

            return res;
        };
    }

    private async handleAPI<T extends IAPIParamTranslator<T>, U>(apiDefinition: APIDefinition<T, U>, ...api_params): Promise<U> {
        let translated_param: IAPIParamTranslator<T> = APIControllerWrapper.translate_param(apiDefinition, ...api_params);
        let api_name = apiDefinition.api_name;

        let API_TYPES_IDS_involved = apiDefinition.API_TYPES_IDS_involved;
        if ((API_TYPES_IDS_involved != CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED) && !Array.isArray(API_TYPES_IDS_involved)) {
            API_TYPES_IDS_involved = API_TYPES_IDS_involved(translated_param);
        }

        let api_res = null;

        switch (apiDefinition.api_type) {
            case APIDefinition.API_TYPE_GET:

                let url_param: string =
                    (translated_param && translated_param.translateToURL) ? translated_param.translateToURL() :
                        (translated_param ? translated_param.toString() : "");

                api_res = await AjaxCacheClientController.getInstance().get(
                    apiDefinition,
                    (APIControllerWrapper.BASE_API_URL + api_name + "/" + url_param).toLowerCase(),
                    API_TYPES_IDS_involved,
                    'application/json; charset=utf-8') as U;
                break;

            case APIDefinition.API_TYPE_POST_FOR_GET:

                api_res = await AjaxCacheClientController.getInstance().get(
                    apiDefinition,
                    (APIControllerWrapper.BASE_API_URL + api_name).toLowerCase(),
                    API_TYPES_IDS_involved,
                    ((typeof translated_param != 'undefined') && (translated_param != null)) ? (JSON.stringify(APIControllerWrapper.try_translate_vos_to_api(translated_param))) : null,
                    null,
                    'application/json; charset=utf-8',
                    null,
                    null,
                    true) as U;
                break;

            case APIDefinition.API_TYPE_POST:
                if (apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_FILE) {

                    let filePath: string = await AjaxCacheClientController.getInstance().post(
                        apiDefinition,
                        (APIControllerWrapper.BASE_API_URL + api_name).toLowerCase(),
                        API_TYPES_IDS_involved,
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? (JSON.stringify(APIControllerWrapper.try_translate_vos_to_api(translated_param))) : null,
                        null,
                        'application/json; charset=utf-8') as string;

                    // const { default: $ } = await import('jquery');

                    if (!!filePath) {
                        let iframe = $('<iframe style="display:none" src="' + filePath + '"></iframe>');
                        $('body').append(iframe);
                    }
                    return;
                } else {
                    api_res = await AjaxCacheClientController.getInstance().post(
                        apiDefinition,
                        (APIControllerWrapper.BASE_API_URL + api_name).toLowerCase(),
                        API_TYPES_IDS_involved,
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? (JSON.stringify(APIControllerWrapper.try_translate_vos_to_api(translated_param))) : null,
                        null,
                        'application/json; charset=utf-8') as U;
                }
        }

        // On tente de traduire si on reconnait un type de vo
        api_res = APIControllerWrapper.try_translate_vo_from_api(api_res);

        // Si on a une api de type result notif, on vient de récupérer un ID normalement, qu'on stocke en attendant la notif
        if (apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) {
            // 2 options, soit le serveur répond en notif et renvoie dans un premier temps le call_id, soit il répond directement avec le résultat
            let api_res_typed: APINotifTypeResultVO = api_res as APINotifTypeResultVO;

            if (!api_res_typed.api_call_id) {
                return api_res_typed.res as U;
            }

            let promise = new Promise((resolve, reject) => {
                ClientAPIController.api_waiting_for_result_notif_solvers[api_res_typed.api_call_id] = resolve;
            });
            ClientAPIController.api_waiting_for_result_notif_promises[api_res_typed.api_call_id] = promise;

            if (ClientAPIController.api_waiting_for_result_notif_waiting_for_solvers[api_res_typed.api_call_id]) {
                ClientAPIController.api_waiting_for_result_notif_waiting_for_solvers[api_res_typed.api_call_id]();
            }

            // On stocke la promesse de résultat
            api_res = await ClientAPIController.api_waiting_for_result_notif_promises[api_res_typed.api_call_id];
            delete ClientAPIController.api_waiting_for_result_notif_promises[api_res_typed.api_call_id];
            delete ClientAPIController.api_waiting_for_result_notif_solvers[api_res_typed.api_call_id];
            delete ClientAPIController.api_waiting_for_result_notif_waiting_for_solvers[api_res_typed.api_call_id];

            return APIControllerWrapper.try_translate_vo_from_api(api_res) as U;
        }

        return api_res;
    }
}