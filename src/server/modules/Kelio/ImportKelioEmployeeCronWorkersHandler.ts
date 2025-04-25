import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleCronServer from '../Cron/ModuleCronServer';
import ImportKelioEmployeeCronWorker from './worker/ImportKelioEmployeeCronWorker';

export default class ImportKelioEmployeeCronWorkersHandler {

    private static instance: ImportKelioEmployeeCronWorkersHandler = null;

    private constructor() {
        this.initializeCronWorker();
    }

    public static getInstance() {
        if (!ImportKelioEmployeeCronWorkersHandler.instance) {
            ImportKelioEmployeeCronWorkersHandler.instance = new ImportKelioEmployeeCronWorkersHandler();
        }
        return ImportKelioEmployeeCronWorkersHandler.instance;
    }

    private initializeCronWorker(): void {
        this.initializeImportKelioEmployeeCronWorker();
    }

    private initializeImportKelioEmployeeCronWorker(): void {
        ModuleCronServer.getInstance().registerCronWorker(ImportKelioEmployeeCronWorker.getInstance());

        const planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();
        const date = Dates.hour(Dates.minute(Dates.second(Dates.now(), 0), 0), 5);

        planCronWorker.date_heure_planifiee = date;
        planCronWorker.intervale_recurrence = 1;
        planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        planCronWorker.planification_uid = ImportKelioEmployeeCronWorker.getInstance().worker_uid;
        planCronWorker.worker_uid = ImportKelioEmployeeCronWorker.getInstance().worker_uid;

        ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}
