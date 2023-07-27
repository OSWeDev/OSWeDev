import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
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

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, VarsServerCallBackSubsController.notify_vardatas.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, VarsServerCallBackSubsController.get_vars_datas.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_var_data, VarsServerCallBackSubsController.get_var_data.bind(this));
    }

    public static async get_vars_datas(params_indexes: string[]): Promise<{ [index: string]: VarDataBaseVO }> {
        let res: { [index: string]: VarDataBaseVO } = {};

        let notifyable_vars: VarDataBaseVO[] = [];

        if ((!params_indexes) || (!params_indexes.length)) {
            return null;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_vars_datas:IN:" + params_indexes.length);
            }

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsServerCallBackSubsController.TASK_NAME_get_vars_datas,
                resolve,
                params_indexes)) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:OUT not main:" + params_indexes.length);
                }
                return null;
            }

            let waiting_nb = params_indexes.length;
            if (ConfigurationService.node_configuration.DEBUG_VARS) {
                ConsoleHandler.log("get_vars_datas:waiting_nb:IN:" + waiting_nb);
            }

            let cb = (data: VarDataBaseVO) => {
                res[data.index] = data;
                waiting_nb--;

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:cb:" + params_indexes.length + ":" + data.index);
                }

                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log("get_vars_datas:waiting_nb:OUT:" + waiting_nb);
                }

                if (waiting_nb <= 0) {
                    resolve(res);
                }
            };

            for (let i in params_indexes) {
                let param_index = params_indexes[i];

                if (!self.cb_subs[param_index]) {
                    self.cb_subs[param_index] = [];
                }
                self.cb_subs[param_index].push(cb);

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:push cb:" + params_indexes.length + ":" + param_index);
                }
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_vars_datas:get_var_datas_or_ask_to_bgthread:IN:" + params_indexes.length);
            }
            notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread(params_indexes);
            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_vars_datas:get_var_datas_or_ask_to_bgthread:OUT:" + params_indexes.length);
            }

            if (notifyable_vars && notifyable_vars.length) {
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:notify_vardatas:IN:" + params_indexes.length);
                }
                await VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_vars_datas:notify_vardatas:OUT:" + params_indexes.length);
                }
            }
        });
    }

    public static async get_var_data<T extends VarDataBaseVO>(param_index: string): Promise<T> {
        let notifyable_vars: T[] = [];

        if (!param_index) {
            return null;
        }

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_var_data:IN:" + param_index);
            }

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsServerCallBackSubsController.TASK_NAME_get_var_data,
                resolve,
                param_index
            )) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_data:OUT not main:" + param_index);
                }
                return null;
            }

            if (!self.cb_subs[param_index]) {
                self.cb_subs[param_index] = [];
            }
            self.cb_subs[param_index].push(resolve as (var_data: VarDataBaseVO) => any);

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:IN:" + param_index);
            }

            notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread([param_index]);

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:OUT:" + param_index);
            }

            if (notifyable_vars && notifyable_vars.length) {
                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_data:notify_vardatas:IN:" + param_index);
                }

                await VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_data:notify_vardatas:OUT:" + param_index);
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

        if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, var_datas)) {
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

            let save_array_cbs = VarsServerCallBackSubsController.cb_subs[var_data.index];
            delete VarsServerCallBackSubsController.cb_subs[var_data.index];

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
}


// import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
// import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
// import ObjectHandler from '../../../shared/tools/ObjectHandler';
// import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
// import { all_promises } from '../../../shared/tools/PromiseTools';
// import ThreadHandler from '../../../shared/tools/ThreadHandler';
// import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
// import ConfigurationService from '../../env/ConfigurationService';
// import ForkedTasksController from '../Fork/ForkedTasksController';
// import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';
// import VarsDatasProxy from './VarsDatasProxy';
// import GetVarDataParam from './vos/GetVarDataParam';

// export default class VarsServerCallBackSubsController {

//     /**
//      * Les callbacks à appeler dès que possible
//      *  ATTENTION les callbacks sont sur le thread des vars obligatoirement !!
//      */
//     public static cb_subs: { [var_index: string]: Array<(var_data: VarDataBaseVO) => any> } = {};

