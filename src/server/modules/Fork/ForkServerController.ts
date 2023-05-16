import { fork } from 'child_process';


import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import IBGThread from '../BGThread/interfaces/IBGThread';
import CronServerController from '../Cron/CronServerController';
import ICronWorker from '../Cron/interfaces/ICronWorker';
import ForkedProcessWrapperBase from './ForkedProcessWrapperBase';
import ForkMessageController from './ForkMessageController';
import IFork from './interfaces/IFork';
import IForkMessage from './interfaces/IForkMessage';
import IForkProcess from './interfaces/IForkProcess';
import PingForkMessage from './messages/PingForkMessage';

export default class ForkServerController {

    // public static PARAM_NAME_NODE_MEM_SIZE: string = 'ForkServerController.NODE_MEM_SIZE';

    public static getInstance() {
        if (!ForkServerController.instance) {
            ForkServerController.instance = new ForkServerController();
        }
        return ForkServerController.instance;
    }

    private static instance: ForkServerController = null;

    /**
     * Local thread cache -----
     */
    public forks_are_initialized: boolean = false;
    public forks_waiting_to_be_alive: number = 0;
    public forks_availability: { [uid: number]: number } = {};
    public forks_reload_asap: { [uid: number]: boolean } = {};
    public forks_alive: { [uid: number]: boolean } = {};
    public throttled_reload_unavailable_threads = ThrottleHelper.getInstance().declare_throttle_without_args(this.reload_unavailable_threads.bind(this), 10000, { leading: false, trailing: true });
    public fork_by_type_and_name: { [exec_type: string]: { [name: string]: IFork } } = {};
    private forks: { [uid: number]: IFork } = {};
    private UID: number = 0;
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    get process_forks(): { [uid: number]: IFork } {
        return this.forks;
    }

    get process_fork_by_type_and_name(): { [exec_type: string]: { [name: string]: IFork } } {
        return this.fork_by_type_and_name;
    }

    get is_main_process(): boolean {
        return !ForkedProcessWrapperBase.getInstance();
    }

    public async fork_threads() {
        // On fork a minima une fois pour mettre tous les bgthreads et crons dans un child process
        //  et éviter de bloquer le server pour un calcul de vars par exemple
        // Si des bgthreads ou des crons demandent à être isolés, on leur dédie un thread
        // On doit aussi mettre en place la communication entre le server et les forked process
        //  pour gérer les crons, qui sont lancés à la demande, soit individuellement, soit tous.
        //  On a pas ce problème sur les bgthreads, ils tournent ou pas

        // On ajoute le default_fork
        let default_fork: IFork = {
            processes: {},
            uid: this.UID++,
            child_process: null
        };
        this.forks[default_fork.uid] = default_fork;

        this.prepare_forked_bgtreads(default_fork);
        this.prepare_forked_crons(default_fork);

        this.forks_waiting_to_be_alive = Object.keys(this.forks).length;

        await this.reload_unavailable_threads();

        /**
         * On met en place un thread sur le master qui check le status régulièrement des forked (en tentant d'envoyer un alive)
         */
        this.checkForksAvailability().then().catch((error) => ConsoleHandler.error(error));
    }

