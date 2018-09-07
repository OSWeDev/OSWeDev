import * as socketIO from 'socket.io';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import ModuleServerBase from '../ModuleServerBase';
import SocketWrapper from './vos/SocketWrapper';

export default class ModulePushDataServer extends ModuleServerBase {

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

    private async notify(notification: NotificationVO) {

        try {

            if ((!notification.user_id) || (!notification.notification_type)) {
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
            }

            // On ne stocke en base que les notifications de type simple, pour les retrouver dans le compte utilisateur
            if (notification.notification_type != NotificationVO.TYPE_NOTIF_SIMPLE) {
                return;
            }

            await ModuleDAO.getInstance().insertOrUpdateVO(notification);
        } catch (error) {

            console.error('notify:' + notification.user_id + ':' + error);
        }
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

        if ((!user_id) || (!msg_type) || (!code_text)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.simple_notif_label = code_text;
        notification.simple_notif_type = msg_type;
        notification.notification_type = NotificationVO.TYPE_NOTIF_SIMPLE;
        notification.read = false;
        notification.user_id = user_id;
        await this.notify(notification);
    }
}