import { fork } from 'child_process';


import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
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

    // public static static PARAM_NAME_NODE_MEM_SIZE: string = 'ForkServerController.NODE_MEM_SIZE';

    // istanbul ignore next: nothing to test : getInstance

    /**
     * Local thread cache -----
     */
    public static forks_are_initialized: boolean = false;
    public static forks_waiting_to_be_alive: number = 0;
    public static forks_availability: { [uid: number]: number } = {};
    public static forks_reload_asap: { [uid: number]: boolean } = {};
    public static forks_alive: { [uid: number]: boolean } = {};

    // On informe chaque thread de son identité auprès du parent pour permettre de faire des communications identifiées et plus tard inter-threads
    public static forks_uid_sent: { [uid: number]: boolean } = {};

    public static throttled_reload_unavailable_threads = ThrottleHelper.declare_throttle_without_args(this.reload_unavailable_threads.bind(this), 500, { leading: false, trailing: true });
    public static fork_by_type_and_name: { [exec_type: string]: { [name: string]: IFork } } = {};

    public static forks: { [uid: number]: IFork } = {};
    public static UID: number = 0;
    /**
     * ----- Local thread cache
     */

    public static is_main_process(): boolean {
        return !ForkedProcessWrapperBase.getInstance();
    }

    public static async fork_threads() {
        // On fork a minima une fois pour mettre tous les bgthreads et crons dans un child process
        //  et éviter de bloquer le server pour un calcul de vars par exemple
        // Si des bgthreads ou des crons demandent à être isolés, on leur dédie un thread
        // On doit aussi mettre en place la communication entre le server et les forked process
        //  pour gérer les crons, qui sont lancés à la demande, soit individuellement, soit tous.
        //  On a pas ce problème sur les bgthreads, ils tournent ou pas

        // On ajoute le default_fork
        const default_fork: IFork = {
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

    public static async reload_unavailable_threads() {

        // On crée les process et on stocke les liens pour pouvoir envoyer les messages en temps voulu (typiquement pour le lancement des crons)
        for (const i in ForkServerController.forks) {
            const forked: IFork = ForkServerController.forks[i];

            if (ForkServerController.forks_availability[i]) {
                continue;
            }

            ForkServerController.forks_availability[i] = Dates.now();

            if (ConfigurationService.node_configuration.debug_forks && (process.debugPort != null) && (typeof process.debugPort !== 'undefined')) {
                forked.child_process = fork('./dist/server/ForkedProcessWrapper.js', ForkServerController.get_argv(forked), {
                    execArgv: ['--inspect=' + (process.debugPort + forked.uid + 1), '--max-old-space-size=4096'],
                    serialization: "advanced"
                });
            } else {
                forked.child_process = fork('./dist/server/ForkedProcessWrapper.js', ForkServerController.get_argv(forked), {
                    execArgv: ['--max-old-space-size=4096'],
                    serialization: "advanced"
                });
            }

            if (ForkMessageController.stacked_msg_waiting && ForkMessageController.stacked_msg_waiting.length) {
                for (const j in ForkMessageController.stacked_msg_waiting) {
                    const stacked_msg_waiting = ForkMessageController.stacked_msg_waiting[j];

                    if (stacked_msg_waiting.forked_target && (stacked_msg_waiting.forked_target.uid == forked.uid)) {
                        stacked_msg_waiting.sendHandle = forked.child_process;
                    }
                }
            }

            forked.child_process.on('message', async (msg: IForkMessage) => {
                msg = APIControllerWrapper.try_translate_vo_from_api(msg);
                await ForkMessageController.message_handler(msg, forked.child_process);
            });

            // /**
            //  * On attend le alive du fork avant de continuer
            //  */
            // let max_timeout = 300;
            // while (!ForkServerController.forks_alive[i]) {
            //     await ThreadHandler.sleep(1000, 'reload_unavailable_threads.!forks_alive.' + forked.uid);
            //     max_timeout--;
            //     if (!(max_timeout % 10)) {
            //         ConsoleHandler.log('Waiting for ALIVE SIGNAL from fork ' + forked.uid);
            //     }

            //     if (max_timeout == 60) {
            //         ConsoleHandler.warn('60 secs until timeout while waiting for ALIVE SIGNAL from fork ' + forked.uid);
            //     }

            //     if (max_timeout <= 0) {
            //         ConsoleHandler.error('Timeout while waiting for ALIVE SIGNAL from fork ' + forked.uid);
            //         break;
            //     }
            // }
        }

        /**
         * On attend le alive des forks avant de continuer
         */
        const promises_pipeline = new PromisePipeline(100, 'ForkServerController.reload_unavailable_threads');
        for (const i in ForkServerController.forks) {
            const forked: IFork = ForkServerController.forks[i];

            if (!ForkServerController.forks_availability[i]) {
                continue;
            }

            await promises_pipeline.push(async () => {
                let max_timeout = 300;
                while (!ForkServerController.forks_alive[i]) {
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
            });
        }
        await promises_pipeline.end();
    }

    private static get_argv(forked: IFork): string[] {
        const res: string[] = [forked.uid.toString()];

        for (const i in forked.processes) {
            const proc = forked.processes[i];

            res.push(proc.type + ':' + proc.name);
        }

        return res;
    }

    private static prepare_forked_bgtreads(default_fork: IFork) {
        for (const i in BGThreadServerController.registered_BGThreads) {
            const bgthread: IBGThread = BGThreadServerController.registered_BGThreads[i];

            const forked_bgthread: IForkProcess = {
                name: bgthread.name,
                type: BGThreadServerController.ForkedProcessType
            };

            if (!this.fork_by_type_and_name[BGThreadServerController.ForkedProcessType]) {
                this.fork_by_type_and_name[BGThreadServerController.ForkedProcessType] = {};
            }

            if (bgthread.exec_in_dedicated_thread) {
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

    private static prepare_forked_crons(default_fork: IFork) {
        for (const i in CronServerController.getInstance().registered_cronWorkers) {
            const cron: ICronWorker = CronServerController.getInstance().registered_cronWorkers[i];

            const forked_cron: IForkProcess = {
                name: cron.worker_uid,
                type: CronServerController.ForkedProcessType
            };

            if (!this.fork_by_type_and_name[CronServerController.ForkedProcessType]) {
                this.fork_by_type_and_name[CronServerController.ForkedProcessType] = {};
            }

            if (cron.exec_in_dedicated_thread) {
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

    private static async checkForksAvailability() {

        ThreadHandler.set_interval(async () => {

            for (const i in this.forks) {
                const forked: IFork = this.forks[i];

                if (!this.forks_availability[i]) {
                    continue;
                }

                await ForkMessageController.send(new PingForkMessage(forked.uid), forked.child_process, forked);
            }
        }, 10000, 'ForkServerController.checkForksAvailability', false);
    }
}