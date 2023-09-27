import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ForkedProcessWrapperBase from '../Fork/ForkedProcessWrapperBase';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ForkMessageController from '../Fork/ForkMessageController';
import ForkServerController from '../Fork/ForkServerController';
import BroadcastWrapperForkMessage from '../Fork/messages/BroadcastWrapperForkMessage';
import KillForkMessage from '../Fork/messages/KillForkMessage';
import IBGThread from './interfaces/IBGThread';
import RunBGThreadForkMessage from './messages/RunBGThreadForkMessage';
import ModuleBGThreadServer from './ModuleBGThreadServer';

export default class BGThreadServerController {

    public static ForkedProcessType: string = "BGT";

    public static SERVER_READY: boolean = false;

    public static TASK_NAME_register_alive_on_main_thread: string = "BGThreadServerController.register_alive_on_main_thread";
    public static PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s: string = "BGThreadServerController.BGTHREAD_LAST_ALIVE_TIMEOUT_s";

    // istanbul ignore next: nothing to test : getInstance
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
     * On met en place un système généralisé à tous les bghtreads, qui impose aux bgthreads de se déclarer
     *  alive régulièrement et si il y a un défaut à ce niveau, et qu'un timeout est défini sur le bghtread, alors
     *  on lance un kill automatique du processus qui est bloqué. (et on le relance).
     *  !! ça signifie qu'il faut être sûr que le process est bien en erreur systématiquement quand on atteint le timeout !!
     *  Par défaut pas de timeout, mais on peut le définir dans le bgthread
     */
    public MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name: { [bgthread_name: string]: number } = {};
    /**
     * ----- Local thread cache
     */

    public register_alive_on_main_thread = ThrottleHelper.declare_throttle_with_stackable_args(this.throttled_register_alive_on_main_thread.bind(this), 10000);

    private constructor() {
        ForkMessageController.register_message_handler(RunBGThreadForkMessage.FORK_MESSAGE_TYPE, async (msg: RunBGThreadForkMessage) => {
            if (BGThreadServerController.getInstance().valid_bgthreads_names[msg.message_content]) {
                await BGThreadServerController.getInstance().registered_BGThreads[msg.message_content].work();
            }
            return true;
        });

        ForkedTasksController.register_task(BGThreadServerController.TASK_NAME_register_alive_on_main_thread, this.register_alive_on_main_thread.bind(this));
        setInterval(this.check_bgthreads_last_alive_ticks.bind(this), 10 * 1000);
    }

    public async throttled_register_alive_on_main_thread(bgthread_names: string[]) {


        if (!await ForkedTasksController.exec_self_on_main_process(BGThreadServerController.TASK_NAME_register_alive_on_main_thread, bgthread_names)) {
            return;
        }

        for (let i in bgthread_names) {
            let bgthread_name = bgthread_names[i];
            this.MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name[bgthread_name] = Dates.now();
        }
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

                // On ajoute avant chaque exécution le fait de signaler qu'on est en vie au thread parent, mais au plus vite une fois toutes les 10 secondes
                await this.register_alive_on_main_thread(bgthread_name);

                await BGThreadServerController.getInstance().registered_BGThreads[bgthread_name].work();
            } else {
                await ForkMessageController.send(new BroadcastWrapperForkMessage(new RunBGThreadForkMessage(bgthread_name)));
            }
        } else {

            if ((!ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType]) ||
                (!ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name])) {
                return false;
            }
            let forked = ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name];
            await ForkMessageController.send(new RunBGThreadForkMessage(bgthread_name), forked.child_process, forked);
        }
    }

    private async check_bgthreads_last_alive_ticks() {
        if (!ForkServerController.is_main_process()) {
            return;
        }

        let now = Dates.now();

        let promises = [];

        for (let bgthread_name in this.MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name) {

            promises.push((async () => {
                let last_tick_s = this.MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name[bgthread_name];
                let timeout_s = await ModuleParams.getInstance().getParamValueAsInt(BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + bgthread_name, null, 60 * 60 * 1000);

                // Timeout == null || timeout == 0 => pas de timeout
                if ((!timeout_s) || (!last_tick_s)) {
                    return;
                }

                if ((now - last_tick_s) > timeout_s) {
                    ConsoleHandler.error("BGThreadServerController.check_bgthreads_last_alive_ticks timeout on " +
                        bgthread_name + " :last_tick_s=" + last_tick_s + ":timeout_s=" + timeout_s + ": => killing process");
                    if (ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType] &&
                        ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name]) {
                        await ForkMessageController.send(
                            new KillForkMessage(await ModuleParams.getInstance().getParamValueAsInt(ModuleBGThreadServer.PARAM_kill_throttle_s, 10, 60 * 60 * 1000)),
                            ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name].child_process);
                    }
                }
            })());
        }

        await all_promises(promises);
    }
}