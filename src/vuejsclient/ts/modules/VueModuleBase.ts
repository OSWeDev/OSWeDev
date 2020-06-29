import Module from "../../../shared/modules/Module";
import ModulesManager from "../../../shared/modules/ModulesManager";
import { RouteConfig } from "vue-router/types/router";
import IVueModule from './IVueModule';

export default abstract class VueModuleBase implements IVueModule {

    public static IVueModuleRoleName: string = "IVueModule";

    public routes: RouteConfig[];

    protected constructor(public name: string) {

        if (!this.actif) {
            return;
        }

        this.routes = [];
        // L'initialisation est appelée dans le register directement
        ModulesManager.getInstance().registerModule(VueModuleBase.IVueModuleRoleName, this);
    }

    get actif(): boolean {
        let shared_module = this.shared_module;
        return shared_module ? shared_module.actif : false;
    }

    get shared_module(): Module {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module;
    }

    public registerApis() { }
    public initialize(): void { }
    public async initializeAsync(): Promise<void> { }
}