import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsDatasProxy from './VarsDatasProxy';

export default class VarsServerCallBackSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsServerCallBackSubsController.notify_vardatas';
    public static TASK_NAME_get_vars_datas: string = 'VarsServerCallBackSubsController.get_vars_datas';
    public static TASK_NAME_get_var_data: string = 'VarsServerCallBackSubsController.get_var_data';
    public static TASK_NAME_get_subs_indexs: string = 'VarsServerCallBackSubsController.get_subs_indexs';

    /**
     * Multithreading notes :
     *  - On force tout sur le main thread
     */
    public static notify_vardatas = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(
        VarsServerCallBackSubsController.notify_vardatas_throttled.bind(this), 10, { leading: true, trailing: true });

    public static init() {
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, VarsServerCallBackSubsController.notify_vardatas.bind(this));
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, VarsServerCallBackSubsController.get_vars_datas.bind(this));
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_var_data, VarsServerCallBackSubsController.get_var_data.bind(this));
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_subs_indexs, VarsServerCallBackSubsController.get_subs_indexs.bind(this));
    }

    public static async get_subs_indexs(): Promise<string[]> {

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_main_process_and_return_value(
                reject, VarsServerCallBackSubsController.TASK_NAME_get_subs_indexs, resolve)) {

                return null;
            }

            resolve(Object.keys(self._cb_subs));
        });
    }

    public static async get_vars_datas(params: VarDataBaseVO[], reason: string): Promise<{ [index: string]: VarDataBaseVO }> {
        let res: { [index: string]: VarDataBaseVO } = {};

        let notifyable_vars: VarDataBaseVO[] = [];

        if ((!params) || (!params.length)) {
            return null;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_vars_datas:IN:" + params.length);
            }

            if (!await ForkedTasksController.exec_self_on_main_process_and_return_value(
                reject, VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, resolve, params, reason)) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:OUT not main:" + params.length);
                }
                return null;
            }

            let waiting_nb = params.length;
            if (ConfigurationService.node_configuration.DEBUG_VARS) {
                ConsoleHandler.log("get_vars_datas:waiting_nb:IN:" + waiting_nb);
            }

            let cb = (data: VarDataBaseVO) => {
                res[data.index] = data;
                waiting_nb--;

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:cb:" + params.length + ":" + data.index);
                }

                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log("get_vars_datas:waiting_nb:OUT:" + waiting_nb);
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

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:push cb:" + params.length + ":" + param.index);
                }
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_vars_datas:get_var_datas_or_ask_to_bgthread:IN:" + params.length);
            }
            notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread(params);
            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_vars_datas:get_var_datas_or_ask_to_bgthread:OUT:" + params.length);
            }

            if (notifyable_vars && notifyable_vars.length) {
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:notify_vardatas:IN:" + params.length);
                }
                await VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:notify_vardatas:OUT:" + params.length);
                }
            }
        });
    }

    public static async get_var_data<T extends VarDataBaseVO>(param: T, reason: string): Promise<T> {
        let notifyable_vars: T[] = [];

        if (!param) {
            return null;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_var_data:IN:" + param.index);
            }

            if (!await ForkedTasksController.exec_self_on_main_process_and_return_value(
                reject,
                VarsServerCallBackSubsController.TASK_NAME_get_var_data,
                resolve,
                param,
                reason
            )) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_data:OUT not main:" + param.index);
                }
                return null;
            }

            if (!self._cb_subs[param.index]) {
                self._cb_subs[param.index] = [];
            }
            self._cb_subs[param.index].push(resolve as (var_data: VarDataBaseVO) => any);

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:IN:" + param.index);
            }

            notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread([param]);

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:OUT:" + param.index);
            }

            if (notifyable_vars && notifyable_vars.length) {
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_data:notify_vardatas:IN:" + param.index);
                }

                await VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_data:notify_vardatas:OUT:" + param.index);
                }
            }
        });
    }



    /**
     * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les cbs qui s'intéressent à ces vardatas
     *  A la différence d'un abonnement permanent, on supprime le callback suite à l'appel
     * @param var_datas Tableau ou map (sur index) des vars datas
     */
    public static async notify_vardatas_throttled(var_datas: VarDataBaseVO[]): Promise<boolean> {

        if (!var_datas || !var_datas.length) {
            return true;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("notify_vardatas_throttled:IN:" + var_datas.length);
        }

        if (!await ForkedTasksController.exec_self_on_main_process(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, var_datas)) {
            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("notify_vardatas_throttled:OUT not main process:" + var_datas.length);
            }
            return false;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("notify_vardatas_throttled:main process:" + var_datas.length);
        }

        let promises = [];
        for (let i in var_datas) {
            let var_data = var_datas[i];

            let save_array_cbs = VarsServerCallBackSubsController._cb_subs[var_data.index];
            delete VarsServerCallBackSubsController._cb_subs[var_data.index];

            if ((!save_array_cbs) || (!save_array_cbs.length)) {
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("notify_vardatas_throttled:!save_array_cbs:" + var_datas.length + ":" + var_data.index);
                }

                continue;
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("notify_vardatas_throttled:save_array_cbs length " + save_array_cbs.length + ":" + var_datas.length + ":" + var_data.index);
            }

            for (let j in save_array_cbs) {
                let cb = save_array_cbs[j];

                promises.push(cb(var_data));
            }
        }
        await all_promises(promises);

        if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("notify_vardatas_throttled:OUT:" + var_datas.length);
        }

        return true;
    }

    /**
     * Les callbacks à appeler dès que possible
     *  ATTENTION les callbacks sont sur le main thread obligatoirement !!
     */
    private static _cb_subs: { [var_index: string]: Array<(var_data: VarDataBaseVO) => any> } = {};
}