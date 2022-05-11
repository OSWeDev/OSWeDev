import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import InstallTranslationsCronWorker from './workers/InstallTranslations/InstallTranslationsCronWorker';

export default class TranslationCronWorkersHandler {

    public static getInstance() {
        if (!TranslationCronWorkersHandler.instance) {
            TranslationCronWorkersHandler.instance = new TranslationCronWorkersHandler();
        }
        return TranslationCronWorkersHandler.instance;
    }

    private static instance: TranslationCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(InstallTranslationsCronWorker.getInstance());

        let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = null;
        planCronWorker.intervale_recurrence = 0;
        planCronWorker.planification_uid = "InstallTranslationsCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE;
        planCronWorker.worker_uid = InstallTranslationsCronWorker.getInstance().worker_uid;
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.getInstance().error(error));
    }
}