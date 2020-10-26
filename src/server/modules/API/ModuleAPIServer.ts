import { Express, Request, Response } from 'express';
import APIController from '../../../shared/modules/API/APIController';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import StackContext from '../../StackContext';
import ServerBase from '../../ServerBase';
import ModuleServerBase from '../ModuleServerBase';
import ServerExpressController from '../../ServerExpressController';
import IServerUserSession from '../../IServerUserSession';

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
        for (let i in ModuleAPI.getInstance().registered_apis) {
            let api: APIDefinition<any, any> = ModuleAPI.getInstance().registered_apis[i];

            switch (api.api_type) {
                case APIDefinition.API_TYPE_GET:
                    ConsoleHandler.getInstance().log("AJOUT API GET  :" + APIController.getInstance().getAPI_URL(api).toLowerCase());
                    app.get(APIController.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    break;
                case APIDefinition.API_TYPE_POST:
                    ConsoleHandler.getInstance().log("AJOUT API POST :" + APIController.getInstance().getAPI_URL(api).toLowerCase());
                    app.post(APIController.getInstance().getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    break;
                case APIDefinition.API_TYPE_POST_FOR_GET:
                    ConsoleHandler.getInstance().log("AJOUT API POST FOR GET :" + APIController.getInstance().getAPI_URL(api).toLowerCase());
                    app.post(APIController.getInstance().getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    break;
            }
        }
    }

    private createApiRequestHandler<T, U>(api: APIDefinition<T, U>): (req: Request, res: Response) => void {
        return async (req: Request, res: Response) => {

            let param: T = null;
            if (api.PARAM_TRANSLATE_FROM_REQ) {
                try {
                    param = await StackContext.getInstance().runPromise(
                        ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                        async () => await api.PARAM_TRANSLATE_FROM_REQ(req));
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
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
            } else {
                if (((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) ||
                    ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))) {
                    param = APIController.getInstance().try_translate_vo_from_api(req.body) as T;
                }
            }

            let returnvalue = null;
            try {
                returnvalue = await StackContext.getInstance().runPromise(
                    ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                    async () => await api.SERVER_HANDLER(param));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
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


            switch (api.api_return_type) {
                case APIDefinition.API_RETURN_TYPE_JSON:
                    if (typeof returnvalue == 'undefined') {
                        returnvalue = {} as any;
                    }
                case APIDefinition.API_RETURN_TYPE_FILE:
                    returnvalue = APIController.getInstance().try_translate_vo_to_api(returnvalue);
                    res.json(returnvalue);
                    return;

                case APIDefinition.API_RETURN_TYPE_RES:
                default:
                    res.end(returnvalue);
                    return;
            }
        };
    }
}