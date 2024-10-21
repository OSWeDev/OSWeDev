
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import OseliaDailyCleanEmptyThreads from './workers/OseliaDailyCleanEmptyThreads/OseliaDailyCleanEmptyThreadsCronWorker';

export default class SupervisionCronWorkersHandler {

    private static instance: SupervisionCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(OseliaDailyCleanEmptyThreads.getInstance());

        const planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 3, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "OseliaDailyCleanEmptyThreads";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = OseliaDailyCleanEmptyThreads.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!SupervisionCronWorkersHandler.instance) {
            SupervisionCronWorkersHandler.instance = new SupervisionCronWorkersHandler();
        }
        return SupervisionCronWorkersHandler.instance;
    }
}