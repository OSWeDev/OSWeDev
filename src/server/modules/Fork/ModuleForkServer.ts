
import { ChildProcess } from 'child_process';
import { Server, Socket } from 'net';
import JSONTransport from 'nodemailer/lib/json-transport';
import CRUD from '../../../shared/modules/DAO/vos/CRUD';
import ModuleFork from '../../../shared/modules/Fork/ModuleFork';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleServerBase from '../ModuleServerBase';
import VarsDatasVoUpdateHandler from '../Var/VarsDatasVoUpdateHandler';
import ForkedTasksController from './ForkedTasksController';
import ForkMessageController from './ForkMessageController';
import ForkServerController from './ForkServerController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import BGThreadProcessTaskForkMessage from './messages/BGThreadProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import KillForkMessage from './messages/KillForkMessage';
import MainProcessForwardToBGThreadForkMessage from './messages/MainProcessForwardToBGThreadForkMessage';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import PingForkACKMessage from './messages/PingForkACKMessage';
import PingForkMessage from './messages/PingForkMessage';
import ReloadAsapForkMessage from './messages/ReloadAsapForkMessage';
import TaskResultForkMessage from './messages/TaskResultForkMessage';

export default class ModuleForkServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleForkServer.instance) {
            ModuleForkServer.instance = new ModuleForkServer();
        }
        return ModuleForkServer.instance;
    }

    private static instance: ModuleForkServer = null;

    public is_killing: boolean = false;

    private constructor() {
        super(ModuleFork.getInstance().name);
    }

    public async configure(): Promise<void> {
        ForkMessageController.getInstance().register_message_handler(ReloadAsapForkMessage.FORK_MESSAGE_TYPE, this.prepare_reload_asap.bind(this));
        ForkMessageController.getInstance().register_message_handler(KillForkMessage.FORK_MESSAGE_TYPE, this.handle_kill_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(PingForkMessage.FORK_MESSAGE_TYPE, this.handle_ping_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(PingForkACKMessage.FORK_MESSAGE_TYPE, this.handle_pingack_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(AliveForkMessage.FORK_MESSAGE_TYPE, this.handle_alive_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE, this.handle_broadcast_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(MainProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_mainprocesstask_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(MainProcessForwardToBGThreadForkMessage.FORK_MESSAGE_TYPE, this.handle_mainprocessforwardtobgtask_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_bgthreadprocesstask_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(TaskResultForkMessage.FORK_MESSAGE_TYPE, this.handle_taskresult_message.bind(this));
    }

    public async kill_process(throttle: number = 10) {
        this.is_killing = true;
        await VarsDatasVoUpdateHandler.getInstance().force_empty_vars_datas_vo_update_cache();

        while (throttle > 0) {
            ConsoleHandler.error("Received KILL SIGN from parent - KILL in " + throttle);
            await ThreadHandler.sleep(1000, 'ModuleForkServer.kill_process');
            throttle--;
        }
        ConsoleHandler.error("Received KILL SIGN from parent - KILL");
        process.exit();
    }

    /**
     * Doit être appelé sur le main thread
     */
    private async prepare_reload_asap(msg: ReloadAsapForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        if (!msg.message_content) {

            return false;
        }

        ForkServerController.getInstance().forks_reload_asap[msg.message_content] = true;
        return true;
    }

    /**
     * On cherche le callback à appeler dans le controller et on envoi le résultat
     */
    private async handle_taskresult_message(msg: TaskResultForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        if ((!msg.callback_id) || (!ForkedTasksController.getInstance().registered_task_result_wrappers) ||
            (!ForkedTasksController.getInstance().registered_task_result_wrappers[msg.callback_id])) {

            return false;
        }

        if (msg.throw_error) {
            ConsoleHandler.error('handle_taskresult_message:' + msg.throw_error + ':' +
                msg.callback_id + ':' + msg.message_type + ':' + JSON.stringify(msg.message_content));
            if (!!ForkedTasksController.getInstance().registered_task_result_wrappers[msg.callback_id]) {

                let thrower = ForkedTasksController.getInstance().registered_task_result_wrappers[msg.callback_id].thrower;
                thrower(msg.throw_error);
                delete ForkedTasksController.getInstance().registered_task_result_wrappers[msg.callback_id];
            }
            return true;
        }

        let resolver = ForkedTasksController.getInstance().registered_task_result_wrappers[msg.callback_id].resolver;
        resolver(msg.message_content);
        delete ForkedTasksController.getInstance().registered_task_result_wrappers[msg.callback_id];
        return true;
    }


    /**
     * On doit donc être sur le main process, on cherche juste la fonction qui a été demandée
     */
    private async handle_mainprocesstask_message(msg: MainProcessTaskForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        if ((!msg.message_content) || (!ForkedTasksController.getInstance().process_registered_tasks) ||
            (!ForkedTasksController.getInstance().process_registered_tasks[msg.message_content])) {

            return false;
        }

        let res;
        try {
            res = await ForkedTasksController.getInstance().process_registered_tasks[msg.message_content](...msg.message_content_params);
        } catch (error) {
            ConsoleHandler.error('handle_mainprocesstask_message:' + error);
        }

        if (msg.callback_id) {
            await ForkMessageController.getInstance().send(new TaskResultForkMessage(res, msg.callback_id), sendHandle as ChildProcess);
        }

        return true;
    }

    private async handle_mainprocessforwardtobgtask_message(msg: BGThreadProcessTaskForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
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
                await ForkMessageController.getInstance().send(new TaskResultForkMessage(null, msg.callback_id, 'KILLING TASK HANDLER'), sendHandle as ChildProcess);
            } else {
                throw new Error('KILLING TASK HANDLER');
            }
            return true;
        }

        return new Promise(async (resolve, reject) => {

            let thrower = async (error) => {
                if (msg.callback_id) {
                    await ForkMessageController.getInstance().send(new TaskResultForkMessage(null, msg.callback_id, error), sendHandle as ChildProcess);
                } else {
                    ConsoleHandler.error('Failed message:' + error + ':' + JSON.stringify(msg));
                }
                reject();
            };

            let resolver = async (res) => {
                if (msg.callback_id) {
                    await ForkMessageController.getInstance().send(new TaskResultForkMessage(res, msg.callback_id), sendHandle as ChildProcess);
                }
                resolve(res);
            };
            await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(thrower, msg.bgthread, msg.message_content, resolver, ...msg.message_content_params);
        });
    }

    /**
     * Si on est sur le bon thread on lance l'action
     */
    private async handle_bgthreadprocesstask_message(msg: BGThreadProcessTaskForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        if ((!msg.message_content) || (!ForkedTasksController.getInstance().process_registered_tasks) ||
            (!ForkedTasksController.getInstance().process_registered_tasks[msg.message_content]) ||
            (!BGThreadServerController.getInstance().valid_bgthreads_names[msg.bgthread])) {
            return false;
        }

        /**
         * Si un kill est en cours on throw une erreur ici pour répondre à la demande le plus vite possible
         */
        if (this.is_killing) {
            ConsoleHandler.error('handle_bgthreadprocesstask_message:KILLING TASK HANDLER:' + JSON.stringify(msg));
            if (msg.callback_id) {
                await ForkMessageController.getInstance().broadcast(new TaskResultForkMessage(null, msg.callback_id, 'KILLING TASK HANDLER'));
            } else {
                throw new Error('KILLING TASK HANDLER');
            }
            return true;
        }

        let res;
        try {
            res = await ForkedTasksController.getInstance().process_registered_tasks[msg.message_content](...msg.message_content_params);
        } catch (error) {
            ConsoleHandler.error('handle_bgthreadprocesstask_message:' + error);
        }

        if (msg.callback_id) {
            await ForkMessageController.getInstance().broadcast(new TaskResultForkMessage(res, msg.callback_id));
        }

        return true;
    }

    private async handle_pingack_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        ForkServerController.getInstance().forks_availability[msg.message_content] = Dates.now();
        return true;
    }

    private async handle_kill_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {

        let throttle = msg ? msg.message_content : 10;

        await ModuleForkServer.getInstance().kill_process(throttle);
        return false;
    }

    private async handle_ping_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        await ForkMessageController.getInstance().send(new PingForkACKMessage(msg.message_content));
        return true;
    }

    private async handle_alive_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        ForkServerController.getInstance().forks_alive[msg.message_content] = true;

        ForkServerController.getInstance().forks_waiting_to_be_alive--;
        if (ForkServerController.getInstance().forks_waiting_to_be_alive <= 0) {
            ForkServerController.getInstance().forks_are_initialized = true;
        }
        ConsoleHandler.log('Process [' + msg.message_content + ']: ALIVE');
        return true;
    }

    /**
     * On est donc sur le parent, on décapsule et on broadcast le vrai message
     * @param msg
     */
    private async handle_broadcast_message(msg: BroadcastWrapperForkMessage): Promise<boolean> {

        await ForkMessageController.getInstance().broadcast(msg.message_content, (msg.ignore_sender ? msg.sender_uid : null));

        return true;
    }
}