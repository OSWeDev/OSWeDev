import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';

export default class VarsSocketsSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsSocketsSubsController.notify_vardatas';

    /**
     * Multithreading notes :
     *  - any data or action in this controller needs to be done on the main thread
     */
    public static getInstance(): VarsSocketsSubsController {
        if (!VarsSocketsSubsController.instance) {
            VarsSocketsSubsController.instance = new VarsSocketsSubsController();
        }
        return VarsSocketsSubsController.instance;
    }

    private static instance: VarsSocketsSubsController = null;

    /**
     * Les socket_ids abonnés à chaque var_index
     */
    private _sockets_subs: { [var_index: string]: { [socket_id: string]: boolean } } = {};

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsSocketsSubsController.TASK_NAME_notify_vardatas, this.notify_vardatas.bind(this));
    }

    /**
     * WARN : Only on main thread (express).
     */
    public register_sub(socket_id: string, param_indexs: string[]) {
        ForkedTasksController.getInstance().assert_is_main_process();

        for (let i in param_indexs) {
            let param_index = param_indexs[i];

            if (!this._sockets_subs[param_index]) {
                this._sockets_subs[param_index] = {};
            }
            this._sockets_subs[param_index][socket_id] = true;
        }
    }

    /**
     * WARN : Only on main thread (express).
     */
    public unregister_sub(socket_id: string, param_indexs: string[]) {
        ForkedTasksController.getInstance().assert_is_main_process();

        for (let i in param_indexs) {
            let param_index = param_indexs[i];

            if ((!this._sockets_subs[param_index]) || (!this._sockets_subs[param_index][socket_id])) {
                continue;
            }
            delete this._sockets_subs[param_index][socket_id];
        }
    }

    /**
     * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les sockets qui s'intéressent à ces vardatas
     * @param var_datas
     */
    public notify_vardatas(var_datas: VarDataBaseVO[]): boolean {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(VarsSocketsSubsController.TASK_NAME_notify_vardatas, var_datas)) {
            return;
        }

        let datas_by_socketid_for_notif: { [socketid: number]: VarDataValueResVO[] } = {};
        for (let i in var_datas) {
            let var_data = var_datas[i];

            for (let socketid in this._sockets_subs[var_data.index]) {

                if (!datas_by_socketid_for_notif[socketid]) {
                    datas_by_socketid_for_notif[socketid] = [];
                }
                datas_by_socketid_for_notif[socketid].push(new VarDataValueResVO().set_from_vardata(var_data));
            }
        }

        for (let socketid in datas_by_socketid_for_notif) {

            PushDataServerController.getInstance().notifyVarsDatasBySocket(socketid, datas_by_socketid_for_notif[socketid]);
        }
        return true;
    }
}