
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
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';

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
    public cronWorkers_semaphores_reload: { [worker_uid: string]: boolean } = {};

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
                await ForkMessageController.getInstance().send(new BroadcastWrapperForkMessage(new RunCronForkMessage(worker_uid)));
            }
        } else {

            if ((!ForkServerController.getInstance().process_fork_by_type_and_name[CronServerController.ForkedProcessType]) ||
                (!ForkServerController.getInstance().process_fork_by_type_and_name[CronServerController.ForkedProcessType][worker_uid])) {
                return false;
            }
            let forked = ForkServerController.getInstance().process_fork_by_type_and_name[CronServerController.ForkedProcessType][worker_uid];
            await ForkMessageController.getInstance().send(new RunCronForkMessage(worker_uid), forked.child_process, forked);
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

            let plannedWorkers: CronWorkerPlanification[] = await query(CronWorkerPlanification.API_TYPE_ID).select_vos<CronWorkerPlanification>();

            if (plannedWorkers) {
                plannedWorkers = plannedWorkers.sort((a: CronWorkerPlanification, b: CronWorkerPlanification) => {
                    if (a.date_heure_planifiee < b.date_heure_planifiee) { return -1; }
                    if (a.date_heure_planifiee > b.date_heure_planifiee) { return 1; }
                    return 0;
                });
            }

            for (let i in plannedWorkers) {
                let plannedWorker: CronWorkerPlanification = plannedWorkers[i];

                if (!CronServerController.getInstance().valid_crons_names[plannedWorker.worker_uid]) {
                    continue;
                }

                if (plannedWorker.date_heure_planifiee && (plannedWorker.date_heure_planifiee <= Dates.now())) {
                    await this.executeWorker(plannedWorker.worker_uid);
                    await this.nextRecurrence(plannedWorker);
                }
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
        CronServerController.getInstance().semaphore = false;
        return true;
    }

    private async handle_runcron_message(msg: RunCronForkMessage): Promise<boolean> {
        try {
            await this.run_cron(msg.message_content);
        } catch (error) {
            ConsoleHandler.error('handle_runcron_message:' + error);
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

        // Si un cron est demandé mais déjà en cours, on attend qu'il soit dispo pour le relancer
        if (!CronServerController.getInstance().cronWorkers_semaphores[worker_uid]) {
            if (!CronServerController.getInstance().cronWorkers_semaphores_reload[worker_uid]) {
                CronServerController.getInstance().cronWorkers_semaphores_reload[worker_uid] = true;
                while (!CronServerController.getInstance().cronWorkers_semaphores[worker_uid]) {
                    await ThreadHandler.getInstance().sleep(1000);
                }
            } else {
                return;
            }
        }

        CronServerController.getInstance().cronWorkers_semaphores_reload[worker_uid] = false;
        CronServerController.getInstance().cronWorkers_semaphores[worker_uid] = false;

        ConsoleHandler.log('CRON:LANCEMENT:' + worker_uid);

        try {
            await CronServerController.getInstance().registered_cronWorkers[worker_uid].work();
        } catch (error) {
            ConsoleHandler.error('run_cron:' + error);
        }

        ConsoleHandler.log('CRON:FIN:' + worker_uid);

        CronServerController.getInstance().cronWorkers_semaphores[worker_uid] = true;
    }

    private async nextRecurrence(plannedWorker: CronWorkerPlanification) {
        if ((!plannedWorker) || (plannedWorker.type_recurrence == CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE)) {
            plannedWorker.date_heure_planifiee = null;
            await ModuleDAO.getInstance().insertOrUpdateVO(plannedWorker);

            return;
        }

        let type_interval = null;

        switch (plannedWorker.type_recurrence) {
            case CronWorkerPlanification.TYPE_RECURRENCE_ANNEES:
                type_interval = TimeSegment.TYPE_YEAR;
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_HEURES:
                type_interval = TimeSegment.TYPE_HOUR;
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_JOURS:
                type_interval = TimeSegment.TYPE_DAY;
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_MINUTES:
                type_interval = TimeSegment.TYPE_MINUTE;
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_MOIS:
                type_interval = TimeSegment.TYPE_MONTH;
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_SEMAINES:
                type_interval = TimeSegment.TYPE_WEEK;
                break;
            default:
        }
        plannedWorker.date_heure_planifiee = Dates.add(plannedWorker.date_heure_planifiee, plannedWorker.intervale_recurrence, type_interval);

        await ModuleDAO.getInstance().insertOrUpdateVO(plannedWorker);
    }
}