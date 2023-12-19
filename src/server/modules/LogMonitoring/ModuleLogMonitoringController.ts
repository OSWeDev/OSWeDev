
import socketIO from 'socket.io';
import IServerUserSession from '../../../shared/modules/AccessPolicy/vos/IServerUserSession';
import ModuleLogMonitoring from '../../../shared/modules/LogMonitoring/ModuleLogMonitoring';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import LogVO from '../../../shared/modules/LogMonitoring/vos/LogVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import ForkedTasksController from '../Fork/ForkedTasksController';
import SocketWrapper from '../PushData/vos/SocketWrapper';
import LogSocketController from './socket-controller/LogSocketController';
import ForkServerController from '../Fork/ForkServerController';

/**
 * ModuleLogMonitoringController
 *
 * @class ModuleLogMonitoringController
 */
export default class ModuleLogMonitoringController {

    /**
     * Only on main thread (express).
     */
    public static last_known_tab_id_by_user_id: { [user_id: number]: string } = {};

    public static NOTIF_INTERVAL_MS: number = 1000;

    public static getInstance(): ModuleLogMonitoringController {
        if (!ModuleLogMonitoringController.instance) {
            ModuleLogMonitoringController.instance = new ModuleLogMonitoringController();
        }

        return ModuleLogMonitoringController.instance;
    }

    private static instance: ModuleLogMonitoringController = null;

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

