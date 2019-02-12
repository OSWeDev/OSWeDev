import IDistantVOBase from './IDistantVOBase';
import IModuleBase from "./IModuleBase";
import Module from './Module';
import ModuleTable from './ModuleTable';
import ModuleTableField from './ModuleTableField';
import ModuleVO from './ModuleVO';
import ModuleWrapper from "./ModuleWrapper";
import DefaultTranslation from './Translation/vos/DefaultTranslation';

export default class ModulesManager {

    public static MODULE_PARAM_TABLE_PREFIX: string = "module_";

    public static getInstance(): ModulesManager {
        if (!ModulesManager.instance) {
            ModulesManager.instance = new ModulesManager();
        }
        return ModulesManager.instance;
    }

    private static instance: ModulesManager = null;

    public isServerSide: boolean = false;
    public modules_by_name: { [key: string]: ModuleWrapper } = {};

    private constructor() {

        // Il faut quand même qu'on register une moduleTable pour le admin.modules
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'Nom' }), true);
        let fields = [
            label_field,
            new ModuleTableField('actif', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ fr: 'Actif' }), true),
        ];
        let moduleTable: ModuleTable<ModuleVO> = new ModuleTable<ModuleVO>(null, ModuleVO.API_TYPE_ID, fields, label_field, new DefaultTranslation({ fr: 'Modules' }));
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
                let moduleParamsTable: ModuleTable<IDistantVOBase> = new ModuleTable<IDistantVOBase>(
                    moduleObj as Module,
                    ModulesManager.MODULE_PARAM_TABLE_PREFIX + moduleObj.name,
                    (moduleObj as Module).fields,
                    null,
                    new DefaultTranslation({ fr: moduleObj.name }));
                moduleParamsTable.set_bdd_ref('admin', ModulesManager.MODULE_PARAM_TABLE_PREFIX + moduleObj.name);
                moduleParamsTable.defineAsModuleParamTable();
            }
        }
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
