import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleBGThread from '../../../shared/modules/BGThread/ModuleBGThread';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventConfVO from '../../../shared/modules/Eventify/vos/EventifyEventConfVO';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import EventifyEventListenerInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ForkMessageController from '../Fork/ForkMessageController';
import ForkServerController from '../Fork/ForkServerController';
import KillForkMessage from '../Fork/messages/KillForkMessage';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ParamsServerController from '../Params/ParamsServerController';
import BGThreadServerController from './BGThreadServerController';
import BGThreadServerDataManager from './BGThreadServerDataManager';
import IBGThread from './interfaces/IBGThread';

export default class ModuleBGThreadServer extends ModuleServerBase {

    public static PARAM_kill_throttle_s: string = 'ModuleBGThreadServer.PARAM_kill_throttle_s';
    public static PARAM_BLOCK_BGTHREAD_prefix: string = 'BLOCK_BGTHREAD___';

    public static TIMEOUT_COEF_LITTLE_BIT_SLOWER: number = 1.25;
    public static TIMEOUT_COEF_SLOWER: number = 2;
    public static TIMEOUT_COEF_SLEEP: number = 10;

    public static TIMEOUT_COEF_NEUTRAL: number = 1;

    public static TIMEOUT_COEF_LITTLE_BIT_FASTER: number = 0.8;
    public static TIMEOUT_COEF_FASTER: number = 0.5;
    public static TIMEOUT_COEF_RUN: number = 0.1;


    public static DEFAULT_initial_timeout: number = 30000;
    public static DEFAULT_MAX_timeout: number = 30000;
    public static DEFAULT_MIN_timeout: number = 300;

    private static instance: ModuleBGThreadServer = null;

    private static TASK_NAME_write_heap_snapshot_on_all_thread: string = 'ModuleBGThreadServer.write_heap_snapshot_on_all_thread';
    private static TASK_NAME_write_heap_snapshot_on_this_thread: string = 'ModuleBGThreadServer.write_heap_snapshot_on_this_thread';

    public block_param_by_name: { [bgthread_name: string]: boolean } = {};

    private block_param_reload_timeout_by_name: { [bgthread_name: string]: number } = {};

