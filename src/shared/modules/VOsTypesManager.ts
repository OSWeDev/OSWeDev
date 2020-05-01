import IDistantVOBase from './IDistantVOBase';
import ModuleTable from './ModuleTable';
import ModuleTableField from './ModuleTableField';

export default class VOsTypesManager {
    public static getInstance() {
        if (!VOsTypesManager.instance) {
            VOsTypesManager.instance = new VOsTypesManager();
        }
        return VOsTypesManager.instance;
    }

    private static instance: VOsTypesManager = null;

    /**
     * Local thread cache -----
     */

    public moduleTables_by_voType: { [voType: string]: ModuleTable<any> } = {};

    /**
     * ----- Local thread cache
     */
    private constructor() { }

    public addAlias(api_type_id_alias: string, vo_type: string) {
        this.moduleTables_by_voType[api_type_id_alias] = this.moduleTables_by_voType[vo_type];
    }

    public registerModuleTable(module_table: ModuleTable<any>) {
        if (module_table && module_table.vo_type) {

            this.moduleTables_by_voType[module_table.vo_type] = module_table;
        }
    }

    public vosArray_to_vosByIds<T extends IDistantVOBase>(vos: T[]): { [id: number]: T } {
        let res: { [id: number]: T } = {};

        for (let i in vos) {
            let vo = vos[i];

            res[vo.id] = vo;
        }

        return res;
    }

    public isManyToManyModuleTable(moduleTable: ModuleTable<any>): boolean {

        let manyToOne1: ModuleTable<any> = null;
        let field_num: number = 0;
        let isManyToMany: boolean = false;
        for (let j in moduleTable.get_fields()) {
            let field: ModuleTableField<any> = moduleTable.get_fields()[j];

            // On ignore les 2 fields de service
            if (field.field_id == "id") {
                continue;
            }
            if (field.field_id == "_type") {
                continue;
            }

            // On défini une table many to many comme une table ayant 2 fields, de type manyToOne vers 2 moduletables différents
            if (!field.manyToOne_target_moduletable) {
                isManyToMany = false;
                break;
            }

            field_num++;
            if (field_num > 2) {
                isManyToMany = false;
                break;
            }

            if (!manyToOne1) {
                manyToOne1 = field.manyToOne_target_moduletable;
                continue;
            }

            if (manyToOne1.full_name == field.manyToOne_target_moduletable.full_name) {
                isManyToMany = false;
                break;
            }

            isManyToMany = true;
        }

        return isManyToMany;
    }

    public get_manyToManyModuleTables(): Array<ModuleTable<any>> {
        let res: Array<ModuleTable<any>> = [];

        for (let i in this.moduleTables_by_voType) {
            let moduleTable = this.moduleTables_by_voType[i];

            if (this.isManyToManyModuleTable(moduleTable)) {
                res.push(moduleTable);
            }
        }

        return res;
    }

    public getManyToManyOtherField(manyToManyModuleTable: ModuleTable<any>, firstField: ModuleTableField<any>): ModuleTableField<any> {

        for (let j in manyToManyModuleTable.get_fields()) {
            let field: ModuleTableField<any> = manyToManyModuleTable.get_fields()[j];

            // On ignore les 2 fields de service
            if (field.field_id == "id") {
                continue;
            }
            if (field.field_id == "_type") {
                continue;
            }

            if (!field.manyToOne_target_moduletable) {
                break;
            }

            if (firstField.manyToOne_target_moduletable.full_name == field.manyToOne_target_moduletable.full_name) {
                continue;
            }

            return field;
        }
        return null;
    }
}