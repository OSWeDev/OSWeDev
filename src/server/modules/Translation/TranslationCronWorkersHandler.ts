import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import AssistantTraductionCronWorker from './workers/AssistantTraduction/AssistantTraductionCronWorker';
import InstallTranslationsCronWorker from './workers/InstallTranslations/InstallTranslationsCronWorker';

export default class TranslationCronWorkersHandler {

    private static instance: TranslationCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(InstallTranslationsCronWorker.getInstance());
        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = "InstallTranslationsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = InstallTranslationsCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));

        ModuleCronServer.getInstance().registerCronWorker(AssistantTraductionCronWorker.getInstance());
        planCronWorker = new CronWorkerPlanification();
        planCronWorker.date_heure_planifiee = Dates.now();
        planCronWorker.intervale_recurrence = 3;
        planCronWorker.planification_uid = AssistantTraductionCronWorker.getInstance().worker_uid;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_HEURES;
        planCronWorker.worker_uid = AssistantTraductionCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!TranslationCronWorkersHandler.instance) {
            TranslationCronWorkersHandler.instance = new TranslationCronWorkersHandler();
        }
        return TranslationCronWorkersHandler.instance;
    }

}