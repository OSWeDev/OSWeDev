import { ChildProcess } from 'child_process';
import { throttle } from 'lodash';

import { performance } from 'perf_hooks';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ForkServerController from './ForkServerController';
import IFork from './interfaces/IFork';
import IForkMessage from './interfaces/IForkMessage';
import IForkMessageWrapper from './interfaces/IForkMessageWrapper';
import BGThreadProcessTaskForkMessage from './messages/BGThreadProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import { all_promises } from '../../../shared/tools/PromiseTools';

export default class ForkMessageController {

    /**
     * Local thread cache -----
     */
    public static stacked_msg_waiting: IForkMessageWrapper[] = [];
    /**
     * ----- Local thread cache
     */

    public static register_message_handler(message_type: string, handler: (msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess) => Promise<boolean>) {
        ForkMessageController.registered_messages_handlers[message_type] = handler;
    }

    public static async message_handler(msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess = null): Promise<boolean> {
        if ((!msg) || (!ForkMessageController.registered_messages_handlers[msg.message_type])) {
            return false;
        }

        StatsController.register_stat_COMPTEUR('ForkMessageController', 'receive', msg.message_type);
        if ((!!msg.message_content) && (
            ((typeof msg.message_content == "string") && (!msg.message_content.startsWith('{'))) &&
            (msg.message_type == MainProcessTaskForkMessage.FORK_MESSAGE_TYPE) ||
            (msg.message_type == BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE) ||
            (msg.message_type == BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE))) {
            StatsController.register_stat_COMPTEUR('ForkMessageController', 'receive', msg.message_content);
        }

        try {

            return await ForkMessageController.registered_messages_handlers[msg.message_type](msg, sendHandle);
        } catch (error) {
            ConsoleHandler.error('ForkMessageController.message_handler error: ' + error);
            return false;
        }
    }

