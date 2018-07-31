import IModuleBase from "./IModuleBase";
import ModuleWrapper from "./ModuleWrapper";
import ModuleTable from './ModuleTable';
import ModuleVO from './ModuleVO';
import DefaultTranslation from './Translation/vos/DefaultTranslation';
import ModuleTableField from './ModuleTableField';

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

    private constructor() {

        // Il faut quand même qu'on register une moduleTable pour le admin.modules
        let fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr': 'Nom' }), true),
            new ModuleTableField('actif', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({ 'fr': 'Actif' }), true),
        ];
        let moduleTable: ModuleTable<ModuleVO> = new ModuleTable<ModuleVO>(null, ModuleVO.API_TYPE_ID, ModuleVO.forceNumeric, ModuleVO.forceNumerics, fields);
        moduleTable.set_bdd_ref('admin', 'modules', new DefaultTranslation({ 'fr': 'Modules' }));
    }

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
