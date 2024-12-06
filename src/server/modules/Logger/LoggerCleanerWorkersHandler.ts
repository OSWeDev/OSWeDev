import CronWorkerPlanification from "../../../shared/modules/Cron/vos/CronWorkerPlanification";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ModuleCronServer from "../Cron/ModuleCronServer";
import LoggerCleanerCronWorker from "./workers/LoggerCleanerCronWorker";


export default class LoggerCleanerWorkersHandler {

    private static instance: LoggerCleanerWorkersHandler = null;

    private constructor() {

        ModuleCronServer.getInstance().registerCronWorker(LoggerCleanerCronWorker.getInstance());

        const planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 3, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = LoggerCleanerCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = LoggerCleanerCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!LoggerCleanerWorkersHandler.instance) {
            LoggerCleanerWorkersHandler.instance = new LoggerCleanerWorkersHandler();
        }
        return LoggerCleanerWorkersHandler.instance;
    }
}