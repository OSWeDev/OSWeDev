import * as moment from 'moment';
import ModuleCron from '../../../shared/modules/Cron/ModuleCron';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ForkedProcessWrapperBase from '../Fork/ForkedProcessWrapperBase';
import ForkMessageController from '../Fork/ForkMessageController';
import ForkServerController from '../Fork/ForkServerController';
import ICronWorker from './interfaces/ICronWorker';
import RunCronForkMessage from './messages/RunCronForkMessage';
import RunCronsForkMessage from './messages/RunCronsForkMessage';
import DateHandler from '../../../shared/tools/DateHandler';
import BroadcastWrapperForkMessage from '../Fork/messages/BroadcastWrapperForkMessage';

export default class CronServerController {

    public static ForkedProcessType: string = "CRON";

    public static getInstance() {
        if (!CronServerController.instance) {
            CronServerController.instance = new CronServerController();
        }
        return CronServerController.instance;
    }

    private static instance: CronServerController = null;

    /**
     * Local thread cache -----
     */
    public registered_cronWorkers: { [worker_uid: string]: ICronWorker } = {};
    public cronWorkers_semaphores: { [worker_uid: string]: boolean } = {};

    public register_crons: boolean = false;
    public run_crons: boolean = false;
    public valid_crons_names: { [name: string]: boolean } = {};
    public server_ready: boolean = false;

    public semaphore: boolean = false;
    /**
     * ----- Local thread cache
     */

    private constructor() {
        ForkMessageController.getInstance().register_message_handler(RunCronForkMessage.FORK_MESSAGE_TYPE, this.handle_runcron_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(RunCronsForkMessage.FORK_MESSAGE_TYPE, this.handle_runcrons_message.bind(this));
    }

    /**
     * On sait sur quel process il est. si c'est nous, on lance le cron directement,
     *  sinon
     *      si on est sur le server principal on envoie au bon process
     *      sinon on envoie le message au process principal
     */
    public async executeWorker(worker_uid: string) {
        if (!!ForkedProcessWrapperBase.getInstance()) {

            if (CronServerController.getInstance().valid_crons_names[worker_uid]) {
                await this.handle_runcron_message(new RunCronForkMessage(worker_uid));
            } else {
                ForkMessageController.getInstance().send(new BroadcastWrapperForkMessage(new RunCronForkMessage(worker_uid)));
            }
        } else {

            if ((!ForkServerController.getInstance().process_fork_by_type_and_name[CronServerController.ForkedProcessType]) ||
                (!ForkServerController.getInstance().process_fork_by_type_and_name[CronServerController.ForkedProcessType][worker_uid])) {
                return false;
            }
            let forked = ForkServerController.getInstance().process_fork_by_type_and_name[CronServerController.ForkedProcessType][worker_uid];
            ForkMessageController.getInstance().send(new RunCronForkMessage(worker_uid), forked.child_process);
        }
    }


    /**
     * On broadcast la demande de executeWorkers, et quand on recevra le message on gèrera comme les autres process
     */
    public async executeWorkers() {

        await ForkMessageController.getInstance().broadcast(new RunCronsForkMessage());
    }

    private async handle_runcrons_message(msg: RunCronForkMessage): Promise<boolean> {

        if (!CronServerController.getInstance().run_crons) {
            return;
        }

        if (CronServerController.getInstance().semaphore) {
            return;
        }
        CronServerController.getInstance().semaphore = true;

        try {

            let plannedWorkers: CronWorkerPlanification[] = await ModuleDAO.getInstance().getVos<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID);

            for (let i in plannedWorkers) {
                let plannedWorker: CronWorkerPlanification = plannedWorkers[i];

                if (!CronServerController.getInstance().valid_crons_names[plannedWorker.worker_uid]) {
                    continue;
                }

                if (plannedWorker.date_heure_planifiee && moment(plannedWorker.date_heure_planifiee).utc(true).isBefore(moment().utc(true))) {
                    await this.executeWorker(plannedWorker.worker_uid);
                    await this.nextRecurrence(plannedWorker);
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        CronServerController.getInstance().semaphore = false;
        return true;
    }

    private async handle_runcron_message(msg: RunCronForkMessage): Promise<boolean> {
        try {
            await this.run_cron(msg.message_content);
        } catch (error) {
            ConsoleHandler.getInstance().error('handle_runcron_message:' + error);
        }
        return true;
    }

    private async run_cron(worker_uid: string) {
        if ((!worker_uid) || (!CronServerController.getInstance().registered_cronWorkers[worker_uid]) || (!CronServerController.getInstance().registered_cronWorkers[worker_uid].work)) {
            return;
        }

        if (!CronServerController.getInstance().run_crons) {
            return;
        }

        if (!CronServerController.getInstance().valid_crons_names[worker_uid]) {
            return;
        }

        if (!CronServerController.getInstance().cronWorkers_semaphores[worker_uid]) {
            return;
        }

        CronServerController.getInstance().cronWorkers_semaphores[worker_uid] = false;

        ConsoleHandler.getInstance().log('CRON:LANCEMENT:' + worker_uid);
        await CronServerController.getInstance().registered_cronWorkers[worker_uid].work();
        ConsoleHandler.getInstance().log('CRON:FIN:' + worker_uid);

        CronServerController.getInstance().cronWorkers_semaphores[worker_uid] = true;
    }

    private async nextRecurrence(plannedWorker: CronWorkerPlanification) {
        if ((!plannedWorker) || (plannedWorker.type_recurrence == CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE)) {
            plannedWorker.date_heure_planifiee = null;
            await ModuleDAO.getInstance().insertOrUpdateVO(plannedWorker);

            return;
        }

        let date_heure_planifiee: moment.Moment = moment(plannedWorker.date_heure_planifiee).utc(true);

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