import IModuleBase from "./IModuleBase";

export default class ModuleWrapper {

    private module_components_by_role: { [key: string]: IModuleBase } = {};

    public constructor(public name: string) {
    }

    public addModuleComponent(role: string, moduleComponent: IModuleBase) {
        if ((!role) || (!moduleComponent)) {
            return;
        }
        this.module_components_by_role[role] = moduleComponent;
    }
    public getModuleComponentByRole(role: string) {
        return this.module_components_by_role[role];
    }
    public getModuleComponentsByRole() {
        return this.module_components_by_role;
    }
}