import ModuleTable from './ModuleTable';
import IDistantVOBase from './IDistantVOBase';

export default class VOsTypesManager {
    public static getInstance() {
        if (!VOsTypesManager.instance) {
            VOsTypesManager.instance = new VOsTypesManager();
        }
        return VOsTypesManager.instance;
    }

    private static instance: VOsTypesManager = null;

    public moduleTables_by_voType: { [voType: string]: ModuleTable<any> } = {};

    private constructor() { }

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
}