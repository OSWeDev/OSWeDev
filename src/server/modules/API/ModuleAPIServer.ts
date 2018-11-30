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
                let returnvalue = await api.SERVER_HANDLER(param, req, res);

                if (!returnvalue) {
                    returnvalue = {} as any;
                }
                res.json(returnvalue);
            } else if (api.api_return_type == APIDefinition.API_RETURN_TYPE_RES) {
                res.end(await api.SERVER_HANDLER(param, req, res));
            } else if (api.api_return_type == APIDefinition.API_RETURN_TYPE_FILE) {

                res.json(await api.SERVER_HANDLER(param, req, res));

                // let filedata = await api.SERVER_HANDLER(param);

                // //T nécessite un filename, il faut faire une interface pour forcer cette situation
                // // Pareil sur le filetype fixé par défaut à xlsx...
                // res.writeHead(200, {
                //     'Content-Description': 'File Transfer',
                //     'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // 'application/octet-stream', //'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                //     'Content-disposition': 'attachment; filename=' + param['filename'],
                //     // 'Content-Transfer-Encoding': 'binary',
                //     'Connection': 'Keep-Alive',
                //     'Expires': '0',
                //     'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
                //     'Pragma': 'public'
                // });
                // // header('Content-Type: application/octet-stream');

                // // res.attachment(param['filename']);
                // // filedata['pipe'](res);

                // // res.end(await api.SERVER_HANDLER(param));

                // // res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
                // res.end(filedata);
                // // res.end(new Buffer(filedata as any, 'base64'));
                // // if (filedata) {
                // //     res.sendFile(filedata as any);
                // // }
                // // res.send(new Buffer(filedata as any));
                // // res.write(filedata, 'binary');
                // // res.end(undefined, 'binary');
            } else {
                res.end(await api.SERVER_HANDLER(param, req, res));
            }
        };
    }
}