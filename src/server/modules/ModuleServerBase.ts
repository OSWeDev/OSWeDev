/* istanbul ignore file: nothing to test */

import { Application } from 'express';
import IModuleBase from '../../shared/modules/IModuleBase';
import Module from '../../shared/modules/Module';
import ModulesManager from '../../shared/modules/ModulesManager';

export default abstract class ModuleServerBase implements IModuleBase {

    /**
     * @deprecated use Module.ServerModuleRoleName instead
     */
    public static SERVER_MODULE_ROLE_NAME: string = "SERVER_MODULE_ROLE_NAME";

    constructor(public name: string) {
        ModulesManager.registerModule(Module.ServerModuleRoleName, this);
    }

    get actif(): boolean {
        const shared_module = this.shared_module;
        return shared_module ? shared_module.actif : false;
    }

    get shared_module(): Module {
        return ModulesManager.getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module;
    }

    public registerApis() { }

    public initialize() { }
    public registerExpressApis(app: Application): void { }
    public async registerAccessPolicies(is_generator: boolean = false): Promise<void> { }
    public async registerAccessRoles(): Promise<void> { }
    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerCrons(): void { }
    // istanbul ignore next: cannot test registerAccessHooks
    public registerAccessHooks(): void { }
    public registerServerApiHandlers(): void { }
    public async configure(): Promise<void> { }
    public async registerImport(): Promise<void> { }

    /**
     * Called after all modules have been configured and initialized
     */
    public async late_configuration(is_generator: boolean): Promise<void> { }
}