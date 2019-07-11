import ModuleServerBase from '../ModuleServerBase';
import { Express, Request, Response } from 'express';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';

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

            if (api.api_type == APIDefinition.API_TYPE_GET) {
                console.log("AJOUT API GET  :" + ModuleAPI.getInstance().getAPI_URL(api).toLowerCase());
                app.get(ModuleAPI.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
            } else {
                console.log("AJOUT API POST :" + ModuleAPI.getInstance().getAPI_URL(api).toLowerCase());
                app.post(ModuleAPI.getInstance().getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
            }
        }
    }

    private createApiRequestHandler<T, U>(api: APIDefinition<T, U>): (req: Request, res: Response) => void {
        return async (req: Request, res: Response) => {

            let param: T = null;
            if (api.PARAM_TRANSLATE_FROM_REQ) {
                param = await api.PARAM_TRANSLATE_FROM_REQ(req);
            } else {
                if ((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) {
                    param = req.body as T;
                }
            }

            if (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) {
                let returnvalue = await api.SERVER_HANDLER(param);

                if (typeof returnvalue == 'undefined') {
                    returnvalue = {} as any;
                }

                // if (!api.is_autonomous_res_handler) {

                returnvalue = ModuleAPI.getInstance().try_translate_vo_to_api(returnvalue);

                res.json(returnvalue);
                // }
            } else if (api.api_return_type == APIDefinition.API_RETURN_TYPE_RES) {
                let returnvalue = await api.SERVER_HANDLER(param);

                // if (!api.is_autonomous_res_handler) {
                res.end(returnvalue);
                // }
            } else if (api.api_return_type == APIDefinition.API_RETURN_TYPE_FILE) {

                let returnvalue = await api.SERVER_HANDLER(param);

                // if (!api.is_autonomous_res_handler) {

                returnvalue = ModuleAPI.getInstance().try_translate_vo_to_api(returnvalue);

                res.json(returnvalue);
                // }
            } else {
                let returnvalue = await api.SERVER_HANDLER(param);

                // if (!api.is_autonomous_res_handler) {
                res.end(returnvalue);
                // }
            }
        };
    }
}