
import { MessagePort, parentPort, Worker } from 'worker_threads';
import ModuleFork from '../../../shared/modules/Fork/ModuleFork';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import PerfReportController from '../../../shared/modules/PerfReport/PerfReportController';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import BgthreadPerfModuleNamesHolder from '../BGThread/BgthreadPerfModuleNamesHolder';
import BGThreadServerDataManager from '../BGThread/BGThreadServerDataManager';
import ModuleServerBase from '../ModuleServerBase';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ForkedTasksController from './ForkedTasksController';
import ForkMessageController from './ForkMessageController';
import ForkServerController from './ForkServerController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import BGThreadProcessTaskForkMessage from './messages/BGThreadProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
// import KillForkMessage from './messages/KillForkMessage';
import MainProcessForwardToBGThreadForkMessage from './messages/MainProcessForwardToBGThreadForkMessage';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import PingForkACKMessage from './messages/PingForkACKMessage';
import PingForkMessage from './messages/PingForkMessage';
import ReloadAsapForkMessage from './messages/ReloadAsapForkMessage';
import TaskResultForkMessage from './messages/TaskResultForkMessage';
import RegisteredForkedTasksController from './RegisteredForkedTasksController';

export default class ModuleForkServer extends ModuleServerBase {


    private static instance: ModuleForkServer = null;

