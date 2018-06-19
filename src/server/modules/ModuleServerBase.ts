import { Express } from 'express';

export default abstract class ModuleServerBase {
    public registerExpressApis(app: Express): void { }
    public registerCrons(): void { }
    public registerAccessHooks(): void { }
    public registerApis(): void { }
    abstract get actif(): boolean;
}