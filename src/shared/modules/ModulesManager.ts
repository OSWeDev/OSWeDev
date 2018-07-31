import IModuleBase from "./IModuleBase";
import ModuleWrapper from "./ModuleWrapper";
import ModuleTable from './ModuleTable';
import ModuleVO from './ModuleVO';
import DefaultTranslation from './Translation/vos/DefaultTranslation';
import ModuleTableField from './ModuleTableField';
import IDistantVOBase from './IDistantVOBase';
import ConversionHandler from '../tools/ConversionHandler';
import VOsTypesManager from './VOsTypesManager';
import Module from './Module';

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

        // Et il faut register une moduleTable pour les parametres du module si on est sur un SharedModule
        if (role == Module.SharedModuleRoleName) {
            if ((module as Module).fields) {
                let moduleParamsTable: ModuleTable<IDistantVOBase> = new ModuleTable<IDistantVOBase>(null, ModulesManager.MODULE_PARAM_TABLE_PREFIX + module.name, ModulesManager.getInstance().defaultforceNumeric, ModulesManager.getInstance().defaultforceNumerics, (module as Module).fields);
                moduleParamsTable.set_bdd_ref('admin', ModulesManager.MODULE_PARAM_TABLE_PREFIX + module.name, new DefaultTranslation({ 'fr': module.name }));
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

    public defaultforceNumeric(e: IDistantVOBase, API_TYPE_ID: string): IDistantVOBase {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);
        e._type = API_TYPE_ID;

        if ((!VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID]) || (!VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID].fields)) {
            return e;
        }
        for (let i in VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID].fields) {
            let field = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID].fields[i];

            if ((field.field_type == ModuleTableField.FIELD_TYPE_float) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_foreign_key) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_int) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_prct) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_timestamp)) {
                e[field.field_id] = ConversionHandler.getInstance().forceNumber(e[field.field_id]);
            }
        }

        return e;
    }

    public defaultforceNumerics(es: IDistantVOBase[], API_TYPE_ID: string): IDistantVOBase[] {
        for (let i in es) {
            es[i] = this.defaultforceNumeric(es[i], API_TYPE_ID);
        }
        return es;
    }

}
