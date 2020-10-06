import * as moment from 'moment';
import * as socketIO from 'socket.io';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIController from '../../../shared/modules/API/APIController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import IServerUserSession from '../../IServerUserSession';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import SocketWrapper from './vos/SocketWrapper';

export default class PushDataServerController {

    public static NOTIF_INTERVAL_MS: number = 1000;

    public static TASK_NAME_notifyVarData: string = 'PushDataServerController' + '.notifyVarData';
    public static TASK_NAME_notifyVarsDatas: string = 'PushDataServerController' + '.notifyVarsDatas';
    public static TASK_NAME_notifyVarsDatasBySocket: string = 'PushDataServerController' + '.notifyVarsDatasBySocket';
    public static TASK_NAME_notifyDAOGetVoById: string = 'PushDataServerController' + '.notifyDAOGetVoById';
    public static TASK_NAME_notifyDAORemoveId: string = 'PushDataServerController' + '.notifyDAORemoveId';
    public static TASK_NAME_notifyDAOGetVos: string = 'PushDataServerController' + '.notifyDAOGetVos';
    public static TASK_NAME_broadcastLoggedSimple: string = 'PushDataServerController' + '.broadcastLoggedSimple';
    public static TASK_NAME_broadcastAllSimple: string = 'PushDataServerController' + '.broadcastAllSimple';
    public static TASK_NAME_broadcastRoleSimple: string = 'PushDataServerController' + '.broadcastRoleSimple';
    public static TASK_NAME_notifySimpleSUCCESS: string = 'PushDataServerController' + '.notifySimpleSUCCESS';
    public static TASK_NAME_notifySimpleINFO: string = 'PushDataServerController' + '.notifySimpleINFO';
    public static TASK_NAME_notifySimpleWARN: string = 'PushDataServerController' + '.notifySimpleWARN';
    public static TASK_NAME_notifySimpleERROR: string = 'PushDataServerController' + '.notifySimpleERROR';

    public static getInstance(): PushDataServerController {
        if (!PushDataServerController.instance) {
            PushDataServerController.instance = new PushDataServerController();
        }
        return PushDataServerController.instance;
    }

    private static instance: PushDataServerController = null;

    /**
     * Global application cache - Handled by Main process -----
     */
    private registeredSockets: { [userId: number]: { [sessId: string]: SocketWrapper[] } } = {};
    private registeredSessions: { [userId: number]: { [sessId: string]: IServerUserSession } } = {};
    private registeredSockets_by_id: { [socket_id: string]: SocketWrapper } = {};
    private registereduid_by_socketid: { [socket_id: string]: number } = {};
    /**
     * ----- Global application cache - Handled by Main process
     */

