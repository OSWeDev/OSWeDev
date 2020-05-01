import * as moment from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import PushDataCronWorkersHandler from './PushDataCronWorkersHandler';
import SocketWrapper from './vos/SocketWrapper';

export default class ModulePushDataServer extends ModuleServerBase {

    public static NOTIF_INTERVAL_MS: number = 1000;

    public static getInstance(): ModulePushDataServer {
        if (!ModulePushDataServer.instance) {
            ModulePushDataServer.instance = new ModulePushDataServer();
        }
        return ModulePushDataServer.instance;
    }

    private static instance: ModulePushDataServer = null;

    private constructor() {
        super(ModulePushData.getInstance().name);
    }

    public registerCrons(): void {
        PushDataCronWorkersHandler.getInstance();
    }

    public async configure() {

        // Triggers pour mettre à jour les dates
        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this.handleNotificationCreation.bind(this));

        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this.handleNotificationUpdate.bind(this));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Aucune notification en attente'
        }, 'UserNotifsViewerComponent.placeholder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Notifications'
        }, 'UserNotifsViewerComponent.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer'
        }, 'UserNotifComponent.mark_as_read.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Tout supprimer'
        }, 'UserNotifsViewerComponent.footer_delete_all.___LABEL___'));
    }

    private async handleNotificationCreation(notif: NotificationVO): Promise<boolean> {
        notif.creation_date = moment().utc(true);
        return true;
    }

    private async handleNotificationUpdate(notif: NotificationVO): Promise<boolean> {

        let enbase: NotificationVO = await ModuleDAO.getInstance().getVoById<NotificationVO>(NotificationVO.API_TYPE_ID, notif.id);

        if ((!enbase.read) && notif.read) {
            notif.read_date = moment().utc(true);
        }
        return true;
    }
}