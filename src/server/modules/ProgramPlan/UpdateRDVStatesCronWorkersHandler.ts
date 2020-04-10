import ModuleCronServer from '../Cron/ModuleCronServer';
import UpdateRDVStatesCronWorker from './workers/UpdateRDVStates/UpdateRDVStatesCronWorker';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import DateHandler from '../../../shared/tools/DateHandler';
const moment = require('moment');

export default class UpdateRDVStatesCronWorkersHandler {

    public static getInstance() {
        if (!UpdateRDVStatesCronWorkersHandler.instance) {
            UpdateRDVStatesCronWorkersHandler.instance = new UpdateRDVStatesCronWorkersHandler();
        }
        return UpdateRDVStatesCronWorkersHandler.instance;
    }

    private static instance: UpdateRDVStatesCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(UpdateRDVStatesCronWorker.getInstance());

        // TODO FIXME : Pas de planification en fait, on veut le lancer à la demande c'est tout
        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(moment().utc(true));
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "CleanOldNotifsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = UpdateRDVStatesCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}