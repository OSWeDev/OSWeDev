import { Express, Request, Response } from 'express';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import IAPIParamTranslator from '../../../shared/modules/API/interfaces/IAPIParamTranslator';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import IServerUserSession from '../../IServerUserSession';
import ServerBase from '../../ServerBase';
import ServerExpressController from '../../ServerExpressController';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleAPIServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAPIServer.instance) {
            ModuleAPIServer.instance = new ModuleAPIServer();
        }
        return ModuleAPIServer.instance;
    }

    private static instance: ModuleAPIServer = null;

    private constructor() {
        super(ModuleAPI.getInstance().name);
    }

    public registerExpressApis(app: Express): void {

        // On doit register toutes les APIs
        for (let i in APIControllerWrapper.registered_apis) {
            let api: APIDefinition<any, any> = APIControllerWrapper.registered_apis[i];

            switch (api.api_type) {
                case APIDefinition.API_TYPE_GET:
                    ConsoleHandler.log("AJOUT API GET  :" + APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase());
                    app.get(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    break;
                case APIDefinition.API_TYPE_POST:
                    ConsoleHandler.log("AJOUT API POST :" + APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase());
                    if (api.csrf_protection) {
                        app.post(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    } else {
                        app.post(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    }
                    break;
                case APIDefinition.API_TYPE_POST_FOR_GET:
                    ConsoleHandler.log("AJOUT API POST FOR GET :" + APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase());
                    if (api.csrf_protection) {
                        app.post(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    } else {
                        app.post(APIControllerWrapper.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    }
                    break;
            }
        }
    }

    private createApiRequestHandler<T, U>(api: APIDefinition<T, U>): (req: Request, res: Response) => void {
        return async (req: Request, res: Response) => {

            if (!!api.access_policy_name) {
                if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(api.access_policy_name)) {
                    ConsoleHandler.error('Access denied to API:' + api.api_name + ': sessionID' + req.sessionID + ":");
                    this.respond_on_error(api, res);
                    return;
                }
            }

            let param: IAPIParamTranslator<T> = null;
            let has_params = false;

            if (((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) ||
                ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))) {
                param = APIControllerWrapper.getInstance().try_translate_vo_from_api(req.body);
                has_params = ObjectHandler.getInstance().hasAtLeastOneAttribute(req.body);
            } else if (api.param_translator && api.param_translator.fromREQ) {
                try {
                    has_params = ObjectHandler.getInstance().hasAtLeastOneAttribute(req.params);
                    param = api.param_translator.fromREQ(req);
                } catch (error) {
                    ConsoleHandler.error(error);
                    this.respond_on_error(api, res);
                    return;
                }
            }

            let params = (param && api.param_translator) ? api.param_translator.getAPIParams(param) : [param];
            let returnvalue = null;
            try {
                if (has_params && params && params.length) {
                    params.push(res);
                } else if (res) {
                    params = [res];
                }
                returnvalue = await StackContext.runPromise(
                    ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                    async () => await api.SERVER_HANDLER(...params, req));
            } catch (error) {
                ConsoleHandler.error(error);
                this.respond_on_error(api, res);
                return;
            }

            if (res.headersSent) {
                // Si les headers sont déjà envoyés, on a plus rien à faire ici
                return;
            }

            switch (api.api_return_type) {
                case APIDefinition.API_RETURN_TYPE_JSON:
                    if (typeof returnvalue == 'undefined') {
                        returnvalue = {} as any;
                    }
                case APIDefinition.API_RETURN_TYPE_FILE:
                    returnvalue = APIControllerWrapper.getInstance().try_translate_vo_to_api(returnvalue);
                    res.json(returnvalue);
                    return;

                case APIDefinition.API_RETURN_TYPE_RES:
                default:
                    res.end(returnvalue);
                    return;
            }
        };
    }

    private respond_on_error<T, U>(api: APIDefinition<T, U>, res: Response) {
        switch (api.api_return_type) {
            case APIDefinition.API_RETURN_TYPE_JSON:
            case APIDefinition.API_RETURN_TYPE_FILE:
                res.json(null);
                return;
            case APIDefinition.API_RETURN_TYPE_RES:
            default:
                res.end(null);
                return;
        }
    }
}