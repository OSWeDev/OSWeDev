import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import CacheInvalidationRulesVO from '../../../../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import IAPIController from '../../../../shared/modules/API/interfaces/IAPIController';
import IAPIParamTranslator from '../../../../shared/modules/API/interfaces/IAPIParamTranslator';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../../shared/modules/API/vos/APIDefinition';
import EnvHandler from '../../../../shared/tools/EnvHandler';
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';

export default class ClientAPIController implements IAPIController {

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
        precondition_default_value: any = null): (...params) => Promise<U> {

        return async (...params) => {

            let apiDefinition: APIDefinition<T, U> = ModuleAPI.getInstance().registered_apis[api_name];

            if (!apiDefinition) {

                throw new Error('API client undefined:' + api_name + ':');
            }

            if (sanitize_params) {
                params = sanitize_params(...params);
            }

            if (precondition && !precondition(...params)) {
                return precondition_default_value;
            }

            return await this.handleAPI(apiDefinition, ...params);
        };
    }

    private async handleAPI<T extends IAPIParamTranslator<T>, U>(apiDefinition: APIDefinition<T, U>, ...api_params): Promise<U> {
        let translated_param: IAPIParamTranslator<T> = ModuleAPI.getInstance().translate_param(apiDefinition, ...api_params);
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
                    (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE) as U;
                break;

            case APIDefinition.API_TYPE_POST_FOR_GET:

                api_res = await AjaxCacheClientController.getInstance().get(
                    apiDefinition,
                    (APIControllerWrapper.BASE_API_URL + api_name).toLowerCase(),
                    API_TYPES_IDS_involved,
                    ((typeof translated_param != 'undefined') && (translated_param != null)) ? ((!EnvHandler.getInstance().MSGPCK) ? JSON.stringify(APIControllerWrapper.getInstance().try_translate_vos_to_api(translated_param)) : APIControllerWrapper.getInstance().try_translate_vos_to_api(translated_param)) : null,
                    null,
                    (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE,
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
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? ((!EnvHandler.getInstance().MSGPCK) ? JSON.stringify(APIControllerWrapper.getInstance().try_translate_vos_to_api(translated_param)) : APIControllerWrapper.getInstance().try_translate_vos_to_api(translated_param)) : null,
                        null,
                        (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE) as string;

                    const { default: $ } = await import(/* webpackChunkName: "jquery" */ 'jquery');

                    let iframe = $('<iframe style="display:none" src="' + filePath + '"></iframe>');
                    $('body').append(iframe);
                    return;
                } else {
                    api_res = await AjaxCacheClientController.getInstance().post(
                        apiDefinition,
                        (APIControllerWrapper.BASE_API_URL + api_name).toLowerCase(),
                        API_TYPES_IDS_involved,
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? ((!EnvHandler.getInstance().MSGPCK) ? JSON.stringify(APIControllerWrapper.getInstance().try_translate_vos_to_api(translated_param)) : APIControllerWrapper.getInstance().try_translate_vos_to_api(translated_param)) : null,
                        null,
                        (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE) as U;
                }
        }

        // On tente de traduire si on reconnait un type de vo
        api_res = APIControllerWrapper.getInstance().try_translate_vo_from_api(api_res);

        return api_res;
    }
}