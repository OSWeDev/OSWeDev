import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import ModuleAjaxCache from '../../../shared/modules/AjaxCache/ModuleAjaxCache';
import LightWeightSendableRequestVO from '../../../shared/modules/AjaxCache/vos/LightWeightSendableRequestVO';
import RequestResponseCacheVO from '../../../shared/modules/AjaxCache/vos/RequestResponseCacheVO';
import RequestsWrapperResult from '../../../shared/modules/AjaxCache/vos/RequestsWrapperResult';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../shared/tools/EnvHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleAjaxCacheServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleAjaxCacheServer.instance) {
            ModuleAjaxCacheServer.instance = new ModuleAjaxCacheServer();
        }
        return ModuleAjaxCacheServer.instance;
    }

    private static instance: ModuleAjaxCacheServer = null;

    private constructor() {
        super(ModuleAjaxCache.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleAjaxCache.APINAME_REQUESTS_WRAPPER, this.requests_wrapper.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAjaxCache.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Cache de requêtes'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        fo_access.translatable_name = ModuleAjaxCache.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            'fr-fr': 'Configuration sur le front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async requests_wrapper(requests: LightWeightSendableRequestVO[], response: Response, req: Request): Promise<RequestsWrapperResult> {

        let res: RequestsWrapperResult = new RequestsWrapperResult();
        res.requests_results = {};

        let limit = ConfigurationService.node_configuration.MAX_POOL / 2;
        let promise_pipeline = new PromisePipeline(limit);

        for (let i in requests) {
            let wrapped_request: LightWeightSendableRequestVO = requests[i];

            if (!wrapped_request) {
                continue;
            }

            promise_pipeline.push(async () => {

                let apiDefinition: APIDefinition<any, any> = null;

                for (let j in APIControllerWrapper.registered_apis) {
                    // Find the registered API
                    let registered_api = APIControllerWrapper.registered_apis[j];
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

                if (!!apiDefinition.access_policy_name) {
                    if (!ModuleAccessPolicyServer.getInstance().checkAccessSync(apiDefinition.access_policy_name)) {
                        let session: IServerUserSession = (req as any).session;
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
                            param = (wrapped_request.postdatas) ? JSON.parse(wrapped_request.postdatas) : wrapped_request.postdatas;
                            // On doit traduire ici ce qui ne l'a pas été puisque encodé en JSON
                            param = APIControllerWrapper.try_translate_vo_from_api(param);
                        } catch (error) {
                            ConsoleHandler.error('Erreur récupération params post_for_get wrapped:' + error + ':');
                        }
                }

                let params = (param && apiDefinition.param_translator) ? apiDefinition.param_translator.getAPIParams(param) : [param];
                let api_res = await apiDefinition.SERVER_HANDLER(...params);
                res.requests_results[wrapped_request.index] = (typeof api_res === 'undefined') ? null : api_res;

                // if ((apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
                //     (apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_FILE)) {
                //     res.requests_results[wrapped_request.index] = APIController.getInstance().try_translate_vo_to_api(res.requests_results[wrapped_request.index]);
                // }
            });

        }

        await promise_pipeline.end();

        return res;
    }
}