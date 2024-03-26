import PreloadedModuleServerController from '../../server/modules/PreloadedModuleServerController';
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

    private static instance: ModulesManager = null;

    /**
     * Local thread cache -----
     */

    public modules_by_name: { [key: string]: ModuleWrapper } = {};

    /**
     * ----- Local thread cache
     */

    private constructor() {

        // Il faut quand même qu'on register une moduleTable pour le admin.modules
        const label_field = ModuleTableFieldController.create_new(ModuleVO.API_TYPE_ID, field_names<ModuleVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Nom' }), true);
        ModuleTableFieldController.create_new(ModuleVO.API_TYPE_ID, field_names<ModuleVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Actif' }), true);
        const moduleTable = ModuleTableController.create_new(
            null, ModuleVO, label_field, DefaultTranslationVO.create_new({ 'fr-fr': 'Modules' }));
        moduleTable.set_bdd_ref('admin', 'modules');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulesManager {
        if (!ModulesManager.instance) {
            ModulesManager.instance = new ModulesManager();
        }
        return ModulesManager.instance;
    }

    public registerModule(role: string, moduleObj: IModuleBase) {
        if (!moduleObj) {
            return;
        }
        if (!this.modules_by_name[moduleObj.name]) {
            this.modules_by_name[moduleObj.name] = new ModuleWrapper(moduleObj.name);
        }
        this.modules_by_name[moduleObj.name].addModuleComponent(role, moduleObj);

        // Si on a un actif en base, on le charge, mais uniquement sur le shared
        if ((role == Module.SharedModuleRoleName) &&
            (typeof PreloadedModuleServerController.preloaded_modules_is_actif[moduleObj.name] != "undefined")) {
            moduleObj.actif = PreloadedModuleServerController.preloaded_modules_is_actif[moduleObj.name];
        }

        moduleObj.initialize();
        moduleObj.registerApis();
    }
    public getModuleByNameAndRole(name: string, role: string) {
        const module = this.modules_by_name[name];

        return module?.getModuleComponentByRole(role) ?? null;
    }
    public getModuleWrapperByName(name: string) {
        return this.modules_by_name[name];
    }
    public getModuleWrappersByName() {
        return this.modules_by_name;
    }
}