//     public static TASK_NAME_notify_vardatas: string = 'VarsServerCallBackSubsController.notify_vardatas';
//     public static TASK_NAME_get_vars_datas: string = 'VarsServerCallBackSubsController.get_vars_datas';
//     public static TASK_NAME_get_var_data: string = 'VarsServerCallBackSubsController.get_var_data';

//     /**
//      * Multithreading notes :
//      *  - On force tout sur le main thread
//      */
//     public static notify_vardatas = ThrottleHelper.declare_throttle_with_stackable_args(
//         VarsServerCallBackSubsController.notify_vardatas_throttled.bind(this), 10, { leading: true, trailing: true });

//     public static init() {
//         // istanbul ignore next: nothing to test : register_task
//         ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, VarsServerCallBackSubsController.notify_vardatas.bind(this));
//         // istanbul ignore next: nothing to test : register_task
//         ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_vars_datas, VarsServerCallBackSubsController.get_vars_datas.bind(this));
//         // istanbul ignore next: nothing to test : register_task
//         ForkedTasksController.register_task(VarsServerCallBackSubsController.TASK_NAME_get_var_data, VarsServerCallBackSubsController.get_var_data.bind(this));

//         VarsServerCallBackSubsController.unstack_waiting_get_datas();
//     }

//     public static async get_vars_datas(params_indexes: string[]): Promise<{ [index: string]: VarDataBaseVO }> {
//         let res: { [index: string]: VarDataBaseVO } = {};

//         if ((!params_indexes) || (!params_indexes.length)) {
//             return null;
//         }

//         return new Promise(async (resolve, reject) => {

//             let nb_params_indexes = params_indexes.length;
//             for (let i in params_indexes) {
//                 let index = params_indexes[i];

//                 let getvarparam = new GetVarDataParam(index, async (var_data: VarDataBaseVO) => {
//                     res[var_data.index] = var_data;
//                     nb_params_indexes--;

//                     if (nb_params_indexes <= 0) {
//                         resolve(res);
//                     }
//                 });

//                 VarsServerCallBackSubsController.vars_datas_indexes_waiting_for_get_datas.push(getvarparam);
//             }
//         });
//     }

//     // /**
//     //  * On throttle à 1 ms le get_var_data pour empiler les demandes, qui seront traitées directement par le get_vars_datas
//     //  * @param param_index
//     //  * @param reason
//     //  * @returns
//     //  */
//     // public static async get_var_data<T extends VarDataBaseVO>(param_index: string, reason: string): Promise<T> {
//     //     let notifyable_vars: T[] = [];

//     //     if (!param_index) {
//     //         return null;
//     //     }

//     //     let self = this;

//     //     return new Promise(async (resolve, reject) => {

//     //         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//     //             ConsoleHandler.log("get_var_data:IN:" + param_index);
//     //         }

//     //         if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
//     //             reject,
//     //             VarsBGThreadNameHolder.bgthread_name,
//     //             VarsServerCallBackSubsController.TASK_NAME_get_var_data,
//     //             resolve,
//     //             param_index,
//     //             reason
//     //         )) {

//     //             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//     //                 ConsoleHandler.log("get_var_data:OUT not main:" + param_index);
//     //             }
//     //             return null;
//     //         }

//     //         if (!self.cb_subs[param_index]) {
//     //             self.cb_subs[param_index] = [];
//     //         }
//     //         self.cb_subs[param_index].push(resolve as (var_data: VarDataBaseVO) => any);

//     //         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//     //             ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:IN:" + param_index);
//     //         }

//     //         notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread([param_index]);

//     //         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//     //             ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:OUT:" + param_index);
//     //         }

//     //         if (notifyable_vars && notifyable_vars.length) {
//     //             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//     //                 ConsoleHandler.log("get_var_data:notify_vardatas:IN:" + param_index);
//     //             }

//     //             await VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);

//     //             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//     //                 ConsoleHandler.log("get_var_data:notify_vardatas:OUT:" + param_index);
//     //             }
//     //         }
//     //     });
//     // }

//     /**
//      * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les cbs qui s'intéressent à ces vardatas
//      *  A la différence d'un abonnement permanent, on supprime le callback suite à l'appel
//      * @param var_datas Tableau ou map (sur index) des vars datas
//      */
//     public static async notify_vardatas_throttled(var_datas: VarDataBaseVO[]): Promise<boolean> {

