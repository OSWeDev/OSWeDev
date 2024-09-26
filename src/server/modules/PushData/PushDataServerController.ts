
import socketIO from 'socket.io';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import APINotifTypeResultVO from '../../../shared/modules/PushData/vos/APINotifTypeResultVO';
import NotificationVO from '../../../shared/modules/PushData/vos/NotificationVO';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ServerBase from '../../ServerBase';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import SocketWrapper from './vos/SocketWrapper';

export default class PushDataServerController {

    /**
     * Only on main thread (express).
     */
    // The goal is to keep track of the last tab id for each user, being the last tab to have sent a request
    public static last_known_tab_id_by_user_id: { [user_id: number]: string } = {};
    /**
     * !!!!!!!!!
     */

    public static NOTIF_INTERVAL_MS: number = 1000;

    public static NOTIFY_SESSION_INVALIDATED: string = 'PushDataServerController.session_invalidated' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    public static NOTIFY_USER_LOGGED: string = 'PushDataServerController.user_logged' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    public static NOTIFY_RELOAD: string = 'PushDataServerController.reload' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;

    public static TASK_NAME_notifyRedirectHomeAndDisconnect: string = 'PushDataServerController' + '.notifyRedirectHomeAndDisconnect';
    public static TASK_NAME_notifyUserLoggedAndRedirect: string = 'PushDataServerController' + '.notifyUserLoggedAndRedirect';
    public static TASK_NAME_notifyAPIResult: string = 'PushDataServerController' + '.notifyAPIResult';
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
    public static TASK_NAME_notifyDownloadFile: string = 'PushDataServerController' + '.notifyDownloadFile';

    public static TASK_NAME_notify_vo_creation: string = 'PushDataServerController' + '.notify_vo_creation';
    public static TASK_NAME_notify_vo_update: string = 'PushDataServerController' + '.notify_vo_update';
    public static TASK_NAME_notify_vo_deletion: string = 'PushDataServerController' + '.notify_vo_deletion';

    // public static TASK_NAME_notifyVarsTabsReload: string = 'PushDataServerController' + '.notifyVarsTabsReload';

    /**
     * Global application cache - Handled by Main process -----
     */
    public static registered_prompts_cbs_by_uid: { [prompt_uid: string]: (prompt_result: string) => Promise<void> } = {};
    public static registeredSockets: { [userId: number]: { [client_tab_id: string]: { [sessId: string]: { [socket_id: string]: SocketWrapper } } } } = {};
    private static PROMPT_UID: number = 0;

    private static registeredSessions_by_uid: { [userId: number]: { [sessId: string]: IServerUserSession } } = {};
    private static registeredSessions_by_sid: { [sid: string]: IServerUserSession } = {};
    private static registeredSockets_by_id: { [socket_id: string]: SocketWrapper } = {};
    private static registeredSockets_by_sessionid: { [session_id: string]: { [socket_id: string]: SocketWrapper } } = {};
    private static registereduid_by_socketid: { [socket_id: string]: number } = {};
    private static registeredclient_tab_id_by_socketid: { [socket_id: string]: string } = {};
    /**
     * ----- Global application cache - Handled by Main process
     */

    private static throttled_notifyVarsDatasBySocket = ThrottleHelper.declare_throttle_with_stackable_args(async (stackable_args: any[]) => {
        if (!stackable_args) {
            return;
        }

        const params: { [socket_id: string]: VarDataValueResVO[] } = {};
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

        const promises = [];
        for (const socket_id in params) {
            promises.push(PushDataServerController.notifyVarsDatasBySocket_(socket_id, params[socket_id]));
        }
        await all_promises(promises);
    }, 100, { leading: false, trailing: true });

