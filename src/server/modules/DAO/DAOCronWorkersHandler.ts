import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import CheckSegmentedIdsCronWorker from './checksegmentedids/CheckSegmentedIdsCronWorker';

export default class DAOCronWorkersHandler {

    public static getInstance() {
        if (!DAOCronWorkersHandler.instance) {
            DAOCronWorkersHandler.instance = new DAOCronWorkersHandler();
        }
        return DAOCronWorkersHandler.instance;
    }

    private static instance: DAOCronWorkersHandler = null;

    private constructor() {

        ModuleCronServer.getInstance().registerCronWorker(CheckSegmentedIdsCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "CheckSegmentedIdsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = CheckSegmentedIdsCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.getInstance().error(error));
    }
}