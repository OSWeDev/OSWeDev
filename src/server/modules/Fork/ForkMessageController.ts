import { ChildProcess } from 'child_process';
import { throttle } from 'lodash';
import { Server, Socket } from 'net';
import APIController from '../../../shared/modules/API/APIController';
import ForkServerController from './ForkServerController';
import IForkMessage from './interfaces/IForkMessage';
import IForkMessageWrapper from './interfaces/IForkMessageWrapper';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';

export default class ForkMessageController {

    public static getInstance() {
        if (!ForkMessageController.instance) {
            ForkMessageController.instance = new ForkMessageController();
        }
        return ForkMessageController.instance;
    }

    private static instance: ForkMessageController = null;

    /**
     * Local thread cache -----
     */
    private registered_messages_handlers: { [message_type: string]: (msg: IForkMessage, sendHandle: Socket | Server) => Promise<boolean> } = {};
    private stacked_msg_waiting: IForkMessageWrapper[] = [];
    /**
     * ----- Local thread cache
     */
    private constructor() { }

    public register_message_handler(message_type: string, handler: (msg: IForkMessage, sendHandle: Socket | Server) => Promise<boolean>) {
        this.registered_messages_handlers[message_type] = handler;
    }

    public async message_handler(msg: IForkMessage, sendHandle: Socket | Server = null): Promise<boolean> {
        if ((!msg) || (!this.registered_messages_handlers[msg.message_type])) {
            return false;
        }

        return await this.registered_messages_handlers[msg.message_type](msg, sendHandle);
    }

    /**
     * On envoie le message à tous les process. Si on est dans un childprocess, on renvoi vers le parent qui enverra vers tout le monde, y compris nous
     *  Donc si on associe un comportement à ce message, il ne faut pas le faire manuellement, il sera exécuté par le message handler
     */
    public async broadcast(msg: IForkMessage, ignore_uid: number = null): Promise<boolean> {

        if (!ForkServerController.getInstance().is_main_process) {
            this.send(new BroadcastWrapperForkMessage(msg));
            return true;
        } else {

            for (let i in ForkServerController.getInstance().process_forks) {
                let forked = ForkServerController.getInstance().process_forks[i];

                if ((!!ignore_uid) && (ignore_uid == forked.uid)) {
                    continue;
                }
                this.send(msg, forked.child_process);
            }
            await this.message_handler(msg);
        }
    }

    public send(msg: IForkMessage, child_process: ChildProcess = null): boolean {

        msg = APIController.getInstance().try_translate_vo_to_api(msg);
        let res: boolean = false;
        let sendHandle = (!child_process) ? process : child_process;

        res = sendHandle.send(msg);
        if (!res) {
            this.stacked_msg_waiting.push({
                message: msg,
                sendHandle: sendHandle
            });
        }

        if (this.stacked_msg_waiting && this.stacked_msg_waiting.length) {
            throttle(this.throttled_retry, 1000, { leading: false });
        }

        return res;
    }

    public throttled_retry() {
        if ((!this.stacked_msg_waiting) || (!this.stacked_msg_waiting.length)) {
            return;
        }

        let stacked_msg_waiting = this.stacked_msg_waiting;
        this.stacked_msg_waiting = [];

        stacked_msg_waiting.forEach((msg_wrapper: IForkMessageWrapper) => {
            if (!msg_wrapper.sendHandle.send(msg_wrapper.message)) {
                this.stacked_msg_waiting.push(msg_wrapper);
            }
        });

        if (this.stacked_msg_waiting && this.stacked_msg_waiting.length) {
            throttle(this.throttled_retry, 1000, { leading: false });
        }
    }
}