    private constructor() {

        // Conf des taches qui dépendent du thread
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarData, this.notifyVarData.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarsDatas, this.notifyVarsDatas.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarsDatasBySocket, this.notifyVarsDatasBySocket.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyDAOGetVoById, this.notifyDAOGetVoById.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyDAOGetVos, this.notifyDAOGetVos.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastLoggedSimple, this.broadcastLoggedSimple.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastAllSimple, this.broadcastAllSimple.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastRoleSimple, this.broadcastRoleSimple.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleSUCCESS, this.notifySimpleSUCCESS.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleINFO, this.notifySimpleINFO.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleWARN, this.notifySimpleWARN.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleERROR, this.notifySimpleERROR.bind(this));
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     * @param socket
     */
    public registerSocket(session: IServerUserSession, socket: socketIO.Socket) {

        ForkedTasksController.getInstance().assert_is_main_process();

        // No user or session, don't save this socket
        if ((!session) || (!session.id) || (!session.uid)) {
            return;
        }

        if (!this.registeredSockets[session.uid]) {
            this.registeredSockets[session.uid] = {};
        }
        if (!this.registeredSockets[session.uid][session.id]) {
            this.registeredSockets[session.uid][session.id] = [];
        }
        let wrapper = new SocketWrapper(session.uid, session.id, socket.id, socket);
        this.registeredSockets[session.uid][session.id].push(wrapper);
        this.registeredSockets_by_id[socket.id] = wrapper;
        this.registereduid_by_socketid[socket.id] = session.uid;

        if (!this.registeredSessions[session.uid]) {
            this.registeredSessions[session.uid] = {};
        }
        if (!this.registeredSessions[session.uid][session.id]) {
            this.registeredSessions[session.uid][session.id] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     * @param socket
     */
    public unregisterSocket(session: IServerUserSession, socket: socketIO.Socket) {

        ForkedTasksController.getInstance().assert_is_main_process();

        if (!socket) {
            return;
        }

        try {

            delete this.registeredSockets_by_id[socket.id];
            delete this.registereduid_by_socketid[socket.id];

            // No user or session, need to search for the socket by id
            if ((!session) || (!session.id) || (!session.uid)) {

                let found: boolean = false;
                for (let uid in this.registeredSockets) {
                    let registeredSockets_ = this.registeredSockets[uid];

                    for (let sid in registeredSockets_) {
                        let registeredSockets__ = registeredSockets_[sid];

                        for (let k = 0; k < registeredSockets__.length; k++) {
                            let registeredSocket = registeredSockets__[k];

                            if (registeredSocket && registeredSocket.socketId == socket.id) {
                                this.registeredSockets[uid][sid].splice(k, 1);
                                found = true;
                                break;
                            }
                        }

                        if (found) {
                            break;
                        }
                    }

                    if (found) {
                        break;
                    }
                }
                return;
            }

            delete this.registeredSockets[session.uid][session.id][socket.id];
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public registerSession(session: IServerUserSession) {

        ForkedTasksController.getInstance().assert_is_main_process();

        // No user or session, don't save this socket
        if ((!session) || (!session.id) || (!session.uid)) {
            return;
        }

        if (!this.registeredSessions[session.uid]) {
            this.registeredSessions[session.uid] = {};
        }
        if (!this.registeredSessions[session.uid][session.id]) {
            this.registeredSessions[session.uid][session.id] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public unregisterSession(session: IServerUserSession) {

        ForkedTasksController.getInstance().assert_is_main_process();

        // No user or session, don't save this socket
        if ((!session) || (!session.id) || (!session.uid)) {
            return;
        }

        if (!this.registeredSessions[session.uid]) {
            return;
        }
        if (!this.registeredSessions[session.uid][session.id]) {
            return;
        }
        delete this.registeredSessions[session.uid][session.id];
    }

    /**
     * WARN : Only on main thread (express).
     * @param userId
     */
    public getUserSockets(userId: number): SocketWrapper[] {

        ForkedTasksController.getInstance().assert_is_main_process();

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

    /**
     * WARN : Only on main thread (express).
     * @param userId
     */
    public getUserSessions(userId: number): { [sessId: string]: IServerUserSession } {

        ForkedTasksController.getInstance().assert_is_main_process();

        return this.registeredSessions[userId];
    }

    /**
     * WARN : Only on main thread (express).
     */
    public getAllSockets(): SocketWrapper[] {

        ForkedTasksController.getInstance().assert_is_main_process();

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


    public async notifyVarData(user_id: number, vo: VarDataValueResVO) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarData, user_id, vo)) {
            return;
        }

        let notification: NotificationVO = this.getVarDataNotif(user_id, null, vo ? [vo] : null);
        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyVarsDatas(user_id: number, vos: VarDataValueResVO[]) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarsDatas, user_id, vos)) {
            return;
        }

        let notification: NotificationVO = this.getVarDataNotif(user_id, null, vos);
        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyVarsDatasBySocket(socket_id: string, vos: VarDataValueResVO[]) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarsDatas, socket_id, vos)) {
            return;
        }

        let notification: NotificationVO = this.getVarDataNotif(this.registereduid_by_socketid[socket_id], socket_id, vos);
        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyDAOGetVoById(user_id: number, api_type_id: string, vo_id: number) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAOGetVoById, user_id, api_type_id, vo_id)) {
            return;
        }

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
        notification.auto_read_if_connected = true;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyDAORemoveId(user_id: number, api_type_id: string, vo_id: number) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAORemoveId, user_id, api_type_id, vo_id)) {
            return;
        }

        if ((!user_id) || (!api_type_id) || (!vo_id)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_REMOVE_ID;
        notification.dao_notif_vo_id = vo_id;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyDAOGetVos(user_id: number, api_type_id: string) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAOGetVos, user_id, api_type_id)) {
            return;
        }

        if ((!user_id) || (!api_type_id)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_GET_VOS;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async broadcastLoggedSimple(msg_type: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastLoggedSimple, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

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
                await this.notifySimple(userId, msg_type, code_text, auto_read_if_connected);
            })());
        }
        await Promise.all(promises);
    }

    public async broadcastAllSimple(msg_type: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastAllSimple, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

        let promises = [];
        let users = await ModuleDAO.getInstance().getVos<UserVO>(UserVO.API_TYPE_ID);
        for (let i in users) {
            let user = users[i];

            promises.push((async () => {
                await this.notifySimple(user.id, msg_type, code_text, auto_read_if_connected);
            })());
        }
        await Promise.all(promises);
    }

    public async broadcastRoleSimple(role_name: string, msg_type: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastRoleSimple, role_name, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

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
                    await this.notifySimple(user.id, msg_type, code_text, auto_read_if_connected);
                })());
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await Promise.all(promises);
    }

    public async notifySimpleSUCCESS(user_id: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleSUCCESS, user_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(user_id, NotificationVO.SIMPLE_SUCCESS, code_text, auto_read_if_connected);
    }

    public async notifySimpleINFO(user_id: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleINFO, user_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(user_id, NotificationVO.SIMPLE_INFO, code_text, auto_read_if_connected);
    }

    public async notifySimpleWARN(user_id: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleWARN, user_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(user_id, NotificationVO.SIMPLE_WARN, code_text, auto_read_if_connected);
    }

    public async notifySimpleERROR(user_id: number, code_text: string, auto_read_if_connected: boolean = false) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleERROR, user_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(user_id, NotificationVO.SIMPLE_ERROR, code_text, auto_read_if_connected);
    }

    private async notifySimple(user_id: number, msg_type: number, code_text: string, auto_read_if_connected: boolean) {

        if ((!user_id) || (msg_type === null) || (typeof msg_type == 'undefined') || (!code_text)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.simple_notif_label = code_text;
        notification.simple_notif_type = msg_type;
        notification.notification_type = NotificationVO.TYPE_NOTIF_SIMPLE;
        notification.read = false;
        notification.user_id = user_id;
        notification.auto_read_if_connected = auto_read_if_connected;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }


    /**
     * TODO REFONTE DES VARS et DES SOCKETS il faut envoyer autant que possible les notifications à un seul socket, en tout cas pour les mises à jour de vars
     *  qui sont très bien ciblables par socket en théorie
     * @param notification
     */
    private async notify(notification: NotificationVO) {

        try {

            if ((!notification.user_id) && (!notification.socket_id)) {
                return;
            }

            // Broadcast to user's sessions or save in DB if no session available

            let socketWrappers: SocketWrapper[] = null;
            if (!notification.socket_id) {
                socketWrappers = this.getUserSockets(notification.user_id);
            } else {
                socketWrappers = [this.registeredSockets_by_id[notification.socket_id]];
            }
            notification.read = false;

            if (socketWrappers && socketWrappers.length) {

                // if sent then consider it read
                if (notification.auto_read_if_connected) {
                    notification.read = true;
                    notification.read_date = moment().utc(true);
                }
            }

            // On ne stocke en base que les notifications de type simple, pour les retrouver dans le compte utilisateur
            if (notification.notification_type == NotificationVO.TYPE_NOTIF_SIMPLE) {
                let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(notification);
                if (res && res.id) {
                    notification.id = parseInt(res.id.toString());
                }
            }

            if (socketWrappers && socketWrappers.length) {

                let notification_type = NotificationVO.TYPE_NAMES[notification.notification_type];
                notification = APIController.getInstance().try_translate_vo_to_api(notification);

                for (let i in socketWrappers) {
                    let socketWrapper: SocketWrapper = socketWrappers[i];
                    socketWrapper.socket.emit(notification_type, notification);
                }
            }
        } catch (error) {

            ConsoleHandler.getInstance().error('notify:' + notification.user_id + ':' + error);
        }
    }

    private getVarDataNotif(user_id: number, socket_id: string, vos: VarDataValueResVO[]): NotificationVO {

        if ((!user_id) || (!vos) || (!vos.length)) {
            return null;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = null;
        notification.notification_type = NotificationVO.TYPE_NOTIF_VARDATA;
        notification.read = false;
        notification.socket_id = socket_id;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        notification.vos = JSON.stringify(APIController.getInstance().try_translate_vos_to_api(vos));
        return notification;
    }
}