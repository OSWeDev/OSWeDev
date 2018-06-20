import * as moment from 'moment';
import ModuleCron from '../../../shared/modules/Cron/ModuleCron';
import PasswordInvalidationCronWorker from './workers/PasswordInvalidation/PasswordInvalidationCronWorker';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import DateHandler from '../../../shared/tools/DateHandler';


export default class AccessPolicyCronWorkersHandler {

    public static getInstance() {
        if (!AccessPolicyCronWorkersHandler.instance) {
            AccessPolicyCronWorkersHandler.instance = new AccessPolicyCronWorkersHandler();
        }
        return AccessPolicyCronWorkersHandler.instance;
    }

    private static instance: AccessPolicyCronWorkersHandler = null;

    private constructor() {
        ModuleCron.getInstance().registerCronWorker(PasswordInvalidationCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(moment());
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "PasswordInvalidationCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = PasswordInvalidationCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCron.getInstance().planCronWorker(planCronWorker);
    }
}