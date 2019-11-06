import * as moment from 'moment';
import * as socketIO from 'socket.io';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import PushDataCronWorkersHandler from './PushDataCronWorkersHandler';
import SocketWrapper from './vos/SocketWrapper';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';

export default class ModulePushDataServer extends ModuleServerBase {

    public static NOTIF_INTERVAL_MS: number = 1000;

    public static getInstance(): ModulePushDataServer {
        if (!ModulePushDataServer.instance) {
            ModulePushDataServer.instance = new ModulePushDataServer();
        }
        return ModulePushDataServer.instance;
    }

    private static instance: ModulePushDataServer = null;

    private registeredSockets: { [userId: number]: { [sessId: string]: SocketWrapper[] } } = {};

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



    public registerSocket(userId: number, sessId: string, socket: socketIO.Socket) {
        // No user or session, don't save this socket
        if ((!userId) || (!sessId)) {
            return;
        }

        if (!this.registeredSockets[userId]) {
            this.registeredSockets[userId] = {};
        }
        if (!this.registeredSockets[userId][sessId]) {
            this.registeredSockets[userId][sessId] = [];
        }
        this.registeredSockets[userId][sessId].push(new SocketWrapper(userId, sessId, socket));
    }

    // A refaire si décommenté public getSessionSockets(sessId: string): socketIO.Socket[] {

    //     let res: socketIO.Socket[] = [];

    //     for (let userId in this.registeredSockets) {

    //         for (let i in this.registeredSockets[sessId]) {
    //             if (this.registeredSockets[sessId][i].connected) {
    //                 res.push(this.registeredSockets[sessId][i]);
    //             }
    //         }
    //     }

    //     return this.registeredSockets[sessId];
    // }

    public getUserSockets(userId: number): SocketWrapper[] {

        let res: SocketWrapper[] = [];
        let newUserSockets: { [sessId: string]: SocketWrapper[] } = {};
        for (let i in this.registeredSockets[userId]) {

            let sessionSockets = this.registeredSockets[userId][i];
            let newSessionSockets: SocketWrapper[] = [];
            for (let j in sessionSockets) {

                if (sessionSockets[j].socket.connected) {
                    newSessionSockets.push(sessionSockets[j]);
                    res.push(sessionSockets[j]);
                }
            }

            if (newSessionSockets.length > 0) {
                newUserSockets[i] = newSessionSockets;
            }
        }

        this.registeredSockets[userId] = newUserSockets;
        return res;
    }

    public getAllSockets(): SocketWrapper[] {

        let res: SocketWrapper[] = [];

        let newSockets: { [userId: number]: { [sessId: string]: SocketWrapper[] } } = {};

        for (let userId in this.registeredSockets) {
            let newUserSockets: { [sessId: string]: SocketWrapper[] } = {};
            let has_session_sockets: boolean = false;

            for (let sessId in this.registeredSockets[userId]) {
                let sessionSockets: SocketWrapper[] = [];

                for (let i in this.registeredSockets[userId][sessId]) {
                    if (this.registeredSockets[userId][sessId][i].socket.connected) {
                        sessionSockets.push(this.registeredSockets[userId][sessId][i]);
                        res.push(this.registeredSockets[userId][sessId][i]);
                    }
                }
                if (sessionSockets.length > 0) {
                    newUserSockets[sessId] = sessionSockets;
                    has_session_sockets = true;
                }
            }
            if (has_session_sockets) {
                newSockets[userId] = newUserSockets;
            }
        }
        this.registeredSockets = newSockets;
        return res;
    }



