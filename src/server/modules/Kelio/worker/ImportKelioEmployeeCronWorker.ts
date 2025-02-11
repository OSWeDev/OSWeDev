import ModuleKelioServer from "../ModuleKelioServer";

export default class ImportKelioEmployeeCronWorker {

    private static instance: ImportKelioEmployeeCronWorker = null;

    private constructor() { }

    get worker_uid(): string {
        return 'ImportKelioEmployeeCronWorker';
    }

    public static getInstance() {
        if (!ImportKelioEmployeeCronWorker.instance) {
            ImportKelioEmployeeCronWorker.instance = new ImportKelioEmployeeCronWorker();
        }
        return ImportKelioEmployeeCronWorker.instance;
    }

    public async work() {
        await ModuleKelioServer.getInstance().exportLightEmployees();
    }
}
