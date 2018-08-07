import ModulesManager from "../../../../shared/modules/ModulesManager";
import { RouteConfig } from "vue-router/types/router";
import VueModuleBase from '../../../ts/modules/VueModuleBase';


export default class AjaxCacheVueModule extends VueModuleBase {

    public static getInstance() {
        if (!AjaxCacheVueModule.instance) {
            AjaxCacheVueModule.instance = new AjaxCacheVueModule();
        }

        return AjaxCacheVueModule.instance;
    }

    private static instance: AjaxCacheVueModule = null;

    public routes: RouteConfig[] = [];
    public name: string;

    private constructor() {
        super("ajax_cache");
        ModulesManager.getInstance().registerModule(VueModuleBase.IVueModuleRoleName, this);
    }
}