import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMaintenance from '../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import DAOServerController from '../DAO/DAOServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import VarsDatasVoUpdateHandler from '../Var/VarsDatasVoUpdateHandler';
import MaintenanceBGThread from './bgthreads/MaintenanceBGThread';
import MaintenanceCronWorkersHandler from './MaintenanceCronWorkersHandler';
import MaintenanceServerController from './MaintenanceServerController';

export default class ModuleMaintenanceServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleMaintenanceServer.instance) {
            ModuleMaintenanceServer.instance = new ModuleMaintenanceServer();
        }
        return ModuleMaintenanceServer.instance;
    }

    private static instance: ModuleMaintenanceServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleMaintenance.getInstance().name);
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        MaintenanceCronWorkersHandler.getInstance();
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        MaintenanceServerController.getInstance();

        // On enregistre le BGThread d'avancement/information sur les maintenances
        ModuleBGThreadServer.getInstance().registerBGThread(MaintenanceBGThread.getInstance());

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Terminer la maintenance' },
            'fields.labels.ref.module_maintenance_maintenance.__component__end_maintenance.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Terminer la maintenance' },
            'endmaintenance_component.endmaintenance.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Maintenances' },
            'menu.menuelements.admin.MaintenanceAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            { 'fr-fr': 'Maintenances' },
            'menu.menuelements.admin.MaintenanceVO.___LABEL___'));


        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'Une opération de maintenance est prévue dans moins de 2H.',
                'de-de': 'Eine Wartung ist in weniger als 2 Stunden geplant.',
                'es-es': 'Se planea una operación de mantenimiento en menos de 2H.'
            },
            ModuleMaintenance.MSG1_code_text
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'Une opération de maintenance est imminente. Enregistrez votre travail.',
                'de-de': 'Ein Wartungsvorgang steht unmittelbar bevor. Speichern Sie Ihre Arbeit.',
                'es-es': 'Una operación de mantenimiento es inminente. Salva tu trabajo.'
            },
            ModuleMaintenance.MSG2_code_text
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'Une opération de maintenance est en cours, votre travail ne sera pas enregistré.',
                'de-de': 'Ein Wartungsvorgang wird ausgeführt, Ihre Arbeit wird nicht gespeichert.',
                'es-es': 'Una operación de mantenimiento está en progreso, su trabajo no se guardará.'
            },
            ModuleMaintenance.MSG3_code_text
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'L\'opération de maintenance est terminée',
                'de-de': 'Der Wartungsvorgang ist abgeschlossen',
                'es-es': 'La operación de mantenimiento está completa.'
            },
            ModuleMaintenance.MSG4_code_text
        ));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Maintenance',
            'de-de': 'Wartung',
            'es-es': 'Mantenimiento'
        }, 'menu.menuelements.admin.module_maintenance.___LABEL___'));


        const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(MaintenanceVO.API_TYPE_ID, this, this.handleTriggerPreC_MaintenanceVO);

        // Quand on modifie une maintenance, quelle qu'elle soit, on informe pas, il faudrait informer les 3 threads
        //  ça se mettra à jour dans les 30 secondes

        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(MaintenanceServerController.TASK_NAME_handleTriggerPreC_MaintenanceVO, this.handleTriggerPreC_MaintenanceVO.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(MaintenanceServerController.TASK_NAME_end_maintenance, this.end_maintenance.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(MaintenanceServerController.TASK_NAME_start_maintenance, this.start_maintenance.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(MaintenanceServerController.TASK_NAME_end_planned_maintenance, this.end_planned_maintenance.bind(this));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleMaintenance.APINAME_END_MAINTENANCE, this.end_maintenance.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleMaintenance.APINAME_START_MAINTENANCE, this.start_maintenance.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE, this.end_planned_maintenance.bind(this));
    }

    public async end_maintenance(num: number): Promise<void> {

        if (!await ForkedTasksController.exec_self_on_main_process(MaintenanceServerController.TASK_NAME_end_maintenance, num)) {
            return;
        }

        if (!num) {
            return;
        }

        const session = StackContext.get('SESSION');

        if (session && !session.uid) {
            return;
        }

        const maintenance: MaintenanceVO = await query(MaintenanceVO.API_TYPE_ID).filter_by_id(num).exec_as_server().select_vo<MaintenanceVO>();

        maintenance.maintenance_over = true;
        maintenance.end_ts = Dates.now();

        DAOServerController.GLOBAL_UPDATE_BLOCKER = false;

        await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(maintenance);
        await PushDataServerController.getInstance().notifyDAOGetVoById(session.uid, null, MaintenanceVO.API_TYPE_ID, maintenance.id);
    }

    public async end_planned_maintenance(): Promise<void> {

        if (!await ForkedTasksController.exec_self_on_main_process(MaintenanceServerController.TASK_NAME_end_planned_maintenance)) {
            return;
        }

        const planned_maintenance: MaintenanceVO = await this.get_planned_maintenance();

        if (!planned_maintenance) {
            return;
        }

        const session = StackContext.get('SESSION');

        planned_maintenance.maintenance_over = true;
        planned_maintenance.end_ts = Dates.now();

        await PushDataServerController.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(planned_maintenance);
        if (session && !!session.uid) {
            await PushDataServerController.getInstance().notifyDAOGetVoById(session.uid, null, MaintenanceVO.API_TYPE_ID, planned_maintenance.id);
        }
    }

    public async start_maintenance(validation_code: string): Promise<void> {

        if (!await ForkedTasksController.exec_self_on_main_process(MaintenanceServerController.TASK_NAME_start_maintenance, validation_code)) {
            return;
        }

        ConsoleHandler.log('Maintenance demandée:' + validation_code);

        if (ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE != validation_code) {
            ConsoleHandler.error('Maintenance refusée');

            return;
        }

        const maintenance: MaintenanceVO = new MaintenanceVO();

        const session = StackContext.get('SESSION');

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
        ConsoleHandler.error('Maintenance programmée dans 10 minutes');
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(maintenance);

        const readonly_maintenance_deadline = await ModuleParams.getInstance().getParamValueAsInt(ModuleMaintenance.PARAM_NAME_start_maintenance_force_readonly_after_x_ms, 60000, 180000);
        await ThreadHandler.sleep(readonly_maintenance_deadline, 'ModuleMaintenanceServer.start_maintenance');
        await VarsDatasVoUpdateHandler.force_empty_vars_datas_vo_update_cache();
    }

    public async get_planned_maintenance(): Promise<MaintenanceVO> {
        const maintenances: MaintenanceVO[] = await query(MaintenanceVO.API_TYPE_ID)
            .filter_is_false('maintenance_over')
            .exec_as_server()
            .select_vos<MaintenanceVO>();
        return (maintenances && maintenances.length) ? maintenances[0] : null;
    }

    private async handleTriggerPreC_MaintenanceVO(maintenance: MaintenanceVO): Promise<boolean> {

        if (!await ForkedTasksController.exec_self_on_main_process(MaintenanceServerController.TASK_NAME_handleTriggerPreC_MaintenanceVO, maintenance)) {
            return false;
        }

        // Si une maintenance est déjà en cours, on doit pas pouvoir en rajouter
        if (await ModuleMaintenanceServer.getInstance().get_planned_maintenance()) {
            return false;
        }

        const session = StackContext.get('SESSION');

        maintenance.creation_date = Dates.now();
        maintenance.author_id = maintenance.author_id ? maintenance.author_id : (session ? session.uid : null);

        return true;
    }
}