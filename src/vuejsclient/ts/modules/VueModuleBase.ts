import Module from "../../../shared/modules/Module";
import ModulesManager from "../../../shared/modules/ModulesManager";
import { RouteConfig } from "vue-router/types/router";
import IVueModule from './IVueModule';

export default abstract class VueModuleBase implements IVueModule {

    public static IVueModuleRoleName: string = "IVueModule";

    public routes: RouteConfig[];

    protected constructor(public name: string) {
        this.routes = [];
        ModulesManager.getInstance().registerModule(VueModuleBase.IVueModuleRoleName, this);
    }

    get actif(): boolean {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) ? ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName).actif : false;
    }

    public registerApis() { }
    public initialize() { }
}