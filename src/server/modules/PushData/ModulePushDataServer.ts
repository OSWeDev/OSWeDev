import * as moment from 'moment';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import PushDataCronWorkersHandler from './PushDataCronWorkersHandler';
import PushDataServerController from './PushDataServerController';

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
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this.handleNotificationCreation);

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this.handleNotificationUpdate);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Votre session a été invalidée, la page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_SESSION_INVALIDATED));

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

    private async handleNotificationUpdate(vo_update_handler: DAOUpdateVOHolder<NotificationVO>): Promise<boolean> {

        if ((!vo_update_handler.pre_update_vo.read) && vo_update_handler.post_update_vo.read) {
            vo_update_handler.post_update_vo.read_date = moment().utc(true);
        }
        return true;
    }
}