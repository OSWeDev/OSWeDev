import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleBGThread from '../../../shared/modules/BGThread/ModuleBGThread';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import IBGThread from './interfaces/IBGThread';
import BGThreadServerController from './BGThreadServerController';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import ForkServerController from '../Fork/ForkServerController';
import ModuleForkServer from '../Fork/ModuleForkServer';
import ForkMessageController from '../Fork/ForkMessageController';
import KillForkMessage from '../Fork/messages/KillForkMessage';

export default class ModuleBGThreadServer extends ModuleServerBase {

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

    public static getInstance() {
        if (!ModuleBGThreadServer.instance) {
            ModuleBGThreadServer.instance = new ModuleBGThreadServer();
        }
        return ModuleBGThreadServer.instance;
    }

    private static instance: ModuleBGThreadServer = null;

    private constructor() {
        super(ModuleBGThread.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
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
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    /**
     * Enregistre le bgthread dans {@link BGThreadServerController.register_bgthreads} et s'il est possible de l'executer l'execute.
     * @param bgthread à enregistrer et executer
     * @returns void
     */
    public registerBGThread(bgthread: IBGThread): void {

        // On vérifie qu'on peut register les bgthreads
        if (!BGThreadServerController.getInstance().register_bgthreads) {
            return;
        }

        BGThreadServerController.getInstance().registered_BGThreads[bgthread.name] = bgthread;

        ManualTasksController.getInstance().registered_manual_tasks_by_name["KILL BGTHREAD : " + bgthread.name] =
            async () => {
                if (ForkServerController.getInstance().process_fork_by_type_and_name[BGThreadServerController.ForkedProcessType] &&
                    ForkServerController.getInstance().process_fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread.name]) {
                    await ForkMessageController.getInstance().send(
                        new KillForkMessage(bgthread.name),
                        ForkServerController.getInstance().process_fork_by_type_and_name[BGThreadServerController.ForkedProcessType][bgthread.name].child_process);
                }
            };

        // On vérifie qu'on peut lancer des bgthreads
        if (!BGThreadServerController.getInstance().run_bgthreads) {
            return;
        }

        // On vérifie qu'on peut lancer ce bgthread
        if (!BGThreadServerController.getInstance().valid_bgthreads_names[bgthread.name]) {
            return;
        }

        this.execute_bgthread(bgthread);
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

            await ThreadHandler.getInstance().sleep(bgthread.current_timeout);

            try {

                if (!BGThreadServerController.getInstance().server_ready) {
                    continue;
                }

                let timeout_coef: number = 1;

                timeout_coef = await bgthread.work();

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
                ConsoleHandler.getInstance().error(error);
            }
        }
    }
}