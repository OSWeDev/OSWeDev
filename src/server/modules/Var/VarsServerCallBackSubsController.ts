import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleVarServer from './ModuleVarServer';

export default class VarsServerCallBackSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsServerCallBackSubsController.notify_vardatas';

    /**
     * Multithreading notes :
     *  - On force tout sur le main thread
     */
    public static getInstance(): VarsServerCallBackSubsController {
        if (!VarsServerCallBackSubsController.instance) {
            VarsServerCallBackSubsController.instance = new VarsServerCallBackSubsController();
        }
        return VarsServerCallBackSubsController.instance;
    }

    private static instance: VarsServerCallBackSubsController = null;

    /**
     * Les callbacks à appeler dès que possible
     *  ATTENTION les callbacks sont sur le main thread obligatoirement !!
     */
    private _cb_subs: { [var_index: string]: Array<(var_data: VarDataBaseVO) => any> } = {};

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, this.notify_vardatas.bind(this));
    }

    /**
     * WARN : Only on main thread (express).
     * ATTENTION ne doit être appelé que depuis le thread principal
     */
    public async get_var_data(param: VarDataBaseVO): Promise<VarDataBaseVO> {
        ForkedTasksController.getInstance().assert_is_main_process();

        return new Promise(async (resolve, reject) => {

            let cb = (data: VarDataBaseVO) => {
                resolve(data);
            };

            if (!this._cb_subs[param.index]) {
                this._cb_subs[param.index] = [];
            }
            this._cb_subs[param.index].push(cb);

            let in_db_data: VarDataBaseVO = await ModuleVarServer.getInstance().get_var_data_or_ask_to_bgthread(param);
            if (in_db_data && in_db_data.has_valid_value) {
                this.notify_vardatas([in_db_data]);
                return;
            }
        });
    }

    /**
     * WARN : Only on main thread (express).
     * ATTENTION ne doit être appelé que depuis le thread principal
     */
    public async get_vars_datas(params: VarDataBaseVO[]): Promise<{ [index: string]: VarDataBaseVO }> {
        ForkedTasksController.getInstance().assert_is_main_process();

        let res: { [index: string]: VarDataBaseVO } = {};
        let promises = [];

        for (let i in params) {
            let param = params[i];

            promises.push((async () => res[param.index] = await this.get_var_data(param))());
        }

        await Promise.all(promises);
        return res;
    }


    /**
     * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les cbs qui s'intéressent à ces vardatas
     *  A la différence d'un abonnement permanent, on supprime le callback suite à l'appel
     * @param var_datas Tableau ou map (sur index) des vars datas
     */
    public notify_vardatas(var_datas: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }): boolean {

        if (!ForkedTasksController.getInstance().exec_self_on_main_process(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, var_datas)) {
            return;
        }

        for (let i in var_datas) {
            let var_data = var_datas[i];

            if (!this._cb_subs[var_data.index]) {
                continue;
            }

            for (let j in this._cb_subs[var_data.index]) {
                let cb = this._cb_subs[var_data.index][j];

                cb(var_data);
            }

            delete this._cb_subs[var_data.index];
        }
        return true;
    }
}