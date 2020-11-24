import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';
import SocketWrapper from '../PushData/vos/SocketWrapper';

export default class VarsTabsSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsTabsSubsController.notify_vardatas';

    /**
     * Multithreading notes :
     *  - any data or action in this controller needs to be done on the main thread
     */
    public static getInstance(): VarsTabsSubsController {
        if (!VarsTabsSubsController.instance) {
            VarsTabsSubsController.instance = new VarsTabsSubsController();
        }
        return VarsTabsSubsController.instance;
    }

    private static instance: VarsTabsSubsController = null;

    /**
     * Les client_tab_ids abonnés à chaque var_index
     */
    private _tabs_subs: { [var_index: string]: { [user_id: number]: { [client_tab_id: string]: boolean } } } = {};

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsTabsSubsController.TASK_NAME_notify_vardatas, this.notify_vardatas.bind(this));
    }

    /**
     * WARN : Only on main thread (express).
     */
    public register_sub(user_id: number, client_tab_id: string, param_indexs: string[]) {
        ForkedTasksController.getInstance().assert_is_main_process();

        for (let i in param_indexs) {
            let param_index = param_indexs[i];

            if (!param_index) {
                continue;
            }

            if (!this._tabs_subs[param_index]) {
                this._tabs_subs[param_index] = {};
            }
            if (!this._tabs_subs[param_index][user_id]) {
                this._tabs_subs[param_index][user_id] = {};
            }
            // ConsoleHandler.getInstance().log('REMOVETHIS:register_sub:' + param_index + ':user_id:' + user_id + ':client_tab_id:' + client_tab_id + ':');
            this._tabs_subs[param_index][user_id][client_tab_id] = true;
        }
    }

    /**
     * WARN : Only on main thread (express).
     */
    public unregister_sub(user_id: number, client_tab_id: string, param_indexs: string[]) {
        ForkedTasksController.getInstance().assert_is_main_process();

        for (let i in param_indexs) {
            let param_index = param_indexs[i];

            if ((!param_index) || (!this._tabs_subs[param_index]) || (!this._tabs_subs[param_index][user_id]) || (!this._tabs_subs[param_index][user_id][client_tab_id])) {
                continue;
            }
            // ConsoleHandler.getInstance().log('REMOVETHIS:unregister_sub:' + param_index + ':user_id:' + user_id + ':client_tab_id:' + client_tab_id + ':');
            delete this._tabs_subs[param_index][user_id][client_tab_id];
        }
    }

    /**
     * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les sockets qui s'intéressent à ces vardatas
     * @param var_datas Tableau ou map (sur index) des vars datas
     * @param is_computing true indique au client de ne pas prendre en compte les valeurs envoyées uniquement le fait q'un calcul est en cours
     */
    public notify_vardatas(var_datas: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }, is_computing: boolean = false): boolean {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(VarsTabsSubsController.TASK_NAME_notify_vardatas, var_datas, is_computing)) {
            return;
        }

        let datas_by_socketid_for_notif: { [socketid: number]: VarDataValueResVO[] } = {};
        for (let i in var_datas) {
            let var_data = var_datas[i];

            // ConsoleHandler.getInstance().log('REMOVETHIS:notify_vardatas.1:' + var_data.index + ':');

            for (let user_id in this._tabs_subs[var_data.index]) {

                /**
                 * On doit demander tous les sockets actifs pour une tab
                 */
                for (let client_tab_id in this._tabs_subs[var_data.index][user_id]) {

                    let sockets: SocketWrapper[] = PushDataServerController.getInstance().getUserSockets(parseInt(user_id.toString()), client_tab_id);

                    for (let j in sockets) {
                        let socket: SocketWrapper = sockets[j];

                        if (!datas_by_socketid_for_notif[socket.socketId]) {
                            datas_by_socketid_for_notif[socket.socketId] = [];
                        }
                        datas_by_socketid_for_notif[socket.socketId].push(new VarDataValueResVO().set_from_vardata(var_data).set_is_computing(is_computing));
                    }
                }
            }
        }

        for (let socketid in datas_by_socketid_for_notif) {

            // datas_by_socketid_for_notif[socketid].forEach((vd) => ConsoleHandler.getInstance().log('REMOVETHIS:notify_vardatas.2:' + vd.index + ':'));
            PushDataServerController.getInstance().notifyVarsDatasBySocket(socketid, datas_by_socketid_for_notif[socketid]);
        }
        return true;
    }
}