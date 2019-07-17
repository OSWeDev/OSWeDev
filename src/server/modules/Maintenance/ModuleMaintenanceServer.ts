import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleMaintenance from '../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../shared/modules/Maintenance/vos/MaintenanceVO';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ServerBase from '../../ServerBase';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import moment = require('moment');
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';

export default class ModuleMaintenanceServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleMaintenanceServer.instance) {
            ModuleMaintenanceServer.instance = new ModuleMaintenanceServer();
        }
        return ModuleMaintenanceServer.instance;
    }

    private static instance: ModuleMaintenanceServer = null;

    // On le rend public via un getter pour indiquer qu'une maintenance planifiée est en cours sans avoir à faire de requete
    private SEMAPHORE_process_to_send_broadcasts: boolean = false;

    private informed_users_tstzs: { [user_id: number]: moment.Moment } = {};

    private constructor() {
        super(ModuleMaintenance.getInstance().name);
    }

    get has_planned_maintenance() {
        return this.SEMAPHORE_process_to_send_broadcasts;
    }

    public async configure() {

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

        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(MaintenanceVO.API_TYPE_ID, this.handleTriggerPreC_MaintenanceVO.bind(this));

        if (!this.SEMAPHORE_process_to_send_broadcasts) {
            this.process_to_send_broadcasts();
        }
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

        if (session && session.user) {
            return;
        }

        let maintenance: MaintenanceVO = await ModuleDAO.getInstance().getVoById<MaintenanceVO>(MaintenanceVO.API_TYPE_ID, param.num);

        maintenance.maintenance_over = true;

        await ModulePushDataServer.getInstance().broadcastSimple(NotificationVO.SIMPLE_SUCCESS, ModuleMaintenance.MSG4_code_text);
        await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);
        await ModulePushDataServer.getInstance().notifyDAOGetVoById(session.user.id, MaintenanceVO.API_TYPE_ID, maintenance.id);
    }

    public async inform_user_on_request(user_id: number): Promise<void> {

        let maintenance: MaintenanceVO = await this.get_planned_maintenance();
        if (!(maintenance && (!maintenance.broadcasted_msg3) && (!maintenance.maintenance_over))) {
            return;
        }

        let timeout_info: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_INFORM_EVERY_MINUTES);
        if ((!!this.informed_users_tstzs[user_id]) && (moment(this.informed_users_tstzs[user_id]).add(timeout_info, 'minute').isSameOrBefore(moment()))) {
            return;
        }

        let timeout_minutes_msg1: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
        let timeout_minutes_msg2: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
        let timeout_minutes_msg3: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);

        if (moment(maintenance.start_ts).add(-timeout_minutes_msg3, 'minute').isSameOrBefore(moment())) {
            await ModulePushDataServer.getInstance().notifySimpleERROR(user_id, ModuleMaintenance.MSG3_code_text);
        } else if (moment(maintenance.start_ts).add(-timeout_minutes_msg2, 'minute').isSameOrBefore(moment())) {
            await ModulePushDataServer.getInstance().notifySimpleWARN(user_id, ModuleMaintenance.MSG2_code_text);
        } else if (moment(maintenance.start_ts).add(-timeout_minutes_msg1, 'minute').isSameOrBefore(moment())) {
            await ModulePushDataServer.getInstance().notifySimpleINFO(user_id, ModuleMaintenance.MSG1_code_text);
        }

        this.informed_users_tstzs[user_id] = moment();
    }

    private async get_planned_maintenance(): Promise<MaintenanceVO> {
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

        // Si une maintenance est déjà en cours, on doit pas pouvoir en rajouter
        if (await this.get_planned_maintenance()) {
            return false;
        }

        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let session = httpContext ? httpContext.get('SESSION') : null;

        if (session && session.user) {
            return false;
        }

        maintenance.creation_date = moment();
        maintenance.author_id = session.user.id;

        // lancer le process qui doit lancer les msgs quand et si besoin
        //  Ce process doit être relancé au lancement de l'appli si une maintenance est en attente
        if (!this.SEMAPHORE_process_to_send_broadcasts) {
            this.process_to_send_broadcasts();
        }

        return true;
    }

    private async process_to_send_broadcasts(): Promise<void> {

        this.SEMAPHORE_process_to_send_broadcasts = true;

        let maintenance: MaintenanceVO = await this.get_planned_maintenance();
        while (maintenance && (!maintenance.broadcasted_msg3) && (!maintenance.maintenance_over)) {

            let timeout_minutes_msg1: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
            let timeout_minutes_msg2: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);
            let timeout_minutes_msg3: number = ModuleMaintenance.getInstance().getParamValue(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES);

            let changed: boolean = false;

            if (!maintenance.broadcasted_msg1) {

                if (moment(maintenance.start_ts).add(-timeout_minutes_msg1, 'minute').isSameOrBefore(moment())) {
                    await ModulePushDataServer.getInstance().broadcastSimple(NotificationVO.SIMPLE_INFO, ModuleMaintenance.MSG1_code_text);
                    maintenance.broadcasted_msg1 = true;
                    changed = true;
                }
            }

            if (!maintenance.broadcasted_msg2) {

                if (moment(maintenance.start_ts).add(-timeout_minutes_msg2, 'minute').isSameOrBefore(moment())) {
                    await ModulePushDataServer.getInstance().broadcastSimple(NotificationVO.SIMPLE_WARN, ModuleMaintenance.MSG2_code_text);
                    maintenance.broadcasted_msg2 = true;
                    changed = true;
                }
            }

            if (!maintenance.broadcasted_msg3) {

                if (moment(maintenance.start_ts).add(-timeout_minutes_msg3, 'minute').isSameOrBefore(moment())) {
                    await ModulePushDataServer.getInstance().broadcastSimple(NotificationVO.SIMPLE_ERROR, ModuleMaintenance.MSG3_code_text);
                    maintenance.broadcasted_msg3 = true;
                    changed = true;
                }
            }

            await ModuleDAO.getInstance().insertOrUpdateVO(maintenance);

            await ThreadHandler.getInstance().sleep(1000 * 60);
            maintenance = await this.get_planned_maintenance();
        }

        // plus rien à gérer ici
        this.SEMAPHORE_process_to_send_broadcasts = false;
        return;
    }
}