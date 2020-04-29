import ModuleFork from '../../../shared/modules/Fork/ModuleFork';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleServerBase from '../ModuleServerBase';
import ForkMessageController from './ForkMessageController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import { Socket, Server } from 'net';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import ForkedTasksController from './ForkedTasksController';

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
        ForkMessageController.getInstance().register_message_handler(AliveForkMessage.FORK_MESSAGE_TYPE, this.handle_alive_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE, this.handle_broadcast_message.bind(this));
        ForkMessageController.getInstance().register_message_handler(MainProcessTaskForkMessage.FORK_MESSAGE_TYPE, this.handle_mainprocesstask_message.bind(this));
    }

    /**
     * On doit donc être sur le main process, on cherche juste la fonction qui a été demandée
     */
    private async handle_mainprocesstask_message(msg: MainProcessTaskForkMessage, sendHandle: Socket | Server): Promise<boolean> {
        if ((!msg.message_content) || (!ForkedTasksController.getInstance().process_registered_tasks) ||
            (!ForkedTasksController.getInstance().process_registered_tasks[msg.message_content])) {
            return false;
        }

        return await ForkedTasksController.getInstance().process_registered_tasks[msg.message_content](...msg.message_content_params);
    }

    private async handle_alive_message(msg: IForkMessage, sendHandle: Socket | Server): Promise<boolean> {
        ConsoleHandler.getInstance().log('Process [' + msg.message_content + ']: ALIVE');
        return true;
    }

    /**
     * On est donc sur le parent, on décapsule et on broadcast le vrai message
     * @param msg
     */
    private async handle_broadcast_message(msg: IForkMessage): Promise<boolean> {

        ForkMessageController.getInstance().broadcast(msg.message_content);

        return true;
    }
}