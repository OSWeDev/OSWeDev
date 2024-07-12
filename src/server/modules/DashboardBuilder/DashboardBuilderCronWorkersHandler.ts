import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import ExportFavoritesFiltersDatatableCronWorker from './workers/ExportFavoritesFiltersDatatableCronWorker';

/**
 * DashboardBuilderCronWorkersHandler
 *  - Handler for Dashboard Builder Cron Workers (declaration and management)
 */
export default class DashboardBuilderCronWorkersHandler {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {

        if (!DashboardBuilderCronWorkersHandler.instance) {
            DashboardBuilderCronWorkersHandler.instance = new DashboardBuilderCronWorkersHandler();
        }

        return DashboardBuilderCronWorkersHandler.instance;
    }

    private static instance: DashboardBuilderCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(ExportFavoritesFiltersDatatableCronWorker.getInstance());

        const planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = ExportFavoritesFiltersDatatableCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = ExportFavoritesFiltersDatatableCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }
}