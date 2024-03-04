import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import ModuleVarServer from '../../ModuleVarServer';

export default class ClearVarCacheCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ClearVarCacheCronWorker.instance) {
            ClearVarCacheCronWorker.instance = new ClearVarCacheCronWorker();
        }
        return ClearVarCacheCronWorker.instance;
    }

    private static instance: ClearVarCacheCronWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "ClearVarCacheCronWorker";
    }

    // istanbul ignore next: nothing to test : work
    public async work() {

        await ModuleVarServer.getInstance().force_delete_all_cache_except_imported_data();
    }
}