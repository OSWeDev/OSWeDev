// import { Request, Response } from "express";
// import APIDefinition from "../../../shared/modules/API/vos/APIDefinition";
// import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
// import PushDataServerController from "../PushData/PushDataServerController";
// import IServerUserSession from "../../../shared/modules/AccessPolicy/vos/IServerUserSession";
// import AjaxCacheController from "../../../shared/modules/AjaxCache/AjaxCacheController";
// import APIControllerWrapper from "../../../shared/modules/API/APIControllerWrapper";
// import IAPIParamTranslator from "../../../shared/modules/API/interfaces/IAPIParamTranslator";
// import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
// import APINotifTypeResultVO from "../../../shared/modules/PushData/vos/APINotifTypeResultVO";
// import StatsController from "../../../shared/modules/Stats/StatsController";
// import ObjectHandler from "../../../shared/tools/ObjectHandler";
// import ConfigurationService from "../../env/ConfigurationService";
// import ServerExpressController from "../../ServerExpressController";
// import StackContext from "../../StackContext";
// import AccessPolicyServerController from "../AccessPolicy/AccessPolicyServerController";
// import ModuleAPIServer from "./ModuleAPIServer";
// import ServerAPISocketRequestWrapper from "./socket_res/ServerAPISocketRequestWrapper";
// const zlib = require('zlib');

// /**
//  * Objectif : Mettre en place un système qui :
//  *  - Si on a pas de socket avec cette tab à date, on continue comme d'habitude,
//  *  - Sinon, on libère immédiatement le serveur express, avec une réponse immédiate au navigateur,
//  *          tout en stockant la requete à réaliser en async et la réponse sera envoyée au navigateur via le socket
//  */
// export default class ServerAPISocketWrapper {

//     private static API_CALL_ID: number = 0;

//     private static staked_APIRequests: ServerAPISocketRequestWrapper<any, any>[] = [];

//     public static async wrapped_apiRequestHandler<T, U>(api: APIDefinition<T, U>, req: Request, res: Response): Promise<void> {

//         try {
//             const client_uid: number = req.session.uid;
//             const client_tab_id: string = req.headers.client_tab_id as string;

//             if (!client_uid) {
//                 throw new Error('client_uid not defined');
//             }

//             if (!client_tab_id) {
//                 throw new Error('client_tab_id not defined');
//             }

//             // Si on a pas de socket avec cette tab à date, on continue comme d'habitude,
//             if ((!PushDataServerController.registeredSockets) ||
//                 (!PushDataServerController.registeredSockets[client_uid]) ||
//                 (!PushDataServerController.registeredSockets[client_uid][client_tab_id])) {

//                 await ServerAPISocketWrapper.apiRequestHandler_res_in_request_response(api, req, res);
//                 return;
//             }

//             // Sinon, on libère immédiatement le serveur express, avec une réponse immédiate au navigateur,
//             res.writeHead(204, { 'Content-Type': 'application/json' }); // 204 = No Content. On utilise ce code pour reco de la part du client
//             res.end();

//             // tout en stockant la requete à réaliser en async et la réponse sera envoyée au navigateur via le socket
//             ServerAPISocketWrapper.staked_APIRequests.push(new ServerAPISocketRequestWrapper(api, req));
//         } catch (error) {
//             ConsoleHandler.error(error);
//             throw error;
//         }
//     }

// }