    /**
     * On envoie le message à tous les process. Si on est dans un childprocess, on renvoi vers le parent qui enverra vers tout le monde, y compris nous
     *  Donc si on associe un comportement à ce message, il ne faut pas le faire manuellement, il sera exécuté par le message handler
     */
    public static async broadcast(msg: IForkMessage, ignore_uid: number = null): Promise<boolean> {

        if (!ForkServerController.is_main_process()) {
            return ForkMessageController.send(new BroadcastWrapperForkMessage(msg));
        } else {

            const promises = [];
            for (const i in ForkServerController.forks) {
                const forked = ForkServerController.forks[i];

                if ((ignore_uid != null) && (ignore_uid == forked.uid)) {
                    continue;
                }

                if ((msg.message_type == BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE) &&
                    (ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][(msg as BGThreadProcessTaskForkMessage).bgthread].uid != forked.uid)) {
                    continue;
                }

                promises.push(ForkMessageController.send(msg, forked.child_process, forked));
            }
            await all_promises(promises);
            return ForkMessageController.message_handler(msg);
        }
    }

    public static async send(msg: IForkMessage, child_process: ChildProcess = null, forked_target: IFork = null): Promise<boolean> {

        StatsController.register_stat_COMPTEUR('ForkMessageController', 'send', msg.message_type);
        if ((!!msg.message_content) &&
            ((typeof msg.message_content == "string") && (!msg.message_content.startsWith('{'))) && (
                (msg.message_type == MainProcessTaskForkMessage.FORK_MESSAGE_TYPE) ||
                (msg.message_type == BroadcastWrapperForkMessage.FORK_MESSAGE_TYPE) ||
                (msg.message_type == BGThreadProcessTaskForkMessage.FORK_MESSAGE_TYPE))) {
            StatsController.register_stat_COMPTEUR('ForkMessageController', 'send', msg.message_content);
        }

        return new Promise((resolve, reject) => {

            msg = APIControllerWrapper.try_translate_vo_to_api(msg);
            let res: boolean = false;
            const sendHandle = (!child_process) ? process : child_process;
            const self = ForkMessageController;

            if ((!sendHandle) || (!sendHandle.send)) {
                resolve(false);
                return;
            }

            res = sendHandle.send(msg, async (error: Error) => {
                if (error) {
                    await self.handle_send_error({
                        message: msg,
                        sendHandle: sendHandle,
                        forked_target: forked_target
                    }, error);
                }

                await resolve(!error);
            });

            if (ForkMessageController.stacked_msg_waiting && ForkMessageController.stacked_msg_waiting.length) {
                ForkMessageController.throttled_retry();
            }
        });
    }

    public static retry() {
        if ((!ForkMessageController.stacked_msg_waiting) || (!ForkMessageController.stacked_msg_waiting.length)) {
            return;
        }

        ConsoleHandler.warn("Retry messages... :" + ForkMessageController.stacked_msg_waiting.length + ':');

        const stacked_msg_waiting = ForkMessageController.stacked_msg_waiting;
        ForkMessageController.stacked_msg_waiting = [];
        const self = ForkMessageController;

        stacked_msg_waiting.forEach((msg_wrapper: IForkMessageWrapper) => {

            if ((!msg_wrapper.sendHandle) || (!msg_wrapper.sendHandle.send) || (!msg_wrapper.sendHandle.connected)) {
                ConsoleHandler.error('ForkMessageController.retry: sendHandle is not connected - aborting retry');
                return;
            }

            msg_wrapper.sendHandle.send(msg_wrapper.message, async (error: Error) => {
                await self.handle_send_error(msg_wrapper, error);
            });
        });

        if (ForkMessageController.stacked_msg_waiting && ForkMessageController.stacked_msg_waiting.length) {
            ForkMessageController.throttled_retry();
        }
    }

    private static registered_messages_handlers: { [message_type: string]: (msg: IForkMessage, sendHandle: NodeJS.Process | ChildProcess) => Promise<boolean> } = {};
    private static last_log_msg_error: number = 0;
    private static throttled_retry = throttle(ForkMessageController.retry.bind(ForkMessageController), 500);

    private static async handle_send_error(msg_wrapper: IForkMessageWrapper, error: Error) {
        if (error) {

            /**
             * On log max 1 fois par minute
             */
            const log_msg_error = performance.now();
            if (ForkMessageController.last_log_msg_error < (log_msg_error - 60)) {
                ForkMessageController.last_log_msg_error = log_msg_error;
                ConsoleHandler.error(error);
            }

            /**
             * si le pid du sendHandle est plus actif, on doit tenter de trouver le nouveau pid correspondant à ce thread
             */
            if (msg_wrapper.sendHandle && msg_wrapper.sendHandle.pid && !msg_wrapper.sendHandle.connected) {
                ConsoleHandler.error('ForkMessageController.handle_send_error: sendHandle.pid:' + msg_wrapper.sendHandle.pid + ' is not connected: Trying to find new handler for pid: ' + msg_wrapper.sendHandle.pid + ' ...');

                let n = 3; // On limite à 90 secondes
                let found_bgthread_id: number = null;
                while ((n-- > 0) && ((!found_bgthread_id) || (!(ForkServerController.forks[found_bgthread_id] && ForkServerController.forks[found_bgthread_id].child_process.connected)))) {

                    await ThreadHandler.sleep(30000, 'ForkMessageController.handle_send_error: sendHandle.pid:' + msg_wrapper.sendHandle.pid + ' is not connected: Trying to find new handler for thread_id: ' + found_bgthread_id + ' ... waiting 30s - ' + n);

                    for (const bgthread_id in ForkServerController.forks_alive_historic_pids) {
                        const historic_ids = ForkServerController.forks_alive_historic_pids[bgthread_id];

                        for (let i in historic_ids) {
                            if (historic_ids[i] == msg_wrapper.sendHandle.pid) {
                                found_bgthread_id = parseInt(bgthread_id.toString());
                                break;
                            }
                        }

                        if (found_bgthread_id) {
                            break;
                        }
                    }
                }

                if (found_bgthread_id && ForkServerController.forks[found_bgthread_id] && ForkServerController.forks[found_bgthread_id].child_process.connected) {
                    ConsoleHandler.error('ForkMessageController.handle_send_error: sendHandle.pid:' + msg_wrapper.sendHandle.pid + ' is not connected: Found new handler for thread_id: ' + found_bgthread_id + ' ... sending message to new handler with pid : ' + ForkServerController.forks[found_bgthread_id].child_process.pid);
                    const forked_target = ForkServerController.forks[found_bgthread_id];
                    ForkMessageController.send(msg_wrapper.message, forked_target.child_process, forked_target);
                    return;
                } else {
                    ConsoleHandler.error('ForkMessageController.handle_send_error: sendHandle.pid:' + msg_wrapper.sendHandle.pid + ' is not connected: No new pid found');
                }
            }

            ForkMessageController.stacked_msg_waiting.push(msg_wrapper);

            /**
             * On informe qu'un thread est plus accessible
             */
            if (msg_wrapper.forked_target) {

                if (ForkServerController.forks_reload_asap[msg_wrapper.forked_target.uid]) {
                    /**
                     * On doit restart ASAP
                     */
                    ForkServerController.forks_reload_asap[msg_wrapper.forked_target.uid] = false;
                    ConsoleHandler.error('handle_send_error:uid:' + msg_wrapper.forked_target.uid + ':On relance le thread le plus vite possible.');
                    ForkServerController.forks_availability[msg_wrapper.forked_target.uid] = null;
                    ForkServerController.forks_alive[msg_wrapper.forked_target.uid] = false;
                    ForkServerController.throttled_reload_unavailable_threads();
                    return;
                }

                if (ForkServerController.forks_availability[msg_wrapper.forked_target.uid] &&
                    (Dates.add(Dates.now(), -1, TimeSegment.TYPE_MINUTE) > ForkServerController.forks_availability[msg_wrapper.forked_target.uid])) {
                    ConsoleHandler.error('handle_send_error:uid:' + msg_wrapper.forked_target.uid + ':On relance le thread, indisponible depuis plus de 60 secondes.');
                    ForkServerController.forks_availability[msg_wrapper.forked_target.uid] = null;
                    ForkServerController.forks_alive[msg_wrapper.forked_target.uid] = false;
                    ForkServerController.throttled_reload_unavailable_threads();
                }
            }
        }
    }
}