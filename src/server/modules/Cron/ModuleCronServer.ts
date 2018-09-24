import ModuleCron from '../../../shared/modules/Cron/ModuleCron';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleServerBase from '../ModuleServerBase';
import ICronWorker from './interfaces/ICronWorker';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import * as moment from 'moment';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';

export default class ModuleCronServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleCronServer.instance) {
            ModuleCronServer.instance = new ModuleCronServer();
        }
        return ModuleCronServer.instance;
    }

    private static instance: ModuleCronServer = null;

    public registered_cronWorkers: { [worker_uid: string]: ICronWorker } = {};

    private constructor() {
        super(ModuleCron.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCron.APINAME_executeWorkers, this.executeWorkers.bind(this));
    }

    public registerCronWorker(cronWorker: ICronWorker) {
        this.registered_cronWorkers[cronWorker.worker_uid] = cronWorker;
    }

    public async planCronWorker(cronWorkerPlan: CronWorkerPlanification) {
        let vo: CronWorkerPlanification = await ModuleDAOServer.getInstance().selectOne<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID, "where t.planification_uid = $1", [cronWorkerPlan.planification_uid]);

        if (!vo) {

            await ModuleDAO.getInstance().insertOrUpdateVO(cronWorkerPlan);
        }
    }

    public async executeWorkers() {
        let plannedWorkers: CronWorkerPlanification[] = await ModuleDAO.getInstance().getVos<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID);

        for (let i in plannedWorkers) {
            let plannedWorker: CronWorkerPlanification = plannedWorkers[i];

            if (plannedWorker.date_heure_planifiee && moment(plannedWorker.date_heure_planifiee).isBefore(moment())) {
                await this.executeWorker(plannedWorker.worker_uid);
                await this.nextRecurrence(plannedWorker);
            }
        }
    }

    public async executeWorker(worker_uid: string) {
        if ((!worker_uid) || (!this.registered_cronWorkers[worker_uid]) || (!this.registered_cronWorkers[worker_uid].work)) {
            return;
        }

        console.log('CRON:LANCEMENT:' + worker_uid);
        await this.registered_cronWorkers[worker_uid].work();
        console.log('CRON:FIN:' + worker_uid);
    }

    protected async nextRecurrence(plannedWorker: CronWorkerPlanification) {
        if ((!plannedWorker) || (plannedWorker.type_recurrence == CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE)) {
            return;
        }

        let date_heure_planifiee: moment.Moment = moment(plannedWorker.date_heure_planifiee);

        switch (plannedWorker.type_recurrence) {
            case CronWorkerPlanification.TYPE_RECURRENCE_ANNEES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'year');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_HEURES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'hour');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_JOURS:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'day');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_MINUTES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'minute');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_MOIS:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'month');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_SEMAINES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'week');
                break;
            default:
        }
        plannedWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(date_heure_planifiee);

        await ModuleDAO.getInstance().insertOrUpdateVO(plannedWorker);
    }
}