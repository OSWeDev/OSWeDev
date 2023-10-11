import { Express, Request, Response } from 'express';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import IAPIParamTranslator from '../../../shared/modules/API/interfaces/IAPIParamTranslator';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import AjaxCacheController from '../../../shared/modules/AjaxCache/AjaxCacheController';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ServerBase from '../../ServerBase';
import ServerExpressController from '../../ServerExpressController';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import APINotifTypeResultVO from '../../../shared/modules/PushData/vos/APINotifTypeResultVO';
const zlib = require('zlib');

export default class ModuleAPIServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAPIServer.instance) {
            ModuleAPIServer.instance = new ModuleAPIServer();
        }
        return ModuleAPIServer.instance;
    }

    private static instance: ModuleAPIServer = null;
    private static API_CALL_ID: number = 0;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAPI.getInstance().name);
    }

    public registerExpressApis(app: Express): void {

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'IN');

        // On doit register toutes les APIs
        for (let i in APIControllerWrapper.registered_apis) {
            let api: APIDefinition<any, any> = APIControllerWrapper.registered_apis[i];

            StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'API');
            switch (api.api_type) {
                // case APIDefinition.API_TYPE_GET:
                //     // ConsoleHandler.log("AJOUT API GET  :" + APIControllerWrapper.getAPI_URL(api).toLowerCase());
                //     app.get(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                //     break;
                case APIDefinition.API_TYPE_POST:
                    // ConsoleHandler.log("AJOUT API POST :" + APIControllerWrapper.getAPI_URL(api).toLowerCase());
                    if (api.csrf_protection) {
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    } else {
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    }
                    break;
                case APIDefinition.API_TYPE_GET:
                case APIDefinition.API_TYPE_POST_FOR_GET:
                    if (api.csrf_protection) {
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    } else {
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    }
                    break;
            }
        }
        StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'OUT');
        StatsController.register_stat_DUREE('ModuleAPIServer', 'registerExpressApis', 'OUT', Dates.now_ms() - time_in);
    }

    private createApiRequestHandler<T, U>(api: APIDefinition<T, U>): (req: Request, res: Response) => void {
        return async (req: Request, res: Response) => {

            if (!!api.access_policy_name) {
                if (!await StackContext.runPromise(
                    await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                    async () => AccessPolicyServerController.checkAccessSync(api.access_policy_name))) {
                    let session: IServerUserSession = (req as any).session;
                    ConsoleHandler.error('Access denied to API:' + api.api_name + ':sessionID:' + req.sessionID + ":uid:" + (session ? session.uid : "null") + ":user_vo:" + ((session && session.user_vo) ? JSON.stringify(session.user_vo) : null));
                    StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'access_denied_api', api.api_name);
                    this.respond_on_error(api, res);
                    return;
                }
            }

            let param: IAPIParamTranslator<T> = null;
            let has_params = false;

            if (
                ((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) ||
                ((api.api_type == APIDefinition.API_TYPE_GET) && (req.body)) ||
                ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))
            ) {
                let req_body: any = req.body;

                if (ConfigurationService.node_configuration.COMPRESS) {
                    // Si je suis en compresse, je vais recevoir mes POST en gzip (BLOB)
                    // Du coup, il faut que je unzip pour récupérer au bon format
                    if (req.method === 'POST' && req.headers[AjaxCacheController.HEADER_GZIP] === 'true') {

                        // Décompresse les données gzipées
                        try {
                            let decoded = zlib.gunzipSync(Buffer.from(req_body));

                            // Utilisez les données décompressées ici
                            // ConsoleHandler.log("gunzipSync :: " + decoded.toString());
                            req_body = JSON.parse(decoded.toString());
                        } catch (e) {
                            ConsoleHandler.error("gunzipSync :: " + e);
                            // Gérer l'erreur
                            res.writeHead(500);
                            res.end();
                            return;
                        }
                    }
                }

                param = APIControllerWrapper.try_translate_vo_from_api(req_body);
                has_params = ObjectHandler.hasAtLeastOneAttribute(req_body);
            }
            // else if (api.param_translator && api.param_translator.fromREQ) {
            //     try {
            //         has_params = ObjectHandler.hasAtLeastOneAttribute(req.params);
            //         param = api.param_translator.fromREQ(req);
            //     } catch (error) {
            //         StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'createApiRequestHandler', 'param_translator.fromREQ');
            //         ConsoleHandler.error(error);
            //         this.respond_on_error(api, res);
            //         return;
            //     }
            // }

            let params = (param && api.param_translator) ? api.param_translator.getAPIParams(param) : [param];
            let returnvalue = null;

            let notif_result_uid: number = req.session.uid;
            let notif_result_tab_id: string = req.headers.client_tab_id as string;
            let do_notif_result: boolean = (
                (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) &&
                (!!notif_result_uid) &&
                (!!notif_result_tab_id));
            let api_call_id = null;

            try {
                if (has_params && params && params.length) {
                    params.push(res);
                } else if (res) {
                    params = [res];
                }
                StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name);
                let date_in_ms = Dates.now_ms();

                // Si on répond en notif, on commence par dire OK au client, avant de gérer vraiment la demande
                if (do_notif_result) {
                    api_call_id = ++ModuleAPIServer.API_CALL_ID;
                    let notif_result = APINotifTypeResultVO.createNew(
                        api_call_id,
                        null
                    );

                    res.json(APIControllerWrapper.try_translate_vo_to_api(notif_result));
                }

                returnvalue = await StackContext.runPromise(
                    await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                    async () => await api.SERVER_HANDLER(...params, req));
                StatsController.register_stat_DUREE('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name, Dates.now_ms() - date_in_ms);
            } catch (error) {
                ConsoleHandler.error(error);
                StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER.ERROR', api.api_name);
                this.respond_on_error(api, res);
                return;
            }

            if (res.headersSent && (!do_notif_result)) {
                // Si les headers sont déjà envoyés, on a plus rien à faire ici
                return;
            }

            if (
                (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
                (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF)) {
                if (typeof returnvalue == 'undefined') {
                    returnvalue = {} as any;
                }
            }

            if (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) {
                if (do_notif_result) {
                    await PushDataServerController.getInstance().notifyAPIResult(
                        notif_result_uid,
                        notif_result_tab_id,
                        api_call_id,
                        APIControllerWrapper.try_translate_vo_to_api(returnvalue)
                    );
                    return;
                }

                returnvalue = APINotifTypeResultVO.createNew(
                    null,
                    APIControllerWrapper.try_translate_vo_to_api(returnvalue)
                );
                return;
            }

            if (
                (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
                (api.api_return_type == APIDefinition.API_RETURN_TYPE_FILE)) {
                returnvalue = APIControllerWrapper.try_translate_vo_to_api(returnvalue);
                res.json(returnvalue);
            }

            res.end(returnvalue);
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