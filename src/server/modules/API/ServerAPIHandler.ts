// import { Request, Response } from "express";
// import IServerUserSession from "../../../shared/modules/AccessPolicy/vos/IServerUserSession";
// import AjaxCacheController from "../../../shared/modules/AjaxCache/AjaxCacheController";
// import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
// import IAPIParamTranslator from "../../../shared/modules/API/interfaces/IAPIParamTranslator";
// import APIDefinition from "../../../shared/modules/API/vos/APIDefinition";
// import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
// import APINotifTypeResultVO from "../../../shared/modules/PushData/vos/APINotifTypeResultVO";
// import StatsController from "../../../shared/modules/Stats/StatsController";
// import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
// import ObjectHandler from "../../../shared/tools/ObjectHandler";
// import ConfigurationService from "../../env/ConfigurationService";
// import ServerExpressController from "../../ServerExpressController";
// import StackContext from "../../StackContext";
// import AccessPolicyServerController from "../AccessPolicy/AccessPolicyServerController";
// import PushDataServerController from "../PushData/PushDataServerController";
// const zlib = require('zlib');

// export default class ServerAPIHandler {

//     private static API_CALL_ID: number = 0;

//     public static async apiRequestHandler_res_in_request_response<T, U>(api: APIDefinition<T, U>, req: Request, res: Response): Promise<void> {

//         // /**
//         //  * DELETE ME :IN: Juste pour un TEST
//         //  */
//         // ConsoleHandler.log("DELETE ME : Juste pour un TEST:IN:" + api.api_name);
//         // await ThreadHandler.sleep(2000, 'DELETE ME : Juste pour un TEST');
//         // ConsoleHandler.log("DELETE ME : Juste pour un TEST:OUT:" + api.api_name);
//         // /**
//         //  * DELETE ME :OUT: Juste pour un TEST
//         //  */

//         if (api.access_policy_name) {
//             if (!await StackContext.runPromise(
//                 await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
//                 async () => AccessPolicyServerController.checkAccessSync(api.access_policy_name))) {
//                 const session: IServerUserSession = (req as any).session;
//                 ConsoleHandler.error('Access denied to API:' + api.api_name + ':sessionID:' + req.sessionID + ":uid:" + (session ? session.uid : "null") + ":user_vo:" + ((session && session.user_vo) ? JSON.stringify(session.user_vo) : null));
//                 StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'access_denied_api', api.api_name);
//                 this.respond_on_error(api, res);
//                 return;
//             }
//         }

//         let param: IAPIParamTranslator<T> = null;
//         let has_params = false;

//         if (
//             ((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) ||
//             ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))
//         ) {
//             let req_body: any = req.body;

//             if (ConfigurationService.node_configuration.compress) {
//                 // Si je suis en compresse, je vais recevoir mes POST en gzip (BLOB)
//                 // Du coup, il faut que je unzip pour récupérer au bon format
//                 if (req.method === 'POST' && req.headers[AjaxCacheController.HEADER_GZIP] === 'true') {

//                     // Décompresse les données gzipées
//                     try {
//                         const decoded = zlib.gunzipSync(Buffer.from(req_body));

//                         // Utilisez les données décompressées ici
//                         // ConsoleHandler.log("gunzipSync :: " + decoded.toString());
//                         req_body = JSON.parse(decoded.toString());
//                     } catch (e) {
//                         ConsoleHandler.error("gunzipSync :: " + e);
//                         // Gérer l'erreur
//                         res.writeHead(500);
//                         res.end();
//                         return;
//                     }
//                 }
//             }

//             param = APIControllerWrapper.try_translate_vo_from_api(req_body);
//             has_params = ObjectHandler.hasAtLeastOneAttribute(req_body);
//         } else if (api.param_translator && api.param_translator.fromREQ) {
//             try {
//                 has_params = ObjectHandler.hasAtLeastOneAttribute(req.params);
//                 param = api.param_translator.fromREQ(req);
//             } catch (error) {
//                 StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'createApiRequestHandler', 'param_translator.fromREQ');
//                 ConsoleHandler.error(error);
//                 this.respond_on_error(api, res);
//                 return;
//             }
//         }

//         const params = (param && api.param_translator) ? api.param_translator.getAPIParams(param) : [param];
//         let returnvalue = null;

