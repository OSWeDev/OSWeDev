import { Application, Request, Response } from 'express';
import zlib from 'zlib';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import IAPIParamTranslator from '../../../shared/modules/API/interfaces/IAPIParamTranslator';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
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
import { RunsOnBgThread } from '../BGThread/annotations/RunsOnBGThread';
import { RunsOnMainThread } from '../BGThread/annotations/RunsOnMainThread';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import ServerAPIController from './ServerAPIController';
import APIBGThread from './bgthreads/APIBGThread';
import APIAccessDenied from './exceptions/APIAccessDenied';
import APIGunZipError from './exceptions/APIGunZipError';
import APIParamTranslatorError from './exceptions/APIParamTranslatorError';
import APIServerHandlerError from './exceptions/APIServerHandlerError';
import APICallResWrapper from './vos/APICallResWrapper';

export default class ModuleAPIServer extends ModuleServerBase {

    private static EXEC_API_ON_BGTHREAD_TASK_UID: string = 'ModuleAPIServer.EXEC_API_ON_BGTHREAD_TASK_UID';
    private static API_CALL_ID: number = 0;
    private static instance: ModuleAPIServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAPI.getInstance().name);

        ForkedTasksController.register_task(ModuleAPIServer.EXEC_API_ON_BGTHREAD_TASK_UID, this.exec_api.bind(this));
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAPIServer.instance) {
            ModuleAPIServer.instance = new ModuleAPIServer();
        }
        return ModuleAPIServer.instance;
    }

    @RunsOnMainThread(ModuleAPIServer.getInstance)
    private async get_do_notif_result(call_id: number): Promise<boolean> {
        return ServerAPIController.api_calls[call_id]?.do_notif_result;
    }

    /**
     * Quand on renvoit le résultat en notif, on doit le faire depuis le thread principal
     * @param notif_result_uid
     * @param notif_result_tab_id
     * @param api_call_id
     * @param returnvalue
     * @returns
     */
    @RunsOnMainThread(ModuleAPIServer.getInstance)
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

    /**
     * INFO : et on peut lancer en local si le bgthread est pas encore dispo
     * @param api_name
     * @param session_id
     * @param sid
     * @param uid
     * @param request_method
     * @param request_body
     * @param request_headers
     * @param request_params
     * @param notif_result_uid
     * @param notif_result_tab_id
     * @param api_call_id
     * @returns
     */
    @RunsOnBgThread(APIBGThread.BGTHREAD_name, ModuleAPIServer.getInstance, true)
    private async exec_api<T, U>(
        api_name: string,
        session_id: string,
        sid: string,
        uid: number,
        request_method: string,
        request_body: any,
        request_headers: any,
        request_params: any,
        notif_result_uid: number,
        notif_result_tab_id: string,
        api_call_id: number
    ): Promise<U> {

        const api: APIDefinition<T, U> = APIControllerWrapper.registered_apis[api_name];

        if (api.access_policy_name) {
            if (!AccessPolicyServerController.checkAccessSync(api.access_policy_name)) {
                ConsoleHandler.error('Access denied to API:' + api.api_name + ':sid:' + sid + ":uid:" + uid);
                StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'access_denied_api', api.api_name);
                throw new APIAccessDenied(api, uid);
            }
        }

        let param: IAPIParamTranslator<T> = null;
        let has_params = false;

        if (
            ((api.api_type == APIDefinition.API_TYPE_POST) && (request_body)) ||
            ((api.api_type == APIDefinition.API_TYPE_POST_FOR_GET) && (request_body))
        ) {
            let req_body: any = request_body;

            if (ConfigurationService.node_configuration.compress) {
                // Si je suis en compresse, je vais recevoir mes POST en gzip (BLOB)
                // Du coup, il faut que je unzip pour récupérer au bon format
                if (request_method === 'POST' && request_headers[AjaxCacheController.HEADER_GZIP] === 'true') {

                    // Décompresse les données gzipées
                    try {
                        const decoded = zlib.gunzipSync(Buffer.from(req_body));

                        // Utilisez les données décompressées ici
                        // ConsoleHandler.log("gunzipSync :: " + decoded.toString());
                        req_body = JSON.parse(decoded.toString());
                    } catch (e) {
                        ConsoleHandler.error("gunzipSync :: " + e);

                        throw new APIGunZipError(e, api, uid);
                    }
                }
            }

            // param = APIControllerWrapper.try_translate_vo_from_api(req_body);
            param = ObjectHandler.reapply_prototypes(req_body, true);

            has_params = ObjectHandler.hasAtLeastOneAttribute(req_body);
        } else if (api.param_translator && api.param_translator.fromREQ) {
            try {
                has_params = ObjectHandler.hasAtLeastOneAttribute(request_params);
                param = api.param_translator.fromREQ({
                    body: request_body,
                    params: request_params,
                    headers: request_headers,
                } as Request);
            } catch (error) {
                StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'createApiRequestHandler', 'param_translator.fromREQ');
                ConsoleHandler.error(error);
                throw new APIParamTranslatorError(error, api, uid);
            }
        }

        const params = (param && api.param_translator) ? api.param_translator.getAPIParams(param) : [param];
        let returnvalue = null;

        try {
            StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name);
            const date_in_ms = Dates.now_ms();

            // const session = new Proxy(
            //     {
            //         sid: sid,
            //         id: session_id,
            //         uid: uid,
            //     },
            //     {
            //         get(target, prop) {
            //             if (prop === 'sid' || prop === 'id' || prop === 'uid') {
            //                 return target[prop as keyof typeof target];
            //             }
            //             throw new Error(
            //                 "Accessing 'session members' is not allowed, if not sid/uid/id. If you need data from the expressSession load the VO using ExpressDBSessionsServerController.get_session_from_db. If you need to update the express session itself, use PushDataServerController.getSessionBySid from the MainThread."
            //             );
            //         },
            //     }
            // );
            const session = {
                sid: sid,
                id: session_id,
                uid: uid,
            };

            const req: Request = {
                body: request_body,
                params: request_params,
                headers: request_headers,
                method: request_method,
                session: session,
            } as unknown as Request;

            // Par défaut, params est un tableau vide si aucun paramètre n'est passé
            const safeParams = (has_params && params && params.length) ? params : [];
            safeParams.push(req);
            safeParams.push(api_call_id); // On change le dernier paramètre pour ajouter l'api_call_id qui permet via this.send_redirect de renvoyer une redirection (ou d'accéder au res sur le main thread pour cette api)

            returnvalue = await StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, session_id, sid, uid),
                api.SERVER_HANDLER,
                null,
                ...safeParams,
            );

            StatsController.register_stat_DUREE('ModuleAPIServer', 'api.SERVER_HANDLER', api.api_name, Dates.now_ms() - date_in_ms);
        } catch (error) {
            ConsoleHandler.error(error);
            StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER.ERROR', api.api_name);
            throw new APIServerHandlerError(error, api, uid);
        }

        // On doit demander l'état de do_notif_result de l'API, pour récupérer la version à jour
        const do_notif_result = await this.get_do_notif_result(api_call_id);

        // if (!do_notif_result) {
        //     // Si les headers sont déjà envoyés, on a plus rien à faire ici
        //     return;
        // }

        // if (
        //     (api.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
        //     (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF)) {
        //     if (typeof returnvalue == 'undefined') {
        //         returnvalue = {} as any;
        //     }
        // }

        // switch (api.api_return_type) {
        //     case APIDefinition.API_RETURN_TYPE_NOTIF:
        //         if (do_notif_result) {
        //             await this.try_send_notif_result(
        //                 notif_result_uid,
        //                 notif_result_tab_id,
        //                 api_call_id,
        //                 returnvalue,
        //             );
        //             return;
        //         }

        //         // return APIControllerWrapper.try_translate_vo_to_api(APINotifTypeResultVO.createNew(
        //         //     null,
        //         //     returnvalue
        //         // ));
        //         return APINotifTypeResultVO.createNew(
        //             null,
        //             returnvalue
        //         ) as unknown as U;

        //     case APIDefinition.API_RETURN_TYPE_JSON:
        //     case APIDefinition.API_RETURN_TYPE_FILE:
        //         // return APIControllerWrapper.try_translate_vo_to_api(returnvalue);
        //         return returnvalue as unknown as U;
        // }

        // return returnvalue;
        // // res.json(returnvalue);


        if (do_notif_result) {

            if (typeof returnvalue == 'undefined') {
                returnvalue = {} as any;
            }
            await this.try_send_notif_result(
                notif_result_uid,
                notif_result_tab_id,
                api_call_id,
                returnvalue,
            );
            return;
        }

        switch (api.api_return_type) {
            case APIDefinition.API_RETURN_TYPE_NOTIF:
                if (typeof returnvalue == 'undefined') {
                    returnvalue = {} as any;
                }

                return APINotifTypeResultVO.createNew(
                    api_call_id,
                    returnvalue
                ) as unknown as U;

            case APIDefinition.API_RETURN_TYPE_JSON:
            case APIDefinition.API_RETURN_TYPE_FILE:
                return returnvalue as unknown as U;
        }

        return returnvalue;
    }

    public async configure(): Promise<void> {
        ModuleBGThreadServer.getInstance().registerBGThread(APIBGThread.getInstance());
    }

    public registerExpressApis(app: Application): void {

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
                    // if (api.csrf_protection) {
                    //     // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    //     app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrf_protection, (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    // } else {
                    // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    // }
                    break;
                case APIDefinition.API_TYPE_POST_FOR_GET:
                    // ConsoleHandler.log("AJOUT API POST FOR GET :" + APIControllerWrapper.getAPI_URL(api).toLowerCase());
                    // if (api.csrf_protection) {
                    //     // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrfProtection, this.createApiRequestHandler(api).bind(this));
                    //     app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), ServerBase.getInstance().csrf_protection, (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    // } else {
                    // app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), this.createApiRequestHandler(api).bind(this));
                    app.post(APIControllerWrapper.getAPI_URL(api).toLowerCase(), (req: Request, res: Response) => this.api_request_handler(api, req, res));
                    // }
                    break;
            }
        }
        StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'registerExpressApis', 'OUT');
        StatsController.register_stat_DUREE('ModuleAPIServer', 'registerExpressApis', 'OUT', Dates.now_ms() - time_in);
    }

    private async api_request_handler<T, U>(api: APIDefinition<T, U>, req: Request, res: Response): Promise<void> {

        const notif_result_uid: number = req.session.uid;
        const notif_result_tab_id: string = req.headers.client_tab_id as string;
        const api_call_id = ++ModuleAPIServer.API_CALL_ID;
        let do_notif_result: boolean = (
            (api.api_return_type == APIDefinition.API_RETURN_TYPE_NOTIF) &&
            (!!notif_result_uid) &&
            (!!notif_result_tab_id));
        const can_notif_result =
            (!!PushDataServerController.registeredSockets) &&
            (!!PushDataServerController.registeredSockets[notif_result_uid]) &&
            (!!PushDataServerController.registeredSockets[notif_result_uid][notif_result_tab_id]);

        try {

            // On check aussi qu'on a bien un socket à date si on doit notif
            do_notif_result = do_notif_result && can_notif_result;

            // Si on répond en notif, on commence par dire OK au client, avant de gérer vraiment la demande
            if (do_notif_result) {
                const notif_result = APINotifTypeResultVO.createNew(
                    api_call_id,
                    null
                );

                // res.json(APIControllerWrapper.try_translate_vo_to_api(notif_result));
                res.json(notif_result);
            }
        } catch (error) {
            ConsoleHandler.error(error);
            this.respond_on_error(api, res);
            return;
        }

        try {
            let api_res = null;

            const api_call_promise = StackContext.runPromise(
                await ServerExpressController.getInstance().getStackContextFromReq(req, req.session.id, req.session.sid, req.session.uid),
                this.exec_api,
                this,
                api.api_name,
                req.session.id,
                req.session.sid,
                req.session.uid,
                req.method,
                req.body,
                req.headers,
                req.params,
                notif_result_uid,
                notif_result_tab_id,
                api_call_id,
            );
            ServerAPIController.api_calls[api_call_id] = new APICallResWrapper(
                api_call_id,
                api.api_name,
                res,
                api_call_promise,
                do_notif_result,
                can_notif_result,
                notif_result_uid,
                notif_result_tab_id,
            );

            api_res = await api_call_promise;

            // api_res = await this.exec_api(
            //     api.api_name,
            //     req.session.id,
            //     req.session.sid,
            //     req.session.uid,
            //     req.method,
            //     req.body,
            //     req.headers,
            //     req.params,
            //     do_notif_result,
            //     notif_result_uid,
            //     notif_result_tab_id,
            //     api_call_id,
            // );

            if (!(res && res.headersSent) && !ServerAPIController.api_calls[api_call_id].do_notif_result) {

                if ((api_res == null) || (api_res === "")) {
                    res.end();
                } else {
                    res.json(api_res);
                }
            }

            delete ServerAPIController.api_calls[api_call_id];
        } catch (error) {
            switch (error._type) {
                case APIAccessDenied.ERROR_TYPE:
                    ConsoleHandler.error(error);
                    this.respond_on_error(api, res);
                    return;

                case APIGunZipError.ERROR_TYPE:
                    res.writeHead(500);
                    res.end();
                    return;

                case APIParamTranslatorError.ERROR_TYPE:
                    ConsoleHandler.error(error);
                    this.respond_on_error(api, res);
                    return;

                case APIServerHandlerError.ERROR_TYPE:
                    ConsoleHandler.error(error);
                    this.respond_on_error(api, res);
                    return;

                default:
                    ConsoleHandler.error(error);
                    this.respond_on_error(api, res);
            }
        }
    }

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
}