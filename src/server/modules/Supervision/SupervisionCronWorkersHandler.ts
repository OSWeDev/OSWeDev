
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import DailyReportCronWorker from './workers/DailyReport/DailyReportCronWorker';
import RefreshCRONSupervisionEachDayCronWorker from './workers/RefreshCRONSupervisionEachDay/RefreshCRONSupervisionEachDayCronWorker';

export default class SupervisionCronWorkersHandler {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!SupervisionCronWorkersHandler.instance) {
            SupervisionCronWorkersHandler.instance = new SupervisionCronWorkersHandler();
        }
        return SupervisionCronWorkersHandler.instance;
    }

    private static instance: SupervisionCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(DailyReportCronWorker.getInstance());
        ModuleCronServer.getInstance().registerCronWorker(RefreshCRONSupervisionEachDayCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 8, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "DailyReportCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = DailyReportCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));

        planCronWorker = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 8, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "RefreshCRONSupervisionEachDayCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = RefreshCRONSupervisionEachDayCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }
}