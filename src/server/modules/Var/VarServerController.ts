import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../shared/modules/Var/VarsController';
import ForkedProcessWrapperBase from '../Fork/ForkedProcessWrapperBase';
import ForkMessageController from '../Fork/ForkMessageController';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import ComputedVarDatasForkMessage from './messages/ComputedVarDatasForkMessage';

export default class VarServerController {

    public static getInstance() {
        if (!VarServerController.instance) {
            VarServerController.instance = new VarServerController();
        }
        return VarServerController.instance;
    }

    private static instance: VarServerController = null;

    public uid_waiting_for_indexes: { [index: string]: { [uid: number]: boolean } } = {};

    private constructor() {
        ForkMessageController.getInstance().register_message_handler(ComputedVarDatasForkMessage.FORK_MESSAGE_TYPE, this.handle_computedvardatas_message.bind(this));
    }

    /**
     * C'est le process parent qui gère ça, donc si on est chez le fils on renvoie au dessus, sinon on s'exécute
     * @param var_datas
     */
    public notify_computedvardatas(var_datas: IVarDataVOBase[]) {
        if (!!ForkedProcessWrapperBase.getInstance()) {
            ForkMessageController.getInstance().send(new ComputedVarDatasForkMessage(var_datas));
            return;
        }
        return this.do_notify_computedvardatas(var_datas);
    }

    private async handle_computedvardatas_message(msg: ComputedVarDatasForkMessage): Promise<boolean> {
        return this.do_notify_computedvardatas(msg.message_content);
    }

    private do_notify_computedvardatas(var_datas: IVarDataVOBase[]): boolean {
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

            ModulePushDataServer.getInstance().notifyVarsDatas(uid, datas_by_uid_for_notif[uid_i]);
        }
        return true;
    }
}