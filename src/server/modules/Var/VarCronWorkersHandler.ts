import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import ModuleVarServer from './ModuleVarServer';
import ClearVarCacheCronWorker from './workers/UpdateEstimatedDurations/ClearVarCacheCronWorker';
import UpdateEstimatedDurationsCronWorker from './workers/UpdateEstimatedDurations/UpdateEstimatedDurationsCronWorker';
// import CachedinfoCronWorker from './cachedinfo/CachedinfoCronWorker';

export default class VarCronWorkersHandler {

    public static getInstance() {
        if (!VarCronWorkersHandler.instance) {
            VarCronWorkersHandler.instance = new VarCronWorkersHandler();
        }
        return VarCronWorkersHandler.instance;
    }

    private static instance: VarCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(UpdateEstimatedDurationsCronWorker.getInstance());
        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_DAY), 1, TimeSegment.TYPE_HOUR);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "UpdateEstimatedDurationsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = UpdateEstimatedDurationsCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));


        ModuleCronServer.getInstance().registerCronWorker(ClearVarCacheCronWorker.getInstance());
        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleVarServer.TASK_NAME_force_delete_all_cache_except_imported_data] =
            ClearVarCacheCronWorker.getInstance().work;
    }
}