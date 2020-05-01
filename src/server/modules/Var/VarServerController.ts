import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../shared/modules/Var/VarsController';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';

export default class VarServerController {

    public static TASK_NAME_notify_computedvardatas: string = 'VarServerController.notify_computedvardatas';
    public static TASK_NAME_add_uid_waiting_for_indexes: string = 'VarServerController.add_uid_waiting_for_indexes';

    public static getInstance() {
        if (!VarServerController.instance) {
            VarServerController.instance = new VarServerController();
        }
        return VarServerController.instance;
    }

    private static instance: VarServerController = null;

    /**
     * Global application cache - Handled by Main process -----
     *  - Exists only on main process (Express)
     */
    private uid_waiting_for_indexes: { [index: string]: { [uid: number]: boolean } } = {};
    /**
     * Global application cache - Handled by Main process -----
     */

    private constructor() {
        ForkedTasksController.getInstance().register_task(VarServerController.TASK_NAME_notify_computedvardatas, this.notify_computedvardatas.bind(this));
        ForkedTasksController.getInstance().register_task(VarServerController.TASK_NAME_add_uid_waiting_for_indexes, this.add_uid_waiting_for_indexes.bind(this));
    }

    public add_uid_waiting_for_indexes(uid: number, var_index: string) {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(VarServerController.TASK_NAME_add_uid_waiting_for_indexes, uid, var_index)) {
            return;
        }

        if (!this.uid_waiting_for_indexes[var_index]) {
            this.uid_waiting_for_indexes[var_index] = {};
        }
        this.uid_waiting_for_indexes[var_index][uid] = true;
    }

    public notify_computedvardatas(var_datas: IVarDataVOBase[]): boolean {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(VarServerController.TASK_NAME_notify_computedvardatas, var_datas)) {
            return;
        }

        let datas_by_uid_for_notif: { [uid: number]: IVarDataVOBase[] } = {};

        for (let i in var_datas) {
            let var_data: IVarDataVOBase = var_datas[i];
            let var_index: string = VarsController.getInstance().getIndex(var_data);

            if (this.uid_waiting_for_indexes[var_index]) {
                for (let uid_i in this.uid_waiting_for_indexes[var_index]) {

                    let uid = parseInt(uid_i.toString());
                    if (!datas_by_uid_for_notif[uid]) {
                        datas_by_uid_for_notif[uid] = [];
                    }
                    datas_by_uid_for_notif[uid].push(var_data);
                }
                delete this.uid_waiting_for_indexes[var_index];
            }
        }

        for (let uid_i in datas_by_uid_for_notif) {

            let uid = parseInt(uid_i.toString());

            PushDataServerController.getInstance().notifyVarsDatas(uid, datas_by_uid_for_notif[uid_i]);
        }
        return true;
    }
}