//         if (!var_datas || !var_datas.length) {
//             return true;
//         }

//         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//             ConsoleHandler.log("notify_vardatas_throttled:IN:" + var_datas.length);
//         }

//         if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsServerCallBackSubsController.TASK_NAME_notify_vardatas, var_datas)) {
//             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                 ConsoleHandler.log("notify_vardatas_throttled:OUT not main process:" + var_datas.length);
//             }
//             return false;
//         }

//         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//             ConsoleHandler.log("notify_vardatas_throttled:main process:" + var_datas.length);
//         }

//         let promises = [];
//         for (let i in var_datas) {
//             let var_data = var_datas[i];

//             let save_array_cbs = VarsServerCallBackSubsController.cb_subs[var_data.index];
//             delete VarsServerCallBackSubsController.cb_subs[var_data.index];

//             if ((!save_array_cbs) || (!save_array_cbs.length)) {
//                 if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                     ConsoleHandler.log("notify_vardatas_throttled:!save_array_cbs:" + var_datas.length + ":" + var_data.index);
//                 }

//                 continue;
//             }

//             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                 ConsoleHandler.log("notify_vardatas_throttled:save_array_cbs length " + save_array_cbs.length + ":" + var_datas.length + ":" + var_data.index);
//             }

//             for (let j in save_array_cbs) {
//                 let cb = save_array_cbs[j];

//                 promises.push(cb(var_data));
//             }
//         }
//         await all_promises(promises);

//         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//             ConsoleHandler.log("notify_vardatas_throttled:OUT:" + var_datas.length);
//         }

//         return true;
//     }

//     private static vars_datas_indexes_waiting_for_get_datas: GetVarDataParam[] = [];

//     private static async unstack_waiting_get_datas() {

//         let promise_pipeline = new PromisePipeline(500);

//         while (true) {

//             if (!VarsServerCallBackSubsController.vars_datas_indexes_waiting_for_get_datas.length) {
//                 await ThreadHandler.sleep(2, 'unstack_waiting_get_datas');
//             }

//             let vars_datas_indexes_waiting_for_get_datas = VarsServerCallBackSubsController.vars_datas_indexes_waiting_for_get_datas;
//             VarsServerCallBackSubsController.vars_datas_indexes_waiting_for_get_datas = [];

//             for (let i in vars_datas_indexes_waiting_for_get_datas) {
//                 let param = vars_datas_indexes_waiting_for_get_datas[i];

//                 await promise_pipeline.push(async () => {
//                     await param.cb(await VarsServerCallBackSubsController._get_var_data(param_index));
//                 });
//             }
//         }
//     }

//     private static async _get_var_data<T extends VarDataBaseVO>(param_index: string): Promise<T> {
//         let notifyable_vars: T[] = [];

//         if (!param_index) {
//             return null;
//         }

//         let self = this;

//         return new Promise(async (resolve, reject) => {

//             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                 ConsoleHandler.log("get_var_data:IN:" + param_index);
//             }

//             if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
//                 reject,
//                 VarsBGThreadNameHolder.bgthread_name,
//                 VarsServerCallBackSubsController.TASK_NAME_get_var_data,
//                 resolve,
//                 param_index
//             )) {

//                 if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                     ConsoleHandler.log("get_var_data:OUT not main:" + param_index);
//                 }
//                 return null;
//             }

//             if (!self.cb_subs[param_index]) {
//                 self.cb_subs[param_index] = [];
//             }
//             self.cb_subs[param_index].push(resolve as (var_data: VarDataBaseVO) => any);

//             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                 ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:IN:" + param_index);
//             }

//             notifyable_vars = await VarsDatasProxy.get_var_datas_or_ask_to_bgthread([param_index]);

//             if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                 ConsoleHandler.log("get_var_data:get_var_datas_or_ask_to_bgthread:OUT:" + param_index);
//             }

//             if (notifyable_vars && notifyable_vars.length) {
//                 if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                     ConsoleHandler.log("get_var_data:notify_vardatas:IN:" + param_index);
//                 }

//                 await VarsServerCallBackSubsController.notify_vardatas(notifyable_vars);

//                 if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
//                     ConsoleHandler.log("get_var_data:notify_vardatas:OUT:" + param_index);
//                 }
//             }
//         });
//     }
// }