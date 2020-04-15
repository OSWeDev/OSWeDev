import ConsoleHandler from '../../tools/ConsoleHandler';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import VOsTypesManager from '../VOsTypesManager';
import IAPIController from './interfaces/IAPIController';
import APIDefinition from './vos/APIDefinition';
import TypesHandler from '../../tools/TypesHandler';
import IRange from '../DataRender/interfaces/IRange';
import RangeHandler from '../../tools/RangeHandler';
import NumRange from '../DataRender/vos/NumRange';
import TSRange from '../DataRender/vos/TSRange';
import HourRange from '../DataRender/vos/HourRange';
import * as moment from 'moment';

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
    private api_controller: IAPIController = null;

    private constructor() {

        super("api", "API");
        this.forceActivationOnInstallation();
    }

    public setAPIController(api_controller: IAPIController) {
        this.api_controller = api_controller;
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
        return await this.api_controller.handleAPI(api_name, ...api_params);
    }

    public async translate_param<T>(api_name: string, ...api_params): Promise<T> {

        let translated_param: T = null;
        let paramTranslator: (...params) => Promise<T> = ModuleAPI.getInstance().getParamTranslator<T>(api_name);

        if (api_params && Array.isArray(api_params) && (api_params.length > 1)) {
            // On a besoin de faire appel à un traducteur
            if (!paramTranslator) {
                ConsoleHandler.getInstance().error("PARAMTRANSLATOR manquant pour l'API " + api_name);
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

        return translated_param;
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
                // ConsoleHandler.getInstance().error('Incohérence getFakeRequestParamsFromUrl :' + urlMembers[i] + ":" + apiMember[1] + ":");
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

            if (this.is_range(e as IRange<any>)) {
                return this.try_translate_range_from_api(e as IRange<any>);
            }

            if (typeof e === 'object') {
                let res = Object.assign({}, e);
                for (let i in res) {

                    res[i] = this.try_translate_vo_from_api(res[i]);
                }
                return res;
            }

            return e;
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

            if (this.is_range(e as IRange<any>)) {
                return this.try_translate_range_to_api(e as IRange<any>);
            }

            if (typeof e === 'object') {
                let res = Object.assign({}, e);
                for (let i in res) {

                    res[i] = this.try_translate_vo_to_api(res[i]);
                }
                return res;
            }

            return e;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[elt._type];
        if (!moduletable) {
            return elt;
        }

        return moduletable.get_api_version(elt);
    }

    public try_translate_vos_from_api(e: any): any {

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

    public try_translate_vos_to_api(e: any): any {

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

    /**
     * On part du principe (faux sur le papier mais peut-etre suffisant) que si on a les champs suivants, on a un range :
     * range_type number
     * segment_type number
     * min_inclusiv boolean
     * max_inclusiv boolean
     *
     * @param e
     */
    private is_range(e: IRange<any>): boolean {

        if (TypesHandler.getInstance().isNumber(e.range_type) && TypesHandler.getInstance().isNumber(e.segment_type) &&
            TypesHandler.getInstance().isBoolean(e.min_inclusiv) && TypesHandler.getInstance().isBoolean(e.max_inclusiv)) {
            return true;
        }
        return false;
    }

    private try_translate_range_from_api(e: IRange<any>) {

        switch (e.range_type) {
            case NumRange.RANGE_TYPE:
                return e;
            case TSRange.RANGE_TYPE:
                return RangeHandler.getInstance().createNew(e.range_type, moment(e.min * 1000).utc(), moment(e.max * 1000).utc(), e.min_inclusiv, e.max_inclusiv, e.segment_type);
            case HourRange.RANGE_TYPE:
                return RangeHandler.getInstance().createNew(e.range_type, moment.duration(e.min), moment.duration(e.max), e.min_inclusiv, e.max_inclusiv, e.segment_type);
        }
        return e;
    }

    private try_translate_range_to_api(e: IRange<any>) {

        switch (e.range_type) {
            case NumRange.RANGE_TYPE:
                return e;
            case TSRange.RANGE_TYPE:
                return {
                    range_type: e.range_type,
                    min: e.min ? (e.min as moment.Moment).unix() : null,
                    max: e.max ? (e.max as moment.Moment).unix() : null,
                    min_inclusiv: e.min_inclusiv,
                    max_inclusiv: e.max_inclusiv,
                    segment_type: e.segment_type,
                };
            case HourRange.RANGE_TYPE:
                return {
                    range_type: e.range_type,
                    min: e.min ? (e.min as moment.Duration).asMilliseconds() : null,
                    max: e.max ? (e.max as moment.Duration).asMilliseconds() : null,
                    min_inclusiv: e.min_inclusiv,
                    max_inclusiv: e.max_inclusiv,
                    segment_type: e.segment_type,
                };
        }
        return e;
    }
}