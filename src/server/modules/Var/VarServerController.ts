import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../shared/modules/Var/VarsController';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';

export default class VarServerController {

    public static TASK_NAME_computedvardatas: string = 'VarServerController.computedvardatas';

    public static getInstance() {
        if (!VarServerController.instance) {
            VarServerController.instance = new VarServerController();
        }
        return VarServerController.instance;
    }

    private static instance: VarServerController = null;

    public uid_waiting_for_indexes: { [index: string]: { [uid: number]: boolean } } = {};

    private constructor() {
        ForkedTasksController.getInstance().register_task(VarServerController.TASK_NAME_computedvardatas, this.notify_computedvardatas.bind(this));
    }

    public notify_computedvardatas(var_datas: IVarDataVOBase[]): boolean {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(VarServerController.TASK_NAME_computedvardatas, var_datas)) {
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