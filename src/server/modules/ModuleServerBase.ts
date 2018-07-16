import { Express } from 'express';
import ModulesManager from '../../shared/modules/ModulesManager';
import IModuleBase from '../../shared/modules/IModuleBase';

export default abstract class ModuleServerBase implements IModuleBase {

    registerApis() {
        throw new Error("Method not implemented.");
    }
    initialize() {
        throw new Error("Method not implemented.");
    }

    public static SERVER_MODULE_ROLE_NAME: string = "SERVER_MODULE_ROLE_NAME";

    constructor(public name: string, public actif: boolean) {
        ModulesManager.getInstance().registerModule(ModuleServerBase.SERVER_MODULE_ROLE_NAME, this);
    }

    public registerExpressApis(app: Express): void { }
    public registerCrons(): void { }
    public registerAccessHooks(): void { }
    public registerServerApiHandlers(): void { }
    public async configure(): Promise<void> { }
}