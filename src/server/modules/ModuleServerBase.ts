import { Express } from 'express';
import ModulesManager from '../../shared/modules/ModulesManager';
import IModuleBase from '../../shared/modules/IModuleBase';
import Module from '../../shared/modules/Module';

/* istanbul ignore next: nothing to test */
export default abstract class ModuleServerBase implements IModuleBase {

    public static SERVER_MODULE_ROLE_NAME: string = "SERVER_MODULE_ROLE_NAME";

    constructor(public name: string) {
        ModulesManager.getInstance().registerModule(ModuleServerBase.SERVER_MODULE_ROLE_NAME, this);
    }

    get actif(): boolean {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) ? ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName).actif : false;
    }

    public registerApis() { }

    public initialize() { }
    public registerExpressApis(app: Express): void { }
    public async registerAccessPolicies(): Promise<void> { }
    public async registerAccessRoles(): Promise<void> { }
    public registerCrons(): void { }
    public registerAccessHooks(): void { }
    public registerServerApiHandlers(): void { }
    public async configure(): Promise<void> { }
    public async registerImport(): Promise<void> { }
}