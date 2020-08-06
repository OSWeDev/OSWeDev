import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleMaintenance from '../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ServerBase from '../../ServerBase';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import MaintenanceBGThread from './bgthreads/MaintenanceBGThread';
import MaintenanceCronWorkersHandler from './MaintenanceCronWorkersHandler';
const moment = require('moment');

export default class ModuleMaintenanceServer extends ModuleServerBase {

    public static TASK_NAME_set_planned_maintenance_vo = 'ModuleMaintenanceServer.set_planned_maintenance_vo';
    public static TASK_NAME_handleTriggerPreC_MaintenanceVO = 'ModuleMaintenanceServer.handleTriggerPreC_MaintenanceVO';
    public static TASK_NAME_end_maintenance = 'ModuleMaintenanceServer.end_maintenance';
    public static TASK_NAME_start_maintenance = 'ModuleMaintenanceServer.start_maintenance';
    public static TASK_NAME_end_planned_maintenance = 'ModuleMaintenanceServer.end_planned_maintenance';

    public static getInstance() {
        if (!ModuleMaintenanceServer.instance) {
            ModuleMaintenanceServer.instance = new ModuleMaintenanceServer();
        }
        return ModuleMaintenanceServer.instance;
    }

    private static instance: ModuleMaintenanceServer = null;

    private constructor() {
        super(ModuleMaintenance.getInstance().name);
    }

    public registerCrons(): void {
        MaintenanceCronWorkersHandler.getInstance();
    }

    public async configure() {

        // On enregistre le BGThread d'avancement/information sur les maintenances
        ModuleBGThreadServer.getInstance().registerBGThread(MaintenanceBGThread.getInstance());

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Terminer la maintenance' },
            'fields.labels.ref.module_maintenance_maintenance.__component__end_maintenance.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Terminer la maintenance' },
            'endmaintenance_component.endmaintenance.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Maintenances' },
            'menu.menuelements.MaintenanceAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Maintenances' },
            'menu.menuelements.MaintenanceVO.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'Une opération de maintenance est prévue dans moins de 2H.',
                de: 'Eine Wartung ist in weniger als 2 Stunden geplant.',
                es: 'Se planea una operación de mantenimiento en menos de 2H.'
            },
            ModuleMaintenance.MSG1_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'Une opération de maintenance est imminente. Enregistrez votre travail.',
                de: 'Ein Wartungsvorgang steht unmittelbar bevor. Speichern Sie Ihre Arbeit.',
                es: 'Una operación de mantenimiento es inminente. Salva tu trabajo.'
            },
            ModuleMaintenance.MSG2_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'Une opération de maintenance est en cours, votre travail ne sera pas enregistré.',
                de: 'Ein Wartungsvorgang wird ausgeführt, Ihre Arbeit wird nicht gespeichert.',
                es: 'Una operación de mantenimiento está en progreso, su trabajo no se guardará.'
            },
            ModuleMaintenance.MSG3_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'L\'opération de maintenance est terminée',
                de: 'Der Wartungsvorgang ist abgeschlossen',
                es: 'La operación de mantenimiento está completa.'
            },
            ModuleMaintenance.MSG4_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Maintenance',
            de: 'Wartung',
            es: 'Mantenimiento'
        }, 'menu.menuelements.module_maintenance.___LABEL___'));


        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(MaintenanceVO.API_TYPE_ID, this.handleTriggerPreC_MaintenanceVO.bind(this));

        ForkedTasksController.getInstance().register_task(ModuleMaintenanceServer.TASK_NAME_handleTriggerPreC_MaintenanceVO, this.handleTriggerPreC_MaintenanceVO.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleMaintenanceServer.TASK_NAME_end_maintenance, this.end_maintenance.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleMaintenanceServer.TASK_NAME_start_maintenance, this.start_maintenance.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleMaintenanceServer.TASK_NAME_end_planned_maintenance, this.end_planned_maintenance.bind(this));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_END_MAINTENANCE, this.end_maintenance.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_START_MAINTENANCE, this.start_maintenance.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE, this.end_planned_maintenance.bind(this));
    }

    public async end_maintenance(param: NumberParamVO): Promise<void> {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(ModuleMaintenanceServer.TASK_NAME_end_maintenance, param)) {
            return;
        }

        if ((!param) || (!param.num)) {
            return;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let session = httpContext ? httpContext.get('SESSION') : null;

        if (session && !session.uid) {
            return;
        }

        let maintenance: MaintenanceVO = await ModuleDAO.getInstance().getVoById<MaintenanceVO>(MaintenanceVO.API_TYPE_ID, param.num);

        maintenance.maintenance_over = true;
        maintenance.end_ts = moment().utc(true);

        await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
        await PushDataServerController.getInstance().notifyDAOGetVoById(session.uid, MaintenanceVO.API_TYPE_ID, maintenance.id);
    }

    public async end_planned_maintenance(): Promise<void> {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(ModuleMaintenanceServer.TASK_NAME_end_planned_maintenance)) {
            return;
        }

        let planned_maintenance: MaintenanceVO = await this.get_planned_maintenance();

        if (!planned_maintenance) {
            return;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let session = httpContext ? httpContext.get('SESSION') : null;

        planned_maintenance.maintenance_over = true;
        planned_maintenance.end_ts = moment().utc(true);

        await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAO.getInstance().insertOrUpdateVO(planned_maintenance);
        if (session && !!session.uid) {
            await PushDataServerController.getInstance().notifyDAOGetVoById(session.uid, MaintenanceVO.API_TYPE_ID, planned_maintenance.id);
        }
    }

    public async start_maintenance(): Promise<void> {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(ModuleMaintenanceServer.TASK_NAME_start_maintenance)) {
            return;
        }

        let maintenance: MaintenanceVO = new MaintenanceVO();

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let session = httpContext ? httpContext.get('SESSION') : null;

        if (session && !!session.uid) {
            maintenance.author_id = session.uid;
        }
        maintenance.broadcasted_msg1 = true;
        maintenance.broadcasted_msg2 = true;
        maintenance.broadcasted_msg3 = false;
        maintenance.start_ts = moment().utc(true);
        maintenance.end_ts = moment().utc(true).add(1, 'hour');
        maintenance.maintenance_over = false;

        await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
    }

    public async get_planned_maintenance(): Promise<MaintenanceVO> {
        let maintenances: MaintenanceVO[] = await ModuleDAO.getInstance().getVos<MaintenanceVO>(MaintenanceVO.API_TYPE_ID);

        for (let i in maintenances) {
            let maintenance = maintenances[i];

            if (!maintenance.maintenance_over) {
                return maintenance;
            }
        }

        return null;
    }

    private async handleTriggerPreC_MaintenanceVO(maintenance: MaintenanceVO): Promise<boolean> {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(ModuleMaintenanceServer.TASK_NAME_handleTriggerPreC_MaintenanceVO, maintenance)) {
            return;
        }

        // Si une maintenance est déjà en cours, on doit pas pouvoir en rajouter
        if (!!(await this.get_planned_maintenance())) {
            return false;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let session = httpContext ? httpContext.get('SESSION') : null;

        if (session && session.uid) {
            return false;
        }

        maintenance.creation_date = moment().utc(true);
        maintenance.author_id = maintenance.author_id ? maintenance.author_id : (session ? session.uid : null);

        return true;
    }
}