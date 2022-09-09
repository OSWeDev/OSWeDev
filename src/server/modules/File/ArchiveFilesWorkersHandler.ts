import CronWorkerPlanification from "../../../shared/modules/Cron/vos/CronWorkerPlanification";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ArchiveFilesCronWorker from "./workers/ArchiveFilesCronWorker";
import ModuleCronServer from "../Cron/ModuleCronServer";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";


export default class ArchiveFilesWorkersHandler {

    public static getInstance() {
        if (!ArchiveFilesWorkersHandler.instance) {
            ArchiveFilesWorkersHandler.instance = new ArchiveFilesWorkersHandler();
        }
        return ArchiveFilesWorkersHandler.instance;
    }

    private static instance: ArchiveFilesWorkersHandler = null;

    private constructor() {

        ModuleCronServer.getInstance().registerCronWorker(ArchiveFilesCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 1, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = ArchiveFilesCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = ArchiveFilesCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.getInstance().error(error));
    }
}