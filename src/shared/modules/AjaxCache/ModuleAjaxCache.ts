import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import IAjaxCacheClientController from './interfaces/IAjaxCacheClientController';
import LightWeightSendableRequestVO from './vos/LightWeightSendableRequestVO';



export default class ModuleAjaxCache extends Module {

    public static MODULE_NAME: string = "AjaxCache";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAjaxCache.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAjaxCache.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_REQUESTS_WRAPPER: string = "REQUESTS_WRAPPER";

    public static getInstance(): ModuleAjaxCache {
        if (!ModuleAjaxCache.instance) {
            ModuleAjaxCache.instance = new ModuleAjaxCache();
        }
        return ModuleAjaxCache.instance;
    }

    private static instance: ModuleAjaxCache = null;

    /**
     * Local thread cache -----
     *  And probably misplaced since it refers to client....
     */
    private client_controller: IAjaxCacheClientController = null;
    /**
     * ----- Local thread cache
     */

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

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<LightWeightSendableRequestVO[], LightWeightSendableRequestVO>(
            null,
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