import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';

/**
 * StartExportDatatableCronWorker
 *  - Export datatable cron worker using favorites filters
 */
export default class StartExportDatatableCronWorker implements ICronWorker {

    public static getInstance() {

        if (!StartExportDatatableCronWorker.instance) {
            StartExportDatatableCronWorker.instance = new StartExportDatatableCronWorker();
        }

        return StartExportDatatableCronWorker.instance;
    }

    private static instance: StartExportDatatableCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "StartExportDatatableCronWorker";
    }

    public async work() {
        await ModuleDashboardBuilder.getInstance().start_export_datatable_using_favorites_filters();
    }
}