import CronWorkerPlanification from "../../../shared/modules/Cron/vos/CronWorkerPlanification";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import FilterFilesCronWorker from "./workers/FilterFilesCronWorker";
import ModuleCronServer from "../Cron/ModuleCronServer";


export default class FilterFilesWorkersHandler {

    public static getInstance(){
        if(!FilterFilesWorkersHandler.instance){
            FilterFilesWorkersHandler.instance = new FilterFilesWorkersHandler();
        }
        return FilterFilesWorkersHandler.instance
    }

    private static instance: FilterFilesWorkersHandler = null;

    private constructor(){

        ModuleCronServer.getInstance().registerCronWorker(FilterFilesCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = FilterFilesCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_MINUTES;
        planCronWorker.worker_uid = FilterFilesCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error)=> ConsoleHandler.getInstance().error(error));
    }
}