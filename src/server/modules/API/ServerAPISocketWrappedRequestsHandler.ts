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
// import PromisePipeline from "../../../shared/tools/PromisePipeline/PromisePipeline";
// const zlib = require('zlib');

// /**
//  * Objectif : Mettre en place un système qui :
//  *  - Si on a pas de socket avec cette tab à date, on continue comme d'habitude,
//  *  - Sinon, on libère immédiatement le serveur express, avec une réponse immédiate au navigateur,
//  *          tout en stockant la requete à réaliser en async et la réponse sera envoyée au navigateur via le socket
//  */
// export default class ServerAPISocketWrappedRequestsHandler {

//     private static staked_APIRequests: ServerAPISocketRequestWrapper<any, any>[] = [];

//     public static async init_worker() {

//         const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);

//         // eslint-disable-next-line no-constant-condition
//         while (true) {

//             while(ServerAPISocketWrappedRequestsHandler.staked_APIRequests.length) {

//                 const staked_APIRequest = ServerAPISocketWrappedRequestsHandler.staked_APIRequests.shift();
//                 await promise_pipeline.push((async() => {
//                     await ServerAPISocketWrappedRequestsHandler.handle_APIRequest(staked_APIRequest);
//                 }));
//             }
//         }
//     }
// }