
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import CleanOldNotifsCronWorker from './workers/CleanOldNotifs/CleanOldNotifsCronWorker';

export default class PushDataCronWorkersHandler {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!PushDataCronWorkersHandler.instance) {
            PushDataCronWorkersHandler.instance = new PushDataCronWorkersHandler();
        }
        return PushDataCronWorkersHandler.instance;
    }

    private static instance: PushDataCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(CleanOldNotifsCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.now();
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "CleanOldNotifsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = CleanOldNotifsCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }
}