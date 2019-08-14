import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleBGThread from '../../../shared/modules/BGThread/ModuleBGThread';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import IBGThread from './interfaces/IBGThread';

export default class ModuleBGThreadServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleBGThreadServer.instance) {
            ModuleBGThreadServer.instance = new ModuleBGThreadServer();
        }
        return ModuleBGThreadServer.instance;
    }

    private static instance: ModuleBGThreadServer = null;

    public registered_BGThreads: { [name: string]: IBGThread } = {};

    private timeout: number = 30000;
    private MAX_timeout: number = 30000;
    private MIN_timeout: number = 300;

    private timeout_coef: number = 10;


    private constructor() {
        super(ModuleBGThread.getInstance().name);
    }

    public async configure() {
        let self = this;

        // On lance le thread à ce niveau
        setTimeout(function () {
            self.execute_bgthreads();
        }, this.timeout);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleBGThread.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'BGThreads'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleBGThread.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des BGThreads'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public registerBGThread(BGThread: IBGThread) {
        this.registered_BGThreads[BGThread.name] = BGThread;
    }

    private async execute_bgthreads() {
        try {

            // On lance les bgthreads, et si l'un d'entre eux demande à être rappelé rapidement, on change le ryhtme d'appel global (FIXME DIRTY on doit séparer les timeouts par bgthread, ... ya de grosses optis ici)
            let need_more_time: boolean = false;
            for (let i in this.registered_BGThreads) {
                let bgthread: IBGThread = this.registered_BGThreads[i];

                console.log('BGThread:LANCEMENT:' + bgthread.name);
                need_more_time = need_more_time || await bgthread.work();
                console.log('BGThread:FIN:' + bgthread.name);
            }

            if (need_more_time) {
                this.timeout = this.timeout / this.timeout_coef;
                if (this.timeout < this.MIN_timeout) {
                    this.timeout = this.MIN_timeout;
                }
            } else {
                this.timeout = this.timeout * this.timeout_coef;
                if (this.timeout > this.MAX_timeout) {
                    this.timeout = this.MAX_timeout;
                }
            }
        } catch (error) {
            console.error(error);
        }

        let self = this;
        setTimeout(function () {
            self.execute_bgthreads();
        }, this.timeout);
    }
}