//         const notif_result_uid: number = req.session.uid;
//         const notif_result_tab_id: string = req.headers.client_tab_id as string;
//         const do_notif_result: boolean = (
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) &&
//             (!!notif_result_uid) &&
//             (!!notif_result_tab_id));
//         let api_call_id = null;

//         try {
//             StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name);
//             const date_in_ms = Dates.now_ms();

//             // Si on répond en notif, on commence par dire OK au client, avant de gérer vraiment la demande
//             if (do_notif_result) {
//                 api_call_id = ++ServerAPIHandler.API_CALL_ID;
//                 const notif_result = APINotifTypeResultVO.createNew(
//                     api_call_id,
//                     null
//                 );

//                 res.json(APIControllerWrapper.try_translate_vo_to_api(notif_result));
//             }

//             returnvalue = await StackContext.runPromise(
//                 await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
//                 async () => (has_params && params && params.length) ? await api.SERVER_HANDLER(...params, req, res) : await api.SERVER_HANDLER(req, res));
//             StatsController.register_stat_DUREE('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name, Dates.now_ms() - date_in_ms);
//         } catch (error) {
//             ConsoleHandler.error(error);
//             StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER.ERROR', api.api_name);
//             this.respond_on_error(api, res);
//             return;
//         }

//         if (res.headersSent && (!do_notif_result)) {
//             // Si les headers sont déjà envoyés, on a plus rien à faire ici
//             return;
//         }

//         if (
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF)) {
//             if (typeof returnvalue == 'undefined') {
//                 returnvalue = {} as any;
//             }
//         }

//         if (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) {
//             if (do_notif_result) {
//                 await PushDataServerController.notifyAPIResult(
//                     notif_result_uid,
//                     notif_result_tab_id,
//                     api_call_id,
//                     APIControllerWrapper.try_translate_vo_to_api(returnvalue)
//                 );
//                 return;
//             }

//             returnvalue = APINotifTypeResultVO.createNew(
//                 null,
//                 APIControllerWrapper.try_translate_vo_to_api(returnvalue)
//             );
//             return;
//         }

//         if (
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_FILE)) {
//             returnvalue = APIControllerWrapper.try_translate_vo_to_api(returnvalue);
//             res.json(returnvalue);
//         }

//         res.end(returnvalue);
//     }

//     public static async apiRequestHandler_res_in_socket<T, U>(
//         api: APIDefinition<T, U>,
//         req: Request,
//         uid: string,
//         tab_id: string): Promise<void> {

//         // /**
//         //  * DELETE ME :IN: Juste pour un TEST
//         //  */
//         // ConsoleHandler.log("DELETE ME : Juste pour un TEST:IN:" + api.api_name);
//         // await ThreadHandler.sleep(2000, 'DELETE ME : Juste pour un TEST');
//         // ConsoleHandler.log("DELETE ME : Juste pour un TEST:OUT:" + api.api_name);
//         // /**
//         //  * DELETE ME :OUT: Juste pour un TEST
//         //  */

//         if (api.access_policy_name) {
//             if (!await StackContext.runPromise(
//                 await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
//                 async () => AccessPolicyServerController.checkAccessSync(api.access_policy_name))) {
//                 const session: IServerUserSession = (req as any).session;
//                 ConsoleHandler.error('Access denied to API:' + api.api_name + ':sessionID:' + req.sessionID + ":uid:" + (session ? session.uid : "null") + ":user_vo:" + ((session && session.user_vo) ? JSON.stringify(session.user_vo) : null));
//                 StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'access_denied_api', api.api_name);

//                 TODO: NOTIFY ACCESS_DENIED 403 / NULL

//                 return;
//             }
//         }

//         let param: IAPIParamTranslator<T> = null;
//         let has_params = false;

//         if (
//             ((api.api_type == APIDefinition.API_TYPE_POST) && (req.body)) ||
//             ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))
//         ) {
//             let req_body: any = req.body;

//             if (ConfigurationService.node_configuration.compress) {
//                 // Si je suis en compresse, je vais recevoir mes POST en gzip (BLOB)
//                 // Du coup, il faut que je unzip pour récupérer au bon format
//                 if (req.method === 'POST' && req.headers[AjaxCacheController.HEADER_GZIP] === 'true') {

//                     // Décompresse les données gzipées
//                     try {
//                         const decoded = zlib.gunzipSync(Buffer.from(req_body));

//                         // Utilisez les données décompressées ici
//                         // ConsoleHandler.log("gunzipSync :: " + decoded.toString());
//                         req_body = JSON.parse(decoded.toString());
//                     } catch (e) {
//                         ConsoleHandler.error("gunzipSync :: " + e);

//                         TODO: NOTIFY InternalServerError 500 / null

//                         return;
//                     }
//                 }
//             }

//             param = APIControllerWrapper.try_translate_vo_from_api(req_body);
//             has_params = ObjectHandler.hasAtLeastOneAttribute(req_body);
//         } else if (api.param_translator && api.param_translator.fromREQ) {
//             try {
//                 has_params = ObjectHandler.hasAtLeastOneAttribute(req.params);
//                 param = api.param_translator.fromREQ(req);
//             } catch (error) {
//                 StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'createApiRequestHandler', 'param_translator.fromREQ');
//                 ConsoleHandler.error(error);

//                 TODO: NOTIFY InternalServerError 500 / null

//                 return;
//             }
//         }

//         const params = (param && api.param_translator) ? api.param_translator.getAPIParams(param) : [param];
//         let returnvalue = null;

//         const notif_result_uid: number = req.session.uid;
//         const notif_result_tab_id: string = req.headers.client_tab_id as string;
//         const do_notif_result: boolean = (
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) &&
//             (!!notif_result_uid) &&
//             (!!notif_result_tab_id));
//         let api_call_id = null;