    /**
     * Les évènements pour chaque bgthread qui permettent de lancer une éxécution du bgthread
     *  A priori on ne l'utilise qu'une fois celui-ci, puisque le reste du temps on est sur is_bgthread, et les autres évènements ça sera plutôt du ASAP
     */
    private EVENT_execute_bgthread_CONF_by_bgthread_name: { [bgthread_name: string]: EventifyEventConfVO } = {};
    /**
     * Les évènements pour chaque bgthread qui permettent de lancer une éxécution du bgthread ASAP
     */
    private ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name: { [bgthread_name: string]: EventifyEventConfVO } = {};
    /**
     * Les listeners pour chaque bgthread qui permettent de lancer une éxécution du bgthread - CONF
     */
    private LISTENER_execute_bgthread_CONF_by_bgthread_name: { [bgthread_name: string]: EventifyEventListenerConfVO } = {};
    /**
     * Les listeners pour chaque bgthread qui permettent de lancer une éxécution du bgthread - INSTANCE
     */
    private LISTENER_execute_bgthread_INSTANCE_by_bgthread_name: { [bgthread_name: string]: EventifyEventListenerInstanceVO } = {};

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleBGThread.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleBGThreadServer.instance) {
            ModuleBGThreadServer.instance = new ModuleBGThreadServer();
        }
        return ModuleBGThreadServer.instance;
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleBGThread.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'BGThreads'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleBGThread.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration des BGThreads'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public async configure() {
        ForkedTasksController.register_task(ModuleBGThreadServer.TASK_NAME_write_heap_snapshot_on_this_thread, this.write_heap_snapshot_on_this_thread.bind(this));
        ManualTasksController.getInstance().registered_manual_tasks_by_name[ModuleBGThreadServer.TASK_NAME_write_heap_snapshot_on_all_thread] =
            ModuleBGThreadServer.getInstance().write_heap_snapshot_on_all_threads;
    }

    public async write_heap_snapshot_on_all_threads() {
        await ForkedTasksController.broadexec_with_valid_promise_for_await(ModuleBGThreadServer.TASK_NAME_write_heap_snapshot_on_this_thread);
    }

    public async write_heap_snapshot_on_this_thread() {

        if (global.gc) {
            global.gc();
        } else {
            ConsoleHandler.warn('Garbage collection unavailable.  Pass --expose-gc '
                + 'when launching node to enable forced garbage collection.');
        }
        require('v8').writeHeapSnapshot();
    }

    /**
     * Enregistre le bgthread dans {@link BGThreadServerController.register_bgthreads} et s'il est possible de l'executer l'execute.
     * @param bgthread à enregistrer et executer
     * @returns void
     */
    public registerBGThread(bgthread: IBGThread): void {

        // On vérifie qu'on peut register les bgthreads
        if (!BGThreadServerController.register_bgthreads) {
            return;
        }

        BGThreadServerDataManager.registered_BGThreads[bgthread.name] = bgthread;

        const bgthread_force_run_asap_throttled_task_name = 'BGThreadServerController.force_run_asap_throttled.' + bgthread.name;
        const force_run_asap_throttled = (): Promise<boolean> => {

            return new Promise(async (resolve, reject) => {

                const thrower = (error) => {
                    ConsoleHandler.error('failed force_run_asap_throttled on bgthread : ' + bgthread.name + ' : ' + error);
                    resolve(true);
                };

                if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                    false,
                    thrower,
                    bgthread.name,
                    bgthread_force_run_asap_throttled_task_name,
                    resolve)) {
                    return;
                }

                ConsoleHandler.log("ModuleBGThreadServer.run_ASAP : " + bgthread.name + " :");

                // On force l'execution du bgthread ASAP
                EventsController.emit_event(EventifyEventInstanceVO.instantiate(await this.get_EVENT_execute_bgthread(bgthread, true)));

                resolve(true);
            });
        };

        /**
         * On register ici un throttle pour forcer l'execution du bgthread à partir de son nom (à appeler dans un trigger de vo par exemple sur un DIHVO on lance les imports)
         *  Le throttle est appelé depuis n'importe quel thread, et s'exécutera au final le thread du bgthread
         */
        BGThreadServerController.force_run_asap_by_bgthread_name[bgthread.name] =
            ThrottleHelper.declare_throttle_without_args(force_run_asap_throttled.bind(bgthread), 10, { leading: true, trailing: true });
        // On register ici la tache qui sera exécutée sur le BGthread - qui est par ailleurs throttled
        ForkedTasksController.register_task(bgthread_force_run_asap_throttled_task_name, BGThreadServerController.force_run_asap_by_bgthread_name[bgthread.name].bind(bgthread));


        ManualTasksController.getInstance().registered_manual_tasks_by_name["KILL BGTHREAD : " + bgthread.name] =
            async () => {
                if (ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType] &&
                    ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread.name]) {
                    await ForkMessageController.send(
                        new KillForkMessage(await ParamsServerController.getParamValueAsInt(ModuleBGThreadServer.PARAM_kill_throttle_s, 10, 60 * 60 * 1000)),
                        ForkServerController.fork_by_type_and_name[BGThreadServerDataManager.ForkedProcessType][bgthread.name].worker);
                }
            };

        ManualTasksController.getInstance().registered_manual_tasks_by_name["RUN ASAP BGTHREAD : " + bgthread.name] =
            async () => {
                await BGThreadServerController.force_run_asap_by_bgthread_name[bgthread.name]();
            };

        // On vérifie qu'on peut lancer des bgthreads
        if (!BGThreadServerController.run_bgthreads) {
            return;
        }

        // On vérifie qu'on peut lancer ce bgthread
        if (!BGThreadServerDataManager.valid_bgthreads_names[bgthread.name]) {
            return;
        }

        ThreadHandler.sleep(bgthread.current_timeout, 'ModuleBGThreadServer.registerBGThread.' + bgthread.name).then(async () => {
            EventsController.emit_event(EventifyEventInstanceVO.instantiate(await this.get_EVENT_execute_bgthread(bgthread, false)));
        }).catch((error) => ConsoleHandler.error(error));
        // this.execute_bgthread(bgthread).then().catch((error) => ConsoleHandler.error(error));
    }

    /**
     * lance l'execution du bgthread
     * @param bgthread bgthread à executer
     */
    public async execute_bgthread(event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO): Promise<void> {

        const bgthread: IBGThread = BGThreadServerDataManager.registered_BGThreads[event.name.split('_').pop()];

        if (!bgthread) {
            ConsoleHandler.error('BGThread not found for event : ' + event.name);
            return;
        }

        /**
         * On check le bloquage par param toutes les 2 minutes
         */
        try {

            if ((!this.block_param_reload_timeout_by_name[bgthread.name]) ||
                (this.block_param_reload_timeout_by_name[bgthread.name] < Dates.now())) {

                const new_param = await ParamsServerController.getParamValueAsBoolean(ModuleBGThreadServer.PARAM_BLOCK_BGTHREAD_prefix + bgthread.name, false, 120000);

                if (new_param != this.block_param_by_name[bgthread.name]) {
                    ConsoleHandler.log('BGTHREAD:' + bgthread.name + ':' + (new_param ? 'DISABLED' : 'ACTIVATED'));
                }

                this.block_param_by_name[bgthread.name] = new_param;
                this.block_param_reload_timeout_by_name[bgthread.name] = Dates.now() + 60;
            }
        } catch (error) {
            ConsoleHandler.error('OK at start, NOK if all nodes already started :execute_bgthread:block_param_by_name:' + error);
        }

        if (this.block_param_by_name[bgthread.name]) {
            // Si on est bloqués, on ne fait rien, et on attend au moins les 2 minutes nécessaires pour recharger le param
            listener.cooldown_ms = Math.max(120000, listener.cooldown_ms);
            bgthread.current_timeout = listener.cooldown_ms;
            return;
        }

        try {

            // Si le serveur est pas prêt, on ne fait rien, et on attend au moins 3 secondes
            if (!BGThreadServerController.SERVER_READY) {
                listener.cooldown_ms = Math.max(3000, listener.cooldown_ms);
                bgthread.current_timeout = listener.cooldown_ms;
                return;
            }

            let timeout_coef: number = 1;

            try {
                timeout_coef = await bgthread.work();
            } catch (error) {
                ConsoleHandler.error('ModuleBGThreadServer.work error : ' + error);
            }

            if (!timeout_coef) {
                timeout_coef = 1;
            }

            listener.cooldown_ms = listener.cooldown_ms * timeout_coef;
            if (listener.cooldown_ms > bgthread.MAX_timeout) {
                listener.cooldown_ms = bgthread.MAX_timeout;
            }

            if (listener.cooldown_ms < bgthread.MIN_timeout) {
                listener.cooldown_ms = bgthread.MIN_timeout;
            }

            bgthread.current_timeout = listener.cooldown_ms;
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async get_EVENT_execute_bgthread(
        bgthread: IBGThread,
        ASAP: boolean = false,
    ): Promise<EventifyEventConfVO> {
        const bgthread_name: string = bgthread.name;

        if (this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] &&
            this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]) {
            return ASAP ? this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] :
                this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name];
        }

        const event_name = this.get_EVENT_execute_bgthread_NAME(bgthread_name);
        const ASAP_event_name = event_name + '_ASAP';

        await all_promises([
            (async () => {
                this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] = await query(EventifyEventConfVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<EventifyEventConfVO>().name, event_name)
                    .exec_as_server()
                    .unthrottle_query_select()
                    .select_vo<EventifyEventConfVO>();
            })(),
            (async () => {
                this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] = await query(EventifyEventConfVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<EventifyEventConfVO>().name, ASAP_event_name)
                    .exec_as_server()
                    .unthrottle_query_select()
                    .select_vo<EventifyEventConfVO>();
            })(),
            (async () => {
                this.LISTENER_execute_bgthread_CONF_by_bgthread_name[bgthread_name] = await query(EventifyEventListenerConfVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<EventifyEventListenerConfVO>().event_conf_name, event_name)
                    .exec_as_server()
                    .unthrottle_query_select()
                    .select_vo<EventifyEventListenerConfVO>();
            })()
        ]);

        if (!this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]) {
            this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] = new EventifyEventConfVO();
            this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name].name = event_name;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]);
        }

        if (!this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]) {
            this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] = new EventifyEventConfVO();
            this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name].name = ASAP_event_name;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]);
        }

        if (!this.LISTENER_execute_bgthread_CONF_by_bgthread_name[bgthread_name]) {
            const LISTENER_execute_bgthread_CONF = new EventifyEventListenerConfVO();
            LISTENER_execute_bgthread_CONF.event_conf_name = event_name;
            LISTENER_execute_bgthread_CONF.cb_module_name = ModuleBGThreadServer.getInstance().name;
            LISTENER_execute_bgthread_CONF.cb_function_name = reflect<ModuleBGThreadServer>().execute_bgthread;
            LISTENER_execute_bgthread_CONF.cooldown_ms = bgthread.current_timeout;
            LISTENER_execute_bgthread_CONF.throttled = true;
            LISTENER_execute_bgthread_CONF.event_conf_id = this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name].id;
            LISTENER_execute_bgthread_CONF.event_conf_name = event_name;
            LISTENER_execute_bgthread_CONF.max_calls = 0;
            LISTENER_execute_bgthread_CONF.name = event_name;
            LISTENER_execute_bgthread_CONF.is_bgthread = true;

            LISTENER_execute_bgthread_CONF.run_as_soon_as_possible_event_conf_id = this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name].id;

            this.LISTENER_execute_bgthread_CONF_by_bgthread_name[bgthread_name] = LISTENER_execute_bgthread_CONF;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(LISTENER_execute_bgthread_CONF);
        }

        this.LISTENER_execute_bgthread_INSTANCE_by_bgthread_name[bgthread_name] = EventifyEventListenerInstanceVO.instantiate(this.LISTENER_execute_bgthread_CONF_by_bgthread_name[bgthread_name]);
        EventsController.register_event_conf(this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]);
        EventsController.register_event_conf(this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name]);
        EventsController.register_event_listener(this.LISTENER_execute_bgthread_INSTANCE_by_bgthread_name[bgthread_name]);

        return ASAP ? this.ASAP_EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name] :
            this.EVENT_execute_bgthread_CONF_by_bgthread_name[bgthread_name];
    }

    private get_EVENT_execute_bgthread_NAME(bgthread_name: string): string {
        return 'ModuleBGThreadServer.execute_bgthread_' + bgthread_name;
    }
}