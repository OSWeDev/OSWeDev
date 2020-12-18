import { ChildProcess } from 'child_process';
import { throttle } from 'lodash';
import { Server, Socket } from 'net';
import { performance } from 'perf_hooks';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ForkServerController from './ForkServerController';
import IFork from './interfaces/IFork';
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

    private last_log_msg_error: number = 0;

    private throttled_retry = throttle(this.retry.bind(this), 1000, { leading: false });

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
                this.send(msg, forked.child_process, forked);
            }
            await this.message_handler(msg);
        }
    }

    public send(msg: IForkMessage, child_process: ChildProcess = null, forked_target: IFork = null): boolean {

        msg = APIControllerWrapper.getInstance().try_translate_vo_to_api(msg);
        let res: boolean = false;
        let sendHandle = (!child_process) ? process : child_process;
        let self = this;

        res = sendHandle.send(msg, (error: Error) => {
            self.handle_send_error({
                message: msg,
                sendHandle: sendHandle,
                forked_target: forked_target
            }, error);
        });

        if (this.stacked_msg_waiting && this.stacked_msg_waiting.length) {
            this.throttled_retry();
        }

        return res;
    }

    public retry() {
        if ((!this.stacked_msg_waiting) || (!this.stacked_msg_waiting.length)) {
            return;
        }

        ConsoleHandler.getInstance().warn("Retry messages... :" + this.stacked_msg_waiting.length + ':');

        let stacked_msg_waiting = this.stacked_msg_waiting;
        this.stacked_msg_waiting = [];
        let self = this;

        stacked_msg_waiting.forEach((msg_wrapper: IForkMessageWrapper) => {
            msg_wrapper.sendHandle.send(msg_wrapper.message, (error: Error) => {
                self.handle_send_error(msg_wrapper, error);
            });
        });

        if (this.stacked_msg_waiting && this.stacked_msg_waiting.length) {
            this.throttled_retry();
        }
    }

    private handle_send_error(msg_wrapper: IForkMessageWrapper, error: Error) {
        if (error) {

            /**
             * On log max 1 fois par minute
             */
            let log_msg_error = performance.now();
            if (this.last_log_msg_error < (log_msg_error - (60 * 1000))) {
                this.last_log_msg_error = log_msg_error;
                ConsoleHandler.getInstance().error(error);
            }
            this.stacked_msg_waiting.push(msg_wrapper);

            /**
             * On informe qu'un thread est plus accessible
             */
            if (msg_wrapper.forked_target) {
                ForkServerController.getInstance().forks_availability[msg_wrapper.forked_target.uid] = false;
                ForkServerController.getInstance().throttled_reload_unavailable_threads();
            }
        }
    }
}