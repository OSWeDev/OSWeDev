import IAPIController from '../../../shared/modules/API/interfaces/IAPIController';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';

export default class ServerAPIController implements IAPIController {

    public static getInstance(): ServerAPIController {
        if (!ServerAPIController.instance) {
            ServerAPIController.instance = new ServerAPIController();
        }
        return ServerAPIController.instance;
    }

    private static instance: ServerAPIController = null;

    public async handleAPI<T, U>(api_name: string, ...api_params): Promise<U> {
        let translated_param: T = await ModuleAPI.getInstance().translate_param(api_name, ...api_params);
        let apiDefinition: APIDefinition<T, U> = ModuleAPI.getInstance().registered_apis[api_name];

        if (apiDefinition.SERVER_HANDLER) {
            return await apiDefinition.SERVER_HANDLER(translated_param);
        }
        return null;
    }
}