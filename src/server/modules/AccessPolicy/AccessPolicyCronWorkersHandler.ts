
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import PasswordInvalidationCronWorker from './workers/PasswordInvalidation/PasswordInvalidationCronWorker';

export default class AccessPolicyCronWorkersHandler {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!AccessPolicyCronWorkersHandler.instance) {
            AccessPolicyCronWorkersHandler.instance = new AccessPolicyCronWorkersHandler();
        }
        return AccessPolicyCronWorkersHandler.instance;
    }

    private static instance: AccessPolicyCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(PasswordInvalidationCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.now();
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "PasswordInvalidationCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = PasswordInvalidationCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }
}