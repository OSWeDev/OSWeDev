import { field_names } from '../tools/ObjectHandler';
import ModuleTableController from './DAO/ModuleTableController';
import ModuleTableFieldController from './DAO/ModuleTableFieldController';
import ModuleTableFieldVO from './DAO/vos/ModuleTableFieldVO';
import IModuleBase from "./IModuleBase";
import Module from './Module';
import ModuleVO from './ModuleVO';
import ModuleWrapper from "./ModuleWrapper";
import DefaultTranslationVO from './Translation/vos/DefaultTranslationVO';

export default class ModulesManager {


    public static isTest: boolean = false;
    public static isGenerator: boolean = false;
    public static isServerSide: boolean = false;

    public static MODULE_PARAM_TABLE_PREFIX: string = "module_";
    public static preloaded_modules_is_actif: { [module_name: string]: boolean } = {};

    /**
     * Local thread cache -----
     */

    public static modules_by_name: { [key: string]: ModuleWrapper } = {};

    /**
     * ----- Local thread cache
     */

    public static initialize() {
    }

    public static registerModule(role: string, moduleObj: IModuleBase) {
        if (!moduleObj) {
            return;
        }
        if (!this.modules_by_name[moduleObj.name]) {
            this.modules_by_name[moduleObj.name] = new ModuleWrapper(moduleObj.name);
        }
        this.modules_by_name[moduleObj.name].addModuleComponent(role, moduleObj);

        // Si on a un actif en base, on le charge, mais uniquement sur le shared
        if ((role == Module.SharedModuleRoleName) &&
            (typeof ModulesManager.preloaded_modules_is_actif[moduleObj.name] != "undefined")) {
            moduleObj.actif = ModulesManager.preloaded_modules_is_actif[moduleObj.name];
        }

        if (!moduleObj.actif) {
            return;
        }

        moduleObj.initialize();
        moduleObj.registerApis();
    }
    public static getModuleByNameAndRole(name: string, role: string) {
        const module = this.modules_by_name[name ? name.toLowerCase() : null];

        return module?.getModuleComponentByRole(role) ?? null;
    }
    public static getModuleWrapperByName(name: string) {
        return this.modules_by_name[name];
    }
    public static getModuleWrappersByName() {
        return this.modules_by_name;
    }
}
