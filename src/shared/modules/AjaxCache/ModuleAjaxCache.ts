import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ConsoleHandler from '../../tools/ConsoleHandler';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import IAjaxCacheClientController from './interfaces/IAjaxCacheClientController';
import LightWeightSendableRequestVO from './vos/LightWeightSendableRequestVO';
import RequestResponseCacheVO from './vos/RequestResponseCacheVO';



export default class ModuleAjaxCache extends Module {

    public static MODULE_NAME: string = "AjaxCache";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAjaxCache.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAjaxCache.MODULE_NAME + ".FO_ACCESS";

    public static MSGPACK_REQUEST_TYPE: string = 'application/x-msgpack; charset=utf-8';

    public static APINAME_REQUESTS_WRAPPER: string = "REQUESTS_WRAPPER";
    public static POST_UID: number = 1;

    public static getInstance(): ModuleAjaxCache {
        if (!ModuleAjaxCache.instance) {
            ModuleAjaxCache.instance = new ModuleAjaxCache();
        }
        return ModuleAjaxCache.instance;
    }

    private static instance: ModuleAjaxCache = null;

    private client_controller: IAjaxCacheClientController = null;

    private constructor() {

        super("ajax_cache", ModuleAjaxCache.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public setAjaxcacheDebouncer(ajaxcache_debouncer: number) {
        if (!!this.client_controller) {
            this.client_controller.ajaxcache_debouncer = ajaxcache_debouncer;
        }
    }

    public setClientController(client_controller: IAjaxCacheClientController) {
        this.client_controller = client_controller;
    }

    public getUIDIndex(url: string, postdatas: any, type: number): string {
        try {
            switch (type) {
                case RequestResponseCacheVO.API_TYPE_GET:
                    return url;
                case RequestResponseCacheVO.API_TYPE_POST_FOR_GET:
                    return url + (postdatas ? '###___###' + JSON.stringify(postdatas) : '');
                case RequestResponseCacheVO.API_TYPE_POST:
                    return url + (postdatas ? '##___##' + (ModuleAjaxCache.POST_UID++) : '');
            }
        } catch (error) {
            ConsoleHandler.getInstance().error('Index impossible à créer:' + url + ':' + postdatas + ':' + error + ':');
        }
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<LightWeightSendableRequestVO[], LightWeightSendableRequestVO>(
            ModuleAjaxCache.APINAME_REQUESTS_WRAPPER,
            []
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public invalidateCachesFromApiTypesInvolved(api_types_involved: string[]) {
        this.client_controller.invalidateCachesFromApiTypesInvolved(api_types_involved);
    }
}