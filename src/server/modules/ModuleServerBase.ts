/* istanbul ignore file: nothing to test */

import { Express } from 'express';
import IModuleBase from '../../shared/modules/IModuleBase';
import Module from '../../shared/modules/Module';
import ModulesManager from '../../shared/modules/ModulesManager';

export default abstract class ModuleServerBase implements IModuleBase {

    public static SERVER_MODULE_ROLE_NAME: string = "SERVER_MODULE_ROLE_NAME";

    constructor(public name: string) {
        ModulesManager.getInstance().registerModule(ModuleServerBase.SERVER_MODULE_ROLE_NAME, this);
    }

    get actif(): boolean {
        let shared_module = this.shared_module;
        return shared_module ? shared_module.actif : false;
    }

    get shared_module(): Module {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module;
    }

    public registerApis() { }

    public initialize() { }
    public registerExpressApis(app: Express): void { }
    public async registerAccessPolicies(is_generator: boolean = false): Promise<void> { }
    public async registerAccessRoles(): Promise<void> { }
    public registerCrons(): void { }
    public registerAccessHooks(): void { }
    public registerServerApiHandlers(): void { }
    public async configure(): Promise<void> { }
    public async registerImport(): Promise<void> { }

    /**
     * Called after all modules have been configured and initialized
     */
    public async late_configuration(): Promise<void> { }
}