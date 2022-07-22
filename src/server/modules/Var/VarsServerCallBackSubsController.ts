import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsDatasProxy from './VarsDatasProxy';

export default class VarsServerCallBackSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsServerCallBackSubsController.notify_vardatas';
    public static TASK_NAME_get_vars_datas: string = 'VarsServerCallBackSubsController.get_vars_datas';
    public static TASK_NAME_get_var_data: string = 'VarsServerCallBackSubsController.get_var_data';

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

    public notify_vardatas = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(
        this.notify_vardatas_throttled.bind(this), 20, { leading: true, trailing: true });

    /**
     * Les callbacks à appeler dès que possible
     *  ATTENTION les callbacks sont sur le main thread obligatoirement !!
     */
    private _cb_subs: { [var_index: string]: Array<(var_data: VarDataBaseVO) => any> } = {};

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, this.notify_vardatas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, this.get_vars_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsServerCallBackSubsController.TASK_NAME_get_var_data, this.get_var_data.bind(this));
    }

    public async get_vars_datas(params: VarDataBaseVO[]): Promise<{ [index: string]: VarDataBaseVO }> {
        let res: { [index: string]: VarDataBaseVO } = {};

        let notifyable_vars: VarDataBaseVO[] = [];
        let needs_computation: VarDataBaseVO[] = [];

        if ((!params) || (!params.length)) {
            return null;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_main_process_and_return_value(
                reject, VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, resolve, params)) {
                return;
            }

            let waiting_nb = params.length;
            if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
                ConsoleHandler.getInstance().log("get_vars_datas:waiting_nb:IN:" + waiting_nb);
            }

            let cb = (data: VarDataBaseVO) => {
                res[data.index] = data;
                waiting_nb--;

                if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
                    ConsoleHandler.getInstance().log("get_vars_datas:waiting_nb:OUT:" + waiting_nb);
                }

                if (waiting_nb <= 0) {
                    resolve(res);
                }
            };

            for (let i in params) {
                let param = params[i];

                if (!self._cb_subs[param.index]) {
                    self._cb_subs[param.index] = [];
                }
                self._cb_subs[param.index].push(cb);
            }

            await VarsDatasProxy.getInstance().get_var_datas_or_ask_to_bgthread(params, notifyable_vars, needs_computation);

            if (notifyable_vars && notifyable_vars.length) {
                await this.notify_vardatas(notifyable_vars);
            }
        });
    }

    public async get_var_data<T extends VarDataBaseVO>(param: T): Promise<T> {
        let notifyable_vars: T[] = [];
        let needs_computation: T[] = [];

        if (!param) {
            return;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_main_process_and_return_value(
                reject, VarsServerCallBackSubsController.TASK_NAME_get_var_data, resolve, param)) {
                return;
            }

            if (!self._cb_subs[param.index]) {
                self._cb_subs[param.index] = [];
            }
            self._cb_subs[param.index].push(resolve as (var_data: VarDataBaseVO) => any);

            await VarsDatasProxy.getInstance().get_var_datas_or_ask_to_bgthread([param], notifyable_vars, needs_computation);

            if (notifyable_vars && notifyable_vars.length) {
                await this.notify_vardatas(notifyable_vars);
            }
        });
    }



    /**
     * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les cbs qui s'intéressent à ces vardatas
     *  A la différence d'un abonnement permanent, on supprime le callback suite à l'appel
     * @param var_datas Tableau ou map (sur index) des vars datas
     */
    public async notify_vardatas_throttled(var_datas: VarDataBaseVO[]): Promise<boolean> {

        if (!await ForkedTasksController.getInstance().exec_self_on_main_process(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, var_datas)) {
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