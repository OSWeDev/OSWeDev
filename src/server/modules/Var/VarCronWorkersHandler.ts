import * as moment from 'moment';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import PrecalcVarDataCronWorker from './workers/PrecalcVarData/PrecalcVarDataCronWorker';

export default class VarCronWorkersHandler {

    public static getInstance() {
        if (!VarCronWorkersHandler.instance) {
            VarCronWorkersHandler.instance = new VarCronWorkersHandler();
        }
        return VarCronWorkersHandler.instance;
    }

    private static instance: VarCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(PrecalcVarDataCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(moment());
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "PrecalcVarDataCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = PrecalcVarDataCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}