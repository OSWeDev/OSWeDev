import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMaintenance from '../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import VarsDatasVoUpdateHandler from '../Var/VarsDatasVoUpdateHandler';
import MaintenanceBGThread from './bgthreads/MaintenanceBGThread';
import MaintenanceCronWorkersHandler from './MaintenanceCronWorkersHandler';
import MaintenanceServerController from './MaintenanceServerController';

export default class ModuleMaintenanceServer extends ModuleServerBase {

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

        MaintenanceServerController.getInstance();

        // On enregistre le BGThread d'avancement/information sur les maintenances
        ModuleBGThreadServer.getInstance().registerBGThread(MaintenanceBGThread.getInstance());

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Terminer la maintenance' },
            'fields.labels.ref.module_maintenance_maintenance.__component__end_maintenance.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Terminer la maintenance' },
            'endmaintenance_component.endmaintenance.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Maintenances' },
            'menu.menuelements.admin.MaintenanceAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Maintenances' },
            'menu.menuelements.admin.MaintenanceVO.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': 'Une opération de maintenance est prévue dans moins de 2H.',
                'de-de': 'Eine Wartung ist in weniger als 2 Stunden geplant.',
                'es-es': 'Se planea una operación de mantenimiento en menos de 2H.'
            },
            ModuleMaintenance.MSG1_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': 'Une opération de maintenance est imminente. Enregistrez votre travail.',
                'de-de': 'Ein Wartungsvorgang steht unmittelbar bevor. Speichern Sie Ihre Arbeit.',
                'es-es': 'Una operación de mantenimiento es inminente. Salva tu trabajo.'
            },
            ModuleMaintenance.MSG2_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': 'Une opération de maintenance est en cours, votre travail ne sera pas enregistré.',
                'de-de': 'Ein Wartungsvorgang wird ausgeführt, Ihre Arbeit wird nicht gespeichert.',
                'es-es': 'Una operación de mantenimiento está en progreso, su trabajo no se guardará.'
            },
            ModuleMaintenance.MSG3_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': 'L\'opération de maintenance est terminée',
                'de-de': 'Der Wartungsvorgang ist abgeschlossen',
                'es-es': 'La operación de mantenimiento está completa.'
            },
            ModuleMaintenance.MSG4_code_text
        ));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Maintenance',
            'de-de': 'Wartung',
            'es-es': 'Mantenimiento'
        }, 'menu.menuelements.admin.module_maintenance.___LABEL___'));


        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(MaintenanceVO.API_TYPE_ID, this.handleTriggerPreC_MaintenanceVO);

        ForkedTasksController.getInstance().register_task(MaintenanceServerController.TASK_NAME_handleTriggerPreC_MaintenanceVO, this.handleTriggerPreC_MaintenanceVO.bind(this));
        ForkedTasksController.getInstance().register_task(MaintenanceServerController.TASK_NAME_end_maintenance, this.end_maintenance.bind(this));
        ForkedTasksController.getInstance().register_task(MaintenanceServerController.TASK_NAME_start_maintenance, this.start_maintenance.bind(this));
        ForkedTasksController.getInstance().register_task(MaintenanceServerController.TASK_NAME_end_planned_maintenance, this.end_planned_maintenance.bind(this));
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_END_MAINTENANCE, this.end_maintenance.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_START_MAINTENANCE, this.start_maintenance.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE, this.end_planned_maintenance.bind(this));
    }

    public async end_maintenance(num: number): Promise<void> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(MaintenanceServerController.TASK_NAME_end_maintenance, num)) {
            return;
        }

        if (!num) {
            return;
        }

        let session = StackContext.getInstance().get('SESSION');

        if (session && !session.uid) {
            return;
        }

        let maintenance: MaintenanceVO = await ModuleDAO.getInstance().getVoById<MaintenanceVO>(MaintenanceVO.API_TYPE_ID, num);

        maintenance.maintenance_over = true;
        maintenance.end_ts = Dates.now();

        ModuleDAOServer.getInstance().global_update_blocker = false;

        await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
        await PushDataServerController.getInstance().notifyDAOGetVoById(session.uid, null, MaintenanceVO.API_TYPE_ID, maintenance.id);
    }

    public async end_planned_maintenance(): Promise<void> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(MaintenanceServerController.TASK_NAME_end_planned_maintenance)) {
            return;
        }

        let planned_maintenance: MaintenanceVO = await this.get_planned_maintenance();

        if (!planned_maintenance) {
            return;
        }

        let session = StackContext.getInstance().get('SESSION');

        planned_maintenance.maintenance_over = true;
        planned_maintenance.end_ts = Dates.now();

        await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAO.getInstance().insertOrUpdateVO(planned_maintenance);
        if (session && !!session.uid) {
            await PushDataServerController.getInstance().notifyDAOGetVoById(session.uid, null, MaintenanceVO.API_TYPE_ID, planned_maintenance.id);
        }
    }

    public async start_maintenance(validation_code: string): Promise<void> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(MaintenanceServerController.TASK_NAME_start_maintenance, validation_code)) {
            return;
        }

        ConsoleHandler.getInstance().log('Maintenance demandée:' + validation_code);

        if (ConfigurationService.getInstance().getNodeConfiguration().START_MAINTENANCE_ACCEPTATION_CODE != validation_code) {
            ConsoleHandler.getInstance().error('Maintenance refusée');

            return;
        }

        let maintenance: MaintenanceVO = new MaintenanceVO();

        let session = StackContext.getInstance().get('SESSION');

        if (session && !!session.uid) {
            maintenance.author_id = session.uid;
        }
        maintenance.broadcasted_msg1 = true;
        maintenance.broadcasted_msg2 = true;
        maintenance.broadcasted_msg3 = false;
        maintenance.start_ts = Dates.now();
        maintenance.end_ts = Dates.add(maintenance.start_ts, 1, TimeSegment.TYPE_DAY);
        maintenance.maintenance_over = false;

        /**
         * On en profite pour bloquer les updates en bases
         *  - Par défaut on laisse 1 minute entre la réception de la notification et le passage en readonly de l'application
         */
        ConsoleHandler.getInstance().error('Maintenance programmée dans 10 minutes');
        await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);

        let readonly_maintenance_deadline = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_start_maintenance_force_readonly_after_x_ms, 60000);
        await ThreadHandler.getInstance().sleep(readonly_maintenance_deadline);
        await VarsDatasVoUpdateHandler.getInstance().force_empty_vars_datas_vo_update_cache();
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

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(MaintenanceServerController.TASK_NAME_handleTriggerPreC_MaintenanceVO, maintenance)) {
            return false;
        }

        // Si une maintenance est déjà en cours, on doit pas pouvoir en rajouter
        if (!!(await ModuleMaintenanceServer.getInstance().get_planned_maintenance())) {
            return false;
        }

        let session = StackContext.getInstance().get('SESSION');

        maintenance.creation_date = Dates.now();
        maintenance.author_id = maintenance.author_id ? maintenance.author_id : (session ? session.uid : null);

        return true;
    }
}