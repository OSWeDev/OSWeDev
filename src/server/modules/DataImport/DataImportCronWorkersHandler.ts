
export default class DataImportCronWorkersHandler {

    public static getInstance() {
        if (!DataImportCronWorkersHandler.instance) {
            DataImportCronWorkersHandler.instance = new DataImportCronWorkersHandler();
        }
        return DataImportCronWorkersHandler.instance;
    }

    private static instance: DataImportCronWorkersHandler = null;

    private constructor() {
        // ModuleCronServer.getInstance().registerCronWorker(ReimportCronWorker.getInstance());

        // let planCronWorker: CronWorkerPlanification = new CronWorkerPlanification();

        // planCronWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(moment());
        // planCronWorker.intervale_recurrence = 1;
        // planCronWorker.planification_uid = "ReimportCronWorker";
        // planCronWorker.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_JOURS;
        // planCronWorker.worker_uid = ReimportCronWorker.getInstance().worker_uid;
        // // Pas besoin d'être dans un contexte synchrone
        // ModuleCronServer.getInstance().planCronWorker(planCronWorker);
    }
}