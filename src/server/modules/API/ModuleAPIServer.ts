import { Express, Request, Response } from 'express';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import IAPIParamTranslator from '../../../shared/modules/API/interfaces/IAPIParamTranslator';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import AjaxCacheController from '../../../shared/modules/AjaxCache/AjaxCacheController';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import APINotifTypeResultVO from '../../../shared/modules/PushData/vos/APINotifTypeResultVO';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ServerBase from '../../ServerBase';
import ServerExpressController from '../../ServerExpressController';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import APIBGThread from './bgthreads/APIBGThread';
const zlib = require('zlib');

export default class ModuleAPIServer extends ModuleServerBase {

    private static EXEC_ON_API_BGTHREAD_TASK_UID: string = 'ModuleAPIServer.EXEC_ON_API_BGTHREAD_TASK_UID';
    private static API_CALL_ID: number = 0;
    private static instance: ModuleAPIServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAPI.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAPIServer.instance) {
            ModuleAPIServer.instance = new ModuleAPIServer();
        }
        return ModuleAPIServer.instance;
    }

    public async configure(): Promise<void> {
        ModuleBGThreadServer.getInstance().registerBGThread(APIBGThread.getInstance());
    }

    public registerExpressApis(app: Express): void {

        const time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'IN');

        // On doit register toutes les APIs
        for (const i in APIControllerWrapper.registered_apis) {
            const api: APIDefinition<any, any> = APIControllerWrapper.registered_apis[i];

            StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'API');
            switch (api.api_type) {
                case APIDefinition.API_TYPE_GET:
                    // ConsoleHandler.log("AJOUT API GET  :" + APIControllerWrapper.getAPI_URL(api).toLowerCase());
                    // app.get(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    app.get(APIControllerWrapper.getAPI_URL(api).toLowerCase(), (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    break;
                case APIDefinition.API_TYPE_POST:
                    // ConsoleHandler.log("AJOUT API POST :" + APIControllerWrapper.getAPI_URL(api).toLowerCase());
                    if (api.csrf_protection) {
                        // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    } else {
                        // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    }
                    break;
                case APIDefinition.API_TYPE_POST_FOR_GET:
                    // ConsoleHandler.log("AJOUT API POST FOR GET :" + APIControllerWrapper.getAPI_URL(api).toLowerCase());
                    if (api.csrf_protection) {
                        // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    } else {
                        // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                        app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    }
                    break;
            }
        }
        StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'OUT');
        StatsController.register_stat_DUREE('ModuleAPIServer', 'registerExpressApis', 'OUT', Dates.now_ms() - time_in);
    }

    private async api_request_handler<T, U>(api: APIDefinition<T, U>, req: Request, res: Response): Promise<void> {

        // /**
        //  * DELETE ME :IN: Juste pour un TEST
        //  */
        // ConsoleHandler.log("DELETE ME : Juste pour un TEST:IN:" + api.api_name);
        // await ThreadHandler.sleep(2000, 'DELETE ME : Juste pour un TEST');
        // ConsoleHandler.log("DELETE ME : Juste pour un TEST:OUT:" + api.api_name);
        // /**
        //  * DELETE ME :OUT: Juste pour un TEST
        //  */

        if (api.access_policy_name) {
            const session: IServerUserSession = (req as any).session;
            if (!AccessPolicyServerController.check_access_sync(api.access_policy_name, true, session.uid)) {
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
            ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (req.body))
        ) {
            let req_body: any = req.body;

            if (ConfigurationService.node_configuration.compress) {
                // Si je suis en compresse, je vais recevoir mes POST en gzip (BLOB)
                // Du coup, il faut que je unzip pour récupérer au bon format
                if (req.method === 'POST' && req.headers[AjaxCacheController.HEADER_GZIP] === 'true') {

                    // Décompresse les données gzipées
                    try {
                        const decoded = zlib.gunzipSync(Buffer.from(req_body));

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
        } else if (api.param_translator && api.param_translator.fromREQ) {
            try {
                has_params = ObjectHandler.hasAtLeastOneAttribute(req.params);
                param = api.param_translator.fromREQ(req);
            } catch (error) {
                StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'createApiRequestHandler', 'param_translator.fromREQ');
                ConsoleHandler.error(error);
                this.respond_on_error(api, res);
                return;
            }
        }

        const params = (param && api.param_translator) ? api.param_translator.getAPIParams(param) : [param];
        let returnvalue = null;

        const notif_result_uid: number = req.session.uid;
        const notif_result_tab_id: string = req.headers.client_tab_id as string;
        let do_notif_result: boolean = (
            (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) &&
            (!!notif_result_uid) &&
            (!!notif_result_tab_id));

        // On check aussi qu'on a bien un socket à date si on doit notif
        do_notif_result = do_notif_result && (
            (!!PushDataServerController.registeredSockets) &&
            (!!PushDataServerController.registeredSockets[notif_result_uid]) &&
            (!!PushDataServerController.registeredSockets[notif_result_uid][notif_result_tab_id]));

        let api_call_id = null;

        try {
            StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name);
            const date_in_ms = Dates.now_ms();

            // Si on répond en notif, on commence par dire OK au client, avant de gérer vraiment la demande
            if (do_notif_result) {
                api_call_id = ++ModuleAPIServer.API_CALL_ID;
                const notif_result = APINotifTypeResultVO.createNew(
                    api_call_id,
                    null
                );

                res.json(APIControllerWrapper.try_translate_vo_to_api(notif_result));
            }

            if (api.needs_response_param) {
                await StackContext.runPromise(
                    await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
                    async () => {
                        if (has_params && params && params.length) {
                            returnvalue = await api.SERVER_HANDLER(...params, req, res);
                        } else {
                            returnvalue = await api.SERVER_HANDLER(req, res);
                        }
                    });
            } else {
                returnvalue = await this.exec_api_on_bg_thread(
                    await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession, true),
                    api.api_name,
                    has_params,
                    ...params);
            }

            // /**
            //  * DELETE ME :IN: Juste pour un TEST
            //  */
            // ConsoleHandler.log("DELETE ME : Juste pour un TEST:IN:" + api.api_name);
            // await ThreadHandler.sleep(2000, 'DELETE ME : Juste pour un TEST');
            // ConsoleHandler.log("DELETE ME : Juste pour un TEST:OUT:" + api.api_name);
            // /**
            //  * DELETE ME :OUT: Juste pour un TEST
            //  */

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

        switch (api.api_return_type) {
            case APIDefinition.API_RETURN_TYPE_NOTIF:
                if (do_notif_result) {
                    await this.try_send_notif_result(
                        notif_result_uid,
                        notif_result_tab_id,
                        api_call_id,
                        returnvalue,
                    );
                    return;
                }

                returnvalue = APIControllerWrapper.try_translate_vo_to_api(APINotifTypeResultVO.createNew(
                    null,
                    returnvalue
                ));
                break;

            case APIDefinition.API_RETURN_TYPE_JSON:
            case APIDefinition.API_RETURN_TYPE_FILE:
                returnvalue = APIControllerWrapper.try_translate_vo_to_api(returnvalue);
                break;
        }

        res.json(returnvalue);
    }

    // private createApiRequestHandler<T, U>(api: APIDefinition<T, U>): (req: Request, res: Response) => void {
    //     return async (req: Request, res: Response) => {

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
    //         let do_notif_result: boolean = (
    //             (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) &&
    //             (!!notif_result_uid) &&
    //             (!!notif_result_tab_id));

    //         // On check aussi qu'on a bien un socket à date si on doit notif
    //         do_notif_result = do_notif_result && (
    //             (!!PushDataServerController.registeredSockets) &&
    //             (!!PushDataServerController.registeredSockets[notif_result_uid]) &&
    //             (!!PushDataServerController.registeredSockets[notif_result_uid][notif_result_tab_id]));

    //         let api_call_id = null;

    //         try {
    //             StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name);
    //             const date_in_ms = Dates.now_ms();

    //             // Si on répond en notif, on commence par dire OK au client, avant de gérer vraiment la demande
    //             if (do_notif_result) {
    //                 api_call_id = ++ModuleAPIServer.API_CALL_ID;
    //                 const notif_result = APINotifTypeResultVO.createNew(
    //                     api_call_id,
    //                     null
    //                 );

    //                 res.json(APIControllerWrapper.try_translate_vo_to_api(notif_result));
    //             }

    //             if (api.needs_response_param) {
    //                 await StackContext.runPromise(
    //                     await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession),
    //                     async () => {
    //                         if (has_params && params && params.length) {
    //                             returnvalue = await api.SERVER_HANDLER(...params, req, res);
    //                         } else {
    //                             returnvalue = await api.SERVER_HANDLER(req, res);
    //                         }
    //                     });
    //             } else {
    //                 returnvalue = await this.exec_api_on_bg_thread(
    //                     await ServerExpressController.getInstance().getStackContextFromReq(req, req.session as IServerUserSession, true),
    //                     api.api_name,
    //                     has_params,
    //                     ...params);
    //             }

    //             // /**
    //             //  * DELETE ME :IN: Juste pour un TEST
    //             //  */
    //             // ConsoleHandler.log("DELETE ME : Juste pour un TEST:IN:" + api.api_name);
    //             // await ThreadHandler.sleep(2000, 'DELETE ME : Juste pour un TEST');
    //             // ConsoleHandler.log("DELETE ME : Juste pour un TEST:OUT:" + api.api_name);
    //             // /**
    //             //  * DELETE ME :OUT: Juste pour un TEST
    //             //  */

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

    //         switch (api.api_return_type) {
    //             case APIDefinition.API_RETURN_TYPE_NOTIF:
    //                 if (do_notif_result) {
    //                     await this.try_send_notif_result(
    //                         notif_result_uid,
    //                         notif_result_tab_id,
    //                         api_call_id,
    //                         returnvalue,
    //                     );
    //                     return;
    //                 }

    //                 returnvalue = APIControllerWrapper.try_translate_vo_to_api(APINotifTypeResultVO.createNew(
    //                     null,
    //                     returnvalue
    //                 ));
    //                 break;

    //             case APIDefinition.API_RETURN_TYPE_JSON:
    //             case APIDefinition.API_RETURN_TYPE_FILE:
    //                 returnvalue = APIControllerWrapper.try_translate_vo_to_api(returnvalue);
    //                 break;
    //         }

    //         res.json(returnvalue);
    //     };
    // }

    private respond_on_error<T, U>(api: APIDefinition<T, U>, res: Response) {
        switch (api.api_return_type) {
            case APIDefinition.API_RETURN_TYPE_JSON:
            case APIDefinition.API_RETURN_TYPE_FILE:
                res.json(null);
                return;
            // case APIDefinition.API_RETURN_TYPE_RES:
            default:
                res.end(null);
                return;
        }
    }

    private async try_send_notif_result(
        notif_result_uid: number,
        notif_result_tab_id: string,
        api_call_id: number,
        returnvalue: any,
    ) {

        // Tant qu'on a pas de socket avec cette tab à date, on attend sagement.
        // On informe quand même au bout de 10 secondes en console et toutes les minutes par la suite en console
        //  dans le cas où on aurait toujours pas de socket pour informer d'un pb problème
        let i = 0;
        let timeout = 18; // 3 minutes sans accès au socket, on bloque l'API et on logue

        while (
            (!PushDataServerController.registeredSockets) ||
            (!PushDataServerController.registeredSockets[notif_result_uid]) ||
            (!PushDataServerController.registeredSockets[notif_result_uid][notif_result_tab_id])
        ) {

            if (i == 0) {
                ConsoleHandler.warn('Waiting for socket to send notif result:' + notif_result_uid + ':' + notif_result_tab_id);
            } else if (i % 6 == 0) {
                ConsoleHandler.log('Still waiting for socket to send notif result:' + notif_result_uid + ':' + notif_result_tab_id + ':' + i + ' * 10s - Probable deadlock');
            }

            await ThreadHandler.sleep(10000, 'Waiting for socket to send notif result:' + notif_result_uid + ':' + notif_result_tab_id);
            i++;

            if (i >= timeout) {
                ConsoleHandler.error('Timeout waiting for socket to send notif result:' + notif_result_uid + ':' + notif_result_tab_id + ':' + i + ' * 10s - Probable deadlock - ABORTING');
                return;
            }
        }

        await PushDataServerController.notifyAPIResult(
            notif_result_uid,
            notif_result_tab_id,
            api_call_id,
            returnvalue,
        );
    }

    private async exec_api_on_bg_thread(
        scope_overloads: any,
        api_name: string,
        has_params: boolean,
        ...params: any
    ) {

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                APIBGThread.BGTHREAD_name,
                ModuleAPIServer.EXEC_ON_API_BGTHREAD_TASK_UID,
                resolve,
                scope_overloads,
                api_name,
                has_params,
                ...params)) {
                return;
            }

            try {
                const api: APIDefinition<any, any> = APIControllerWrapper.registered_apis[api_name];
                resolve(await StackContext.runPromise(
                    scope_overloads,
                    async () => {
                        if (has_params && params && params.length) {
                            return await api.SERVER_HANDLER(...params);
                        } else {
                            return await api.SERVER_HANDLER();
                        }
                    }));

            } catch (error) {
                ConsoleHandler.error(error);
                reject(error);
            }
        });
    }
}