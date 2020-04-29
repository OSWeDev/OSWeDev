import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import IAPIController from '../../../../shared/modules/API/interfaces/IAPIController';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../../shared/modules/API/vos/APIDefinition';
import EnvHandler from '../../../../shared/tools/EnvHandler';
import AjaxCacheClientController from '../AjaxCache/AjaxCacheClientController';
import APIController from '../../../../shared/modules/API/APIController';

export default class ClientAPIController implements IAPIController {

    public static getInstance(): ClientAPIController {
        if (!ClientAPIController.instance) {
            ClientAPIController.instance = new ClientAPIController();
        }
        return ClientAPIController.instance;
    }

    private static instance: ClientAPIController = null;

    public async handleAPI<T, U>(api_name: string, ...api_params): Promise<U> {
        let translated_param: T = await ModuleAPI.getInstance().translate_param(api_name, ...api_params);
        let apiDefinition: APIDefinition<T, U> = ModuleAPI.getInstance().registered_apis[api_name];

        let API_TYPES_IDS_involved = apiDefinition.API_TYPES_IDS_involved;
        if (!Array.isArray(API_TYPES_IDS_involved)) {
            API_TYPES_IDS_involved = API_TYPES_IDS_involved(translated_param);
        }

        let api_res = null;

        switch (apiDefinition.api_type) {
            case APIDefinition.API_TYPE_GET:

                let url_param: string =
                    apiDefinition.PARAM_TRANSLATE_TO_URL ? await apiDefinition.PARAM_TRANSLATE_TO_URL(translated_param) :
                        (translated_param ? translated_param.toString() : "");

                api_res = await AjaxCacheClientController.getInstance().get(
                    (ModuleAPI.BASE_API_URL + api_name + "/" + url_param).toLowerCase(),
                    API_TYPES_IDS_involved,
                    (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE) as U;
                break;

            case APIDefinition.API_TYPE_POST_FOR_GET:

                api_res = await AjaxCacheClientController.getInstance().get(
                    (ModuleAPI.BASE_API_URL + api_name).toLowerCase(),
                    API_TYPES_IDS_involved,
                    ((typeof translated_param != 'undefined') && (translated_param != null)) ? ((!EnvHandler.getInstance().MSGPCK) ? JSON.stringify(ModuleAPI.getInstance().try_translate_vos_to_api(translated_param)) : ModuleAPI.getInstance().try_translate_vos_to_api(translated_param)) : null,
                    null,
                    (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE,
                    null,
                    null,
                    true) as U;
                break;

            case APIDefinition.API_TYPE_POST:
                if (apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_FILE) {

                    let filePath: string = await AjaxCacheClientController.getInstance().post(
                        (ModuleAPI.BASE_API_URL + api_name).toLowerCase(),
                        API_TYPES_IDS_involved,
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? ((!EnvHandler.getInstance().MSGPCK) ? JSON.stringify(ModuleAPI.getInstance().try_translate_vos_to_api(translated_param)) : ModuleAPI.getInstance().try_translate_vos_to_api(translated_param)) : null,
                        null,
                        (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE) as string;

                    const { default: $ } = await import(/* webpackChunkName: "jquery" */ 'jquery');

                    let iframe = $('<iframe style="display:none" src="' + filePath + '"></iframe>');
                    $('body').append(iframe);
                    return;
                } else {
                    api_res = await AjaxCacheClientController.getInstance().post(
                        (ModuleAPI.BASE_API_URL + api_name).toLowerCase(),
                        API_TYPES_IDS_involved,
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? ((!EnvHandler.getInstance().MSGPCK) ? JSON.stringify(ModuleAPI.getInstance().try_translate_vos_to_api(translated_param)) : ModuleAPI.getInstance().try_translate_vos_to_api(translated_param)) : null,
                        null,
                        (!EnvHandler.getInstance().MSGPCK) ? 'application/json; charset=utf-8' : ModuleAjaxCache.MSGPACK_REQUEST_TYPE) as U;
                }
        }

        // On tente de traduire si on reconnait un type de vo
        api_res = APIController.getInstance().try_translate_vo_from_api(api_res);

        return api_res;
    }
}