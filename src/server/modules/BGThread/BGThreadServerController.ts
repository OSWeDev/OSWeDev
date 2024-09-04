import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
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
    public static TASK_NAME_is_alive: string = "BGThreadServerController.is_alive";
    public static PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s: string = "BGThreadServerController.BGTHREAD_LAST_ALIVE_TIMEOUT_s";

    /**
     * Local thread cache -----
     */
    public static registered_BGThreads: { [name: string]: IBGThread } = {};

    public static register_bgthreads: boolean = false;
    public static run_bgthreads: boolean = false;
    public static valid_bgthreads_names: { [name: string]: boolean } = {};

    public static force_run_asap_by_bgthread_name: { [bgthread_name: string]: () => void } = {};

    /**
     * On met en place un système généralisé à tous les bghtreads, qui impose aux bgthreads de se déclarer
     *  alive régulièrement et si il y a un défaut à ce niveau, et qu'un timeout est défini sur le bghtread, alors
     *  on lance un kill automatique du processus qui est bloqué. (et on le relance).
     *  !! ça signifie qu'il faut être sûr que le process est bien en erreur systématiquement quand on atteint le timeout !!
     *  Par défaut pas de timeout, mais on peut le définir dans le bgthread
     */
    public static MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name: { [bgthread_name: string]: number } = {};
    /**
     * ----- Local thread cache
     */

    public static register_alive_on_main_thread = ThrottleHelper.declare_throttle_with_stackable_args(this.throttled_register_alive_on_main_thread.bind(this), 10000);

    public static init() {
        ForkMessageController.register_message_handler(RunBGThreadForkMessage.FORK_MESSAGE_TYPE, async (msg: RunBGThreadForkMessage) => {
            if (BGThreadServerController.valid_bgthreads_names[msg.message_content]) {
                await BGThreadServerController.registered_BGThreads[msg.message_content].work();
            }
            return true;
        });

        ForkedTasksController.register_task(BGThreadServerController.TASK_NAME_register_alive_on_main_thread, this.register_alive_on_main_thread.bind(this));
        ForkedTasksController.register_task(BGThreadServerController.TASK_NAME_is_alive, this.is_alive.bind(this));
        ThreadHandler.set_interval(this.check_bgthreads_last_alive_ticks.bind(this), 10 * 1000, 'BGThreadServerController.check_bgthreads_last_alive_ticks', true);
    }

    public static async throttled_register_alive_on_main_thread(bgthread_names: string[]) {


        if (!await ForkedTasksController.exec_self_on_main_process(BGThreadServerController.TASK_NAME_register_alive_on_main_thread, bgthread_names)) {
            return;
        }

        for (const i in bgthread_names) {
            const bgthread_name = bgthread_names[i];
            this.MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name[bgthread_name] = Dates.now();
        }
    }

    /**
     * On sait sur quel process il est. si c'est nous, on lance le cron directement,
     *  sinon
     *      si on est sur le server principal on envoie au bon process
     *      sinon on envoie le message au process principal
     */
    public static async executeBGThread(bgthread_name: string) {
        if (ForkedProcessWrapperBase.getInstance()) {

            if (BGThreadServerController.valid_bgthreads_names[bgthread_name]) {

                // On ajoute avant chaque exécution le fait de signaler qu'on est en vie au thread parent, mais au plus vite une fois toutes les 10 secondes
                await this.register_alive_on_main_thread(bgthread_name);

                await BGThreadServerController.registered_BGThreads[bgthread_name].work();
            } else {
                await ForkMessageController.send(new BroadcastWrapperForkMessage(new RunBGThreadForkMessage(bgthread_name)));
            }
        } else {

            if ((!ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType]) ||
                (!ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name])) {
                return false;
            }
            const forked = ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread_name];
            await ForkMessageController.send(new RunBGThreadForkMessage(bgthread_name), forked.child_process, forked);
        }
    }

    private static async check_bgthreads_last_alive_ticks() {
        if (!ForkServerController.is_main_process()) {
            return;
        }

        const now = Dates.now();

        const promises = [];

        for (const bgthread_name in this.MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name) {

            promises.push((async () => {
                const last_tick_s = this.MAIN_THREAD_BGTHREAD_LAST_ALIVE_tick_sec_by_bgthread_name[bgthread_name];
                const timeout_s = await ModuleParams.getInstance().getParamValueAsInt(BGThreadServerController.PARAM_NAME_BGTHREAD_LAST_ALIVE_TIMEOUT_PREFIX_s + '.' + bgthread_name, null, 60 * 60 * 1000);

                // Timeout == null || timeout == 0 => pas de timeout
                if ((!timeout_s) || (!last_tick_s)) {
                    return;
                }

                if ((now - last_tick_s) > timeout_s) {
                    ConsoleHandler.error("BGThreadServerController.check_bgthreads_last_alive_ticks timeout on " +
                        bgthread_name + " :last_tick_s=" + last_tick_s + ":timeout_s=" + timeout_s + ": => killing process"); // TODO FIXME ça semble totalement inefficace non ?
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

    private static is_alive(): boolean {
        return true;
    }
}