//         try {
//             StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name);
//             const date_in_ms = Dates.now_ms();

//             // Si on répond en notif, on commence par dire OK au client, avant de gérer vraiment la demande
//             if (do_notif_result) {
//                 api_call_id = ++ServerAPIHandler.API_CALL_ID;
//                 const notif_result = APINotifTypeResultVO.createNew(
//                     api_call_id,
//                     null
//                 );

//                 TODO: NOTIFY 200 / notif_result || APIControllerWrapper.try_translate_vo_to_api(notif_result)

//                 // res.json(APIControllerWrapper.try_translate_vo_to_api(notif_result));
//             }

//             returnvalue = await StackContext.runPromise(
//                 await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
//                 async () => (has_params && params && params.length) ? await api.SERVER_HANDLER(...params, req) : await api.SERVER_HANDLER(req));
//             StatsController.register_stat_DUREE('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name, Dates.now_ms() - date_in_ms);
//         } catch (error) {
//             ConsoleHandler.error(error);
//             StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER.ERROR', api.api_name);

//             TODO: NOTIFY InternalServerError 500 / null

//             return;
//         }

//         if (
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
//             (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF)) {
//             if (typeof returnvalue == 'undefined') {
//                 returnvalue = {} as any;
//             }
//         }

//         switch (api.api_return_type) {
//             case APIDefinition.API_RETURN_TYPE_NOTIF:
//                 if (do_notif_result) {
//                     await PushDataServerController.notifyAPIResult(
//                         notif_result_uid,
//                         notif_result_tab_id,
//                         api_call_id,
//                         APIControllerWrapper.try_translate_vo_to_api(returnvalue)
//                     );
//                     return;
//                 }

//                 returnvalue = APINotifTypeResultVO.createNew(
//                     null,
//                     APIControllerWrapper.try_translate_vo_to_api(returnvalue)
//                 );
//                 break;
//             case APIDefinition.API_RETURN_TYPE_JSON:
//             case APIDefinition.API_RETURN_TYPE_FILE:
//                 returnvalue = APIControllerWrapper.try_translate_vo_to_api(returnvalue);
//                 break;
//         }

//         TODO: NOTIFY 200 / returnvalue || APIControllerWrapper.try_translate_vo_to_api(returnvalue)
//     }

//     private static respond_on_error<T, U>(api: APIDefinition<T, U>, res: Response) {
//         switch (api.api_return_type) {
//             case APIDefinition.API_RETURN_TYPE_JSON:
//             case APIDefinition.API_RETURN_TYPE_FILE:
//                 res.json(null);
//                 return;
//             // case APIDefinition.API_RETURN_TYPE_RES:
//             default:
//                 res.end(null);
//                 return;
//         }
//     }
// }