import AccessPolicyTools from '../../tools/AccessPolicyTools';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import LightWeightSendableRequestVO from './vos/LightWeightSendableRequestVO';



export default class ModuleAjaxCache extends Module {

    public static MODULE_NAME: string = "AjaxCache";

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAjaxCache.MODULE_NAME;

    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAjaxCache.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_REQUESTS_WRAPPER: string = "REQUESTS_WRAPPER";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAjaxCache {
        if (!ModuleAjaxCache.instance) {
            ModuleAjaxCache.instance = new ModuleAjaxCache();
        }
        return ModuleAjaxCache.instance;
    }

    private static instance: ModuleAjaxCache = null;

    private constructor() {

        super("ajax_cache", ModuleAjaxCache.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<LightWeightSendableRequestVO[], LightWeightSendableRequestVO>(
            null,
            ModuleAjaxCache.APINAME_REQUESTS_WRAPPER,
            []
        ));
    }
}