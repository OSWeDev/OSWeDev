import { field_names } from '../tools/ObjectHandler';
import IDistantVOBase from './IDistantVOBase';
import IModuleBase from "./IModuleBase";
import Module from './Module';
import ModuleTableVO from './ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from './ModuleTableFieldVO';
import ModuleVO from './ModuleVO';
import ModuleWrapper from "./ModuleWrapper";
import DefaultTranslationVO from './Translation/vos/DefaultTranslationVO';

export default class ModulesManager {

    public static isGenerator: boolean = false;
    public static isServerSide: boolean = false;

    public static MODULE_PARAM_TABLE_PREFIX: string = "module_";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulesManager {
        if (!ModulesManager.instance) {
            ModulesManager.instance = new ModulesManager();
        }
        return ModulesManager.instance;
    }

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
        let label_field = ModuleTableFieldController.create_new(ModuleVO.API_TYPE_ID, field_names<ModuleVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, DefaultTranslationVO.create_new({ 'fr-fr': 'Nom' }), true);
        let fields = [
            label_field,
            ModuleTableFieldController.create_new(ModuleVO.API_TYPE_ID, field_names<ModuleVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({ 'fr-fr': 'Actif' }), true),
        ];
        let moduleTable: ModuleTableVO<ModuleVO> = new ModuleTableVO<ModuleVO>(
            null, ModuleVO.API_TYPE_ID, () => new ModuleVO(), fields, label_field, DefaultTranslationVO.create_new({ 'fr-fr': 'Modules' }));
        moduleTable.set_bdd_ref('admin', 'modules');
    }

    public registerModule(role: string, moduleObj: IModuleBase) {
        if (!moduleObj) {
            return;
        }
        if (!this.modules_by_name[moduleObj.name]) {
            this.modules_by_name[moduleObj.name] = new ModuleWrapper(moduleObj.name);
        }
        this.modules_by_name[moduleObj.name].addModuleComponent(role, moduleObj);
        moduleObj.initialize();
        moduleObj.registerApis();

        // Et il faut register une moduleTable pour les parametres du module si on est sur un SharedModule
        if (role == Module.SharedModuleRoleName) {
            if ((moduleObj as Module).fields) {
                let moduleParamsTable: ModuleTableVO<IDistantVOBase> = new ModuleTableVO<IDistantVOBase>(
                    moduleObj as Module,
                    ModulesManager.MODULE_PARAM_TABLE_PREFIX + moduleObj.name,
                    () => ({} as any),
                    (moduleObj as Module).fields,
                    null,
                    DefaultTranslationVO.create_new({ 'fr-fr': moduleObj.name }));
                moduleParamsTable.set_bdd_ref('admin', ModulesManager.MODULE_PARAM_TABLE_PREFIX + moduleObj.name);
                moduleParamsTable.defineAsModuleParamTable();
            }
        }
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
