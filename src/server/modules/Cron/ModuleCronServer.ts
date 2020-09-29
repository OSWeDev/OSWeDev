import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleCron from '../../../shared/modules/Cron/ModuleCron';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import StackContext from '../../../shared/tools/StackContext';
import ServerBase from '../../ServerBase';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import CronServerController from './CronServerController';
import ICronWorker from './interfaces/ICronWorker';

export default class ModuleCronServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleCronServer.instance) {
            ModuleCronServer.instance = new ModuleCronServer();
        }
        return ModuleCronServer.instance;
    }

    private static instance: ModuleCronServer = null;

    private constructor() {
        super(ModuleCron.getInstance().name);
        CronServerController.getInstance();
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '{worker_uid}'
        }, 'cron.run_cron_individuel.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tâche manuelle en cours'
        }, 'CronComponent.info.executeWorkerManually.started.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Lancement manuel'
        }, 'cron.execute_manually_indiv.start'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tâche manuelle terminée'
        }, 'cron.execute_manually_indiv.success'));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleCron.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Tâches planifiées'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleCron.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des tâches planifiées'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCron.APINAME_executeWorkersManually, this.executeWorkersManually.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleCron.APINAME_executeWorkerManually, this.executeWorkerManually.bind(this));
    }

    public registerCronWorker(cronWorker: ICronWorker) {

        if (!CronServerController.getInstance().register_crons) {
            return;
        }

        CronServerController.getInstance().registered_cronWorkers[cronWorker.worker_uid] = cronWorker;
        CronServerController.getInstance().cronWorkers_semaphores[cronWorker.worker_uid] = true;
    }

    public async planCronWorker(cronWorkerPlan: CronWorkerPlanification) {

        if (!CronServerController.getInstance().register_crons) {
            return;
        }

        if (!CronServerController.getInstance().valid_crons_names[cronWorkerPlan.worker_uid]) {
            return;
        }

        let vo: CronWorkerPlanification = await ModuleDAOServer.getInstance().selectOne<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID, "where t.planification_uid = $1", [cronWorkerPlan.planification_uid]);

        if (!vo) {

            await ModuleDAO.getInstance().insertOrUpdateVO(cronWorkerPlan);
        }
    }

    public async executeWorkersManually() {

        let uid: number = StackContext.getInstance().get('UID');
        PushDataServerController.getInstance().notifySimpleINFO(uid, 'cron.execute_manually.start');
        try {

            CronServerController.getInstance().executeWorkers();
            PushDataServerController.getInstance().notifySimpleSUCCESS(uid, 'cron.execute_manually.success');
        } catch (error) {
            PushDataServerController.getInstance().notifySimpleERROR(uid, 'cron.execute_manually.failed');
        }
    }

    public async executeWorkerManually(param: StringParamVO) {

        let worker_uid: string = param.text;

        if (!worker_uid) {
            return;
        }

        let uid: number = StackContext.getInstance().get('UID');

        PushDataServerController.getInstance().notifySimpleINFO(uid, 'cron.execute_manually_indiv.start');
        try {

            CronServerController.getInstance().executeWorker(worker_uid);
            PushDataServerController.getInstance().notifySimpleSUCCESS(uid, 'cron.execute_manually_indiv.success');
        } catch (error) {
            PushDataServerController.getInstance().notifySimpleERROR(uid, 'cron.execute_manually_indiv.failed');
        }
    }
}