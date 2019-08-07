import Module from '../Module';
// if false
// FIXME RIEN A FAIRE ICI
import * as $ from 'jquery';
// endif
import ModulesManager from '../ModulesManager';
import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import APIDefinition from './vos/APIDefinition';
import { isArray } from 'util';
import { EEXIST } from 'constants';
import IDistantVOBase from '../IDistantVOBase';
import VOsTypesManager from '../VOsTypesManager';

export default class ModuleAPI extends Module {

    public static BASE_API_URL: string = "/api_handler/";

    public static getInstance(): ModuleAPI {
        if (!ModuleAPI.instance) {
            ModuleAPI.instance = new ModuleAPI();
        }
        return ModuleAPI.instance;
    }

    private static instance: ModuleAPI = null;

    public registered_apis: { [api_name: string]: APIDefinition<any, any> } = {};

    private constructor() {

        super("api", "API");
        this.forceActivationOnInstallation();
    }

    public registerApi<T, U>(apiDefinition: APIDefinition<T, U>) {
        this.registered_apis[apiDefinition.api_name] = apiDefinition;
    }

    public registerServerApiHandler<T, U>(api_name: string, SERVER_HANDLER: (translated_param: T) => Promise<U>) {
        if (!this.registered_apis[api_name]) {
            throw new Error("Registering server API Handler on unknown API:" + api_name);
        }
        this.registered_apis[api_name].SERVER_HANDLER = SERVER_HANDLER;
    }

    public getParamTranslator<T>(api_name: string): (...params) => Promise<T> {
        if (!this.registered_apis[api_name]) {
            return null;
        }
        return this.registered_apis[api_name].PARAM_TRANSLATOR;
    }

    public async handleAPI<T, U>(api_name: string, ...api_params): Promise<U> {
        let translated_param: T = null;
        let paramTranslator: (...params) => Promise<T> = this.getParamTranslator<T>(api_name);
        let apiDefinition: APIDefinition<T, U> = this.registered_apis[api_name];

        if (api_params && isArray(api_params) && (api_params.length > 1)) {
            // On a besoin de faire appel à un traducteur
            if (!paramTranslator) {
                console.error("PARAMTRANSLATOR manquant pour l'API " + api_name);
                return null;
            } else {
                translated_param = await paramTranslator.apply(this, api_params);
            }
        } else {
            // Si on a un translateur on l'utilise sinon on garde ce param
            if (paramTranslator) {
                translated_param = await paramTranslator.apply(this, api_params);
            } else if (api_params && (api_params.length == 1)) {
                translated_param = api_params[0];
            }
        }

        // Si on est côté serveur, on demande le handler serveur
        // Si on est côté client, on doit transférer la demande au serveur via les apis.
        //  La suite se passera donc dans la partie serveur de ce module
        if (ModulesManager.getInstance().isServerSide) {
            return await apiDefinition.SERVER_HANDLER(translated_param);
        } else {

            let API_TYPES_IDS_involved = apiDefinition.API_TYPES_IDS_involved;
            if (!isArray(API_TYPES_IDS_involved)) {
                API_TYPES_IDS_involved = API_TYPES_IDS_involved(translated_param);
            }

            let api_res = null;

            switch (apiDefinition.api_type) {
                case APIDefinition.API_TYPE_GET:

                    let url_param: string =
                        apiDefinition.PARAM_TRANSLATE_TO_URL ? await apiDefinition.PARAM_TRANSLATE_TO_URL(translated_param) :
                            (translated_param ? translated_param.toString() : "");

                    api_res = await ModuleAjaxCache.getInstance().get(
                        (ModuleAPI.BASE_API_URL + api_name + "/" + url_param).toLowerCase(),
                        API_TYPES_IDS_involved) as U;
                    break;

                case APIDefinition.API_TYPE_POST_FOR_GET:

                    api_res = await ModuleAjaxCache.getInstance().get(
                        (ModuleAPI.BASE_API_URL + api_name).toLowerCase(),
                        API_TYPES_IDS_involved,
                        ((typeof translated_param != 'undefined') && (translated_param != null)) ? JSON.stringify(translated_param) : null,
                        null,
                        'application/json; charset=utf-8',
                        null,
                        null,
                        true) as U;
                    break;

                case APIDefinition.API_TYPE_POST:
                    if (apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_FILE) {

                        let filePath: string = await ModuleAjaxCache.getInstance().post(
                            (ModuleAPI.BASE_API_URL + api_name).toLowerCase(),
                            API_TYPES_IDS_involved,
                            ((typeof translated_param != 'undefined') && (translated_param != null)) ? JSON.stringify(translated_param) : null,
                            null) as string;

                        let iframe = $('<iframe style="display:none" src="' + filePath + '"></iframe>');
                        $('body').append(iframe);
                        return;
                    } else {
                        api_res = await ModuleAjaxCache.getInstance().post(
                            (ModuleAPI.BASE_API_URL + api_name).toLowerCase(),
                            API_TYPES_IDS_involved,
                            ((typeof translated_param != 'undefined') && (translated_param != null)) ? JSON.stringify(translated_param) : null,
                            null) as U;
                    }
                    break;

            }

            // On tente de traduire si on reconnait un type de vo
            api_res = this.try_translate_vo_from_api(api_res);

            return api_res;
        }
    }



