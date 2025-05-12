

import path from 'path';
import { Worker } from 'worker_threads';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import PerfReportController from '../../../shared/modules/PerfReport/PerfReportController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import { RunsOnMainThread } from '../BGThread/annotations/RunsOnMainThread';
import BgthreadPerfModuleNamesHolder from '../BGThread/BgthreadPerfModuleNamesHolder';
import BGThreadServerDataManager from '../BGThread/BGThreadServerDataManager';
import IBGThread from '../BGThread/interfaces/IBGThread';
import CronServerController from '../Cron/CronServerController';
import ICronWorker from '../Cron/interfaces/ICronWorker';
import ForkMessageController from './ForkMessageController';
import IFork from './interfaces/IFork';
import IForkMessage from './interfaces/IForkMessage';
import type { IForkProcess } from './interfaces/IForkProcess';
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
    // public static forks_alive_historic_pids: { [uid: number]: number[] } = {};

    // On informe chaque thread de son identité auprès du parent pour permettre de faire des communications identifiées et plus tard inter-threads
    public static forks_uid_sent: { [uid: number]: boolean } = {};

    public static throttled_reload_unavailable_threads = ThrottleHelper.declare_throttle_without_args(
        'ForkServerController.reload_unavailable_threads',
        this.reload_unavailable_threads.bind(this), 500, false);
    public static fork_by_type_and_name: { [exec_type: string]: { [name: string]: IFork } } = {};

    public static forks: { [uid: number]: IFork } = {};
    public static UID: number = 1;
    /**
     * ----- Local thread cache
     */

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
            worker: null
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

        ConsoleHandler.log('Pour info : Version actuelle de Node.js : ' + process.version);

        // On crée les process et on stocke les liens pour pouvoir envoyer les messages en temps voulu (typiquement pour le lancement des crons)
        for (const i in ForkServerController.forks) {
            const forked: IFork = ForkServerController.forks[i];

            ForkServerController.load_worker(forked);
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

    private static load_worker(forked: IFork) {

        if (ForkServerController.forks_availability[forked.uid]) {
            return;
        }

        ForkServerController.forks_availability[forked.uid] = Dates.now();
        const workerPath = path.resolve(process.cwd(), './dist/server/ForkedProcessWrapper.js');

        if (ConfigurationService.node_configuration.debug_forks && (process.debugPort != null) && (typeof process.debugPort !== 'undefined')) {
            forked.worker = new Worker(
                workerPath,
                {
                    workerData: ForkServerController.get_argv(forked),
                    execArgv: ['--inspect=' + (process.debugPort + forked.uid + 1), /*'--max-old-space-size=4096', '--expose-gc'*/],
                }
            );
        } else {
            forked.worker = new Worker(
                workerPath,
                {
                    workerData: ForkServerController.get_argv(forked),
                    execArgv: [/*'--max-old-space-size=4096', '--expose-gc'*/],
                }
            );
        }

        if (forked.worker.threadId != forked.uid) {
            ForkServerController.forks_availability[forked.worker.threadId] = ForkServerController.forks_availability[forked.uid];
            ForkServerController.forks_alive[forked.worker.threadId] = ForkServerController.forks_alive[forked.uid];
            delete ForkServerController.forks_availability[forked.uid];
            delete ForkServerController.forks_alive[forked.uid];
            forked.uid = forked.worker.threadId;
        }

        if (ForkMessageController.stacked_msg_waiting && ForkMessageController.stacked_msg_waiting.length) {
            for (const j in ForkMessageController.stacked_msg_waiting) {
                const stacked_msg_waiting = ForkMessageController.stacked_msg_waiting[j];

                if (stacked_msg_waiting.forked_target && (stacked_msg_waiting.forked_target.uid == forked.uid)) {
                    stacked_msg_waiting.send_handle = forked.worker;
                }
            }
        }

        /**
         * On contrôle à 3 minutes du lancement pour vérifier qu'on a bien un ALIVE de ce bgthread, et sinon on kill/restart le bgthread
         */
        ForkServerController.check_is_alive_after_timeout(forked, 3 * 60 * 1000);

        forked.worker.on('error', (error) => {
            ConsoleHandler.error('Erreur du worker uid:' + forked.uid + ' qui gère les processus : ' + Object.keys(forked.processes).join(', ') + ' : ' + error);
        });

        forked.worker.on('exit', (code) => {
            ConsoleHandler.error(`Le worker uid:${forked.uid} s'est arrêté avec le code ${code}. Il gérait les processus : ${Object.keys(forked.processes).join(', ')}`);
            ForkServerController.forks_availability[forked.uid] = 0;
            ForkServerController.forks_alive[forked.uid] = false;
            ForkServerController.load_worker(forked);
        });

        forked.worker.on('message', (msg: IForkMessage) => {

            // On commence par créer l'info de perfReport event de réception de query
            msg['PERF_MODULE_UID'] = msg['PERF_MODULE_UID'] ? msg['PERF_MODULE_UID'] : ForkMessageController.PERF_MODULE_UID++;
            const perf_name = 'ForkMessageController.message_handler.' + msg.message_type + ' [' + msg['PERF_MODULE_UID'] + ']';
            const perf_line_name = msg.message_type;
            PerfReportController.add_event(
                BgthreadPerfModuleNamesHolder.EXPRESSJS_PERF_MODULE_NAME,
                perf_name,
                perf_line_name,
                perf_line_name,
                Dates.now_ms(),
                perf_name + '<br>' +
                ForkMessageController.to_perf_desc(msg)
            );

            // cf GPT4.5 : Les messages reçus par un worker Node.js sont traités en série, car ils sont traités par un seul thread/event-loop.
            // Donc on await surtout pas ici et on renvoie pas la promise et on renvoie asap la main au worker
            setTimeout(() => {
                msg = ForkMessageController.reapply_prototypes_on_msg(msg);

                ForkMessageController.message_handler(msg, forked.worker);
            }, 1);

            // On rend la main
        });
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
        for (const i in BGThreadServerDataManager.registered_BGThreads) {
            const bgthread: IBGThread = BGThreadServerDataManager.registered_BGThreads[i];

            const forked_bgthread: IForkProcess = {
                name: bgthread.name,
                type: BGThreadServerDataManager.ForkedProcessType
            };

            if (!this.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType]) {
                this.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType] = {};
            }

            if (bgthread.exec_in_dedicated_thread) {
                this.forks[this.UID] = {
                    processes: {
                        [bgthread.name]: forked_bgthread
                    },
                    uid: this.UID,
                    worker: null
                };
                this.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread.name] = this.forks[this.UID];
                this.UID++;
            } else {
                default_fork.processes[bgthread.name] = forked_bgthread;
                this.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread.name] = default_fork;
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
                    worker: null
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

        ThreadHandler.set_interval(
            'ForkServerController.checkForksAvailability',
            async () => {

                for (const i in this.forks) {
                    const forked: IFork = this.forks[i];

                    if (!this.forks_availability[i]) {
                        continue;
                    }

                    await ForkMessageController.send(new PingForkMessage(forked.uid, Dates.now_ms()), forked.worker, forked);
                }
            },
            10000,
            'ForkServerController.checkForksAvailability',
            false,
        );
    }

    /**
     * JNE : 09/04/2025 suite cas en PROD d'un plantage de tous les bgthreads, tous redémarrent mais 4/6 ALIVE,
     * Pas de reboot probablement par ce que les threads continuent de répondre au ping, mais comme la bdd était pas dispo, les 2 premiers se sont pas chargés correctement et ont pas ALIVE
     * On rajoute du coup un contrôle à 3 minutes du lancement pour vérifier qu'on a bien un ALIVE de ce bgthread, et sinon on kill/restart le bgthread
     * On rajoute aussi un check de l'uid du worker, pour être sûr qu'on a pas un worker qui a été remplacé par un autre
     */
    private static async check_is_alive_after_timeout(forked: IFork, timeout_ms: number) {

        try {

            await ThreadHandler.sleep(timeout_ms, 'ForkServerController.check_is_alive_after_timeout', true);

            // On check que le thread a pas déjà exit et replace
            if (!forked.worker) {
                ConsoleHandler.warn('ForkServerController.check_is_alive_after_timeout : checked after ' + (timeout_ms / 1000 / 60) + ' minutes : fork ' + forked.uid + ' has no worker - probably existed already, ignoring it');
                return;
            }

            if (ForkServerController.forks_alive[forked.uid] && ForkServerController.forks_availability[forked.uid]) {
                ConsoleHandler.log('ForkServerController.check_is_alive_after_timeout : checked after ' + (timeout_ms / 1000 / 60) + ' minutes : fork ' + forked.uid + ' is alive');
                return;
            }

            ConsoleHandler.error('ForkServerController.check_is_alive_after_timeout : checked after ' + (timeout_ms / 1000 / 60) + ' minutes : fork ' + forked.uid + ' is NOT alive, killing it');

            // On kill le fork => le reload se fait par le callback du exit normalement...
            if (forked.worker) {
                forked.worker.terminate();
                forked.worker = null;
            }
        } catch (error) {
            ConsoleHandler.error('ForkServerController.check_is_alive_after_timeout : error while checking if alive : ' + error);
        }
    }

    @RunsOnMainThread(null)
    public static kill_worker(bgthread_name: string) {

        if (!bgthread_name) {
            ConsoleHandler.error('bgthread_name is not defined');
            return;
        }

        if (!ForkServerController.fork_by_type_and_name) {
            ConsoleHandler.error('ForkServerController.forks is not defined');
            return;
        }
        if (!ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType]) {
            ConsoleHandler.error('ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType] is not defined');
            return;
        }

        if (!ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread_name]) {
            ConsoleHandler.error('ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][' + bgthread_name + '] is not defined');
            return;
        }

        if (!ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread_name].worker) {
            ConsoleHandler.error('ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][' + bgthread_name + '].worker is not defined');
            return;
        }

        return ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread_name].worker.terminate();
    }
}