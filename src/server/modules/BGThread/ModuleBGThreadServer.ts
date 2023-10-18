import IBGThread from './interfaces/IBGThread';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleBGThread from '../../../shared/modules/BGThread/ModuleBGThread';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ForkMessageController from '../Fork/ForkMessageController';
import ForkServerController from '../Fork/ForkServerController';
import KillForkMessage from '../Fork/messages/KillForkMessage';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import BGThreadServerController from './BGThreadServerController';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';

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


    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleBGThreadServer.instance) {
            ModuleBGThreadServer.instance = new ModuleBGThreadServer();
        }
        return ModuleBGThreadServer.instance;
    }

    private static instance: ModuleBGThreadServer = null;

    public block_param_by_name: { [bgthread_name: string]: boolean } = {};

    private block_param_reload_timeout_by_name: { [bgthread_name: string]: number } = {};

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleBGThread.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleBGThread.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'BGThreads'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleBGThread.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des BGThreads'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
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

        BGThreadServerController.registered_BGThreads[bgthread.name] = bgthread;

        let bgthread_force_run_asap_throttled_task_name = 'BGThreadServerController.force_run_asap_throttled.' + bgthread.name;
        let force_run_asap_throttled = (): Promise<boolean> => {

            return new Promise(async (resolve, reject) => {

                let thrower = (error) => {
                    ConsoleHandler.error('failed force_run_asap_throttled on bgthread : ' + bgthread.name + ' : ' + error);
                    resolve(true);
                };

                if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                    thrower,
                    bgthread.name,
                    bgthread_force_run_asap_throttled_task_name,
                    resolve)) {
                    return;
                }

                ConsoleHandler.log("ModuleBGThreadServer.run_ASAP : " + bgthread.name + " :");
                bgthread.run_asap = true;

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
                if (ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType] &&
                    ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread.name]) {
                    await ForkMessageController.send(
                        new KillForkMessage(await ModuleParams.getInstance().getParamValueAsInt(ModuleBGThreadServer.PARAM_kill_throttle_s, 10, 60 * 60 * 1000)),
                        ForkServerController.fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread.name].child_process);
                }
            };

        // On vérifie qu'on peut lancer des bgthreads
        if (!BGThreadServerController.run_bgthreads) {
            return;
        }

        // On vérifie qu'on peut lancer ce bgthread
        if (!BGThreadServerController.valid_bgthreads_names[bgthread.name]) {
            return;
        }

        this.execute_bgthread(bgthread).then().catch((error) => ConsoleHandler.error(error));
    }

    /**
     * lance l'execution du bgthread
     * @param bgthread bgthread à executer
     */
    private async execute_bgthread(bgthread: IBGThread): Promise<void> {

        if (!bgthread) {
            return;
        }

        while (true) {

            /**
             * On change de méthode, on lance immédiatement si c'est utile/demandé, sinon on attend le timeout
             */

            // Si déjà lancé, on attend que ça se termine normalement
            if (bgthread.semaphore) {
                bgthread.last_run_unix = Dates.now_ms();
                await ThreadHandler.sleep(10, 'ModuleBGThreadServer.execute_bgthread.' + bgthread.name);
                continue;
            }

            // Si run_asap, on lance immédiatement
            let do_run: boolean = bgthread.run_asap;

            // Sinon on check le current_timeout
            if (!do_run) {
                if (Dates.now_ms() > (bgthread.last_run_unix + bgthread.current_timeout)) {
                    do_run = true;
                }
            }

            if (!do_run) {
                await ThreadHandler.sleep(10, 'ModuleBGThreadServer.execute_bgthread.' + bgthread.name);
                continue;
            }

            bgthread.last_run_unix = Dates.now_ms();

            /**
             * On check le bloquage par param toutes les minutes
             */
            try {

                if ((!this.block_param_reload_timeout_by_name[bgthread.name]) ||
                    (this.block_param_reload_timeout_by_name[bgthread.name] < Dates.now())) {

                    let new_param = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleBGThreadServer.PARAM_BLOCK_BGTHREAD_prefix + bgthread.name, false, 120000);

                    if (new_param != this.block_param_by_name[bgthread.name]) {
                        ConsoleHandler.log('BGTHREAD:' + bgthread.name + ':' + (new_param ? 'DISABLED' : 'ACTIVATED'));
                    }

                    this.block_param_by_name[bgthread.name] = new_param;
                    this.block_param_reload_timeout_by_name[bgthread.name] = Dates.now() + 60;
                }

            } catch (error) {
                ConsoleHandler.error('OK at start, NOK if all nodes already started :execute_bgthread:block_param_by_name:' + error);
            }

            if (!!this.block_param_by_name[bgthread.name]) {
                continue;
            }

            try {

                if (!BGThreadServerController.SERVER_READY) {
                    continue;
                }

                let timeout_coef: number = 1;

                if (bgthread.semaphore) {
                    continue;
                }
                bgthread.semaphore = true;
                bgthread.run_asap = false;

                try {
                    timeout_coef = await bgthread.work();
                } catch (error) {
                    ConsoleHandler.error('ModuleBGThreadServer.work error : ' + error);
                }

                bgthread.semaphore = false;
                bgthread.last_run_unix = Dates.now_ms();

                if (!timeout_coef) {
                    timeout_coef = 1;
                }

                bgthread.current_timeout = bgthread.current_timeout * timeout_coef;
                if (bgthread.current_timeout > bgthread.MAX_timeout) {
                    bgthread.current_timeout = bgthread.MAX_timeout;
                }

                if (bgthread.current_timeout < bgthread.MIN_timeout) {
                    bgthread.current_timeout = bgthread.MIN_timeout;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }
        }
    }
}