    public getAPI_URL<T, U>(apiDefinition: APIDefinition<T, U>): string {
        if (apiDefinition.api_type == APIDefinition.API_TYPE_GET) {

            return ModuleAPI.BASE_API_URL + apiDefinition.api_name + "/" + (apiDefinition.PARAM_GET_URL ? apiDefinition.PARAM_GET_URL : "");
        } else {

            return ModuleAPI.BASE_API_URL + apiDefinition.api_name;
        }
    }

    public requestUrlMatchesApiUrl(requestUrl: string, apiUrl: string): boolean {
        let pattern: string = apiUrl.replace(/(:[^:\/?]+)([/]|$)/ig, '[^/]*$2');

        // Gestion des paramètres optionnels
        pattern = pattern.replace(/([/]:[^:\/?]+[?])/ig, '(/[^/]*)?');

        // Par contre on doit bien avoir un truc complet donc on ajoute les indices de début et fin
        pattern = '^' + pattern + '$';

        return new RegExp(pattern, "ig").test(requestUrl);
    }

    /**
     * Used for calling translateFromREQ functions from simple url:string. Returns object of form request.params.{}
     * @param requestUrl
     * @param apiUrl
     */
    public getFakeRequestParamsFromUrl(requestUrl: string, apiUrl: string): any {
        var pattern = apiUrl.replace(/:[^:\/?]+([/]|$)/ig, '([^/]*)$1');
        // Gestion des paramètres optionnels
        pattern = pattern.replace(/[/]:[^:\/?]+[?]/ig, '/?([^/]*)?');

        // let pattern: string = apiUrl.replace(/(:[^:\/]+)/ig, '([^/]*)');

        let urlMembers: string[] = Array.from(new RegExp(pattern, "ig").exec(requestUrl));
        let res = { params: {} };

        if ((!urlMembers) || (urlMembers.length <= 1)) {
            return res;
        }
        urlMembers.shift();

        let i = 0;
        let apiRegExp = /:([^:\/]+)/ig;
        let apiMember = apiRegExp.exec(apiUrl);

        while (apiMember) {

            if ((!urlMembers[i]) || (!apiMember[1])) {
                // console.error('Incohérence getFakeRequestParamsFromUrl :' + urlMembers[i] + ":" + apiMember[1] + ":");
                return res;
            }

            res.params[apiMember[1].replace(/[?]/ig, '')] = urlMembers[i];
            apiMember = apiRegExp.exec(apiUrl);
            i++;
        }

        return res;
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public try_translate_vo_from_api(e: any): any {

        if (!e) {
            return e;
        }

        if (Array.isArray(e)) {
            return this.try_translate_vos_from_api(e);
        }

        let elt = (e as IDistantVOBase);
        if (!elt._type) {
            return elt;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[elt._type];
        if (!moduletable) {
            return elt;
        }

        return moduletable.from_api_version(elt);
    }

    public try_translate_vo_to_api(e: any): any {

        if (!e) {
            return e;
        }

        if (Array.isArray(e)) {
            return this.try_translate_vos_to_api(e);
        }

        let elt = (e as IDistantVOBase);
        if (!elt._type) {
            return elt;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[elt._type];
        if (!moduletable) {
            return elt;
        }

        return moduletable.get_api_version(elt);
    }

    private try_translate_vos_from_api(e: any): any {

        if (!e) {
            return e;
        }

        if (!Array.isArray(e)) {
            return this.try_translate_vo_from_api(e);
        }

        let res = [];

        for (let i in e) {
            let elt = e[i];

            res.push(this.try_translate_vo_from_api(elt));
        }

        return res;
    }

    private try_translate_vos_to_api(e: any): any {

        if (!e) {
            return e;
        }

        if (!Array.isArray(e)) {
            return this.try_translate_vo_to_api(e);
        }

        let res = [];

        for (let i in e) {
            let elt = e[i];

            res.push(this.try_translate_vo_to_api(elt));
        }

        return res;
    }
}