    public static initialize() {

        // Conf des taches qui dépendent du thread
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyDownloadFile, PushDataServerController.notifyDownloadFile.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyRedirectHomeAndDisconnect, PushDataServerController.notifyRedirectHomeAndDisconnect.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyVarData, PushDataServerController.notifyVarData.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyVarsDatas, PushDataServerController.notifyVarsDatas.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyVarsDatasBySocket, PushDataServerController.notifyVarsDatasBySocket.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyDAOGetVoById, PushDataServerController.notifyDAOGetVoById.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyDAOGetVos, PushDataServerController.notifyDAOGetVos.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_broadcastLoggedSimple, PushDataServerController.broadcastLoggedSimple.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_broadcastAllSimple, PushDataServerController.broadcastAllSimple.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_broadcastRoleSimple, PushDataServerController.broadcastRoleSimple.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_broadcastRoleRedirect, PushDataServerController.broadcastRoleRedirect.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifySimpleSUCCESS, PushDataServerController.notifySimpleSUCCESS.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifySimpleINFO, PushDataServerController.notifySimpleINFO.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifySimpleWARN, PushDataServerController.notifySimpleWARN.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifySimpleERROR, PushDataServerController.notifySimpleERROR.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyRedirectINFO, PushDataServerController.notifyRedirectINFO.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyPrompt, PushDataServerController.notifyPrompt.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifySession, PushDataServerController.notifySession.bind(this));
        // ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyReload, PushDataServerController.notifyReload.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyUserLoggedAndRedirect, PushDataServerController.notifyUserLoggedAndRedirect.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyTabReload, PushDataServerController.notifyTabReload.bind(this));
        // ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notifyVarsTabsReload, PushDataServerController.notifyVarsTabsReload.bind(this));

        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notify_vo_creation, PushDataServerController.notify_vo_creation.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notify_vo_update, PushDataServerController.notify_vo_update.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(PushDataServerController.TASK_NAME_notify_vo_deletion, PushDataServerController.notify_vo_deletion.bind(this));
    }

    public static getSocketsBySession(session_id: string): { [socket_id: string]: SocketWrapper } {
        if ((!PushDataServerController.registeredSockets_by_sessionid) ||
            (!PushDataServerController.registeredSockets_by_sessionid[session_id])) {
            return null;
        }

        return PushDataServerController.registeredSockets_by_sessionid[session_id];
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     * @param socket
     */
    public static registerSocket(session: IServerUserSession, socket: socketIO.Socket) {

        if ((!session) || (!socket)) {
            return;
        }

        ForkedTasksController.assert_is_main_process();
        const session_uid = ((session.uid == null) ? 0 : session.uid);

        const wrapper = new SocketWrapper(session_uid, session.id, socket.id, socket);

        // save in the socket in the session
        if (!PushDataServerController.registeredSockets_by_sessionid[session.id]) {
            PushDataServerController.registeredSockets_by_sessionid[session.id] = {};
        }
        PushDataServerController.registeredSockets_by_sessionid[session.id][socket.id] = wrapper;
        PushDataServerController.registeredSockets_by_id[socket.id] = wrapper;

        // No user or session, don't save this socket in registeredSockets
        const client_tab_id: string = socket.handshake.headers['client_tab_id'] ? socket.handshake.headers['client_tab_id'] as string : null;
        if ((!session) || (!session.id) || (!client_tab_id)) {
            return;
        }

        if (!PushDataServerController.registeredSockets[session_uid]) {
            PushDataServerController.registeredSockets[session_uid] = {};
        }
        if (!PushDataServerController.registeredSockets[session_uid][client_tab_id]) {
            PushDataServerController.registeredSockets[session_uid][client_tab_id] = {};
        }
        if (!PushDataServerController.registeredSockets[session_uid][client_tab_id][session.id]) {
            PushDataServerController.registeredSockets[session_uid][client_tab_id][session.id] = {};
        }
        PushDataServerController.registeredSockets[session_uid][client_tab_id][session.id][socket.id] = wrapper;

        PushDataServerController.registereduid_by_socketid[socket.id] = session_uid;
        PushDataServerController.registeredclient_tab_id_by_socketid[socket.id] = client_tab_id;

        if (!PushDataServerController.registeredSessions_by_uid[session_uid]) {
            PushDataServerController.registeredSessions_by_uid[session_uid] = {};
        }
        if (!PushDataServerController.registeredSessions_by_uid[session_uid][session.id]) {
            PushDataServerController.registeredSessions_by_uid[session_uid][session.id] = session;
        }
        if (!PushDataServerController.registeredSessions_by_sid[session.sid]) {
            PushDataServerController.registeredSessions_by_sid[session.sid] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     * @param socket
     */
    public static unregisterSocket(session: IServerUserSession, socket: socketIO.Socket) {

        if ((!session) || (!socket)) {
            return;
        }

        ForkedTasksController.assert_is_main_process();
        const session_uid = ((session.uid == null) ? 0 : session.uid);

        try {

            delete PushDataServerController.registeredSockets_by_sessionid[session.id][socket.id];
            delete PushDataServerController.registeredSockets_by_id[socket.id];
            delete PushDataServerController.registereduid_by_socketid[socket.id];
            delete PushDataServerController.registeredclient_tab_id_by_socketid[socket.id];
            const client_tab_id_ = StackContext.get('client_tab_id') ? StackContext.get('client_tab_id') : null;

            // No user or session, need to search for the socket by id
            if ((!session) || (!session.id) || (!client_tab_id_)) {

                const found: boolean = false;
                for (const uid in PushDataServerController.registeredSockets) {
                    const registeredSockets__ = PushDataServerController.registeredSockets[uid];

                    for (const client_tab_id in registeredSockets__) {
                        const registeredSockets_ = registeredSockets__[client_tab_id];

                        for (const sid in registeredSockets_) {
                            const registeredSockets = registeredSockets_[sid];

                            for (const socket_id in registeredSockets) {
                                if (socket_id == socket.id) {
                                    delete PushDataServerController.registeredSockets[uid][client_tab_id][sid][socket_id];
                                    return;
                                }
                            }
                        }
                    }
                }
                return;
            }

            delete PushDataServerController.registeredSockets[session_uid][client_tab_id_][session.id][socket.id];
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public static registerSession(session: IServerUserSession) {

        // No user or session, don't save this socket
        if ((!session) || (!session.id)) {
            return;
        }

        const uid = ((session.uid == null) ? 0 : session.uid);

        ForkedTasksController.assert_is_main_process();

        if (!PushDataServerController.registeredSessions_by_uid[uid]) {
            PushDataServerController.registeredSessions_by_uid[uid] = {};
        }
        if (!PushDataServerController.registeredSessions_by_uid[uid][session.id]) {
            PushDataServerController.registeredSessions_by_uid[uid][session.id] = session;
        }
        if (!PushDataServerController.registeredSessions_by_sid[session.sid]) {
            PushDataServerController.registeredSessions_by_sid[session.sid] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public static async unregisterSession(session: IServerUserSession, notify_redirect: boolean = true) {

        if (!session) {
            return;
        }

        ForkedTasksController.assert_is_main_process();
        const uid = ((session.uid == null) ? 0 : session.uid);

        await PushDataServerController.notifyRedirectHomeAndDisconnect(session);

        if (PushDataServerController.registeredSockets_by_sessionid[session.id]) {
            delete PushDataServerController.registeredSockets_by_sessionid[session.id];
        }

        // PushDataServerController.notifySimpleERROR(session.uid, null, PushDataServerController.NOTIFY_SESSION_INVALIDATED, true);

        // No user or session, don't save this socket
        if ((!session) || (!session.id)) {
            return;
        }

        if (PushDataServerController.registeredSessions_by_uid[uid] && PushDataServerController.registeredSessions_by_uid[uid][session.id]) {
            delete PushDataServerController.registeredSessions_by_uid[uid][session.id];
        }

        if (PushDataServerController.registeredSessions_by_sid[session.sid]) {
            delete PushDataServerController.registeredSessions_by_sid[session.sid];
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param session
     */
    public static async unregisterUserSession(session: IServerUserSession) {

        if (!session) {
            return;
        }

        ForkedTasksController.assert_is_main_process();
        const uid = ((session.uid == null) ? 0 : session.uid);

        // PushDataServerController.notifySimpleERROR(session.uid, null, PushDataServerController.NOTIFY_SESSION_INVALIDATED, true);
        await PushDataServerController.notifyRedirectHomeAndDisconnect();

        if (PushDataServerController.registeredSessions_by_uid[uid] && PushDataServerController.registeredSessions_by_uid[uid][session.id]) {
            delete PushDataServerController.registeredSessions_by_uid[uid][session.id];
        }
        if (PushDataServerController.registeredSessions_by_sid[session.sid]) {
            delete PushDataServerController.registeredSessions_by_sid[session.sid];
        }
    }


    /**
     * WARN : Only on main thread (express).
     * @param userId
     */
    public static getUserSockets(userId: number, client_tab_id: string = null): SocketWrapper[] {

        ForkedTasksController.assert_is_main_process();

        if (!client_tab_id) {
            let res: SocketWrapper[] = [];
            for (const i in PushDataServerController.registeredSockets[userId]) {
                res = res.concat(PushDataServerController.getUserSockets_client_tab_id(userId, i));
            }
            return res;
        } else {
            return PushDataServerController.getUserSockets_client_tab_id(userId, client_tab_id);
        }
    }

    /**
     * WARN : Only on main thread (express).
     * @param userId
     */
    public static getUserSessions(userId: number): { [sessId: string]: IServerUserSession } {

        ForkedTasksController.assert_is_main_process();

        return PushDataServerController.registeredSessions_by_uid[userId];
    }

    /**
     * WARN : Only on main thread (express).
     * @param sid
     */
    public static getSessionBySid(sid: string): IServerUserSession {

        ForkedTasksController.assert_is_main_process();

        return PushDataServerController.registeredSessions_by_sid[sid];
    }

    /**
     * WARN : Only on main thread (express).
     */
    public static getAllSockets(): SocketWrapper[] {

        ForkedTasksController.assert_is_main_process();

        let res: SocketWrapper[] = [];

        for (const userId in PushDataServerController.registeredSockets) {
            res = res.concat(PushDataServerController.getUserSockets(parseInt(userId.toString())));
        }
        return res;
    }

    /**
     * On notifie une room IO, avec le vo créé
     * @param room_id
     * @param vo
     */
    public static async notify_vo_creation(room_id: string, vo: any) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notify_vo_creation, room_id, vo)) {
            return;
        }

        const create_vo_notif: NotificationVO = new NotificationVO();
        create_vo_notif.notification_type = NotificationVO.TYPE_NOTIF_VO_CREATED;
        create_vo_notif.room_id = room_id;
        create_vo_notif.vos = [vo];

        if (ConfigurationService.node_configuration.debug_vo_events) {
            ConsoleHandler.log('notify_vo_creation:' + room_id + ':' + vo._type + ':' + vo.id);
        }

        const notification_type = NotificationVO.TYPE_NAMES[create_vo_notif.notification_type];
        const notification = APIControllerWrapper.try_translate_vo_to_api(create_vo_notif);

        await ServerBase.getInstance().io.to(room_id).emit(notification_type, notification);
    }

    /**
     * On notifie une room IO, avec le vo updaté (pré et post update)
     * @param room_id
     * @param pre_update_vo
     * @param post_update_vo
     */
    public static async notify_vo_update(room_id: string, pre_update_vo: any, post_update_vo: any) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notify_vo_update, room_id, pre_update_vo, post_update_vo)) {
            return;
        }

        const update_vo_notif: NotificationVO = new NotificationVO();
        update_vo_notif.notification_type = NotificationVO.TYPE_NOTIF_VO_UPDATED;
        update_vo_notif.room_id = room_id;
        update_vo_notif.vos = [pre_update_vo, post_update_vo];

        if (ConfigurationService.node_configuration.debug_vo_events) {
            ConsoleHandler.log('notify_vo_update:' + room_id + ':' + pre_update_vo._type + ':' + pre_update_vo.id);
        }

        const notification_type = NotificationVO.TYPE_NAMES[update_vo_notif.notification_type];
        const notification = APIControllerWrapper.try_translate_vo_to_api(update_vo_notif);

        await ServerBase.getInstance().io.to(room_id).emit(notification_type, notification);
    }


    /**
     * On notifie une room IO, avec le vo supprimé
     * @param room_id
     * @param vo
     */
    public static async notify_vo_deletion(room_id: string, vo: any) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notify_vo_deletion, room_id, vo)) {
            return;
        }

        const delete_vo_notif: NotificationVO = new NotificationVO();
        delete_vo_notif.notification_type = NotificationVO.TYPE_NOTIF_VO_DELETED;
        delete_vo_notif.room_id = room_id;
        delete_vo_notif.vos = [vo];

        if (ConfigurationService.node_configuration.debug_vo_events) {
            ConsoleHandler.log('notify_vo_deletion:' + room_id + ':' + vo._type + ':' + vo.id);
        }

        const notification_type = NotificationVO.TYPE_NAMES[delete_vo_notif.notification_type];
        const notification = APIControllerWrapper.try_translate_vo_to_api(delete_vo_notif);

        await ServerBase.getInstance().io.to(room_id).emit(notification_type, notification);
    }

    /**
     * On notifie un utilisateur, via son user_id et son client_tab_id pour renvoyer le résultat d'un appel POST ou POST_FOR_GET dont l'api est def en result notif
     * @param user_id
     * @param client_tab_id
     * @param res
     */
    public static async notifyAPIResult(user_id: number, client_tab_id: string, api_call_id: number, res: any) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyAPIResult, user_id, client_tab_id, api_call_id, res)) {
            return;
        }

        user_id = ((user_id == null) ? 0 : user_id);
        const notification: NotificationVO = PushDataServerController.getAPIResultNotif(user_id, client_tab_id, null, api_call_id, res);
        if (!notification) {
            ConsoleHandler.error('notifyAPIResult: no notification');
            return;
        }

        await PushDataServerController.notify(notification);
    }


    /**
     * On notifie un utilisateur, via son user_id et son client_tab_id pour notifier la fenêtre abonnée uniquement
     * @param user_id
     * @param client_tab_id
     * @param vo
     */
    public static async notifyVarData(user_id: number, client_tab_id: string, vo: VarDataValueResVO) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarData, user_id, client_tab_id, vo)) {
            return;
        }

        user_id = ((user_id == null) ? 0 : user_id);
        const notification: NotificationVO = PushDataServerController.getVarDataNotif(user_id, client_tab_id, null, vo ? [vo] : null);
        if (!notification) {
            return;
        }

        await PushDataServerController.notify(notification);
    }

    /**
     * On notifie un utilisateur pour forcer la déco et rechargement de la page d'accueil
     */
    public static async notifyRedirectHomeAndDisconnect(session: IServerUserSession = null) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyRedirectHomeAndDisconnect, session)) {
            return;
        }

        let notification: NotificationVO = null;
        try {
            const sid = (session && session.sid) ? session.sid : StackContext.get('SID');
            if (!sid) {
                return;
            }

            if (PushDataServerController.registeredSockets_by_sessionid && PushDataServerController.registeredSockets_by_sessionid[sid]) {
                notification = PushDataServerController.getTechNotif(
                    null, null,
                    Object.values(PushDataServerController.registeredSockets_by_sessionid[sid]).map((w) => w.socketId), NotificationVO.TECH_DISCONNECT_AND_REDIRECT_HOME);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        if (!notification) {
            return;
        }

        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyRedirectHomeAndDisconnect');
    }

    /**
     * On notifie une session pour forcer le rechargement de la page d'accueil suite connexion / changement de compte
     */
    public static async notifyUserLoggedAndRedirect(redirect_uri: string = '/', sso: boolean = false) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyUserLoggedAndRedirect, redirect_uri, sso)) {
            return;
        }

        let notification: NotificationVO = null;
        try {
            const session: IServerUserSession = StackContext.get('SESSION');

            if (PushDataServerController.registeredSockets_by_sessionid && PushDataServerController.registeredSockets_by_sessionid[session.id]) {
                notification = PushDataServerController.getTechNotif(
                    null, null,
                    Object.values(PushDataServerController.registeredSockets_by_sessionid[session.id]).map((w) => w.socketId), NotificationVO.TECH_LOGGED_AND_REDIRECT);

                if (session && session['last_fragmented_url']) {
                    const url = session['last_fragmented_url'];
                    session['last_fragmented_url'] = null;
                    notification.redirect_uri = url.replace(/\/f\//, '/#/');
                } else {
                    notification.redirect_uri = redirect_uri + (sso ? ('?session_id=' + session.sid) : '');
                }
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        if (!notification) {
            return;
        }

        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyUserLoggedAndRedirectHome');
    }

    /**
     * On notifie une tab pour reload
     */
    public static async notifyTabReload(UID: number, CLIENT_TAB_ID: string) {

        // Permet d'assurer un lancement uniquement sur le main process
        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyTabReload)) {
            return;
        }

        let notification: NotificationVO = null;
        try {
            notification = PushDataServerController.getTechNotif(
                UID, CLIENT_TAB_ID,
                null, NotificationVO.TECH_RELOAD);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        if (!notification) {
            return;
        }

        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyTabReload');
    }

    /**
     * On notifie un utilisateur, via son user_id et son client_tab_id pour notifier la fenêtre abonnée uniquement
     * @param user_id
     * @param client_tab_id
     * @param vos
     */
    public static async notifyVarsDatas(user_id: number, client_tab_id: string, vos: VarDataValueResVO[]) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarsDatas, user_id, client_tab_id, vos)) {
            return;
        }

        user_id = ((user_id == null) ? 0 : user_id);
        const notification: NotificationVO = PushDataServerController.getVarDataNotif(user_id, client_tab_id, null, vos);
        if (!notification) {
            return;
        }

        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyVarsDatas');
    }

    public static async notifyVarsDatasBySocket(socket_id: string, vos: VarDataValueResVO[]) {

        PushDataServerController.throttled_notifyVarsDatasBySocket([{ socket_id: socket_id, vos: vos }]);
    }

    public static async notifyVarsDatasBySocket_(socket_id: string, vos: VarDataValueResVO[]) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyVarsDatas, socket_id, vos)) {
            return;
        }

        const notification: NotificationVO = PushDataServerController.getVarDataNotif(PushDataServerController.registereduid_by_socketid[socket_id], PushDataServerController.registeredclient_tab_id_by_socketid[socket_id], socket_id, vos);
        if (!notification) {
            return;
        }

        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyVarsDatasBySocket_');
    }

    public static async notifyDAOGetVoById(user_id: number, client_tab_id: string, api_type_id: string, vo_id: number) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAOGetVoById, user_id, client_tab_id, api_type_id, vo_id)) {
            return;
        }

        if ((!user_id) || (!api_type_id) || (!vo_id)) {
            return;
        }

        const notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_GET_VO_BY_ID;
        notification.dao_notif_vo_id = vo_id;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = true;
        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyDAOGetVoById');
    }

    public static async notifyDAORemoveId(user_id: number, client_tab_id: string, api_type_id: string, vo_id: number) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAORemoveId, user_id, client_tab_id, api_type_id, vo_id)) {
            return;
        }

        if ((!user_id) || (!api_type_id) || (!vo_id)) {
            return;
        }

        const notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_REMOVE_ID;
        notification.dao_notif_vo_id = vo_id;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = true;
        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyDAORemoveId');
    }

    public static async notifyDAOGetVos(user_id: number, client_tab_id: string, api_type_id: string) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDAOGetVos, user_id, client_tab_id, api_type_id)) {
            return;
        }

        if ((!user_id) || (!api_type_id)) {
            return;
        }

        const notification: NotificationVO = new NotificationVO();

        notification.api_type_id = api_type_id;
        notification.dao_notif_type = NotificationVO.DAO_GET_VOS;
        notification.notification_type = NotificationVO.TYPE_NOTIF_DAO;
        notification.read = false;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = true;
        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyDAOGetVos');
    }

    public static async broadcastLoggedSimple(msg_type: number, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastLoggedSimple, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

        const promises = [];

        const ids: number[] = [];
        for (const userId_ in PushDataServerController.registeredSockets) {
            const userId = parseInt(userId_.toString());

            if (ids.indexOf(userId) < 0) {
                ids.push(userId);
            } else {
                continue;
            }

            promises.push((async () => {
                await PushDataServerController.notifySimple(null, userId, null, msg_type, code_text, auto_read_if_connected, simple_notif_json_params);
            })());
        }
        await all_promises(promises);
    }

    public static async broadcastAllSimple(msg_type: number, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastAllSimple, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

        const promises = [];
        const users = await query(UserVO.API_TYPE_ID).select_vos<UserVO>();
        for (const i in users) {
            const user = users[i];

            promises.push((async () => {
                await PushDataServerController.notifySimple(null, user.id, null, msg_type, code_text, auto_read_if_connected, simple_notif_json_params);
            })());
        }
        await all_promises(promises);
    }

    public static async broadcastRoleSimple(role_name: string, msg_type: number, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastRoleSimple, role_name, msg_type, code_text, auto_read_if_connected, simple_notif_json_params)) {
            return;
        }

        const promises = [];

        try {
            const role: RoleVO = await query(RoleVO.API_TYPE_ID).filter_by_text_eq(field_names<RoleVO>().translatable_name, role_name).select_vo<RoleVO>();
            if (!role) {
                ConsoleHandler.error('broadcastRoleSimple:Role introuvable:' + role_name + ':');
                return;
            }

            const usersRoles: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).filter_by_num_eq(field_names<UserRoleVO>().role_id, role.id).select_vos<UserRoleVO>();

            if ((!usersRoles) || (!usersRoles.length)) {
                ConsoleHandler.error('broadcastRoleSimple:usersRoles introuvables:' + role_name + ':' + role.id);
                return;
            }

            const user_ids: number[] = [];
            for (const i in usersRoles) {
                user_ids.push(usersRoles[i].user_id);
            }

            const users: UserVO[] = await query(UserVO.API_TYPE_ID).filter_by_ids(user_ids).select_vos<UserVO>();
            if (!users) {
                ConsoleHandler.error('broadcastRoleSimple:users introuvables:' + role_name + ':' + role.id);
                return;
            }

            for (const i in users) {
                const user = users[i];

                promises.push((async () => {
                    await PushDataServerController.notifySimple(null, user.id, null, msg_type, code_text, auto_read_if_connected, simple_notif_json_params);
                })());
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await all_promises(promises);
    }

    // Notifications qui redirigent sur une route avec ou sans paramètres
    public static async broadcastRoleRedirect(
        role_name: string,
        msg_type: number,
        code_text: string,
        redirect_route: string = "",
        notif_route_params_name: string[] = null,
        notif_route_params_values: string[] = null,
        auto_read_if_connected: boolean = false
    ) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_broadcastRoleRedirect, role_name, msg_type, code_text, auto_read_if_connected)) {
            return;
        }

        const promises = [];

        try {
            const role: RoleVO = await query(RoleVO.API_TYPE_ID).filter_by_text_eq(field_names<RoleVO>().translatable_name, role_name).select_vo<RoleVO>();
            if (!role) {
                ConsoleHandler.error('broadcastRoleRedirect:Role introuvable:' + role_name + ':');
                return;
            }

            const usersRoles: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).filter_by_num_eq(field_names<UserRoleVO>().role_id, role.id).select_vos<UserRoleVO>();
            if ((!usersRoles) || (!usersRoles.length)) {
                ConsoleHandler.error('broadcastRoleRedirect:usersRoles introuvables:' + role_name + ':' + role.id);
                return;
            }

            const user_ids: number[] = [];
            for (const i in usersRoles) {
                user_ids.push(usersRoles[i].user_id);
            }

            const users: UserVO[] = await query(UserVO.API_TYPE_ID).filter_by_ids(user_ids).select_vos<UserVO>();

            if (!users) {
                ConsoleHandler.error('broadcastRoleRedirect:users introuvables:' + role_name + ':' + role.id);
                return;
            }

            for (const i in users) {
                const user = users[i];

                promises.push((async () => {
                    await PushDataServerController.notifyRedirect(null, user.id, null, msg_type, code_text, redirect_route, notif_route_params_name, notif_route_params_values, auto_read_if_connected);
                })());
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await all_promises(promises);
    }


    public static async notifySession(code_text: string, notif_type: number = NotificationVO.SIMPLE_SUCCESS, simple_notif_json_params: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySession, code_text, notif_type)) {
            return;
        }

        try {
            const sid: string = StackContext.get('SID');
            if (PushDataServerController.registeredSockets_by_sessionid && PushDataServerController.registeredSockets_by_sessionid[sid]) {
                await PushDataServerController.notifySimple(Object.values(PushDataServerController.registeredSockets_by_sessionid[sid]).map((w) => w.socketId),
                    null, null, notif_type, code_text, true, simple_notif_json_params);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    public static async notifySimpleSUCCESS(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null, simple_downloadable_link: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleSUCCESS, user_id, client_tab_id, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link)) {
            return;
        }

        await PushDataServerController.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_SUCCESS, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link);
    }

    public static async notifySimpleINFO(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null, simple_downloadable_link: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleINFO, user_id, client_tab_id, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link)) {
            return;
        }

        await PushDataServerController.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_INFO, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link);
    }

    public static async notifySimpleWARN(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null, simple_downloadable_link: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleWARN, user_id, client_tab_id, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link)) {
            return;
        }

        await PushDataServerController.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_WARN, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link);
    }

    public static async notifySimpleERROR(user_id: number, client_tab_id: string, code_text: string, auto_read_if_connected: boolean = false, simple_notif_json_params: string = null, simple_downloadable_link: string = null) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifySimpleERROR, user_id, client_tab_id, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link)) {
            return;
        }

        await PushDataServerController.notifySimple(null, user_id, client_tab_id, NotificationVO.SIMPLE_ERROR, code_text, auto_read_if_connected, simple_notif_json_params, simple_downloadable_link);
    }

    /**
     * Notifications qui permettent de télécharger un fichier
     *  On sélectionne la current tab du user pour ne pas envoyer autant de notif que de tabs ouvertes, si la tab n'est pas fournie d'emblée à la fonction
     * @param user_id
     * @param client_tab_id
     * @param full_file_path
     */
    public static async notifyDownloadFile(
        user_id: number,
        client_tab_id: string,
        full_file_path: string
    ) {

        if (!full_file_path) {
            return;
        }

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyDownloadFile, user_id, client_tab_id, full_file_path)) {
            return;
        }

        const notification: NotificationVO = new NotificationVO();

        notification.notification_type = NotificationVO.TYPE_NOTIF_DOWNLOAD_FILE;
        notification.read = false;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id ? client_tab_id : PushDataServerController.last_known_tab_id_by_user_id[user_id];
        notification.simple_downloadable_link = full_file_path;
        await PushDataServerController.notify(notification);
    }

    public static async notifyPrompt(user_id: number, client_tab_id: string, code_text: string, simple_notif_json_params: string = null): Promise<string> {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyPrompt, user_id, client_tab_id, code_text)) {
            return null;
        }

        if ((!user_id) || (!client_tab_id) || (!code_text)) {
            return null;
        }

        const self = this;

        // On met aussi un time out à 2 minutes sinon on reste bloqués à vie potentiellement
        return new Promise(async (resolve, reject) => {
            const notification: NotificationVO = new NotificationVO();
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
            // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifyPrompt');

            await ThreadHandler.sleep(120000, 'PushDataServerController.notifyPrompt.120000');
            if (still_waiting) {
                reject('No Prompt received');
            }
        });
    }

    public static async notifyRedirectINFO(user_id: number, client_tab_id: string, code_text: string, redirect_route: string = "", notif_route_params_name: string[] = null, notif_route_params_values: string[] = null, auto_read_if_connected: boolean = false) {

        if (!await ForkedTasksController.exec_self_on_main_process(PushDataServerController.TASK_NAME_notifyRedirectINFO, user_id, client_tab_id, code_text, redirect_route, notif_route_params_name, notif_route_params_values, auto_read_if_connected)) {
            return;
        }

        await PushDataServerController.notifyRedirect(null, user_id, client_tab_id, NotificationVO.SIMPLE_INFO, code_text, redirect_route, notif_route_params_name, notif_route_params_values, auto_read_if_connected);
    }

    // Notifications qui redirigent sur une route avec ou sans paramètres
    private static async notifyRedirect(
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

        const notification: NotificationVO = new NotificationVO();

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
        await PushDataServerController.notify(notification);
    }

    private static async notifySimple(
        socket_ids: string[], user_id: number, client_tab_id: string,
        msg_type: number, code_text: string, auto_read_if_connected: boolean,
        simple_notif_json_params: string = null,
        simple_downloadable_link: string = null) {

        if ((msg_type === null) || (typeof msg_type == 'undefined') || (!code_text)) {
            return;
        }

        const notification: NotificationVO = new NotificationVO();

        notification.simple_notif_label = code_text;
        notification.simple_notif_json_params = simple_notif_json_params;
        notification.simple_notif_type = msg_type;
        notification.notification_type = NotificationVO.TYPE_NOTIF_SIMPLE;
        notification.read = false;
        notification.socket_ids = socket_ids;
        notification.user_id = user_id;
        notification.client_tab_id = client_tab_id;
        notification.auto_read_if_connected = auto_read_if_connected;
        notification.simple_downloadable_link = simple_downloadable_link;
        await PushDataServerController.notify(notification);
        // await ThreadHandler.sleep(PushDataServerController.NOTIF_INTERVAL_MS, 'PushDataServerController.notifySimple');
    }


    /**
     * TODO REFONTE DES VARS et DES SOCKETS il faut envoyer autant que possible les notifications à un seul socket, en tout cas pour les mises à jour de vars
     *  qui sont très bien ciblables par socket en théorie
     * TODO Ajouter un wrapper sur les notifs et un debounced comme pour les request wrapper de manière à regrouper au maximum les notifs sans avoir à mettre des await sur chaque notif...
     * @param notification
     */
    private static async notify(notification: NotificationVO) {

        try {

            // Broadcast to user's sessions or save in DB if no session available

            let socketWrappers: SocketWrapper[] = null;
            if ((!notification.socket_ids) || (!notification.socket_ids.length)) {
                if (notification.user_id == null) {
                    return;
                }
                socketWrappers = PushDataServerController.getUserSockets(notification.user_id, notification.client_tab_id);
            } else {
                socketWrappers = notification.socket_ids.map((socket_id: string) => PushDataServerController.registeredSockets_by_id[socket_id]);
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
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(notification);
            }

            if (socketWrappers && socketWrappers.length) {

                const notification_type = NotificationVO.TYPE_NAMES[notification.notification_type];
                notification = APIControllerWrapper.try_translate_vo_to_api(notification);

                for (const i in socketWrappers) {
                    const socketWrapper: SocketWrapper = socketWrappers[i];

                    if (!socketWrapper) {
                        continue;
                    }
                    socketWrapper.socket.emit(notification_type, notification);
                }
            }
        } catch (error) {

            ConsoleHandler.error('notify:' + notification.user_id + ':' + error);
        }
    }

    private static getAPIResultNotif(user_id: number, client_tab_id: string, socket_id: string, api_call_id: number, res: any): NotificationVO {

        const notification: NotificationVO = new NotificationVO();

        notification.api_type_id = null;
        notification.notification_type = NotificationVO.TYPE_NOTIF_APIRESULT;
        notification.read = true;
        notification.socket_ids = socket_id ? [socket_id] : null;
        notification.client_tab_id = client_tab_id;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        notification.vos = [
            APINotifTypeResultVO.createNew(
                api_call_id,
                res
            )
        ];
        return notification;
    }

    private static getVarDataNotif(user_id: number, client_tab_id: string, socket_id: string, vos: VarDataValueResVO[]): NotificationVO {

        if ((!vos) || (!vos.length)) {
            return null;
        }

        const notification: NotificationVO = new NotificationVO();

        notification.api_type_id = null;
        notification.notification_type = NotificationVO.TYPE_NOTIF_VARDATA;
        notification.read = false;
        notification.socket_ids = socket_id ? [socket_id] : null;
        notification.client_tab_id = client_tab_id;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        notification.vos = vos;
        return notification;
    }

    private static getTechNotif(user_id: number, client_tab_id: string, socket_ids: string[], marker: string): NotificationVO {

        const notification: NotificationVO = new NotificationVO();

        notification.api_type_id = null;
        notification.notification_type = NotificationVO.TYPE_NOTIF_TECH;
        notification.read = false;
        notification.socket_ids = socket_ids;
        notification.client_tab_id = client_tab_id;
        notification.user_id = user_id;
        notification.auto_read_if_connected = true;
        notification.vos = [{
            marker
        } as any];
        return notification;
    }

    private static clearClosedSockets(userId: number, client_tab_id: string) {

        ForkedTasksController.assert_is_main_process();

        if (!client_tab_id) {
            for (const i in PushDataServerController.registeredSockets[userId]) {
                PushDataServerController.clearClosedSockets_client_tab_id(userId, i);
            }
        } else {
            PushDataServerController.clearClosedSockets_client_tab_id(userId, client_tab_id);
        }
    }

    private static clearClosedSockets_client_tab_id(userId: number, client_tab_id: string) {

        ForkedTasksController.assert_is_main_process();

        const toclose_tabs: string[] = [];

        if (!PushDataServerController.registeredSockets[userId]) {
            return;
        }

        for (const i in PushDataServerController.registeredSockets[userId][client_tab_id]) {

            const sessionSockets = PushDataServerController.registeredSockets[userId][client_tab_id][i];
            const toclose: string[] = [];
            for (const socketId in sessionSockets) {

                if ((!sessionSockets[socketId]) || (!sessionSockets[socketId].socket.connected)) {
                    toclose.push(socketId);
                }
            }

            for (const j in toclose) {
                delete sessionSockets[toclose[j]];
            }

            if (!ObjectHandler.hasAtLeastOneAttribute(sessionSockets)) {
                toclose_tabs.push(client_tab_id);
            }
        }

        for (const j in toclose_tabs) {
            if (PushDataServerController.registeredSockets[userId] && PushDataServerController.registeredSockets[userId][toclose_tabs[j]]) {
                delete PushDataServerController.registeredSockets[userId][toclose_tabs[j]];
            }
        }
    }

    private static getUserSockets_client_tab_id(userId: number, client_tab_id: string): SocketWrapper[] {

        ForkedTasksController.assert_is_main_process();

        PushDataServerController.clearClosedSockets(userId, client_tab_id);

        if ((!PushDataServerController.registeredSockets) || (!PushDataServerController.registeredSockets[userId]) || (!PushDataServerController.registeredSockets[userId][client_tab_id])) {
            return [];
        }

        const res: SocketWrapper[] = [];
        for (const sessId in PushDataServerController.registeredSockets[userId][client_tab_id]) {
            for (const socketId in PushDataServerController.registeredSockets[userId][client_tab_id][sessId]) {
                res.push(PushDataServerController.registeredSockets[userId][client_tab_id][sessId][socketId]);
            }
        }

        return res;
    }
}