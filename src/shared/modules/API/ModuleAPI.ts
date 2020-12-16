import ConsoleHandler from '../../tools/ConsoleHandler';
import Module from '../Module';
import APIControllerWrapper from './APIController';
import IAPIController from './interfaces/IAPIController';
import IAPIParamTranslator from './interfaces/IAPIParamTranslator';
import APIDefinition from './vos/APIDefinition';

export default class ModuleAPI extends Module {

    public static getInstance(): ModuleAPI {
        if (!ModuleAPI.instance) {
            ModuleAPI.instance = new ModuleAPI();
        }
        return ModuleAPI.instance;
    }

    /**
     * Return Shared API Handler => la fonction qui gère la demande en fonction de si l'on est client ou server
     * @param api_name
     * @param sanitize_params used to sanitize params if provided
     * @param precondition returns false if we refuse, and the api returns precondition_default_value
     * @param precondition_default_value default value if !precondition
     */
    public static sah<T, U>(
        api_name: string,
        sanitize_params: (...params) => any[] = null,
        precondition: (...params) => boolean = null,
        precondition_default_value: any = null
    ): (...params) => Promise<U> {
        return APIControllerWrapper.API_CONTROLLER.get_shared_api_handler(api_name, sanitize_params, precondition, precondition_default_value);
    }

    private static instance: ModuleAPI = null;

    /**
     * Local thread cache -----
     */
    public registered_apis: { [api_name: string]: APIDefinition<any, any> } = {};
    /**
     * ----- Local thread cache
     */

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

    public async translate_param<T, U>(apiDefinition: APIDefinition<T, U>, ...api_params): Promise<IAPIParamTranslator<T>> {

        let translated_param: IAPIParamTranslator<T> = null;

        if (api_params && Array.isArray(api_params) && (api_params.length > 1)) {
            // On a besoin de faire appel à un traducteur
            if (!apiDefinition.param_translator.fromParams) {
                ConsoleHandler.getInstance().error("PARAMTRANSLATOR manquant pour l'API " + apiDefinition.api_name);
                return null;
            } else {
                translated_param = apiDefinition.param_translator.fromParams(...api_params);
            }
        } else {
            // Si on a un translateur on l'utilise sinon on garde ce param
            if (!!apiDefinition.param_translator.fromParams) {
                translated_param = apiDefinition.param_translator.fromParams(...api_params);
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