    private constructor() {

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
     *
     * @param {IServerUserSession} session
     * @param {socketIO.Socket} socket
     */
    public registerSocket(session: IServerUserSession, socket: socketIO.Socket) {

        if ((!session) || (!socket)) {
            return;
        }

        if (!ForkServerController.is_main_process()) {
            return;
        }

        const session_uid = ((session.uid == null) ? 0 : session.uid);

        const wrapper = new SocketWrapper(session_uid, session.id, socket.id, socket);

        // Save in the socket in the session
        if (!this.registeredSockets_by_sessionid[session.id]) {
            this.registeredSockets_by_sessionid[session.id] = {};
        }

        this.registeredSockets_by_sessionid[session.id][socket.id] = wrapper;
        this.registeredSockets_by_id[socket.id] = wrapper;

        // No user or session, don't save this socket in registeredSockets
        const client_tab_id: string = socket.handshake.headers['client_tab_id'] ? socket.handshake.headers['client_tab_id'] as string : null;
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
        this.registeredclient_tab_id_by_socketid[socket.id] = client_tab_id;
        this.registereduid_by_socketid[socket.id] = session_uid;

        if (!this.registeredSessions[session_uid]) {
            this.registeredSessions[session_uid] = {};
        }

        if (!this.registeredSessions[session_uid][session.id]) {
            this.registeredSessions[session_uid][session.id] = session;
        }

        // Subscribe to the client context_query changes
        socket.on(ModuleLogMonitoring.SOCKET_APINAME_client_logs_query, (context_query: ContextQueryVO) => {
            LogSocketController.getInstance().subscribe_to_context_query_changes(context_query);
        });
    }

    /**
     * WARN : Only on main thread (express).
     *
     * @param {IServerUserSession} session
     * @param {socketIO.Socket} socket
     */
    public unregisterSocket(session: IServerUserSession, socket: socketIO.Socket) {

        if ((!session) || (!socket)) {
            return;
        }

        if (!ForkServerController.is_main_process()) {
            return;
        }

        let session_uid = ((session.uid == null) ? 0 : session.uid);

        try {

            delete this.registeredSockets_by_sessionid[session.id][socket.id];
            delete this.registeredSockets_by_id[socket.id];
            delete this.registereduid_by_socketid[socket.id];
            delete this.registeredclient_tab_id_by_socketid[socket.id];

            let client_tab_id_ = StackContext.get('client_tab_id') ? StackContext.get('client_tab_id') : null;

            // No user or session, need to search for the socket by id
            if ((!session) || (!session?.id) || (!client_tab_id_)) {

                let found: boolean = false;
                for (const uid in this.registeredSockets) {
                    const registeredSockets__ = this.registeredSockets[uid];

                    for (const client_tab_id in registeredSockets__) {
                        const registeredSockets_ = registeredSockets__[client_tab_id];

                        for (const sid in registeredSockets_) {
                            const registeredSockets = registeredSockets_[sid];

                            for (const socket_id in registeredSockets) {
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
            ConsoleHandler.error(error);
        }
    }

    /**
     * WARN : Only on main thread (express).
     *
     * @param {IServerUserSession} session
     */
    public registerSession(session: IServerUserSession) {

        // No user or session, don't save this socket
        if ((!session) || (!session.id)) {
            return;
        }

        let uid = ((session.uid == null) ? 0 : session.uid);

        if (!ForkServerController.is_main_process()) {
            return;
        }

        if (!this.registeredSessions[uid]) {
            this.registeredSessions[uid] = {};
        }

        if (!this.registeredSessions[uid][session.id]) {
            this.registeredSessions[uid][session.id] = session;
        }
    }

    /**
     * WARN : Only on main thread (express).
     *
     * @param session
     */
    public async unregisterSession(session: IServerUserSession, notify_redirect: boolean = true) {

        if (!session) {
            return;
        }

        if (!ForkServerController.is_main_process()) {
            return;
        }

        let uid = ((session.uid == null) ? 0 : session.uid);

        if (this.registeredSockets_by_sessionid[session.id]) {
            delete this.registeredSockets_by_sessionid[session.id];
        }

        // this.notifySimpleERROR(session.uid, null, ModuleLogMonitoringController.NOTIFY_SESSION_INVALIDATED, true);

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

        if (!ForkServerController.is_main_process()) {
            return;
        }

        let uid = ((session.uid == null) ? 0 : session.uid);

        if (this.registeredSessions[uid] && this.registeredSessions[uid][session.id]) {
            delete this.registeredSessions[uid][session.id];
        }
    }

    /**
     * getUserSockets
     *  - WARN : Only on main thread (express).
     *
     * @param {number} userId
     * @param {string} client_tab_id
     */
    public getUserSockets(userId: number, client_tab_id: string = null): SocketWrapper[] {

        if (!ForkServerController.is_main_process()) {
            return;
        }

        if (!client_tab_id) {
            let res: SocketWrapper[] = [];

            for (const i in this.registeredSockets[userId]) {
                res = res.concat(this.getUserSockets_client_tab_id(userId, i));
            }

            return res;
        } else {
            return this.getUserSockets_client_tab_id(userId, client_tab_id);
        }
    }

    /**
     * getUserSessions
     *  - WARN : Only on main thread (express).
     *
     * @param {number} userId
     * @returns {{ [sessId: string]: IServerUserSession }}
     */
    public getUserSessions(userId: number): { [sessId: string]: IServerUserSession } {

        if (!ForkServerController.is_main_process()) {
            return;
        }

        return this.registeredSessions[userId];
    }

    /**
     * WARN : Only on main thread (express).
     */
    public getAllSockets(): SocketWrapper[] {

        if (!ForkServerController.is_main_process()) {
            return;
        }

        let res: SocketWrapper[] = [];

        for (let userId in this.registeredSockets) {
            res = res.concat(this.getUserSockets(parseInt(userId.toString())));
        }

        return res;
    }

    /**
     * sendLogsThroughSocket
     *
     * @param {SocketWrapper} socket
     * @param logs
     * @returns {Promise<void>}
     */
    public async send_logs_through_socket(props: { user_id: number, client_tab_id: string, data: { items: LogVO[], total_count: number } }): Promise<void> {
        const { data } = props;

        if (!ForkServerController.is_main_process()) {
            return;
        }

        try {
            // TODO: Just to make it work for now
            for (const i in this.registeredSockets_by_id) {
                const socket_wrapper: SocketWrapper = this.registeredSockets_by_id[i];

                if (!socket_wrapper) {
                    continue;
                }

                socket_wrapper.socket.emit(ModuleLogMonitoring.SOCKET_APINAME_server_logs_rows, data);
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private clearClosedSockets(userId: number, client_tab_id: string) {

        if (!ForkServerController.is_main_process()) {
            return;
        }

        if (!client_tab_id) {
            for (let i in this.registeredSockets[userId]) {
                this.clearClosedSockets_client_tab_id(userId, i);
            }
        } else {
            this.clearClosedSockets_client_tab_id(userId, client_tab_id);
        }
    }

    private clearClosedSockets_client_tab_id(userId: number, client_tab_id: string) {

        if (!ForkServerController.is_main_process()) {
            return;
        }

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

            if (!ObjectHandler.hasAtLeastOneAttribute(sessionSockets)) {
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

        if (!ForkServerController.is_main_process()) {
            return;
        }

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