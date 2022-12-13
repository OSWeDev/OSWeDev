
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
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

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModulePushData.APINAME_set_prompt_result, this.set_prompt_result.bind(this));
    }

    public async configure() {

        // Triggers pour mettre à jour les dates
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this, this.handleNotificationCreation);

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this, this.handleNotificationUpdate);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valider'
        }, 'snotify.prompt.submit.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'snotify.prompt.cancel.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre session a été invalidée, la page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_SESSION_INVALIDATED));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion en cours. La page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_USER_LOGGED));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'La page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_RELOAD));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Aucune notification en attente'
        }, 'UserNotifsViewerComponent.placeholder.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Notifications'
        }, 'UserNotifsViewerComponent.title.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'UserNotifComponent.mark_as_read.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout supprimer'
        }, 'UserNotifsViewerComponent.footer_delete_all.___LABEL___'));
    }

    private async handleNotificationCreation(notif: NotificationVO): Promise<boolean> {
        notif.creation_date = Dates.now();
        return true;
    }

    private async handleNotificationUpdate(vo_update_handler: DAOUpdateVOHolder<NotificationVO>): Promise<boolean> {

        if ((!vo_update_handler.pre_update_vo.read) && vo_update_handler.post_update_vo.read) {
            vo_update_handler.post_update_vo.read_date = Dates.now();
        }
        return true;
    }

    private async set_prompt_result(notification: NotificationVO) {
        if (!PushDataServerController.getInstance().registered_prompts_cbs_by_uid[notification.prompt_uid]) {
            ConsoleHandler.error('set_prompt_result:prompt unknown:' + notification.prompt_uid + ':' + notification.prompt_result + ':');
            return;
        }

        let callback = PushDataServerController.getInstance().registered_prompts_cbs_by_uid[notification.prompt_uid];
        try {
            await callback(notification.prompt_result);
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }
}