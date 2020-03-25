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
import ModuleServerBase from '../ModuleServerBase';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import MaintenanceBGThread from './bgthreads/MaintenanceBGThread';
import moment = require('moment');

export default class ModuleMaintenanceServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleMaintenanceServer.instance) {
            ModuleMaintenanceServer.instance = new ModuleMaintenanceServer();
        }
        return ModuleMaintenanceServer.instance;
    }

    private static instance: ModuleMaintenanceServer = null;

    // On le rend public via un getter pour indiquer qu'une maintenance planifiée est en cours sans avoir à faire de requete
    public planned_maintenance: MaintenanceVO = null;

    private informed_users_tstzs: { [user_id: number]: moment.Moment } = {};

    private constructor() {
        super(ModuleMaintenance.getInstance().name);
    }

    get has_planned_maintenance() {
        return !!this.planned_maintenance;
    }

    public async configure() {

        // On enregistre le BGThread d'avancement/information sur les maintenances
        ModuleBGThreadServer.getInstance().registerBGThread(MaintenanceBGThread.getInstance());

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Terminer la maintenance' },
            'fields.labels.ref.module_maintenance_maintenance.__component__end_maintenance.___LABEL___'));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Terminer la maintenance' },
            'endmaintenance_component.endmaintenance.___LABEL___'));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Maintenances' },
            'menu.menuelements.MaintenanceAdminVueModule.___LABEL___'));
        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            { fr: 'Maintenances' },
            'menu.menuelements.MaintenanceVO.___LABEL___'));


        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'Une opération de maintenance est prévue dans moins de 2H.',
                de: 'Eine Wartung ist in weniger als 2 Stunden geplant.',
                es: 'Se planea una operación de mantenimiento en menos de 2H.'
            },
            ModuleMaintenance.MSG1_code_text
        ));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'Une opération de maintenance est imminente. Enregistrez votre travail.',
                de: 'Ein Wartungsvorgang steht unmittelbar bevor. Speichern Sie Ihre Arbeit.',
                es: 'Una operación de mantenimiento es inminente. Salva tu trabajo.'
            },
            ModuleMaintenance.MSG2_code_text
        ));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
            {
                fr: 'Une opération de maintenance est en cours, votre travail ne sera pas enregistré.',
                de: 'Ein Wartungsvorgang wird ausgeführt, Ihre Arbeit wird nicht gespeichert.',
                es: 'Una operación de mantenimiento está en progreso, su trabajo no se guardará.'
            },
            ModuleMaintenance.MSG3_code_text
        ));

        await DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
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
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleMaintenance.APINAME_END_MAINTENANCE, this.end_maintenance.bind(this));
    }

    public async end_maintenance(param: NumberParamVO): Promise<void> {

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

        await ModulePushDataServer.getInstance().broadcastAllSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
        await ModulePushDataServer.getInstance().notifyDAOGetVoById(session.uid, MaintenanceVO.API_TYPE_ID, maintenance.id);
    }

    public async inform_user_on_request(user_id: number): Promise<void> {

        if (!(this.planned_maintenance && (!this.planned_maintenance.maintenance_over))) {
            return;
        }

        let timeout_info: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_INFORM_EVERY_MINUTES);
        if ((!!this.informed_users_tstzs[user_id]) && (moment(this.informed_users_tstzs[user_id]).utc(true).add(timeout_info, 'minute').isAfter(moment().utc(true)))) {
            return;
        }

        let timeout_minutes_msg1: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
        let timeout_minutes_msg2: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
        let timeout_minutes_msg3: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);

        if (moment(this.planned_maintenance.start_ts).utc(true).add(-timeout_minutes_msg3, 'minute').isSameOrBefore(moment().utc(true))) {
            await ModulePushDataServer.getInstance().notifySimpleERROR(user_id, ModuleMaintenance.MSG3_code_text);
        } else if (moment(this.planned_maintenance.start_ts).utc(true).add(-timeout_minutes_msg2, 'minute').isSameOrBefore(moment().utc(true))) {
            await ModulePushDataServer.getInstance().notifySimpleWARN(user_id, ModuleMaintenance.MSG2_code_text);
        } else if (moment(this.planned_maintenance.start_ts).utc(true).add(-timeout_minutes_msg1, 'minute').isSameOrBefore(moment().utc(true))) {
            await ModulePushDataServer.getInstance().notifySimpleINFO(user_id, ModuleMaintenance.MSG1_code_text);
        }

        this.informed_users_tstzs[user_id] = moment().utc(true);
    }

    private async handleTriggerPreC_MaintenanceVO(maintenance: MaintenanceVO): Promise<boolean> {

        // Si une maintenance est déjà en cours, on doit pas pouvoir en rajouter
        if (this.has_planned_maintenance) {
            return false;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let session = httpContext ? httpContext.get('SESSION') : null;

        if (session && session.uid) {
            return false;
        }

        maintenance.creation_date = moment().utc(true);
        maintenance.author_id = session.uid;

        return true;
    }
}