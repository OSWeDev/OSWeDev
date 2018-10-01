import * as moment from 'moment';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import CleanOldNotifsCronWorker from './workers/CleanOldNotifs/CleanOldNotifsCronWorker';

export default class PushDataCronWorkersHandler {

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

        planCronWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(moment());
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "CleanOldNotifsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = CleanOldNotifsCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}