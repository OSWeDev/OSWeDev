import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleCronServer from '../Cron/ModuleCronServer';
import CacheableinfoCronWorker from './cacheableinfo/CacheableinfoCronWorker';
import CachedinfoCronWorker from './cachedinfo/CachedinfoCronWorker';

export default class VarCronWorkersHandler {

    public static getInstance() {
        if (!VarCronWorkersHandler.instance) {
            VarCronWorkersHandler.instance = new VarCronWorkersHandler();
        }
        return VarCronWorkersHandler.instance;
    }

    private static instance: VarCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(CacheableinfoCronWorker.getInstance());
        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = "CacheableinfoCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = CacheableinfoCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);

        ModuleCronServer.getInstance().registerCronWorker(CachedinfoCronWorker.getInstance());
        planCronWorker = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = "CachedinfoCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = CachedinfoCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}