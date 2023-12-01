import CronWorkerPlanification from "../../../shared/modules/Cron/vos/CronWorkerPlanification";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ModuleCronServer from "../Cron/ModuleCronServer";
import DeleteOldExpressSessionsCronWorker from "./workers/DeleteOldExpressSessionsCronWorker";


export default class ExpressDBSessionsWorkersHandler {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ExpressDBSessionsWorkersHandler.instance) {
            ExpressDBSessionsWorkersHandler.instance = new ExpressDBSessionsWorkersHandler();
        }
        return ExpressDBSessionsWorkersHandler.instance;
    }

    private static instance: ExpressDBSessionsWorkersHandler = null;

    private constructor() {

        ModuleCronServer.getInstance().registerCronWorker(DeleteOldExpressSessionsCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 3, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = DeleteOldExpressSessionsCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_HEURES;
        planCronWorker.worker_uid = DeleteOldExpressSessionsCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }
}