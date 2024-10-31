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

        // Il faut quand même qu'on register une moduleTable pour le admin.modules
        const label_field = ModuleTableFieldController.create_new(ModuleVO.API_TYPE_ID, field_names<ModuleVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Nom' }), true)
            .unique();
        ModuleTableFieldController.create_new(ModuleVO.API_TYPE_ID, field_names<ModuleVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Actif' }), true);

        ModuleTableController.create_new(null, ModuleVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': 'Modules' }))
            .set_description('Les modules disponibles / activés pour cette instance d\'OSWEDEV')
            .set_bdd_ref('admin', 'modules');
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

        moduleObj.initialize();
        moduleObj.registerApis();
    }
    public static getModuleByNameAndRole(name: string, role: string) {
        const module = this.modules_by_name[name];

        return module?.getModuleComponentByRole(role) ?? null;
    }
    public static getModuleWrapperByName(name: string) {
        return this.modules_by_name[name];
    }
    public static getModuleWrappersByName() {
        return this.modules_by_name;
    }
}
