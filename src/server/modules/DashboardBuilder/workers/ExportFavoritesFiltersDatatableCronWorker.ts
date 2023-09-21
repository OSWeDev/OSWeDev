import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import ICronWorker from '../../Cron/interfaces/ICronWorker';

/**
 * ExportFavoritesFiltersDatatableCronWorker
 *  - Export datatable cron worker using favorites filters
 */
export default class ExportFavoritesFiltersDatatableCronWorker implements ICronWorker {

    public static getInstance() {

        if (!ExportFavoritesFiltersDatatableCronWorker.instance) {
            ExportFavoritesFiltersDatatableCronWorker.instance = new ExportFavoritesFiltersDatatableCronWorker();
        }

        return ExportFavoritesFiltersDatatableCronWorker.instance;
    }

    private static instance: ExportFavoritesFiltersDatatableCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "ExportFavoritesFiltersDatatableCronWorker";
    }

    public async work() {
        await ModuleDashboardBuilder.getInstance().start_export_favorites_filters_datatable();
    }
}