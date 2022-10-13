
import * as socketIO from 'socket.io';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import IServerUserSession from '../../IServerUserSession';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsTabsSubsController from '../Var/VarsTabsSubsController';
import SocketWrapper from './vos/SocketWrapper';

export default class PushDataServerController {

    public static NOTIF_INTERVAL_MS: number = 1000;

    public static NOTIFY_SESSION_INVALIDATED: string = 'PushDataServerController.session_invalidated' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static NOTIFY_USER_LOGGED: string = 'PushDataServerController.user_logged' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static NOTIFY_RELOAD: string = 'PushDataServerController.reload' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;

    public static TASK_NAME_notifyRedirectHomeAndDisconnect: string = 'PushDataServerController' + '.notifyRedirectHomeAndDisconnect';
    public static TASK_NAME_notifyUserLoggedAndRedirectHome: string = 'PushDataServerController' + '.notifyUserLoggedAndRedirectHome';
    public static TASK_NAME_notifyVarData: string = 'PushDataServerController' + '.notifyVarData';
    public static TASK_NAME_notifyVarsDatas: string = 'PushDataServerController' + '.notifyVarsDatas';
    public static TASK_NAME_notifyVarsDatasBySocket: string = 'PushDataServerController' + '.notifyVarsDatasBySocket';
    public static TASK_NAME_notifyDAOGetVoById: string = 'PushDataServerController' + '.notifyDAOGetVoById';
    public static TASK_NAME_notifyDAORemoveId: string = 'PushDataServerController' + '.notifyDAORemoveId';
    public static TASK_NAME_notifyDAOGetVos: string = 'PushDataServerController' + '.notifyDAOGetVos';
    public static TASK_NAME_broadcastLoggedSimple: string = 'PushDataServerController' + '.broadcastLoggedSimple';
    public static TASK_NAME_broadcastAllSimple: string = 'PushDataServerController' + '.broadcastAllSimple';
    public static TASK_NAME_broadcastRoleSimple: string = 'PushDataServerController' + '.broadcastRoleSimple';
    public static TASK_NAME_broadcastRoleRedirect: string = 'PushDataServerController' + '.broadcastRoleRedirect';
    public static TASK_NAME_notifySimpleSUCCESS: string = 'PushDataServerController' + '.notifySimpleSUCCESS';
    public static TASK_NAME_notifySimpleINFO: string = 'PushDataServerController' + '.notifySimpleINFO';
    public static TASK_NAME_notifySimpleWARN: string = 'PushDataServerController' + '.notifySimpleWARN';
    public static TASK_NAME_notifySimpleERROR: string = 'PushDataServerController' + '.notifySimpleERROR';
    public static TASK_NAME_notifyRedirectINFO: string = 'PushDataServerController' + '.notifyRedirectINFO';
    public static TASK_NAME_notifyPrompt: string = 'PushDataServerController' + '.notifyPrompt';
    public static TASK_NAME_notifySession: string = 'PushDataServerController' + '.notifySession';
    public static TASK_NAME_notifyReload: string = 'PushDataServerController' + '.notifyReload';
    public static TASK_NAME_notifyTabReload: string = 'PushDataServerController' + '.notifyTabReload';
    // public static TASK_NAME_notifyVarsTabsReload: string = 'PushDataServerController' + '.notifyVarsTabsReload';

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
    public registered_prompts_cbs_by_uid: { [prompt_uid: string]: (prompt_result: string) => Promise<void> } = {};
    private PROMPT_UID: number = 0;

    private registeredSockets: { [userId: number]: { [client_tab_id: string]: { [sessId: string]: { [socket_id: string]: SocketWrapper } } } } = {};
    private registeredSessions: { [userId: number]: { [sessId: string]: IServerUserSession } } = {};
    private registeredSockets_by_id: { [socket_id: string]: SocketWrapper } = {};
    private registeredSockets_by_sessionid: { [session_id: string]: { [socket_id: string]: SocketWrapper } } = {};
    private registereduid_by_socketid: { [socket_id: string]: number } = {};
    private registeredclient_tab_id_by_socketid: { [socket_id: string]: string } = {};
    /**
     * ----- Global application cache - Handled by Main process
     */

