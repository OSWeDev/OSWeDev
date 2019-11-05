import * as moment from 'moment';
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
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import ServerBase from '../../ServerBase';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import ICronWorker from './interfaces/ICronWorker';

export default class ModuleCronServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleCronServer.instance) {
            ModuleCronServer.instance = new ModuleCronServer();
        }
        return ModuleCronServer.instance;
    }

    private static instance: ModuleCronServer = null;

    public registered_cronWorkers: { [worker_uid: string]: ICronWorker } = {};
    public cronWorkers_semaphores: { [worker_uid: string]: boolean } = {};

    private semaphore: boolean = false;

    private constructor() {
        super(ModuleCron.getInstance().name);
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '{worker_uid}'
        }, 'cron.run_cron_individuel.___LABEL___'));
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
        this.registered_cronWorkers[cronWorker.worker_uid] = cronWorker;
        this.cronWorkers_semaphores[cronWorker.worker_uid] = true;
    }

    public async planCronWorker(cronWorkerPlan: CronWorkerPlanification) {
        let vo: CronWorkerPlanification = await ModuleDAOServer.getInstance().selectOne<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID, "where t.planification_uid = $1", [cronWorkerPlan.planification_uid]);

        if (!vo) {

            await ModuleDAO.getInstance().insertOrUpdateVO(cronWorkerPlan);
        }
    }

    public async executeWorkersManually() {

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;
        ModulePushDataServer.getInstance().notifySimpleINFO(uid, 'cron.execute_manually.start');
        try {

            await this.executeWorkers();
            ModulePushDataServer.getInstance().notifySimpleSUCCESS(uid, 'cron.execute_manually.success');
        } catch (error) {
            ModulePushDataServer.getInstance().notifySimpleERROR(uid, 'cron.execute_manually.failed');
        }
    }

    public async executeWorkerManually(param: StringParamVO) {

        let worker_uid: string = param.text;

        if (!worker_uid) {
            return;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        ModulePushDataServer.getInstance().notifySimpleINFO(uid, 'cron.execute_manually_indiv.start');
        try {

            await this.executeWorker(worker_uid);
            ModulePushDataServer.getInstance().notifySimpleSUCCESS(uid, 'cron.execute_manually_indiv.success');
        } catch (error) {
            ModulePushDataServer.getInstance().notifySimpleERROR(uid, 'cron.execute_manually_indiv.failed');
        }
    }

    public async executeWorkers() {

        if (this.semaphore) {
            return false;
        }
        this.semaphore = true;

        try {

            let plannedWorkers: CronWorkerPlanification[] = await ModuleDAO.getInstance().getVos<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID);

            for (let i in plannedWorkers) {
                let plannedWorker: CronWorkerPlanification = plannedWorkers[i];

                if (plannedWorker.date_heure_planifiee && moment(plannedWorker.date_heure_planifiee).isBefore(moment())) {
                    await this.executeWorker(plannedWorker.worker_uid);
                    await this.nextRecurrence(plannedWorker);
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        this.semaphore = false;
    }

    protected async nextRecurrence(plannedWorker: CronWorkerPlanification) {
        if ((!plannedWorker) || (plannedWorker.type_recurrence == CronWorkerPlanification.TYPE_RECURRENCE_AUCUNE)) {
            plannedWorker.date_heure_planifiee = null;
            await ModuleDAO.getInstance().insertOrUpdateVO(plannedWorker);

            return;
        }

        let date_heure_planifiee: moment.Moment = moment(plannedWorker.date_heure_planifiee);

        switch (plannedWorker.type_recurrence) {
            case CronWorkerPlanification.TYPE_RECURRENCE_ANNEES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'year');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_HEURES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'hour');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_JOURS:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'day');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_MINUTES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'minute');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_MOIS:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'month');
                break;
            case CronWorkerPlanification.TYPE_RECURRENCE_SEMAINES:
                date_heure_planifiee.add(plannedWorker.intervale_recurrence, 'week');
                break;
            default:
        }
        plannedWorker.date_heure_planifiee = DateHandler.getInstance().formatDateTimeForBDD(date_heure_planifiee);

        await ModuleDAO.getInstance().insertOrUpdateVO(plannedWorker);
    }

    private async executeWorker(worker_uid: string) {
        if ((!worker_uid) || (!this.registered_cronWorkers[worker_uid]) || (!this.registered_cronWorkers[worker_uid].work)) {
            return;
        }

        if (!this.cronWorkers_semaphores[worker_uid]) {
            return;
        }

        this.cronWorkers_semaphores[worker_uid] = false;

        ConsoleHandler.getInstance().log('CRON:LANCEMENT:' + worker_uid);
        await this.registered_cronWorkers[worker_uid].work();
        ConsoleHandler.getInstance().log('CRON:FIN:' + worker_uid);

        this.cronWorkers_semaphores[worker_uid] = true;
    }
}