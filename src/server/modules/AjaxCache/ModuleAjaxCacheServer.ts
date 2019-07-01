import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleAjaxCache from '../../../shared/modules/AjaxCache/ModuleAjaxCache';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import RequestResponseCacheVO from '../../../shared/modules/AjaxCache/vos/RequestResponseCacheVO';
import RequestsWrapperResult from '../../../shared/modules/AjaxCache/vos/RequestsWrapperResult';
import ModuleAPIServer from '../API/ModuleAPIServer';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';

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

    public async requests_wrapper(request_urls: string[]): Promise<RequestsWrapperResult> {

        let res: RequestsWrapperResult = new RequestsWrapperResult();
        res.requests_results = {};

        for (let i in request_urls) {
            let request_url: string = request_urls[i];

            let apiDefinition: APIDefinition<any, any> = null;

            for (let j in ModuleAPI.getInstance().registered_apis) {
                let registered_api = ModuleAPI.getInstance().registered_apis[j];
                if (ModuleAPI.getInstance().requestUrlMatchesApiUrl(request_url, ModuleAPI.getInstance().getAPI_URL(registered_api))) {
                    apiDefinition = registered_api;
                    break;
                }
            }

            if (!apiDefinition) {
                console.error('API introuvable:' + request_url + ':');
                break;
            }

            let param = null;
            if (!!apiDefinition.PARAM_TRANSLATE_FROM_REQ) {
                // Il faut un objet request.params à ce niveau avec chaque param séparé si c'est possible.
                //
                param = await apiDefinition.PARAM_TRANSLATE_FROM_REQ(ModuleAPI.getInstance().getFakeRequestParamsFromUrl(
                    request_url,
                    ModuleAPI.getInstance().getAPI_URL(apiDefinition)));
            }

            res.requests_results[request_url] = await apiDefinition.SERVER_HANDLER(param);
        }

        return res;
    }
}