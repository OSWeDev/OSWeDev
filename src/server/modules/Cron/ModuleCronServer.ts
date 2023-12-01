import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ManualTasksController from '../../../shared/modules/Cron/ManualTasksController';
import ModuleCron from '../../../shared/modules/Cron/ModuleCron';
import CronWorkerPlanification from '../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import CronServerController from './CronServerController';
import ICronWorker from './interfaces/ICronWorker';

export default class ModuleCronServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleCronServer.instance) {
            ModuleCronServer.instance = new ModuleCronServer();
        }
        return ModuleCronServer.instance;
    }

    private static instance: ModuleCronServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleCron.getInstance().name);
        CronServerController.getInstance();
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '{worker_uid}'
        }, 'cron.run_cron_individuel.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lancer une tâche planifiée manuellement'
        }, 'cron.run_cron_individuel.head.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mettre à jour la supervision'
        }, 'cron.update_supervised.head.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâche manuelles'
        }, 'cron.manual_task.head.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '{manual_task}'
        }, 'cron.manual_task.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': '{supervised_uid}'
        }, 'cron.update_supervised.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mise à jour supervision {supervised_uid} débutée'
        }, 'CronComponent.info.update_supervised.started.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mise à jour supervision {supervised_uid} terminée'
        }, 'CronComponent.info.update_supervised.ended.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Non planifié'
        }, 'cronworkplan.TYPE_RECURRENCE.AUCUNE'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Année.s'
        }, 'cronworkplan.TYPE_RECURRENCE.ANNEES'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mois'
        }, 'cronworkplan.TYPE_RECURRENCE.MOIS'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Semaine.s'
        }, 'cronworkplan.TYPE_RECURRENCE.SEMAINES'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Jour.s'
        }, 'cronworkplan.TYPE_RECURRENCE.JOURS'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Heure.s'
        }, 'cronworkplan.TYPE_RECURRENCE.HEURES'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Minute.s'
        }, 'cronworkplan.TYPE_RECURRENCE.MINUTES'));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâche manuelle en cours'
        }, 'CronComponent.info.run_manual_task.started.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâche manuelle terminée'
        }, 'CronComponent.info.run_manual_task.ended.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lancement manuel des tâches'
        }, 'cron.execute_manually.start'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâches terminées'
        }, 'cron.execute_manually.success'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâches échouées'
        }, 'cron.execute_manually.failed'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâche manuelle en cours'
        }, 'CronComponent.info.executeWorkerManually.started.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Lancement manuel'
        }, 'cron.execute_manually_indiv.start'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tâche manuelle terminée'
        }, 'cron.execute_manually_indiv.success'));
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleCron.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Tâches planifiées'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleCron.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des tâches planifiées'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleCron.APINAME_executeWorkersManually, this.executeWorkersManually.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCron.APINAME_executeWorkerManually, this.executeWorkerManually.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCron.APINAME_run_manual_task, this.run_manual_task.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleCron.APINAME_get_manual_tasks, this.get_manual_tasks.bind(this));
    }

    public registerCronWorker(cronWorker: ICronWorker) {

        if (!CronServerController.getInstance().register_crons) {
            return;
        }

        CronServerController.getInstance().registered_cronWorkers[cronWorker.worker_uid] = cronWorker;
        CronServerController.getInstance().cronWorkers_semaphores[cronWorker.worker_uid] = true;
    }

    /**
     * planCronWorker
     *  - Create or load Plan Cron Worker
     *
     * @param {CronWorkerPlanification} [cronWorkerPlan]
     * @returns {Promise<void>}
     */
    public async planCronWorker(cronWorkerPlan: CronWorkerPlanification): Promise<void> {

        if (!CronServerController.getInstance().register_crons) {
            return;
        }

        if (!CronServerController.getInstance().valid_crons_names[cronWorkerPlan.worker_uid]) {
            return;
        }

        // Create or load cron worker
        let vo: CronWorkerPlanification = await query(CronWorkerPlanification.API_TYPE_ID)
            .filter_by_text_eq('planification_uid', cronWorkerPlan.planification_uid)
            .select_vo<CronWorkerPlanification>();

        if (!vo) {
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cronWorkerPlan);
        }
    }

    public async run_manual_task(text: string) {

        let uid: number = StackContext.get('UID');
        let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

        if (!ManualTasksController.getInstance().registered_manual_tasks_by_name[text]) {
            return null;
        }
        await ManualTasksController.getInstance().registered_manual_tasks_by_name[text]();
    }


    public async executeWorkersManually() {

        let uid: number = StackContext.get('UID');
        let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

        await PushDataServerController.getInstance().notifySimpleINFO(uid, CLIENT_TAB_ID, 'cron.execute_manually.start');
        try {

            await CronServerController.getInstance().executeWorkers();
            await PushDataServerController.getInstance().notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'cron.execute_manually.success');
        } catch (error) {
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'cron.execute_manually.failed');
        }
    }

    public async executeWorkerManually(text: string) {

        let worker_uid: string = text;

        if (!worker_uid) {
            return;
        }

        let uid: number = StackContext.get('UID');
        let CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

        await PushDataServerController.getInstance().notifySimpleINFO(uid, CLIENT_TAB_ID, 'cron.execute_manually_indiv.start');
        try {

            await CronServerController.getInstance().executeWorker(worker_uid);
            await PushDataServerController.getInstance().notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'cron.execute_manually_indiv.success');
        } catch (error) {
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'cron.execute_manually_indiv.failed');
        }
    }

    private async get_manual_tasks(): Promise<string[]> {
        let res: string[] = [];

        for (let text in ManualTasksController.getInstance().registered_manual_tasks_by_name) {
            res.push(text);
        }
        return res;
    }
}