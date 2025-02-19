import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import ModuleAjaxCache from '../../../shared/modules/AjaxCache/ModuleAjaxCache';
import LightWeightSendableRequestVO from '../../../shared/modules/AjaxCache/vos/LightWeightSendableRequestVO';
import RequestResponseCacheVO from '../../../shared/modules/AjaxCache/vos/RequestResponseCacheVO';
import RequestsWrapperResult from '../../../shared/modules/AjaxCache/vos/RequestsWrapperResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../shared/modules/Stats/StatsController';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleAjaxCacheServer extends ModuleServerBase {

    private static instance: ModuleAjaxCacheServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAjaxCache.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAjaxCacheServer.instance) {
            ModuleAjaxCacheServer.instance = new ModuleAjaxCacheServer();
        }
        return ModuleAjaxCacheServer.instance;
    }


    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleAjaxCache.APINAME_REQUESTS_WRAPPER, this.requests_wrapper.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAjaxCache.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Cache de requêtes'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        fo_access.translatable_name = ModuleAjaxCache.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Configuration sur le front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    // /**
    //  * FIXME DELETE ME DEBUG ONLY JNE
    //  */
    // private static requests_wrapper_uid: number = 0;
    // /**
    //  * !FIXME DELETE ME DEBUG ONLY JNE
    //  */


    public async requests_wrapper(requests: LightWeightSendableRequestVO[], req: Request): Promise<RequestsWrapperResult> {

        // /**
        //  * FIXME DELETE ME DEBUG ONLY JNE
        //  */
        // const uid = ModuleAjaxCacheServer.requests_wrapper_uid++;
        // let puid = 0;
        // if (!StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE)) {
        //     StackContext['set']('REQUEST_WRAPPER_UID', uid);
        // }
        // ConsoleHandler.log('requests_wrapper:IN:' + uid + ':' + JSON.stringify(StackContext.get_active_context()));
        // /**
        //  * FIXME DELETE ME DEBUG ONLY JNE
        //  */

        // /**
        //  * ! FIXME DELETE ME DEBUG ONLY JNE
        //  */

        const res: RequestsWrapperResult = new RequestsWrapperResult();
        res.requests_results = {};

        // On tente sans promise pipeline par ce qu'en réalité je suis pas sur de l'intéret ici. On promisepipeline les appels à la base de données, mais pas les appels à des APIs
        // à creuser. En l'occurrence ce pipeline explose bien avant celui des requetes en base de données.
        // const limit = ConfigurationService.node_configuration.max_pool / 2;
        // const promise_pipeline = PromisePipeline.get_semaphore_pipeline('ModuleAjaxCacheServer.requests_wrapper', limit);

        // JNE 19/02/2025 : On repasse en PromisePipeline, par ce que le maintien du StackContext est ok en PromisePipeline et pas en Promise[]...
        // const promises = [];
        const promise_pipeline = new PromisePipeline(0, null); // on ne limite pas le pipeline et on ne log/stat rien

        for (const i in requests) {
            const wrapped_request: LightWeightSendableRequestVO = requests[i];

            if (!wrapped_request) {
                continue;
            }

            await promise_pipeline.push(async () => {
                // promises.push((async () => {
                // await promise_pipeline.push(async () => {

                // /**
                //  * FIXME DELETE ME DEBUG ONLY JNE
                //  */
                // const this_puid = puid++;
                // if (!StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE)) {
                //     StackContext['set']('REQUEST_WRAPPER_PUID', this_puid);
                // }
                // ConsoleHandler.log('requests_wrapper:promise_pipeline:IN:' + uid + ':' + this_puid + ':' + wrapped_request.url + ':' + JSON.stringify(StackContext.get_active_context()));
                // /**
                //  * ! FIXME DELETE ME DEBUG ONLY JNE
                //  */

                let apiDefinition: APIDefinition<any, any> = null;

                for (const j in APIControllerWrapper.registered_apis) {
                    // Find the registered API
                    const registered_api = APIControllerWrapper.registered_apis[j];
                    if (APIControllerWrapper.requestUrlMatchesApiUrl(wrapped_request.url, APIControllerWrapper.getAPI_URL(registered_api))) {
                        apiDefinition = registered_api;
                        break;
                    }
                }

                if (!apiDefinition) {
                    ConsoleHandler.error('API introuvable:' + wrapped_request.url);
                    res.requests_results[wrapped_request.index] = null;
                    return null;
                }

                if (apiDefinition.access_policy_name) {
                    if (!AccessPolicyServerController.checkAccessSync(apiDefinition.access_policy_name)) {
                        const session: IServerUserSession = (req as any).session;
                        ConsoleHandler.error('Access denied to API:' + apiDefinition.api_name + ':' + ' sessionID:' + (req as any).sessionID + ": UID:" + (session ? session.uid : "null") + ":");
                        res.requests_results[wrapped_request.index] = null;
                        return null;
                    }
                }

                let param = null;

                switch (wrapped_request.type) {
                    case RequestResponseCacheVO.API_TYPE_GET:
                        if (apiDefinition.param_translator && apiDefinition.param_translator.fromREQ) {
                            // Il faut un objet request.params à ce niveau avec chaque param séparé si c'est possible.
                            //
                            param = apiDefinition.param_translator.fromREQ(
                                APIControllerWrapper.getFakeRequestParamsFromUrl(
                                    wrapped_request.url,
                                    APIControllerWrapper.getAPI_URL(apiDefinition)));
                        }
                        break;

                    case RequestResponseCacheVO.API_TYPE_POST_FOR_GET:
                        try {
                            param = (wrapped_request.postdatas && ObjectHandler.try_is_json(wrapped_request.postdatas)) ? ObjectHandler.try_get_json(wrapped_request.postdatas) : wrapped_request.postdatas;
                            // On doit traduire ici ce qui ne l'a pas été puisque encodé en JSON
                            // param = APIControllerWrapper.try_translate_vo_from_api(param);
                            param = ObjectHandler.reapply_prototypes(param, true);
                        } catch (error) {
                            ConsoleHandler.error('Erreur récupération params post_for_get wrapped:' + error + ':');
                        }
                }

                const params = (param && apiDefinition.param_translator) ? apiDefinition.param_translator.getAPIParams(param) : [param];
                try {

                    StatsController.register_stat_COMPTEUR('ModuleAPIServer', 'api.SERVER_HANDLER', apiDefinition.api_name);
                    const date_in_ms = Dates.now_ms();

                    const api_res = await apiDefinition.SERVER_HANDLER(...params);
                    res.requests_results[wrapped_request.index] = (typeof api_res === 'undefined') ? null : api_res;

                    StatsController.register_stat_DUREE('ModuleAPIServer', 'api.SERVER_HANDLER', apiDefinition.api_name, Dates.now_ms() - date_in_ms);
                } catch (error) {
                    const session: IServerUserSession = (req as any).session;
                    ConsoleHandler.error('Erreur API:requests_wrapper:' + apiDefinition.api_name + ':' + ' sessionID:' + (req as any).sessionID + ": UID:" + (session ? session.uid : "null") + ":error:" + error + ':');
                    res.requests_results[wrapped_request.index] = null;
                }

                // /**
                //  * FIXME DELETE ME DEBUG ONLY JNE
                //  */
                // ConsoleHandler.log('requests_wrapper:promise_pipeline:OUT:' + uid + ':' + this_puid + ':' + wrapped_request.url + ':' + JSON.stringify(StackContext.get_active_context()));
                // /**
                //  * ! FIXME DELETE ME DEBUG ONLY JNE
                //  */

                // });
                // })());
            });
        }

        await promise_pipeline.end();
        // await all_promises(promises);

        // /**
        //  * FIXME DELETE ME DEBUG ONLY JNE
        //  */
        // ConsoleHandler.log('requests_wrapper:OUT:' + uid + ':' + JSON.stringify(StackContext.get_active_context()));
        // /**
        //  * ! FIXME DELETE ME DEBUG ONLY JNE
        //  */

        return res;
    }
}