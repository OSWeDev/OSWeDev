import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleCronServer from '../Cron/ModuleCronServer';
import EndPlannedMaintenanceCronWorker from './workers/EndPlannedMaintenance/EndPlannedMaintenanceCronWorker';
import StartMaintenanceCronWorker from './workers/StartMaintenance/StartMaintenanceCronWorker';

export default class MaintenanceCronWorkersHandler {

    public static getInstance() {
        if (!MaintenanceCronWorkersHandler.instance) {
            MaintenanceCronWorkersHandler.instance = new MaintenanceCronWorkersHandler();
        }
        return MaintenanceCronWorkersHandler.instance;
    }

    private static instance: MaintenanceCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(StartMaintenanceCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = StartMaintenanceCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = StartMaintenanceCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);

        ModuleCronServer.getInstance().registerCronWorker(EndPlannedMaintenanceCronWorker.getInstance());

        planCronWorker = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = EndPlannedMaintenanceCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = EndPlannedMaintenanceCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}