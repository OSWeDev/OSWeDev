import ModuleFork from '../../../shared/modules/Fork/ModuleFork';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleServerBase from '../ModuleServerBase';
import ForkMessageController from './ForkMessageController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import { Socket, Server } from 'net';

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