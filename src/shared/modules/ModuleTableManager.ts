import ModuleTable from './ModuleTable';

export default class ModuleTableManager {
    private static instance;

    public static getInstance() {
        if (!ModuleTableManager.instance) {
            ModuleTableManager.instance = new ModuleTableManager();
        }
        return ModuleTableManager.instance;
    }

    public registered_moduleTables: { [API_TYPE_ID: string]: ModuleTable<any> } = {};

    private constructor() { }

    public register_moduletable(moduleTable: ModuleTable<any>) {
        if (!moduleTable) {
            return;
        }
        this.registered_moduleTables[moduleTable.vo_type] = moduleTable;
    }
}