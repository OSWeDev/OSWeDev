import SlowVarVO from '../../../shared/modules/Var/vos/SlowVarVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';
import SocketWrapper from '../PushData/vos/SocketWrapper';
import NotifVardatasParam from './notifs/NotifVardatasParam';

export default class VarsTabsSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsTabsSubsController.notify_vardatas';
    public static TASK_NAME_filter_by_subs: string = 'VarsTabsSubsController.filter_by_subs';

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

    public notify_vardatas = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(
        this.notify_vardatas_throttled.bind(this), 400, { leading: true, trailing: true });

    /**
     * Les client_tab_ids abonnés à chaque var_index
     */
    private _tabs_subs: { [var_index: string]: { [user_id: number]: { [client_tab_id: string]: boolean } } } = {};

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsTabsSubsController.TASK_NAME_notify_vardatas, this.notify_vardatas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsTabsSubsController.TASK_NAME_filter_by_subs, this.filter_by_subs.bind(this));
    }

    public get_subscribed_tabs_ids(index: string): { [user_id: number]: { [client_tab_id: string]: boolean } } {
        return this._tabs_subs[index];
    }

    /**
     * WARN : Only on main thread (express).
     */
    public register_sub(user_id: number, client_tab_id: string, param_indexs: string[]) {
        ForkedTasksController.getInstance().assert_is_main_process();

        user_id = ((user_id == null) ? 0 : user_id);

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

        user_id = ((user_id == null) ? 0 : user_id);

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
    public async notify_vardatas_throttled(params: NotifVardatasParam[]): Promise<boolean> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(VarsTabsSubsController.TASK_NAME_notify_vardatas, params)) {
            return false;
        }

        let datas_by_socketid_for_notif: { [socketid: number]: VarDataValueResVO[] } = {};
        for (let parami in params) {
            let param = params[parami];

            for (let i in param.var_datas) {
                let var_data = param.var_datas[i];

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
                            datas_by_socketid_for_notif[socket.socketId].push(new VarDataValueResVO().set_from_vardata(var_data).set_is_computing(param.is_computing));
                        }
                    }
                }
            }
        }

        for (let socketid in datas_by_socketid_for_notif) {

            // datas_by_socketid_for_notif[socketid].forEach((vd) => ConsoleHandler.getInstance().log('REMOVETHIS:notify_vardatas.2:' + vd.index + ':'));
            await PushDataServerController.getInstance().notifyVarsDatasBySocket(socketid, datas_by_socketid_for_notif[socketid]);
        }
        return true;
    }

    /**
     * Méthode qui permet de filtrer un tableau de vars et de récupérer les vars actuellement subscribed par des utilisateurs.
     *  On peut ainsi prioriser une mise en cache avec les variables actuellement consultées
     */
    public async filter_by_subs(var_datas: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {

        let res: VarDataBaseVO[] = [];

        if ((!var_datas) || (!var_datas.length)) {
            return null;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_main_process_and_return_value(
                reject, VarsTabsSubsController.TASK_NAME_filter_by_subs, resolve, var_datas)) {
                return;
            }

            for (let i in var_datas) {
                let var_data = var_datas[i];

                if (self.has_registered_user(var_data.index)) {
                    res.push(var_data);
                }
            }

            resolve(res);
        });
    }

    private has_registered_user(index: string): boolean {

        if (!this._tabs_subs[index]) {
            return false;
        }

        for (let i in this._tabs_subs[index]) {
            let subs = this._tabs_subs[index][i];

            for (let j in subs) {

                if (subs[j]) {
                    return true;
                }
            }
        }
        return false;
    }
}