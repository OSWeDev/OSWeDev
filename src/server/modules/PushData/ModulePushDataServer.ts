
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import EnvHandler from '../../../shared/tools/EnvHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import StackContext from '../../StackContext';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ForkMessageController from '../Fork/ForkMessageController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import PushDataCronWorkersHandler from './PushDataCronWorkersHandler';
import PushDataServerController from './PushDataServerController';
import RegisterIORoomsThreadMessage from './vos/RegisterIORoomsThreadMessage';
import SocketWrapper from './vos/SocketWrapper';
import UnRegisterIORoomsThreadMessage from './vos/UnRegisterIORoomsThreadMessage';

export default class ModulePushDataServer extends ModuleServerBase {

    public static getInstance(): ModulePushDataServer {
        if (!ModulePushDataServer.instance) {
            ModulePushDataServer.instance = new ModulePushDataServer();
        }
        return ModulePushDataServer.instance;
    }

    private static instance: ModulePushDataServer = null;

    /**
     * En clé le nom de la room IO, en valeur l'objet de filtrage
     */
    private registered_rooms: { [room_id: string]: any } = {};

    private throttle_broadcast_registered_rooms = ThrottleHelper.declare_throttle_with_mappable_args(this.broadcast_registered_rooms, 1);
    private throttle_broadcast_unregistered_rooms = ThrottleHelper.declare_throttle_with_mappable_args(this.broadcast_unregistered_rooms, 1);

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModulePushData.getInstance().name);
    }

    // istanbul ignore next: cannot test registerCrons
    public registerCrons(): void {
        PushDataCronWorkersHandler.getInstance();
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModulePushData.APINAME_set_prompt_result, this.set_prompt_result.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePushData.APINAME_get_app_version, this.get_app_version.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePushData.APINAME_join_io_room, this.join_io_room.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePushData.APINAME_leave_io_room, this.leave_io_room.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        // Triggers pour mettre à jour les dates
        let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
        preCreateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this, this.handleNotificationCreation);

        let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(NotificationVO.API_TYPE_ID, this, this.handleNotificationUpdate);

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Valider'
        }, 'snotify.prompt.submit.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Annuler'
        }, 'snotify.prompt.cancel.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Votre session a été invalidée, la page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_SESSION_INVALIDATED));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Connexion en cours. La page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_USER_LOGGED));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'La page va être rechargée automatiquement...'
        }, PushDataServerController.NOTIFY_RELOAD));


        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Aucune notification en attente'
        }, 'UserNotifsViewerComponent.placeholder.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Notifications'
        }, 'UserNotifsViewerComponent.title.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Supprimer'
        }, 'UserNotifComponent.mark_as_read.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Télécharger'
        }, 'notification.simple_downloadable_link.download.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Tout supprimer'
        }, 'UserNotifsViewerComponent.footer_delete_all.___LABEL___'));

        // Déclaration de triggers sur tous les types de datas pour post C/U/D pour envoyer les notifs de mise à jour des données aux rooms IO
        let post_create_trigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let post_update_trigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let post_delete_trigger: DAOPostDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        for (let voType in VOsTypesManager.moduleTables_by_voType) {
            let table = VOsTypesManager.moduleTables_by_voType[voType];

            if (!table) {
                continue;
            }

            post_create_trigger.registerHandler(table.vo_type, this, this.handlePostCreate_io_rooms);
            post_update_trigger.registerHandler(table.vo_type, this, this.handlePostUpdate_io_rooms);
            post_delete_trigger.registerHandler(table.vo_type, this, this.handlePostDelete_io_rooms);
        }

        ForkMessageController.register_message_handler(RegisterIORoomsThreadMessage.FORK_MESSAGE_TYPE, this.register_io_rooms.bind(this));
        ForkMessageController.register_message_handler(UnRegisterIORoomsThreadMessage.FORK_MESSAGE_TYPE, this.unregister_io_rooms.bind(this));
    }

    public on_create_room(room_id: string) {
        this.throttle_broadcast_registered_rooms({ [room_id]: true });
    }

    public on_delete_room(room_id: string) {
        this.throttle_broadcast_unregistered_rooms({ [room_id]: true });
    }

    private async register_io_rooms(msg: RegisterIORoomsThreadMessage) {
        let room_ids: string[] = msg.message_content;
        try {
            for (let i in room_ids) {
                let room_id = room_ids[i];
                this.registered_rooms[room_id] = JSON.parse(room_id);
            }
        } catch (error) {
            ConsoleHandler.error('Impossible de parser les rooms IO: ' + room_ids.toString());
            return;
        }
    }

    private async unregister_io_rooms(msg: UnRegisterIORoomsThreadMessage) {
        let room_ids: string[] = msg.message_content;
        for (let i in room_ids) {
            let room_id = room_ids[i];
            delete this.registered_rooms[room_id];
        }
    }

    private async broadcast_registered_rooms(rooms: { [room_id: string]: boolean }) {
        let param = Object.keys(rooms);
        if ((!param) || (!param.length)) {
            return;
        }
        await ForkMessageController.broadcast(new RegisterIORoomsThreadMessage(Object.keys(rooms)));
    }

    private async broadcast_unregistered_rooms(rooms: { [room_id: string]: boolean }) {
        let param = Object.keys(rooms);
        if ((!param) || (!param.length)) {
            return;
        }
        await ForkMessageController.broadcast(new UnRegisterIORoomsThreadMessage(Object.keys(rooms)));
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

    /**
     * Déclenché à chaque création d'un objet en base
     * Appelé dans chaque thread. Il faut donc connaître ici les registered rooms (issues du thread principal, mais broadcastées dans tous les threads)
     * Et ensuite envoyer une demande au thread principal pour broadcaster dans la ou les rooms concernées
     */
    private async handlePostCreate_io_rooms(vo: IDistantVOBase) {
        for (let room_id in this.registered_rooms) {
            let vo_filter = this.registered_rooms[room_id];

            if (!vo_filter) {
                continue;
            }

            let ignore_vo = false;
            for (let field_id in vo_filter) {
                if (vo_filter[field_id] != vo[field_id]) {
                    ignore_vo = true;
                    break;
                }
            }

            if (ignore_vo) {
                continue;
            }

            PushDataServerController.getInstance().notify_vo_creation(room_id, vo);
        }
    }
    private async handlePostUpdate_io_rooms(vo_updtae_wrapper: DAOUpdateVOHolder<IDistantVOBase>) {
        for (let room_id in this.registered_rooms) {
            let vo_filter = this.registered_rooms[room_id];

            if (!vo_filter) {
                continue;
            }

            let ignore_pre_vo = false;
            for (let field_id in vo_filter) {
                if (vo_filter[field_id] != vo_updtae_wrapper.pre_update_vo[field_id]) {
                    ignore_pre_vo = true;
                    break;
                }
            }

            if (!ignore_pre_vo) {
                PushDataServerController.getInstance().notify_vo_update(room_id, vo_updtae_wrapper.pre_update_vo, vo_updtae_wrapper.post_update_vo);
                continue;
            }

            let ignore_post_vo = false;
            for (let field_id in vo_filter) {
                if (vo_filter[field_id] != vo_updtae_wrapper.post_update_vo[field_id]) {
                    ignore_post_vo = true;
                    break;
                }
            }

            if (!ignore_post_vo) {
                PushDataServerController.getInstance().notify_vo_update(room_id, vo_updtae_wrapper.pre_update_vo, vo_updtae_wrapper.post_update_vo);
                continue;
            }
        }
    }
    private async handlePostDelete_io_rooms(vo: IDistantVOBase) {
        for (let room_id in this.registered_rooms) {
            let vo_filter = this.registered_rooms[room_id];

            if (!vo_filter) {
                continue;
            }

            let ignore_vo = false;
            for (let field_id in vo_filter) {
                if (vo_filter[field_id] != vo[field_id]) {
                    ignore_vo = true;
                    break;
                }
            }

            if (ignore_vo) {
                continue;
            }

            PushDataServerController.getInstance().notify_vo_deletion(room_id, vo);
        }
    }

    private join_io_room(room_vo_fields: string[]) {

        if ((!room_vo_fields) || (!room_vo_fields.length) || (room_vo_fields.length % 2 == 1)) {
            ConsoleHandler.error('Impossible de parser la room IO:' + room_vo_fields);
            return;
        }

        let room: string = null;
        let room_vo: any = null;
        try {
            for (let i = 0; i < room_vo_fields.length; i += 2) {
                let field_id = room_vo_fields[i];
                let field_value = room_vo_fields[i + 1];

                if (i == 0) {
                    room = '{';
                } else {
                    room += ',';
                }

                room += '"' + field_id + '":' + field_value;
            }
            room += '}';
            room_vo = JSON.parse(room);
        } catch (error) {
            ConsoleHandler.error('Impossible de parser la room IO:' + room);
        }

        if (!room) {
            ConsoleHandler.error('Impossible de récuperer la room IO:' + room);
            return;
        }

        if (!this.registered_rooms[room]) {

            this.registered_rooms[room] = room_vo;
        }

        let uid = StackContext.get('UID');
        let client_tab_id = StackContext.get('CLIENT_TAB_ID');

        let sockets: SocketWrapper[] = PushDataServerController.getInstance().getUserSockets(parseInt(uid.toString()), client_tab_id);

        try {

            for (let i in sockets) {
                sockets[i].socket.join(room);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private leave_io_room(room_vo_fields: string[]) {

        if ((!room_vo_fields) || (!room_vo_fields.length) || (room_vo_fields.length % 2 == 1)) {
            ConsoleHandler.error('Impossible de parser la room IO:' + room_vo_fields);
            return;
        }

        let room: string = null;
        let room_vo: any = null;
        try {
            for (let i = 0; i < room_vo_fields.length; i += 2) {
                let field_id = room_vo_fields[i];
                let field_value = room_vo_fields[i + 1];

                if (i == 0) {
                    room = '{';
                } else {
                    room += ',';
                }

                room += '"' + field_id + '":' + field_value;
            }
            room += '}';
            room_vo = JSON.parse(room);
        } catch (error) {
            ConsoleHandler.error('Impossible de parser la room IO:' + room);
        }

        if (!room) {
            ConsoleHandler.error('Impossible de récuperer la room IO:' + room);
            return;
        }

        let uid = StackContext.get('UID');
        let client_tab_id = StackContext.get('CLIENT_TAB_ID');

        let sockets: SocketWrapper[] = PushDataServerController.getInstance().getUserSockets(parseInt(uid.toString()), client_tab_id);

        try {

            for (let i in sockets) {
                sockets[i].socket.leave(room);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
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

    private async get_app_version(): Promise<string> {
        return EnvHandler.VERSION;
    }
}