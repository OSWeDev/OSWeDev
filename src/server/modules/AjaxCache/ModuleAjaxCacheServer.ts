import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleAjaxCache from '../../../shared/modules/AjaxCache/ModuleAjaxCache';
import LightWeightSendableRequestVO from '../../../shared/modules/AjaxCache/vos/LightWeightSendableRequestVO';
import RequestResponseCacheVO from '../../../shared/modules/AjaxCache/vos/RequestResponseCacheVO';
import RequestsWrapperResult from '../../../shared/modules/AjaxCache/vos/RequestsWrapperResult';
import APIController from '../../../shared/modules/API/APIController';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../shared/tools/EnvHandler';
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
        ModuleAPI.getInstance().registerServerApiHandler(ModuleAjaxCache.APINAME_REQUESTS_WRAPPER, this.requests_wrapper.bind(this));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleAjaxCache.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Cache de requêtes'
        }));

        let fo_access: AccessPolicyVO = new AccessPolicyVO();
        fo_access.group_id = group.id;
        fo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        fo_access.translatable_name = ModuleAjaxCache.POLICY_FO_ACCESS;
        fo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(fo_access, new DefaultTranslation({
            fr: 'Configuration sur le front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async requests_wrapper(requests: LightWeightSendableRequestVO[]): Promise<RequestsWrapperResult> {

        let res: RequestsWrapperResult = new RequestsWrapperResult();
        res.requests_results = {};

        let promises = [];

        for (let i in requests) {
            let wrapped_request: LightWeightSendableRequestVO = requests[i];

            promises.push((async () => {

                let apiDefinition: APIDefinition<any, any> = null;

                for (let j in ModuleAPI.getInstance().registered_apis) {
                    let registered_api = ModuleAPI.getInstance().registered_apis[j];
                    if (APIController.getInstance().requestUrlMatchesApiUrl(wrapped_request.url, APIController.getInstance().getAPI_URL(registered_api))) {
                        apiDefinition = registered_api;
                        break;
                    }
                }

                if (!apiDefinition) {
                    ConsoleHandler.getInstance().error('API introuvable:' + wrapped_request.url + ':');
                    return;
                }

                let param = null;

                switch (wrapped_request.type) {
                    case RequestResponseCacheVO.API_TYPE_GET:
                        if (!!apiDefinition.PARAM_TRANSLATE_FROM_REQ) {
                            // Il faut un objet request.params à ce niveau avec chaque param séparé si c'est possible.
                            //
                            param = await apiDefinition.PARAM_TRANSLATE_FROM_REQ(APIController.getInstance().getFakeRequestParamsFromUrl(
                                wrapped_request.url,
                                APIController.getInstance().getAPI_URL(apiDefinition)));
                        }
                        break;

                    case RequestResponseCacheVO.API_TYPE_POST_FOR_GET:
                        try {
                            param = ((!EnvHandler.getInstance().MSGPCK) && wrapped_request.postdatas) ? JSON.parse(wrapped_request.postdatas) : wrapped_request.postdatas;
                            // On doit traduire ici si (!EnvHandler.getInstance().MSGPCK) ce qui ne l'a pas été puisque encodé en JSON
                            param = (!EnvHandler.getInstance().MSGPCK) ? APIController.getInstance().try_translate_vo_from_api(param) : param;
                        } catch (error) {
                            ConsoleHandler.getInstance().error('Erreur récupération params post_for_get wrapped:' + error + ':');
                        }
                }

                let api_res = await apiDefinition.SERVER_HANDLER(param);
                res.requests_results[wrapped_request.index] = (typeof api_res === 'undefined') ? null : api_res;

                // if ((apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_JSON) ||
                //     (apiDefinition.api_return_type == APIDefinition.API_RETURN_TYPE_FILE)) {
                //     res.requests_results[wrapped_request.index] = APIController.getInstance().try_translate_vo_to_api(res.requests_results[wrapped_request.index]);
                // }
            })());

        }

        await Promise.all(promises);

        return res;
    }
}