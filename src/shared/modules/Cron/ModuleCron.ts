import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import * as moment from 'moment';
import ICronWorker from './interfaces/ICronWorker';
import CronWorkerPlanification from './vos/CronWorkerPlanification';
import ModuleDAO from '../DAO/ModuleDAO';
import DateHandler from '../../tools/DateHandler';

export default class ModuleCron extends Module {

    public static getInstance(): ModuleCron {
        if (!ModuleCron.instance) {
            ModuleCron.instance = new ModuleCron();
        }
        return ModuleCron.instance;
    }

    private static instance: ModuleCron = null;

    public registered_cronWorkers: { [worker_uid: string]: ICronWorker } = {};
    public datatable_cronworkplan: ModuleTable<CronWorkerPlanification>;

    private constructor() {

        super("cron", "CRON");
        this.initialize();
    }

    public registerCronWorker(cronWorker: ICronWorker) {
        this.registered_cronWorkers[cronWorker.worker_uid] = cronWorker;
    }

    public async planCronWorker(cronWorkerPlan: CronWorkerPlanification) {
        let vo: CronWorkerPlanification = await ModuleDAO.getInstance().selectOne<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID, "where t.planification_uid = $1", [cronWorkerPlan.planification_uid]);

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

    protected initialize() {
        this.fields = [];
        this.datatables = [];

        let datatable_fields = [
            new ModuleTableField('planification_uid', ModuleTableField.FIELD_TYPE_string, 'planification_uid', true),
            new ModuleTableField('worker_uid', ModuleTableField.FIELD_TYPE_string, 'worker_uid', true),
            new ModuleTableField('date_heure_planifiee', ModuleTableField.FIELD_TYPE_string, 'date_heure_planifiee', true),
            new ModuleTableField('type_recurrence', ModuleTableField.FIELD_TYPE_int, 'type_recurrence', true),
            new ModuleTableField('intervale_recurrence', ModuleTableField.FIELD_TYPE_float, 'intervale_recurrence', true),
        ];

        this.datatable_cronworkplan = new ModuleTable(this, CronWorkerPlanification.API_TYPE_ID, CronWorkerPlanification.forceNumeric, CronWorkerPlanification.forceNumerics, datatable_fields, CronWorkerPlanification.API_TYPE_ID);
        this.datatables.push(this.datatable_cronworkplan);
    }
}