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

    // /**
    //  * WARN : Only on main thread (express).
    //  * ATTENTION ne doit être appelé que depuis le thread principal
    //  */
    // public async get_var_data(param: VarDataBaseVO): Promise<VarDataBaseVO> {
    //     ForkedTasksController.getInstance().assert_is_main_process();

    //     if (!param.check_param_is_valid(param._type)) {
    //         ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
    //         return;
    //     }

    //     let notifyable_vars: VarDataBaseVO[]
    //     let needs_computation: VarDataBaseVO[]

    //     let self = this;

    //     return new Promise(async (resolve, reject) => {

    //         let cb = (data: VarDataBaseVO) => {
    //             resolve(data);
    //         };

    //         if (!self._cb_subs[param.index]) {
    //             self._cb_subs[param.index] = [];
    //         }
    //         self._cb_subs[param.index].push(cb);

    //         let in_db_data: VarDataBaseVO = await ModuleVarServer.getInstance().get_var_data_or_ask_to_bgthread(param);
    //         if (in_db_data && VarsServerController.getInstance().has_valid_value(in_db_data)) {
    //             self.notify_vardatas([in_db_data]);
    //             return;
    //         }
    //     });
    // }

    // /**
    //  * WARN : Only on main thread (express).
    //  * ATTENTION ne doit être appelé que depuis le thread principal
    //  */
    // public async wait_var_data(param: VarDataBaseVO): Promise<VarDataBaseVO> {
    //     ForkedTasksController.getInstance().assert_is_main_process();

    //     let self = this;

    //     return new Promise(async (resolve, reject) => {

    //         let cb = (data: VarDataBaseVO) => {
    //             resolve(data);
    //         };

    //         if (!self._cb_subs[param.index]) {
    //             self._cb_subs[param.index] = [];
    //         }
    //         self._cb_subs[param.index].push(cb);

    //         let in_db_data: VarDataBaseVO = await ModuleVarServer.getInstance().get_var_data_or_ask_to_bgthread(param);
    //         if (in_db_data && VarsServerController.getInstance().has_valid_value(in_db_data)) {
    //             self.notify_vardatas([in_db_data]);
    //             return;
    //         }
    //     });
    // }

    /**
     * WARN : Only on main thread (express).
     * ATTENTION ne doit être appelé que depuis le thread principal
     */
    public async get_vars_datas(params: VarDataBaseVO[]): Promise<{ [index: string]: VarDataBaseVO }> {
        ForkedTasksController.getInstance().assert_is_main_process();

        let res: { [index: string]: VarDataBaseVO } = {};

        let notifyable_vars: VarDataBaseVO[] = [];
        let needs_computation: VarDataBaseVO[] = [];

        if ((!params) || (!params.length)) {
            return;
        }

        let self = this;
        let promises = [];

        params.forEach((param) => {

            let cb = null;
            let promise = new Promise(async (resolve, reject) => {

                cb = (data: VarDataBaseVO) => {
                    res[data.index] = data;
                    resolve(data);
                };
            });

            if (!self._cb_subs[param.index]) {
                self._cb_subs[param.index] = [];
            }
            self._cb_subs[param.index].push(cb);

            promises.push(promise);
        });

        await ModuleVarServer.getInstance().get_var_datas_or_ask_to_bgthread(params, notifyable_vars, needs_computation);

        if (notifyable_vars && notifyable_vars.length) {
            this.notify_vardatas(notifyable_vars);
        }

        await Promise.all(promises);

        return res;
    }

    /**
     * WARN : Only on main thread (express).
     * ATTENTION ne doit être appelé que depuis le thread principal
     */
    public async get_var_data(param: VarDataBaseVO): Promise<VarDataBaseVO> {
        ForkedTasksController.getInstance().assert_is_main_process();

        let res: VarDataBaseVO = null;

        let notifyable_vars: VarDataBaseVO[] = [];
        let needs_computation: VarDataBaseVO[] = [];

        if (!param) {
            return;
        }

        let self = this;
        let cb = null;
        let promise = new Promise(async (resolve, reject) => {

            cb = (data: VarDataBaseVO) => {
                res = data;
                resolve(data);
            };
        });

        if (!self._cb_subs[param.index]) {
            self._cb_subs[param.index] = [];
        }
        self._cb_subs[param.index].push(cb);

        await ModuleVarServer.getInstance().get_var_datas_or_ask_to_bgthread([param], notifyable_vars, needs_computation);

        if (notifyable_vars && notifyable_vars.length) {
            this.notify_vardatas(notifyable_vars);
        }

        await promise;

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