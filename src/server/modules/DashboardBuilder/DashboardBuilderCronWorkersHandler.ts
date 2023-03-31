import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import StartExportDatatableCronWorker from './workers/StartExportDatatable/StartExportDatatableCronWorker';

/**
 * DashboardBuilderCronWorkersHandler
 *  - Handler for Dashboard Builder Cron Workers (declaration and management)
 */
export default class DashboardBuilderCronWorkersHandler {

    public static getInstance() {

        if (!DashboardBuilderCronWorkersHandler.instance) {
            DashboardBuilderCronWorkersHandler.instance = new DashboardBuilderCronWorkersHandler();
        }

        return DashboardBuilderCronWorkersHandler.instance;
    }

    private static instance: DashboardBuilderCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(StartExportDatatableCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = StartExportDatatableCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = StartExportDatatableCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }
}