    public async reload_unavailable_threads() {

        // On crée les process et on stocke les liens pour pouvoir envoyer les messages en temps voulu (typiquement pour le lancement des crons)
        for (let i in ForkServerController.getInstance().forks) {
            let forked: IFork = ForkServerController.getInstance().forks[i];

            if (ForkServerController.getInstance().forks_availability[i]) {
                continue;
            }

            ForkServerController.getInstance().forks_availability[i] = Dates.now();

            if (ConfigurationService.node_configuration.DEBUG_FORKS && (process.debugPort != null) && (typeof process.debugPort !== 'undefined')) {
                forked.child_process = fork('./dist/server/ForkedProcessWrapper.js', ForkServerController.getInstance().get_argv(forked), {
                    execArgv: ['--inspect=' + (process.debugPort + forked.uid + 1), '--max-old-space-size=4096'],
                    serialization: "advanced"
                });
            } else {
                forked.child_process = fork('./dist/server/ForkedProcessWrapper.js', ForkServerController.getInstance().get_argv(forked), {
                    execArgv: ['--max-old-space-size=4096'],
                    serialization: "advanced"
                });
            }

            if (ForkMessageController.getInstance().stacked_msg_waiting && ForkMessageController.getInstance().stacked_msg_waiting.length) {
                for (let j in ForkMessageController.getInstance().stacked_msg_waiting) {
                    let stacked_msg_waiting = ForkMessageController.getInstance().stacked_msg_waiting[j];

                    if (stacked_msg_waiting.forked_target && (stacked_msg_waiting.forked_target.uid == forked.uid)) {
                        stacked_msg_waiting.sendHandle = forked.child_process;
                    }
                }
            }

            forked.child_process.on('message', async (msg: IForkMessage) => {
                msg = APIControllerWrapper.try_translate_vo_from_api(msg);
                await ForkMessageController.getInstance().message_handler(msg, forked.child_process);
            });

            /**
             * On attend le alive du fork avant de continuer
             */
            let max_timeout = 300;
            while (!ForkServerController.getInstance().forks_alive[i]) {
                await ThreadHandler.sleep(1000, 'reload_unavailable_threads.!forks_alive.' + forked.uid);
                max_timeout--;
                if (!(max_timeout % 10)) {
                    ConsoleHandler.log('Waiting for ALIVE SIGNAL from fork ' + forked.uid);
                }

                if (max_timeout == 60) {
                    ConsoleHandler.warn('60 secs until timeout while waiting for ALIVE SIGNAL from fork ' + forked.uid);
                }

                if (max_timeout <= 0) {
                    ConsoleHandler.error('Timeout while waiting for ALIVE SIGNAL from fork ' + forked.uid);
                    break;
                }
            }
        }
    }

    private get_argv(forked: IFork): string[] {
        let res: string[] = [forked.uid.toString()];

        for (let i in forked.processes) {
            let proc = forked.processes[i];

            res.push(proc.type + ':' + proc.name);
        }

        return res;
    }

    private prepare_forked_bgtreads(default_fork: IFork) {
        for (let i in BGThreadServerController.getInstance().registered_BGThreads) {
            let bgthread: IBGThread = BGThreadServerController.getInstance().registered_BGThreads[i];

            let forked_bgthread: IForkProcess = {
                name: bgthread.name,
                type: BGThreadServerController.ForkedProcessType
            };

            if (!this.fork_by_type_and_name[BGThreadServerController.ForkedProcessType]) {
                this.fork_by_type_and_name[BGThreadServerController.ForkedProcessType] = {};
            }

            if (!!bgthread.exec_in_dedicated_thread) {
                this.forks[this.UID] = {
                    processes: {
                        [bgthread.name]: forked_bgthread
                    },
                    uid: this.UID,
                    child_process: null
                };
                this.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread.name] = this.forks[this.UID];
                this.UID++;
            } else {
                default_fork.processes[bgthread.name] = forked_bgthread;
                this.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread.name] = default_fork;
            }
        }
    }

    private prepare_forked_crons(default_fork: IFork) {
        for (let i in CronServerController.getInstance().registered_cronWorkers) {
            let cron: ICronWorker = CronServerController.getInstance().registered_cronWorkers[i];

            let forked_cron: IForkProcess = {
                name: cron.worker_uid,
                type: CronServerController.ForkedProcessType
            };

            if (!this.fork_by_type_and_name[CronServerController.ForkedProcessType]) {
                this.fork_by_type_and_name[CronServerController.ForkedProcessType] = {};
            }

            if (!!cron.exec_in_dedicated_thread) {
                this.forks[this.UID] = {
                    processes: {
                        [cron.worker_uid]: forked_cron
                    },
                    uid: this.UID,
                    child_process: null
                };
                this.fork_by_type_and_name[CronServerController.ForkedProcessType][cron.worker_uid] = this.forks[this.UID];

                this.UID++;
            } else {
                default_fork.processes[cron.worker_uid] = forked_cron;
                this.fork_by_type_and_name[CronServerController.ForkedProcessType][cron.worker_uid] = default_fork;
            }
        }
    }

    private async checkForksAvailability() {

        while (true) {

            await ThreadHandler.sleep(10000, 'ForkServerController.checkForksAvailability');

            for (let i in this.forks) {
                let forked: IFork = this.forks[i];

                if (!this.forks_availability[i]) {
                    continue;
                }

                await ForkMessageController.getInstance().send(new PingForkMessage(forked.uid), forked.child_process, forked);
            }
        }
    }
}