    private throttled_notifyVarsDatasBySocket = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(async (stackable_args: any[]) => {
        if (!stackable_args) {
            return;
        }

        let params: { [socket_id: string]: VarDataValueResVO[] } = {};
        stackable_args.forEach((stackable_arg: { socket_id: string, vos: VarDataValueResVO[] }) => {

            if ((!stackable_arg.socket_id) || (!stackable_arg.vos) || (!stackable_arg.vos.length)) {
                return;
            }

            if (!params[stackable_arg.socket_id]) {
                params[stackable_arg.socket_id] = stackable_arg.vos;
                return;
            }
            params[stackable_arg.socket_id] = params[stackable_arg.socket_id].concat(stackable_arg.vos);
        });

        let promises = [];
        for (let socket_id in params) {
            promises.push(PushDataServerController.getInstance().notifyVarsDatasBySocket_(socket_id, params[socket_id]));
        }
        await Promise.all(promises);
    }, 100, { leading: false, trailing: true });

    private constructor() {

        // Conf des taches qui dépendent du thread
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyRedirectHomeAndDisconnect, this.notifyRedirectHomeAndDisconnect.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarData, this.notifyVarData.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarsDatas, this.notifyVarsDatas.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarsDatasBySocket, this.notifyVarsDatasBySocket.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyDAOGetVoById, this.notifyDAOGetVoById.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyDAOGetVos, this.notifyDAOGetVos.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastLoggedSimple, this.broadcastLoggedSimple.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastAllSimple, this.broadcastAllSimple.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastRoleSimple, this.broadcastRoleSimple.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_broadcastRoleRedirect, this.broadcastRoleRedirect.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleSUCCESS, this.notifySimpleSUCCESS.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleINFO, this.notifySimpleINFO.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleWARN, this.notifySimpleWARN.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySimpleERROR, this.notifySimpleERROR.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyRedirectINFO, this.notifyRedirectINFO.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyPrompt, this.notifyPrompt.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifySession, this.notifySession.bind(this));
        // ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyReload, this.notifyReload.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyUserLoggedAndRedirectHome, this.notifyUserLoggedAndRedirectHome.bind(this));
        ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyTabReload, this.notifyTabReload.bind(this));
        // ForkedTasksController.getInstance().register_task(PushDataServerController.TASK_NAME_notifyVarsTabsReload, this.notifyVarsTabsReload.bind(this));

    }

    public getSocketsBySession(session_id: string): { [socket_id: string]: SocketWrapper } {
        if ((!this.registeredSockets_by_sessionid) ||
            (!this.registeredSockets_by_sessionid[session_id])) {
            return null;
        }

        return this.registeredSockets_by_sessionid[session_id];
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     * @param socket
     */
    public registerSocket(session: IServerUserSession, socket: socketIO.Socket) {

        if ((!session) || (!socket)) {
            return;
        }

        ForkedTasksController.getInstance().assert_is_main_process();
        let session_uid = ((session.uid == null) ? 0 : session.uid);

        let wrapper = new SocketWrapper(session_uid, session.id, socket.id, socket);

        // save in the socket in the session
        if (!this.registeredSockets_by_sessionid[session.id]) {
            this.registeredSockets_by_sessionid[session.id] = {};
        }
        this.registeredSockets_by_sessionid[session.id][socket.id] = wrapper;
        this.registeredSockets_by_id[socket.id] = wrapper;

        // No user or session, don't save this socket in registeredSockets
        let client_tab_id = socket.handshake.headers['client_tab_id'] ? socket.handshake.headers['client_tab_id'] : null;
        if ((!session) || (!session.id) || (!client_tab_id)) {
            return;
        }

        if (!this.registeredSockets[session_uid]) {
            this.registeredSockets[session_uid] = {};
        }
        if (!this.registeredSockets[session_uid][client_tab_id]) {
            this.registeredSockets[session_uid][client_tab_id] = {};
        }
        if (!this.registeredSockets[session_uid][client_tab_id][session.id]) {
            this.registeredSockets[session_uid][client_tab_id][session.id] = {};
        }
        this.registeredSockets[session_uid][client_tab_id][session.id][socket.id] = wrapper;

        this.registereduid_by_socketid[socket.id] = session_uid;
        this.registeredclient_tab_id_by_socketid[socket.id] = client_tab_id;

        if (!this.registeredSessions[session_uid]) {
            this.registeredSessions[session_uid] = {};
        }
        if (!this.registeredSessions[session_uid][session.id]) {
            this.registeredSessions[session_uid][session.id] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     * @param socket
     */
    public unregisterSocket(session: IServerUserSession, socket: socketIO.Socket) {

        if ((!session) || (!socket)) {
            return;
        }

        ForkedTasksController.getInstance().assert_is_main_process();
        let session_uid = ((session.uid == null) ? 0 : session.uid);

        try {

            delete this.registeredSockets_by_sessionid[session.id][socket.id];
            delete this.registeredSockets_by_id[socket.id];
            delete this.registereduid_by_socketid[socket.id];
            delete this.registeredclient_tab_id_by_socketid[socket.id];
            let client_tab_id_ = StackContext.getInstance().get('client_tab_id') ? StackContext.getInstance().get('client_tab_id') : null;

            // No user or session, need to search for the socket by id
            if ((!session) || (!session.id) || (!client_tab_id_)) {

                let found: boolean = false;
                for (let uid in this.registeredSockets) {
                    let registeredSockets__ = this.registeredSockets[uid];

                    for (let client_tab_id in registeredSockets__) {
                        let registeredSockets_ = registeredSockets__[client_tab_id];

                        for (let sid in registeredSockets_) {
                            let registeredSockets = registeredSockets_[sid];

                            for (let socket_id in registeredSockets) {
                                if (socket_id == socket.id) {
                                    delete this.registeredSockets[uid][client_tab_id][sid][socket_id];
                                    return;
                                }
                            }
                        }
                    }
                }
                return;
            }

            delete this.registeredSockets[session_uid][client_tab_id_][session.id][socket.id];
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public registerSession(session: IServerUserSession) {

        // No user or session, don't save this socket
        if ((!session) || (!session.id)) {
            return;
        }

        let uid = ((session.uid == null) ? 0 : session.uid);

        ForkedTasksController.getInstance().assert_is_main_process();

        if (!this.registeredSessions[uid]) {
            this.registeredSessions[uid] = {};
        }
        if (!this.registeredSessions[uid][session.id]) {
            this.registeredSessions[uid][session.id] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public async unregisterSession(session: IServerUserSession, notify_redirect: boolean = true) {

        if (!session) {
            return;
        }

        ForkedTasksController.getInstance().assert_is_main_process();
        let uid = ((session.uid == null) ? 0 : session.uid);

        await this.notifyRedirectHomeAndDisconnect(session);

        if (this.registeredSockets_by_sessionid[session.id]) {
            delete this.registeredSockets_by_sessionid[session.id];
        }

        // this.notifySimpleERROR(session.uid, null, PushDataServerController.NOTIFY_SESSION_INVALIDATED, true);

        // No user or session, don't save this socket
        if ((!session) || (!session.id)) {
            return;
        }

        if (this.registeredSessions[uid] && this.registeredSessions[uid][session.id]) {
            delete this.registeredSessions[uid][session.id];
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public async unregisterUserSession(session: IServerUserSession) {

        if (!session) {
            return;
        }

        ForkedTasksController.getInstance().assert_is_main_process();
        let uid = ((session.uid == null) ? 0 : session.uid);

        // this.notifySimpleERROR(session.uid, null, PushDataServerController.NOTIFY_SESSION_INVALIDATED, true);
        await this.notifyRedirectHomeAndDisconnect();

        if (this.registeredSessions[uid] && this.registeredSessions[uid][session.id]) {
            delete this.registeredSessions[uid][session.id];
        }
    }


    /**
     * WARN : Only on main thread (express).
     * @param userId
     */
    public getUserSockets(userId: number, client_tab_id: string = null): SocketWrapper[] {

        ForkedTasksController.getInstance().assert_is_main_process();

        if (!client_tab_id) {
            let res: SocketWrapper[] = [];
            for (let i in this.registeredSockets[userId]) {
                res = res.concat(this.getUserSockets_client_tab_id(userId, i));
            }
            return res;
        } else {
            return this.getUserSockets_client_tab_id(userId, client_tab_id);
        }
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

        for (let userId in this.registeredSockets) {
            res = res.concat(this.getUserSockets(parseInt(userId.toString())));
        }
        return res;
    }

    /**
     * On notifie un utilisateur, via son user_id et son client_tab_id pour notifier la fenêtre abonnée uniquement
     * @param user_id
     * @param client_tab_id
     * @param vo
     */
    public async notifyVarData(user_id: number, client_tab_id: string, vo: VarDataValueResVO) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarData, user_id, client_tab_id, vo)) {
            return;
        }

        user_id = ((user_id == null) ? 0 : user_id);
        let notification: NotificationVO = this.getVarDataNotif(user_id, client_tab_id, null, vo ? [vo] : null);
        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    /**
     * On notifie un utilisateur pour forcer la déco et rechargement de la page d'accueil
     */
    public async notifyRedirectHomeAndDisconnect(session: IServerUserSession = null) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyRedirectHomeAndDisconnect, session)) {
            return;
        }

        let notification: NotificationVO = null;
        try {
            session = session ? session : StackContext.getInstance().get('SESSION');
            if (!session) {
                return;
            }

            if (this.registeredSockets_by_sessionid && this.registeredSockets_by_sessionid[session.id]) {
                notification = this.getTechNotif(
                    null, null,
                    Object.values(this.registeredSockets_by_sessionid[session.id]).map((w) => w.socketId), NotificationVO.TECH_DISCONNECT_AND_REDIRECT_HOME);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    /**
     * On notifie une session pour forcer le rechargement de la page d'accueil suite connexion / changement de compte
     */
    public async notifyUserLoggedAndRedirectHome() {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyUserLoggedAndRedirectHome)) {
            return;
        }

        let notification: NotificationVO = null;
        try {
            let session: IServerUserSession = StackContext.getInstance().get('SESSION');

            if (this.registeredSockets_by_sessionid && this.registeredSockets_by_sessionid[session.id]) {
                notification = this.getTechNotif(
                    null, null,
                    Object.values(this.registeredSockets_by_sessionid[session.id]).map((w) => w.socketId), NotificationVO.TECH_LOGGED_AND_REDIRECT_HOME);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    /**
     * On notifie une tab pour reload
     */
    public async notifyTabReload(UID: number, CLIENT_TAB_ID: string) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyTabReload)) {
            return;
        }

        let notification: NotificationVO = null;
        try {
            notification = this.getTechNotif(
                UID, CLIENT_TAB_ID,
                null, NotificationVO.TECH_RELOAD);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    // /**
    //  * On notifie toutes les tabs subscribed à cet index pour reload
    //  */
    // public async notifyVarsTabsReload(var_index: string) {

    //     // Permet d'assurer un lancement uniquement sur le main process
    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.getInstance().exec_self_on_main_process_and_return_value(
    //             reject, PushDataServerController.TASK_NAME_notifyVarsTabsReload, resolve, var_index)) {
    //             return;
    //         }

    //         let tabs: { [user_id: number]: { [client_tab_id: string]: number } } = VarsTabsSubsController.getInstance().get_subscribed_tabs_ids(var_index);
    //         for (let uid in tabs) {
    //             let tab = tabs[uid];

    //             for (let tabid in tab) {
    //                 await this.notifyTabReload(parseInt(uid.toString()), tabid);
    //             }
    //         }
    //         resolve(true);
    //     });
    // }


    // /**
    //  * On notifie les sockets de la session qu'il faut un reload (exemple lors du login)
    //  */
    // public async notifyReload() {

    //     // Permet d'assurer un lancement uniquement sur le main process
    //     if (!ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyReload)) {
    //         return;
    //     }

    //     let notification: NotificationVO = null;
    //     try {
    //         let session: IServerUserSession = StackContext.getInstance().get('SESSION');
    //         notification = this.getTechNotif(
    //             null, null,
    //             Object.values(this.registeredSockets_by_sessionid[session.id]).map((w) => w.socketId), NotificationVO.TECH_RELOAD);
    //     } catch (error) {
    //         ConsoleHandler.getInstance().error(error);
    //     }

    //     if (!notification) {
    //         return;
    //     }

    //     await this.notify(notification);
    //     await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    // }

    /**
     * On notifie un utilisateur, via son user_id et son client_tab_id pour notifier la fenêtre abonnée uniquement
     * @param user_id
     * @param client_tab_id
     * @param vos
     */
    public async notifyVarsDatas(user_id: number, client_tab_id: string, vos: VarDataValueResVO[]) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarsDatas, user_id, client_tab_id, vos)) {
            return;
        }

        user_id = ((user_id == null) ? 0 : user_id);
        let notification: NotificationVO = this.getVarDataNotif(user_id, client_tab_id, null, vos);
        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyVarsDatasBySocket(socket_id: string, vos: VarDataValueResVO[]) {

        this.throttled_notifyVarsDatasBySocket([{ socket_id: socket_id, vos: vos }]);
    }

    public async notifyVarsDatasBySocket_(socket_id: string, vos: VarDataValueResVO[]) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarsDatas, socket_id, vos)) {
            return;
        }

        let notification: NotificationVO = this.getVarDataNotif(this.registereduid_by_socketid[socket_id], this.registeredclient_tab_id_by_socketid[socket_id], socket_id, vos);
        if (!notification) {
            return;
        }

        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyDAOGetVoById(user_id: number, client_tab_id: string, api_type_id: string, vo_id: number) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAOGetVoById, user_id, client_tab_id, api_type_id, vo_id)) {
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
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = true;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyDAORemoveId(user_id: number, client_tab_id: string, api_type_id: string, vo_id: number) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAORemoveId, user_id, client_tab_id, api_type_id, vo_id)) {
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
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = true;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async notifyDAOGetVos(user_id: number, client_tab_id: string, api_type_id: string) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAOGetVos, user_id, client_tab_id, api_type_id)) {
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
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = true;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    public async broadcastLoggedSimple(msg_type: number, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastLoggedSimple, msg_type, code_text, auto_read_if_connected)) {
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
                await this.notifySimple(null, userId, null, msg_type, code_text, auto_read_if_connected, simple_notif_json_params);
            })());
        }
        await Promise.all(promises);
    }

    public async broadcastAllSimple(msg_type: number, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastAllSimple, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

        let promises = [];
        let users = await query(UserVO.API_TYPE_ID).select_vos<UserVO>();
        for (let i in users) {
            let user = users[i];

            promises.push((async () => {
                await this.notifySimple(null, user.id, null, msg_type, code_text, auto_read_if_connected, simple_notif_json_params);
            })());
        }
        await Promise.all(promises);
    }

    public async broadcastRoleSimple(role_name: string, msg_type: number, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastRoleSimple, role_name, msg_type, code_text, auto_read_if_connected, simple_notif_json_params)) {
            return;
        }

        let promises = [];

        try {
            let role: RoleVO = await query(RoleVO.API_TYPE_ID).filter_by_text_eq('translatable_name', role_name).select_vo<RoleVO>();
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
                    await this.notifySimple(null, user.id, null, msg_type, code_text, auto_read_if_connected, simple_notif_json_params);
                })());
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await Promise.all(promises);
    }

    // Notifications qui redirigent sur une route avec ou sans paramètres
    public async broadcastRoleRedirect(
        role_name: string,
        msg_type: number,
        code_text: string,
        redirect_route: string = "",
        notif_route_params_name: string[] = null,
        notif_route_params_values: string[] = null,
        auto_read_if_connected: boolean = false
    ) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastRoleRedirect, role_name, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

        let promises = [];

        try {
            let role: RoleVO = await query(RoleVO.API_TYPE_ID).filter_by_text_eq('translatable_name', role_name).select_vo<RoleVO>();
            if (!role) {
                ConsoleHandler.getInstance().error('broadcastRoleRedirect:Role introuvable:' + role_name + ':');
                return;
            }

            let usersRoles: UserRoleVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<UserRoleVO>(UserRoleVO.API_TYPE_ID, 'role_id', [role.id]);
            if (!usersRoles) {
                ConsoleHandler.getInstance().error('broadcastRoleRedirect:usersRoles introuvables:' + role_name + ':' + role.id);
                return;
            }

            let user_ids: number[] = [];
            for (let i in usersRoles) {
                user_ids.push(usersRoles[i].user_id);
            }

            let users: UserVO[] = await ModuleDAO.getInstance().getVosByIds<UserVO>(UserVO.API_TYPE_ID, user_ids);
            if (!users) {
                ConsoleHandler.getInstance().error('broadcastRoleRedirect:users introuvables:' + role_name + ':' + role.id);
                return;
            }

            for (let i in users) {
                let user = users[i];

                promises.push((async () => {
                    await this.notifyRedirect(null, user.id, null, msg_type, code_text, redirect_route, notif_route_params_name, notif_route_params_values, auto_read_if_connected);
                })());
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await Promise.all(promises);
    }


    public async notifySession(code_text: string, notif_type: number = NotificationVO.SIMPLE_SUCCESS, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySession, code_text, notif_type)) {
            return;
        }

        try {
            let session: IServerUserSession = StackContext.getInstance().get('SESSION');
            if (this.registeredSockets_by_sessionid && this.registeredSockets_by_sessionid[session.id]) {
                await this.notifySimple(Object.values(this.registeredSockets_by_sessionid[session.id]).map((w) => w.socketId),
                    null, null, notif_type, code_text, true, simple_notif_json_params);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    public async notifySimpleSUCCESS(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleSUCCESS, user_id, client_tab_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_SUCCESS, code_text, auto_read_if_connected, simple_notif_json_params);
    }

    public async notifySimpleINFO(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleINFO, user_id, client_tab_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_INFO, code_text, auto_read_if_connected, simple_notif_json_params);
    }

    public async notifySimpleWARN(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleWARN, user_id, client_tab_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_WARN, code_text, auto_read_if_connected, simple_notif_json_params);
    }

    public async notifySimpleERROR(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleERROR, user_id, client_tab_id, code_text, auto_read_if_connected)) {
            return;
        }

        await this.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_ERROR, code_text, auto_read_if_connected, simple_notif_json_params);
    }

    public async notifyPrompt(user_id: number, client_tab_id: string, code_text: string, simple_notif_json_params: string = null): Promise<string> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyPrompt, user_id, client_tab_id, code_text)) {
            return null;
        }

        if ((!user_id) || (!client_tab_id) || (!code_text)) {
            return null;
        }

        let self = this;

        // On met aussi un time out à 2 minutes sinon on reste bloqués à vie potentiellement
        return new Promise(async (resolve, reject) => {
            let notification: NotificationVO = new NotificationVO();
            let still_waiting: boolean = true;

            notification.simple_notif_label = code_text;
            notification.simple_notif_json_params = simple_notif_json_params;
            notification.simple_notif_type = null;
            notification.notification_type = NotificationVO.TYPE_NOTIF_PROMPT;
            notification.read = false;
            notification.user_id = user_id;
            notification.client_tab_id = client_tab_id;
            notification.auto_read_if_connected = true;

            notification.prompt_result = null;
            notification.prompt_uid = self.PROMPT_UID++;
            self.registered_prompts_cbs_by_uid[notification.prompt_uid] = async (prompt_result: string) => {
                still_waiting = false;
                await resolve(prompt_result);
                delete self.registered_prompts_cbs_by_uid[notification.prompt_uid];
            };

            await self.notify(notification);
            await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);

            await ThreadHandler.getInstance().sleep(120000);
            if (still_waiting) {
                reject('No Prompt received');
            }
        });
    }

    public async notifyRedirectINFO(user_id: number, client_tab_id: string, code_text: string, redirect_route: string = "", notif_route_params_name: string[] = null, notif_route_params_values: string[] = null, auto_read_if_connected: boolean = false) {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyRedirectINFO, user_id, client_tab_id, code_text, redirect_route, notif_route_params_name, notif_route_params_values, auto_read_if_connected)) {
            return;
        }

        await this.notifyRedirect(null, user_id, client_tab_id, NotificationVO.SIMPLE_INFO, code_text, redirect_route, notif_route_params_name, notif_route_params_values, auto_read_if_connected);
    }

    // Notifications qui redirigent sur une route avec ou sans paramètres
    private async notifyRedirect(
        socket_ids: string[],
        user_id: number,
        client_tab_id: string,
        msg_type: number,
        code_text: string,
        redirect_route: string,
        notif_route_params_name: string[],
        notif_route_params_values: string[],
        auto_read_if_connected: boolean,
        simple_notif_json_params: string = null
    ) {

        if ((msg_type === null) || (typeof msg_type == 'undefined') || (!code_text)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.simple_notif_label = code_text;
        notification.notif_route = redirect_route;
        notification.simple_notif_json_params = simple_notif_json_params;
        notification.simple_notif_type = msg_type;
        notification.notification_type = NotificationVO.TYPE_NOTIF_REDIRECT;
        notification.read = false;
        notification.socket_ids = socket_ids;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = auto_read_if_connected;
        notification.notif_route_params_name = notif_route_params_name;
        notification.notif_route_params_values = notif_route_params_values;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }

    private async notifySimple(
        socket_ids: string[], user_id: number, client_tab_id: string,
        msg_type: number, code_text: string, auto_read_if_connected: boolean,
        simple_notif_json_params: string = null) {

        if ((msg_type === null) || (typeof msg_type == 'undefined') || (!code_text)) {
            return;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.simple_notif_label = code_text;
        notification.simple_notif_json_params = simple_notif_json_params;
        notification.simple_notif_type = msg_type;
        notification.notification_type = NotificationVO.TYPE_NOTIF_SIMPLE;
        notification.read = false;
        notification.socket_ids = socket_ids;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = auto_read_if_connected;
        await this.notify(notification);
        await ThreadHandler.getInstance().sleep(PushDataServerController.NOTIF_INTERVAL_MS);
    }


    /**
     * TODO REFONTE DES VARS et DES SOCKETS il faut envoyer autant que possible les notifications à un seul socket, en tout cas pour les mises à jour de vars
     *  qui sont très bien ciblables par socket en théorie
     * TODO Ajouter un wrapper sur les notifs et un debounced comme pour les request wrapper de manière à regrouper au maximum les notifs sans avoir à mettre des await sur chaque notif...
     * @param notification
     */
    private async notify(notification: NotificationVO) {

        try {

            // Broadcast to user's sessions or save in DB if no session available

            let socketWrappers: SocketWrapper[] = null;
            if ((!notification.socket_ids) || (!notification.socket_ids.length)) {
                if (notification.user_id == null) {
                    return;
                }
                socketWrappers = this.getUserSockets(notification.user_id, notification.client_tab_id);
            } else {
                socketWrappers = notification.socket_ids.map((socket_id: string) => this.registeredSockets_by_id[socket_id]);
            }
            notification.read = false;

            if (socketWrappers && socketWrappers.length) {

                socketWrappers = socketWrappers.filter((s) => !!s);
            }

            if (socketWrappers && socketWrappers.length) {

                // if sent then consider it read
                if (notification.auto_read_if_connected) {
                    notification.read = true;
                    notification.read_date = Dates.now();
                }
            }

            // On ne stocke en base que les notifications de type simple, pour les retrouver dans le compte utilisateur
            if ((notification.notification_type == NotificationVO.TYPE_NOTIF_SIMPLE || notification.notification_type == NotificationVO.TYPE_NOTIF_REDIRECT) && (notification.user_id)) {
                let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(notification);
                if (res && res.id) {
                    notification.id = res.id;
                }
            }

            if (socketWrappers && socketWrappers.length) {

                let notification_type = NotificationVO.TYPE_NAMES[notification.notification_type];
                notification = APIControllerWrapper.getInstance().try_translate_vo_to_api(notification);

                for (let i in socketWrappers) {
                    let socketWrapper: SocketWrapper = socketWrappers[i];

                    if (!socketWrapper) {
                        continue;
                    }
                    socketWrapper.socket.emit(notification_type, notification);
                }
            }
        } catch (error) {

            ConsoleHandler.getInstance().error('notify:' + notification.user_id + ':' + error);
        }
    }

    private getVarDataNotif(user_id: number, client_tab_id: string, socket_id: string, vos: VarDataValueResVO[]): NotificationVO {

        if ((!vos) || (!vos.length)) {
            return null;
        }

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = null;
        notification.notification_type = NotificationVO.TYPE_NOTIF_VARDATA;
        notification.read = false;
        notification.socket_ids = socket_id ? [socket_id] : null;
        notification.client_tab_id = client_tab_id;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        notification.vos = JSON.stringify(APIControllerWrapper.getInstance().try_translate_vos_to_api(vos));
        return notification;
    }

    private getTechNotif(user_id: number, client_tab_id: string, socket_ids: string[], marker: string): NotificationVO {

        let notification: NotificationVO = new NotificationVO();

        notification.api_type_id = null;
        notification.notification_type = NotificationVO.TYPE_NOTIF_TECH;
        notification.read = false;
        notification.socket_ids = socket_ids;
        notification.client_tab_id = client_tab_id;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        notification.vos = JSON.stringify([{
            marker
        }]);
        return notification;
    }

    private clearClosedSockets(userId: number, client_tab_id: string) {

        ForkedTasksController.getInstance().assert_is_main_process();

        if (!client_tab_id) {
            for (let i in this.registeredSockets[userId]) {
                this.clearClosedSockets_client_tab_id(userId, i);
            }
        } else {
            this.clearClosedSockets_client_tab_id(userId, client_tab_id);
        }
    }

    private clearClosedSockets_client_tab_id(userId: number, client_tab_id: string) {

        ForkedTasksController.getInstance().assert_is_main_process();

        let toclose_tabs: string[] = [];

        if (!this.registeredSockets[userId]) {
            return;
        }

        for (let i in this.registeredSockets[userId][client_tab_id]) {

            let sessionSockets = this.registeredSockets[userId][client_tab_id][i];
            let toclose: string[] = [];
            for (let socketId in sessionSockets) {

                if ((!sessionSockets[socketId]) || (!sessionSockets[socketId].socket.connected)) {
                    toclose.push(socketId);
                }
            }

            for (let j in toclose) {
                delete sessionSockets[toclose[j]];
            }

            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(sessionSockets)) {
                toclose_tabs.push(client_tab_id);
            }
        }

        for (let j in toclose_tabs) {
            if (this.registeredSockets[userId] && this.registeredSockets[userId][toclose_tabs[j]]) {
                delete this.registeredSockets[userId][toclose_tabs[j]];
            }
        }
    }

    private getUserSockets_client_tab_id(userId: number, client_tab_id: string): SocketWrapper[] {

        ForkedTasksController.getInstance().assert_is_main_process();

        this.clearClosedSockets(userId, client_tab_id);

        if ((!this.registeredSockets) || (!this.registeredSockets[userId]) || (!this.registeredSockets[userId][client_tab_id])) {
            return [];
        }

        let res: SocketWrapper[] = [];
        for (let sessId in this.registeredSockets[userId][client_tab_id]) {
            for (let socketId in this.registeredSockets[userId][client_tab_id][sessId]) {
                res.push(this.registeredSockets[userId][client_tab_id][sessId][socketId]);
            }
        }

        return res;
    }
}