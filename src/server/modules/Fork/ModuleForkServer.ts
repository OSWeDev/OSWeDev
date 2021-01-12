import * as moment from 'moment';
import { ChildProcess } from 'child_process';
import { Server, Socket } from 'net';
import ModuleFork from '../../../shared/modules/Fork/ModuleFork';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleServerBase from '../ModuleServerBase';
import ForkedTasksController from './ForkedTasksController';
import ForkMessageController from './ForkMessageController';
import ForkServerController from './ForkServerController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import BGThreadProcessTaskForkMessage from './messages/BGThreadProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import PingForkACKMessage from './messages/PingForkACKMessage';
import PingForkMessage from './messages/PingForkMessage';
import TaskResultForkMessage from './messages/TaskResultForkMessage';

export default class ModuleForkServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleForkServer.instance) {
            ModuleForkServer.instance = new ModuleForkServer();
        }
        return ModuleForkServer.instance;
    }

    private static instance: ModuleForkServer = null;

    private constructor() {
        super(ModuleFork.getInstance().name);
    }

    public async configure(): Promise<void> {
        ForkMessageController.getInstance().register_message_handler(PingForkMessage.FORK_MESSAGE_TYPE, this.handle_ping_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(PingForkACKMessage.FORK_MESSAGE_TYPE, this.handle_pingack_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(AliveForkMessage.FORK_MESSAGE_TYPE, this.handle_alive_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE, this.handle_broadcast_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(MainProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_mainprocesstask_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_bgthreadprocesstask_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(TaskResultForkMessage.FORK_MESSAGE_TYPE, this.handle_taskresult_message.bind(this));
    }

    /**
     * On cherche le callback à appeler dans le controller et on envoi le résultat
     */
    private async handle_taskresult_message(msg: TaskResultForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        if ((!msg.callback_id) || (!ForkedTasksController.getInstance().registered_task_result_resolvers) ||
            (!ForkedTasksController.getInstance().registered_task_result_resolvers[msg.callback_id])) {

            return false;
        }

        ForkedTasksController.getInstance().registered_task_result_resolvers[msg.callback_id](msg.message_content);
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
            ConsoleHandler.getInstance().error('handle_mainprocesstask_message:' + error);
        }

        if (msg.callback_id) {
            ForkMessageController.getInstance().send(new TaskResultForkMessage(res, msg.callback_id), sendHandle as ChildProcess);
        }

        return true;
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

        return await ForkedTasksController.getInstance().process_registered_tasks[msg.message_content](...msg.message_content_params);
    }

    private async handle_pingack_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        ForkServerController.getInstance().forks_availability[msg.message_content] = moment().utc(true);
        return true;
    }

    private async handle_ping_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        ForkMessageController.getInstance().send(new PingForkACKMessage(msg.message_content));
        return true;
    }

    private async handle_alive_message(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess): Promise<boolean> {
        ForkServerController.getInstance().forks_waiting_to_be_alive--;
        if (ForkServerController.getInstance().forks_waiting_to_be_alive <= 0) {
            ForkServerController.getInstance().forks_are_initialized = true;
        }
        ConsoleHandler.getInstance().log('Process [' + msg.message_content + ']: ALIVE');
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