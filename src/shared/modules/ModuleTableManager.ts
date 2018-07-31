import ModuleTable from './ModuleTable';

export default class ModuleTableManager {
    private static instance;

    public static getInstance() {
        if (!ModuleTableManager.instance) {
            ModuleTableManager.instance = new ModuleTableManager();
        }
        return ModuleTableManager.instance;
    }

    public registered_moduleTables: { [fullname: string]: ModuleTable<any> } = {};

    private constructor() { }

    public register_moduletable(moduleTable: ModuleTable<any>) {
        let index = this.getIndex(moduleTable);

        if (!index) {
            return;
        }
        this.registered_moduleTables[index] = moduleTable;
    }

    private getIndex(moduleTable: ModuleTable<any>): string {
        if ((!moduleTable) || (!moduleTable.full_name)) {
            return null;
        }

        return moduleTable.full_name;
    }
}