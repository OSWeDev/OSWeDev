import ForkedProcessWrapperBase from '../Fork/ForkedProcessWrapperBase';
import ForkMessageController from '../Fork/ForkMessageController';
import ForkServerController from '../Fork/ForkServerController';
import BroadcastWrapperForkMessage from '../Fork/messages/BroadcastWrapperForkMessage';
import IBGThread from './interfaces/IBGThread';
import RunBGThreadForkMessage from './messages/RunBGThreadForkMessage';

export default class BGThreadServerController {

    public static ForkedProcessType: string = "BGT";

    public static SERVER_READY: boolean = false;

    public static getInstance() {
        if (!BGThreadServerController.instance) {
            BGThreadServerController.instance = new BGThreadServerController();
        }
        return BGThreadServerController.instance;
    }

    private static instance: BGThreadServerController = null;

    /**
     * Local thread cache -----
     */
    public registered_BGThreads: { [name: string]: IBGThread } = {};

    public register_bgthreads: boolean = false;
    public run_bgthreads: boolean = false;
    public valid_bgthreads_names: { [name: string]: boolean } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() {
        ForkMessageController.getInstance().register_message_handler(RunBGThreadForkMessage.FORK_MESSAGE_TYPE, async (msg: RunBGThreadForkMessage) => {
            if (BGThreadServerController.getInstance().valid_bgthreads_names[msg.message_content]) {
                await BGThreadServerController.getInstance().registered_BGThreads[msg.message_content].work();
            }
            return true;
        });
    }

    /**
     * On sait sur quel process il est. si c'est nous, on lance le cron directement,
     *  sinon
     *      si on est sur le server principal on envoie au bon process
     *      sinon on envoie le message au process principal
     */
    public async executeBGThread(bgthread_name: string) {
        if (!!ForkedProcessWrapperBase.getInstance()) {

            if (BGThreadServerController.getInstance().valid_bgthreads_names[bgthread_name]) {
                await BGThreadServerController.getInstance().registered_BGThreads[bgthread_name].work();
            } else {
                await ForkMessageController.getInstance().send(new BroadcastWrapperForkMessage(new RunBGThreadForkMessage(bgthread_name)));
            }
        } else {

            if ((!ForkServerController.getInstance().process_fork_by_type_and_name[BGThreadServerController.ForkedProcessType]) ||
                (!ForkServerController.getInstance().process_fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name])) {
                return false;
            }
            let forked = ForkServerController.getInstance().process_fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name];
            await ForkMessageController.getInstance().send(new RunBGThreadForkMessage(bgthread_name), forked.child_process, forked);
        }
    }
}