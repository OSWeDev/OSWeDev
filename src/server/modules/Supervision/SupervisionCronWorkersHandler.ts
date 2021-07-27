
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import DailyReportCronWorker from './workers/DailyReport/DailyReportCronWorker';

export default class SupervisionCronWorkersHandler {

    public static getInstance() {
        if (!SupervisionCronWorkersHandler.instance) {
            SupervisionCronWorkersHandler.instance = new SupervisionCronWorkersHandler();
        }
        return SupervisionCronWorkersHandler.instance;
    }

    private static instance: SupervisionCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(DailyReportCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 8, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "DailyReportCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = DailyReportCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}