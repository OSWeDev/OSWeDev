import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ThrottlePipelineHelper from '../../../shared/tools/ThrottlePipeline/ThrottlePipelineHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';
import VarsDatasProxy from './VarsDatasProxy';

export default class VarsServerCallBackSubsController {

    /**
     * Les callbacks à appeler dès que possible
     *  ATTENTION les callbacks sont sur le thread des vars obligatoirement !!
     */
    public static cb_subs: { [var_index: string]: Array<(var_data: VarDataBaseVO) => any> } = {};

    public static TASK_NAME_notify_vardatas: string = 'VarsServerCallBackSubsController.notify_vardatas';
    public static TASK_NAME_get_vars_datas: string = 'VarsServerCallBackSubsController.get_vars_datas';
    public static TASK_NAME_get_var_data: string = 'VarsServerCallBackSubsController.get_var_data';

    /**
     * Multithreading notes :
     *  - On force tout sur le main thread
     */
    public static notify_vardatas = ThrottleHelper.declare_throttle_with_stackable_args(
        VarsServerCallBackSubsController.notify_vardatas_throttled.bind(this), 10, { leading: true, trailing: true });

    public static get_var_data_indexed: <T extends VarDataBaseVO>(throttle_index: string, param_index: string) => Promise<T> = ThrottlePipelineHelper.declare_throttled_pipeline(
        'VarsServerCallBackSubsController.get_var_data_indexed',
        this._get_vars_datas.bind(this), 10, 500, 20
    );

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, VarsServerCallBackSubsController.notify_vardatas.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, VarsServerCallBackSubsController.get_vars_datas.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_var_data, VarsServerCallBackSubsController.get_var_data.bind(this));
    }

    public static async get_var_data<T extends VarDataBaseVO>(param_index: string): Promise<T> {

        try {

            const var_data = await this.get_var_data_indexed<T>(param_index, param_index);

            if (var_data) {
                return var_data;
            }
        } catch (error) {

            // Dans le cas d'un timeout, on retente automatiquement
            let msg = error.message ? error.message : error;
            msg = msg.toLowerCase();
            if ((msg.indexOf('timeout') > -1) || (msg.indexOf('timedout') > -1)) {
                let retries = 3;
                ConsoleHandler.warn('VarsServerCallBackSubsController.get_var_data: timeout for index: ' + param_index + ' error: ' + error + ' retries: ' + retries);

                while (retries) {
                    retries--;

                    try {
                        const var_data = await this.get_var_data_indexed<T>(param_index, param_index);

                        if (var_data) {
                            return var_data;
                        }
                    } catch (error) {
                        ConsoleHandler.warn('VarsServerCallBackSubsController.get_var_data: timeout for index: ' + param_index + ' error: ' + error + ' retries: ' + retries);
                    }
                }

                ConsoleHandler.error('VarsServerCallBackSubsController.get_var_data: timeout for index: ' + param_index + ' error: ' + error + ' no more retries');
            } else {
                ConsoleHandler.error('VarsServerCallBackSubsController.get_var_data: error for index: ' + param_index + ' error: ' + error);
            }
        }
    }

    public static async get_vars_datas<T extends VarDataBaseVO>(params_indexes: string[]): Promise<{ [index: string]: T }> {
        const res: { [index: string]: T } = {};

        const promises = [];
        for (const i in params_indexes) {
            const params_index = params_indexes[i];

            promises.push((async () => {
                const var_data = await this.get_var_data(params_index) as T;

                if (var_data) {
                    res[var_data.index] = var_data;
                }
            })());
        }

        await all_promises(promises);

        return res;
    }

    /**
     * Sera exécutée dans tous les cas sur le VarsBGThread. Objectif : notifier tous les cbs qui s'intéressent à ces vardatas
     *  A la différence d'un abonnement permanent, on supprime le callback suite à l'appel
     * @param var_datas Tableau ou map (sur index) des vars datas
     */
    public static async notify_vardatas_throttled(var_datas: VarDataBaseVO[]): Promise<boolean> {

        if (!var_datas || !var_datas.length) {
            return true;
        }

        if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
            ConsoleHandler.log("notify_vardatas_throttled:IN:" + var_datas.length);
        }

        if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, var_datas)) {
            if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                ConsoleHandler.log("notify_vardatas_throttled:OUT not VarsBGThread process:" + var_datas.length);
            }
            return false;
        }

        if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
            ConsoleHandler.log("notify_vardatas_throttled:VarsBGThread process:" + var_datas.length);
        }

        const promises = [];
        for (const i in var_datas) {
            const var_data = var_datas[i];

            const save_array_cbs = VarsServerCallBackSubsController.cb_subs[var_data.index];
            delete VarsServerCallBackSubsController.cb_subs[var_data.index];

            if ((!save_array_cbs) || (!save_array_cbs.length)) {
                if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                    ConsoleHandler.log("notify_vardatas_throttled:!save_array_cbs:" + var_datas.length + ":" + var_data.index);
                }

                continue;
            }

            if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                ConsoleHandler.log("notify_vardatas_throttled:save_array_cbs length " + save_array_cbs.length + ":" + var_datas.length + ":" + var_data.index);
            }

            for (const j in save_array_cbs) {
                const cb = save_array_cbs[j];

                promises.push(cb(var_data));
            }
        }
        await all_promises(promises);

        if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
            ConsoleHandler.log("notify_vardatas_throttled:OUT:" + var_datas.length);
        }

        return true;
    }



    private static async _get_vars_datas(params_indexes: { [index: string]: string }): Promise<{ [index: string]: VarDataBaseVO }> {
        const res: { [index: string]: VarDataBaseVO } = {};

        let notifyable_vars: VarDataBaseVO[] = [];
        const params_list = params_indexes ? Object.keys(params_indexes) : null;
        const nb_params = params_list ? params_list.length : 0;
        if (!nb_params) {
            return null;
        }

        const self = this;

        return new Promise(async (resolve, reject) => {

            if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                ConsoleHandler.log("get_vars_datas:IN:" + nb_params);
            }

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                false,
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsServerCallBackSubsController.TASK_NAME_get_vars_datas,
                resolve,
                params_indexes)) {

                if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                    ConsoleHandler.log("get_vars_datas:OUT not main:" + nb_params);
                }
                return null;
            }

            let waiting_nb = nb_params;
            if (ConfigurationService.node_configuration.debug_vars) {
                ConsoleHandler.log("get_vars_datas:waiting_nb:IN:" + waiting_nb);
            }

            const cb = (data: VarDataBaseVO) => {
                res[data.index] = data;
                waiting_nb--;

                if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                    ConsoleHandler.log("get_vars_datas:cb:" + nb_params + ":" + data.index);
                }

                if (ConfigurationService.node_configuration.debug_vars) {
                    ConsoleHandler.log("get_vars_datas:waiting_nb:OUT:" + waiting_nb);
                }

                if (waiting_nb <= 0) {
                    resolve(res);
                }
            };

            for (const i in params_indexes) {
                const param_index = params_indexes[i];

                if (!self.cb_subs[param_index]) {
                    self.cb_subs[param_index] = [];
                }
                self.cb_subs[param_index].push(cb);

                if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                    ConsoleHandler.log("get_vars_datas:push cb:" + nb_params + ":" + param_index);
                }
            }

            if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                ConsoleHandler.log("get_vars_datas:get_var_datas_or_ask_to_bgthread:IN:" + nb_params);
            }
            notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread(params_list);
            if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                ConsoleHandler.log("get_vars_datas:get_var_datas_or_ask_to_bgthread:OUT:" + nb_params);
            }

            if (notifyable_vars && notifyable_vars.length) {
                if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                    ConsoleHandler.log("get_vars_datas:notify_vardatas:IN:" + nb_params);
                }
                VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);
                if (ConfigurationService.node_configuration.debug_vars_server_subs_cbs) {
                    ConsoleHandler.log("get_vars_datas:notify_vardatas:OUT:" + nb_params);
                }
            }
        });
    }
}