    public is_killing: boolean = false;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleFork.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleForkServer.instance) {
            ModuleForkServer.instance = new ModuleForkServer();
        }
        return ModuleForkServer.instance;
    }

    public async configure(): Promise<void> {
        ForkMessageController.register_message_handler(ReloadAsapForkMessage.FORK_MESSAGE_TYPE, this.prepare_reload_asap.bind(this));
        // ForkMessageController.register_message_handler(KillForkMessage.FORK_MESSAGE_TYPE, this.handle_kill_message.bind(this));
        ForkMessageController.register_message_handler(PingForkMessage.FORK_MESSAGE_TYPE, this.handle_ping_message.bind(this));
        ForkMessageController.register_message_handler(PingForkACKMessage.FORK_MESSAGE_TYPE, this.handle_pingack_message.bind(this));
        ForkMessageController.register_message_handler(AliveForkMessage.FORK_MESSAGE_TYPE, this.handle_alive_message.bind(this));
        ForkMessageController.register_message_handler(BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE, this.handle_broadcast_message.bind(this));
        ForkMessageController.register_message_handler(MainProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_mainprocesstask_message.bind(this));
        ForkMessageController.register_message_handler(MainProcessForwardToBGThreadForkMessage.FORK_MESSAGE_TYPE, this.handle_mainprocessforwardtobgtask_message.bind(this));
        ForkMessageController.register_message_handler(BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_bgthreadprocesstask_message.bind(this));
        ForkMessageController.register_message_handler(TaskResultForkMessage.FORK_MESSAGE_TYPE, this.handle_taskresult_message.bind(this));
    }

    // public async kill_process(throttle: number = 10, force_empty_vars_datas_vo_update_cache: boolean = true) {
    //     this.is_killing = true;

    //     if (force_empty_vars_datas_vo_update_cache) {
    //         await VarsDatasVoUpdateHandler.force_empty_vars_datas_vo_update_cache();
    //     }

    //     while (throttle > 0) {
    //         ConsoleHandler.error("Received KILL SIGN from parent - KILL in " + throttle);
    //         await ThreadHandler.sleep(1000, 'ModuleForkServer.kill_process');
    //         throttle--;
    //     }
    //     ConsoleHandler.error("Received KILL SIGN from parent - Before KILL inform parent thread to reload thread asap");
    //     await ForkMessageController.send(
    //         new ReloadAsapForkMessage().set_message_content(threadId),
    //         parentPort
    //     );
    //     ConsoleHandler.error("Received KILL SIGN from parent - KILL");
    //     process.exit();
    // }

    /**
     * Doit être appelé sur le main thread
     */
    private async prepare_reload_asap(msg: ReloadAsapForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        if (!msg.message_content) {

            return false;
        }

        ForkServerController.forks_reload_asap[msg.message_content] = true;
        return true;
    }

    /**
     * On cherche le callback à appeler dans le controller et on envoi le résultat
     */
    private async handle_taskresult_message(msg: TaskResultForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        if ((!msg.callback_id) || (!ForkedTasksController.registered_task_result_wrappers) ||
            (!ForkedTasksController.registered_task_result_wrappers[msg.callback_id])) {

            return false;
        }

        if (msg.throw_error) {
            ConsoleHandler.error('handle_taskresult_message:' + msg.throw_error + ':' +
                msg.callback_id + ':' + msg.message_type + ':' + JSON.stringify(msg.message_content));
            if (ForkedTasksController.registered_task_result_wrappers[msg.callback_id]) {

                const thrower = ForkedTasksController.registered_task_result_wrappers[msg.callback_id].thrower;
                thrower(msg.throw_error);
                delete ForkedTasksController.registered_task_result_wrappers[msg.callback_id];
            }
            return true;
        }

        const resolver = ForkedTasksController.registered_task_result_wrappers[msg.callback_id].resolver;
        delete ForkedTasksController.registered_task_result_wrappers[msg.callback_id];
        resolver(msg.message_content);
        return true;
    }


    /**
     * On doit donc être sur le main process, on cherche juste la fonction qui a été demandée
     */
    private async handle_mainprocesstask_message(msg: MainProcessTaskForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        if ((!msg.message_content) || (!RegisteredForkedTasksController.registered_tasks) ||
            (!RegisteredForkedTasksController.registered_tasks[msg.message_content])) {

            return false;
        }

        let res;
        try {
            // On propage le StackContext
            res = await StackContext.runPromise(
                msg.stack_context,
                RegisteredForkedTasksController.registered_tasks[msg.message_content],
                RegisteredForkedTasksController,
                ...msg.message_content_params
            );
        } catch (error) {
            ConsoleHandler.error('handle_mainprocesstask_message:' + error);
        }

        if (msg.callback_id) {
            await ForkMessageController.send(new TaskResultForkMessage(res, msg.callback_forked_uid, msg.callback_id), send_handle);
        }

        return true;
    }

    private async handle_mainprocessforwardtobgtask_message(msg: BGThreadProcessTaskForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        /**
         * Là on est sur le main thread, on a reçu une demande d'un bg thread à forwarder vers un autre
         *  On check si on est en plein kill
         *  Sinon on envoie la demande au bgthread en param et quand on a le résultat on renvoie au bgthread qui avait posé la question initialement
         */
        /**
         * Si un kill est en cours on throw une erreur ici pour répondre à la demande le plus vite possible
         */
        if (this.is_killing) {
            ConsoleHandler.error('handle_bgthreadprocesstask_message:KILLING TASK HANDLER:' + JSON.stringify(msg));
            if (msg.callback_id) {
                await ForkMessageController.send(new TaskResultForkMessage(null, msg.callback_forked_uid, msg.callback_id, 'KILLING TASK HANDLER'), send_handle);
            } else {
                throw new Error('KILLING TASK HANDLER');
            }
            return true;
        }

        return new Promise(async (resolve, reject) => {

            const thrower = async (error) => {
                if (msg.callback_id) {
                    await ForkMessageController.send(new TaskResultForkMessage(null, msg.callback_forked_uid, msg.callback_id, error), send_handle);
                } else {
                    ConsoleHandler.error('Failed message:' + error + ':' + JSON.stringify(msg));
                }
                reject();
            };

            const resolver = async (res) => {
                if (msg.callback_id) {
                    await ForkMessageController.send(new TaskResultForkMessage(res, msg.callback_forked_uid, msg.callback_id), send_handle);
                }
                resolve(res);
            };

            // On propage le StackContext
            await StackContext.runPromise(
                msg.stack_context,
                ForkedTasksController.exec_self_on_bgthread_and_return_value,
                ForkedTasksController,
                true,
                thrower,
                msg.bgthread,
                msg.message_content,
                resolver,
                ...msg.message_content_params);
        });
    }

    /**
     * Si on est sur le bon thread on lance l'action
     */
    private async handle_bgthreadprocesstask_message(msg: BGThreadProcessTaskForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        if ((!msg.message_content) || (!RegisteredForkedTasksController.registered_tasks) ||
            (!RegisteredForkedTasksController.registered_tasks[msg.message_content]) ||
            (!BGThreadServerDataManager.valid_bgthreads_names[msg.bgthread])) {
            return false;
        }

        /**
         * Si un kill est en cours on throw une erreur ici pour répondre à la demande le plus vite possible
         */
        if (this.is_killing) {
            ConsoleHandler.error('handle_bgthreadprocesstask_message:KILLING TASK HANDLER:' + JSON.stringify(msg));
            if (msg.callback_id) {
                await ForkMessageController.broadcast(new TaskResultForkMessage(null, msg.callback_forked_uid, msg.callback_id, 'KILLING TASK HANDLER'));
            } else {
                throw new Error('KILLING TASK HANDLER');
            }
            return true;
        }

        let res;
        try {

            // On propage le StackContext
            res = await StackContext.runPromise(
                msg.stack_context,
                RegisteredForkedTasksController.registered_tasks[msg.message_content],
                RegisteredForkedTasksController,
                ...msg.message_content_params,
            );

        } catch (error) {
            ConsoleHandler.error('handle_bgthreadprocesstask_message:' + error);
        }

        if (msg.callback_id) {
            await ForkMessageController.broadcast(new TaskResultForkMessage(res, msg.callback_forked_uid, msg.callback_id));
        }

        return true;
    }

    private async handle_pingack_message(msg: IForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {

        const now_ms = Dates.now_ms();
        ForkServerController.forks_availability[msg.message_content] = Dates.now();
        const delay = now_ms - (msg as PingForkACKMessage).emission_date_ms;
        const fork = ForkServerController.forks[msg.message_content];

        StatsController.register_stat_COMPTEUR('ModuleForkServer', 'bgthread_ping_ack', 'received_from_' + fork.uid);
        StatsController.register_stat_DUREE('ModuleForkServer', 'bgthread_ping_ack', 'total_delay_' + fork.uid, delay);
        StatsController.register_stat_DUREE('ModuleForkServer', 'bgthread_ping_ack', 'main_to_bgthread_' + fork.uid + '__delay', (msg as PingForkACKMessage).response_date_ms - (msg as PingForkACKMessage).emission_date_ms);
        StatsController.register_stat_DUREE('ModuleForkServer', 'bgthread_ping_ack', 'bgthread_' + fork.uid + '_to_main__delay', now_ms - (msg as PingForkACKMessage).response_date_ms);

        PerfReportController.add_event(
            BgthreadPerfModuleNamesHolder.BGTHREAD_PING_LATENCY_PERF_MODULE_NAME,
            'bgthread_' + fork.uid + '_ping_latency',
            'bgthread_' + fork.uid + '_ping_latency',
            'bgthread_' + fork.uid + '_ping_latency',
            (msg as PingForkACKMessage).emission_date_ms,
            'Emission du ping par le main thread vers le bgthread [' + fork.uid + ']<br>' +
            'Ce bgthread gère les processus : ' + Object.keys(fork.processes).join(', '),
        );

        PerfReportController.add_call(
            BgthreadPerfModuleNamesHolder.BGTHREAD_PING_LATENCY_PERF_MODULE_NAME,
            'bgthread_' + fork.uid + '_ping_latency',
            'bgthread_' + fork.uid + '_ping_latency',
            'bgthread_' + fork.uid + '_ping_latency',
            (msg as PingForkACKMessage).emission_date_ms,
            (msg as PingForkACKMessage).response_date_ms,
            'Délai entre l\'émission par le main thread et la réception par le bgthread [' + fork.uid + '] : ' + ((msg as PingForkACKMessage).response_date_ms - (msg as PingForkACKMessage).emission_date_ms) + ' ms<br>' +
            'Délai entre l\'émission de la réponse par le bgthread [' + fork.uid + ']  et sa réception sur le main thread : ' + (now_ms - (msg as PingForkACKMessage).response_date_ms) + ' ms<br>' +
            'Délai total : ' + (now_ms - (msg as PingForkACKMessage).emission_date_ms) + ' ms<br>' +
            'Ce bgthread gère les processus : ' + Object.keys(fork.processes).join(', ')
        );

        PerfReportController.add_cooldown(
            BgthreadPerfModuleNamesHolder.BGTHREAD_PING_LATENCY_PERF_MODULE_NAME,
            'bgthread_' + fork.uid + '_ping_latency',
            'bgthread_' + fork.uid + '_ping_latency',
            'bgthread_' + fork.uid + '_ping_latency',
            (msg as PingForkACKMessage).response_date_ms,
            now_ms,
            'Délai entre l\'émission par le main thread et la réception par le bgthread [' + fork.uid + '] : ' + ((msg as PingForkACKMessage).response_date_ms - (msg as PingForkACKMessage).emission_date_ms) + ' ms<br>' +
            'Délai entre l\'émission de la réponse par le bgthread [' + fork.uid + ']  et sa réception sur le main thread : ' + (now_ms - (msg as PingForkACKMessage).response_date_ms) + ' ms<br>' +
            'Délai total : ' + (now_ms - (msg as PingForkACKMessage).emission_date_ms) + ' ms<br>' +
            'Ce bgthread gère les processus : ' + Object.keys(fork.processes).join(', ')
        );

        // D'abord la console
        let log_to_console = false;
        if (ConfigurationService.node_configuration.debug_all_thread_ping_latency) {
            log_to_console = true;
        } else {
            if (ConfigurationService.node_configuration.debug_thread_ping_latency &&
                (delay > ConfigurationService.node_configuration.debug_thread_ping_latency_console_log_ms_limit)) {
                log_to_console = true;
            }
        }

        if (log_to_console) {
            ConsoleHandler.log(
                "Ping delay for bgthread [" + fork.uid + "] is <b>" + delay + "ms</b><br>" +
                "Ping message sent by main process at " + (msg as PingForkACKMessage).emission_date_ms + " ms<br>" +
                "Ping message received by bgthread at " + (msg as PingForkACKMessage).response_date_ms + " ms <b>(main -> bgthread delay: " + ((msg as PingForkACKMessage).response_date_ms - (msg as PingForkACKMessage).emission_date_ms) + " ms)</b><br>" +
                "Ping ACK received by main process at " + now_ms + " ms <b>(bgthread -> main delay: " + (now_ms - (msg as PingForkACKMessage).response_date_ms) + " ms)</b><br>" +
                "Processes managed by this worker : " + Object.keys(fork.processes).join(', ')
            );
        }

        // Ensuite teams
        if (ConfigurationService.node_configuration.debug_thread_ping_latency && (delay > ConfigurationService.node_configuration.debug_thread_ping_latency_teams_log_ms_limit)) {
            TeamsAPIServerController.send_teams_warn(
                'BGThreads - Ping Delay',
                "Ping delay for bgthread [" + fork.uid + "] is <b>" + delay + "ms</b><br>" +
                "Processes managed by this worker : " + Object.keys(fork.processes).join(', ')
            );
        }

        return true;
    }

    // private async handle_kill_message(msg: KillForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {

    //     const throttle = msg ? msg.message_content : 10;

    //     await ModuleForkServer.getInstance().kill_process(throttle, msg.force_empty_vars_datas_vo_update_cache);
    //     return false;
    // }

    private async handle_ping_message(msg: IForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        await ForkMessageController.send(new PingForkACKMessage(msg.message_content, (msg as PingForkMessage).emission_date_ms, Dates.now_ms()), parentPort);
        return true;
    }

    private async handle_alive_message(msg: IForkMessage, send_handle: Worker | MessagePort): Promise<boolean> {
        ForkServerController.forks_alive[msg.message_content] = true;

        // if (!ForkServerController.forks_alive_historic_pids[msg.message_content]) {
        //     ForkServerController.forks_alive_historic_pids[msg.message_content] = [];
        // }
        // ForkServerController.forks_alive_historic_pids[msg.message_content].push(send_handle.pid);

        ForkServerController.forks_waiting_to_be_alive--;
        if (ForkServerController.forks_waiting_to_be_alive <= 0) {
            ForkServerController.forks_are_initialized = true;
        }
        ConsoleHandler.log('Process [' + msg.message_content + ']: ALIVE'); // - Sending back UID');
        // ForkServerController.forks_uid_sent[msg.message_content] = true;
        return true;
    }

    /**
     * On est donc sur le parent, on décapsule et on broadcast le vrai message
     * @param msg
     */
    private async handle_broadcast_message(msg: BroadcastWrapperForkMessage): Promise<boolean> {

        await ForkMessageController.broadcast(msg.message_content, (msg.ignore_sender ? msg.sender_uid : null));

        return true;
    }
}