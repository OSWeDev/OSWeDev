
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleCronServer from '../Cron/ModuleCronServer';
import CleanEmptyRapportCronWorker from './workers/CleanEmptyRapport/CleanEmptyRapportCronWorker';

export default class SuiviCompetencesCronWorkersHandler {

    private static instance: SuiviCompetencesCronWorkersHandler = null;

    private constructor() {
        ModuleCronServer.getInstance().registerCronWorker(CleanEmptyRapportCronWorker.getInstance());

        const planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        planCronWorker.date_heure_planifiee = Dates.hour(Dates.minute(Dates.second(Dates.now(), 0), 0), 2);
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.planification_uid = "CleanEmptyRapportCronWorker";
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.worker_uid = CleanEmptyRapportCronWorker.getInstance().worker_uid;
        // Pas besoin d'être dans un contexte synchrone
        ModuleCronServer.getInstance().planCronWorker(planCronWorker).then().catch((error) => ConsoleHandler.error(error));
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!SuiviCompetencesCronWorkersHandler.instance) {
            SuiviCompetencesCronWorkersHandler.instance = new SuiviCompetencesCronWorkersHandler();
        }
        return SuiviCompetencesCronWorkersHandler.instance;
    }
}