    public async notifyDAOGetVoById(user_id: number, api_type_id: string, vo_id: number) {

        if ((!user_id) || (!api_type_id) || (!vo_id)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_GET_VO_BY_ID;
        notification.dao_notif_vo_id = vo_id;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(ModulePushDataServer.NOTIF_INTERVAL_MS);
    }

    public async notifyDAOGetVos(user_id: number, api_type_id: string) {

        if ((!user_id) || (!api_type_id)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_GET_VOS;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(ModulePushDataServer.NOTIF_INTERVAL_MS);
    }

    public async broadcastLoggedSimple(msg_type: number, code_text: string) {
        let promises = [];

        let ids: number[] = [];
        for (let userId_ in this.registeredSockets) {
            let userId = parseInt(userId_.toString());

            if (ids.indexOf(userId) < 0) {
                ids.push(userId);
            } else {
                continue;
            }

            promises.push((async () => {
                await this.notifySimple(userId, msg_type, code_text);
            })());
        }
        await Promise.all(promises);
    }

    public async broadcastAllSimple(msg_type: number, code_text: string) {
        let promises = [];
        let users = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);
        for (let i in users) {
            let user = users[i];

            promises.push((async () => {
                await this.notifySimple(user.id, msg_type, code_text);
            })());
        }
        await Promise.all(promises);
    }

    public async broadcastRoleSimple(role_name: string, msg_type: number, code_text: string) {
        let promises = [];

        try {
            let role: RoleVO = await ModuleDAOServer.getInstance().selectOne<RoleVO>(RoleVO.API_TYPE_ID, ' where translatable_name=$1;', [role_name]);
            if (!role) {
                ConsoleHandler.getInstance().error('broadcastRoleSimple:Role introuvable:' + role_name + ':');
                return;
            }

            let usersRoles: UserRoleVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<UserRoleVO>(UserRoleVO.API_TYPE_ID, 'role_id', [role.id]);
            if (!usersRoles) {
                ConsoleHandler.getInstance().error('broadcastRoleSimple:usersRoles introuvables:' + role_name + ':' + role.id);
                return;
            }

            let user_ids: number[] = [];
            for (let i in usersRoles) {
                user_ids.push(usersRoles[i].user_id);
            }

            let users: UserVO[] = await ModuleDAO.getInstance().getVosByIds<UserVO>(UserVO.API_TYPE_ID, user_ids);
            if (!users) {
                ConsoleHandler.getInstance().error('broadcastRoleSimple:users introuvables:' + role_name + ':' + role.id);
                return;
            }

            for (let i in users) {
                let user = users[i];

                promises.push((async () => {
                    await this.notifySimple(user.id, msg_type, code_text);
                })());
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await Promise.all(promises);
    }

    public async notifySimpleSUCCESS(user_id: number, code_text: string) {
        await this.notifySimple(user_id, NotificationVO.SIMPLE_SUCCESS, code_text);
    }
    public async notifySimpleINFO(user_id: number, code_text: string) {
        await this.notifySimple(user_id, NotificationVO.SIMPLE_INFO, code_text);
    }
    public async notifySimpleWARN(user_id: number, code_text: string) {
        await this.notifySimple(user_id, NotificationVO.SIMPLE_WARN, code_text);
    }
    public async notifySimpleERROR(user_id: number, code_text: string) {
        await this.notifySimple(user_id, NotificationVO.SIMPLE_ERROR, code_text);
    }

    private async notifySimple(user_id: number, msg_type: number, code_text: string) {

        if ((!user_id) || (msg_type == null) || (typeof msg_type == 'undefined') || (!code_text)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.simple_notif_label = code_text;
        notification.simple_notif_type = msg_type;
        notification.notification_type = NotificationVO.TYPE_NOTIF_SIMPLE;
        notification.read = false;
        notification.user_id = user_id;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(ModulePushDataServer.NOTIF_INTERVAL_MS);
    }
    private async handleNotificationCreation(notif: NotificationVO): Promise<boolean> {
        notif.creation_date = moment();
        return true;
    }

    private async handleNotificationUpdate(notif: NotificationVO): Promise<boolean> {

        let enbase: NotificationVO = await ModuleDAO.getInstance().getVoById<NotificationVO>(NotificationVO.API_TYPE_ID, notif.id);

        if ((!enbase.read) && notif.read) {
            notif.read_date = moment();
        }
        return true;
    }

    private async notify(notification: NotificationVO) {

        try {

            if (!notification.user_id) {
                return;
            }

            // Broadcast to user's sessions or save in DB if no session available
            let socketWrappers: SocketWrapper[] = this.getUserSockets(notification.user_id);
            notification.read = false;
            if (socketWrappers && socketWrappers.length) {
                for (let i in socketWrappers) {
                    let socketWrapper: SocketWrapper = socketWrappers[i];
                    socketWrapper.socket.emit(NotificationVO.TYPE_NAMES[notification.notification_type], notification);
                }
                // if sent then consider it read
                notification.read = true;
                notification.read_date = moment();
            }

            // On ne stocke en base que les notifications de type simple, pour les retrouver dans le compte utilisateur
            if (notification.notification_type != NotificationVO.TYPE_NOTIF_SIMPLE) {
                return;
            }

            await ModuleDAO.getInstance().insertOrUpdateVO(notification);
        } catch (error) {

            ConsoleHandler.getInstance().error('notify:' + notification.user_id + ':' + error);
        }
    }
}