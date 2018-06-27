import IModuleBase from "./IModuleBase";
import ModuleWrapper from "./ModuleWrapper";

export default class ModulesManager {

    public static getInstance(): ModulesManager {
        if (!ModulesManager.instance) {
            ModulesManager.instance = new ModulesManager();
        }
        return ModulesManager.instance;
    }

    private static instance: ModulesManager = null;

    public isServerSide: boolean = false;
    private modules_by_name: { [key: string]: ModuleWrapper } = {};

    private constructor() { }

    public registerModule(role: string, module: IModuleBase) {
        if (!module) {
            return;
        }
        if (!this.modules_by_name[module.name]) {
            this.modules_by_name[module.name] = new ModuleWrapper(module.name);
        }
        this.modules_by_name[module.name].addModuleComponent(role, module);
        module.initialize();
        module.registerApis();
    }
    public getModuleByNameAndRole(name: string, role: string) {
        return this.modules_by_name[name] ? this.modules_by_name[name].getModuleComponentByRole(role) : null;
    }
    public getModuleWrapperByName(name: string) {
        return this.modules_by_name[name];
    }
    public getModuleWrappersByName() {
        return this.modules_by_name;
    }
}
