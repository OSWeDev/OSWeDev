import ConsoleHandler from '../../tools/ConsoleHandler';
import Module from '../Module';
import IAPIController from './interfaces/IAPIController';
import APIDefinition from './vos/APIDefinition';

export default class ModuleAPI extends Module {

    public static getInstance(): ModuleAPI {
        if (!ModuleAPI.instance) {
            ModuleAPI.instance = new ModuleAPI();
        }
        return ModuleAPI.instance;
    }

    private static instance: ModuleAPI = null;

    /**
     * Local thread cache -----
     */
    public registered_apis: { [api_name: string]: APIDefinition<any, any> } = {};
    private api_controller: IAPIController = null;
    /**
     * ----- Local thread cache
     */

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

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}