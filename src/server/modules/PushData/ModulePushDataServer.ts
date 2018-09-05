import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import ModuleServerBase from '../ModuleServerBase';
import * as socketIO from 'socket.io';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import SocketWrapper from './vos/SocketWrapper';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';

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

    public async notify(user_id: number, notification: NotificationVO) {

        try {

            // Broadcast to user's sessions or save in DB if no session available
            let socketWrappers: SocketWrapper[] = this.getUserSockets(user_id);
            notification.read = false;
            notification.user_id = user_id;
            notification.notification_type = notification.notification_type ? notification.notification_type : NotificationVO.TYPE_NOTIF_SIMPLE;

            if (socketWrappers && socketWrappers.length) {
                for (let i in socketWrappers) {
                    let socketWrapper: SocketWrapper = socketWrappers[i];
                    socketWrapper.socket.emit(NotificationVO.TYPE_NAMES[notification.notification_type], notification);
                }
                // if sent then consider it read
                notification.read = true;
            }

            await ModuleDAO.getInstance().insertOrUpdateVO(notification);
        } catch (error) {

            console.error('notify:' + user_id + ':' + error);
        }
    }
}