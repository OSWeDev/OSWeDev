import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../shared/tools/ThrottleHelper';
import ConfigurationService from '../../env/ConfigurationService';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PushDataServerController from '../PushData/PushDataServerController';
import SocketWrapper from '../PushData/vos/SocketWrapper';
import VarsClientsSubsCacheManager from './bgthreads/processes/VarsClientsSubsCacheManager';
import NotifVardatasParam from './notifs/NotifVardatasParam';

export default class VarsTabsSubsController {

    public static TASK_NAME_notify_vardatas: string = 'VarsTabsSubsController.notify_vardatas';
    public static TASK_NAME_get_subs_indexs: string = 'VarsTabsSubsController.get_subs_indexs';


    public static PARAM_NAME_SUBS_CLEAN_THROTTLE: string = 'VarsTabsSubsController.SUBS_CLEAN_THROTTLE';
    public static PARAM_NAME_SUBS_CLEAN_DELAY: string = 'VarsTabsSubsController.SUBS_CLEAN_DELAY';

    /**
     * Multithreading notes :
     *  - any data or action in this controller needs to be done on the main thread
     */
    public static notify_vardatas = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(
        this.notify_vardatas_throttled.bind(this), 100, { leading: true, trailing: true });

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsTabsSubsController.TASK_NAME_notify_vardatas, this.notify_vardatas.bind(this));
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsTabsSubsController.TASK_NAME_get_subs_indexs, this.get_subs_indexs.bind(this));
    }

    public static async get_subs_indexs(): Promise<string[]> {

        let self = this;

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_main_process_and_return_value(
                reject, VarsTabsSubsController.TASK_NAME_get_subs_indexs, resolve)) {
                return;
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS) {
                ConsoleHandler.log('get_subs_index:IN:clean_old_subs:IN');
            }

            await self.clean_old_subs();

            if (ConfigurationService.node_configuration.DEBUG_VARS) {
                ConsoleHandler.log('get_subs_index:IN:clean_old_subs:OUT');
            }

            resolve(Object.keys(self._tabs_subs));
        });
    }

    /**
     * WARN : Only on main thread (express).
     */
    public static register_sub(user_id: number, client_tab_id: string, param_indexs: string[]) {
        ForkedTasksController.assert_is_main_process();

        user_id = ((user_id == null) ? 0 : user_id);

        for (let i in param_indexs) {
            let param_index = param_indexs[i];

            if (!param_index) {
                continue;
            }

            if (!this._tabs_subs[param_index]) {
                this._tabs_subs[param_index] = {};

                // On ajoute un nouvel index, on prévient le thread des vars immédiatement
                VarsClientsSubsCacheManager.add_new_sub(param_index);
            }

            if (!this._tabs_subs[param_index][user_id]) {
                this._tabs_subs[param_index][user_id] = {};
            }
            // ConsoleHandler.log('REMOVETHIS:register_sub:' + param_index + ':user_id:' + user_id + ':client_tab_id:' + client_tab_id + ':');

            if (!this._tabs_subs[param_index][user_id][client_tab_id]) {
                this._tabs_subs[param_index][user_id][client_tab_id] = {
                    last_notif_value_ts: null,
                    last_registration_ts: Dates.now()
                };
            }

            this._tabs_subs[param_index][user_id][client_tab_id].last_registration_ts = Dates.now();
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsTabsSubsController:post register_sub:nb_subs:' + Object.keys(this._tabs_subs).length + ':');
        }
    }

    /**
     * WARN : Only on main thread (express).
     */
    public static unregister_sub(user_id: number, client_tab_id: string, param_indexs: string[]) {
        ForkedTasksController.assert_is_main_process();

        user_id = ((user_id == null) ? 0 : user_id);

        for (let i in param_indexs) {
            let param_index = param_indexs[i];

            if ((!param_index) || (!this._tabs_subs[param_index]) || (!this._tabs_subs[param_index][user_id]) || (!this._tabs_subs[param_index][user_id][client_tab_id])) {
                continue;
            }
            // ConsoleHandler.log('REMOVETHIS:unregister_sub:' + param_index + ':user_id:' + user_id + ':client_tab_id:' + client_tab_id + ':');
            delete this._tabs_subs[param_index][user_id][client_tab_id];
        }

        let param_index_to_delete: string[] = [];
        for (let param_index in this._tabs_subs) {
            let _tabs_subs_index = this._tabs_subs[param_index];

            if ((!_tabs_subs_index) || (!Object.keys(_tabs_subs_index).length)) {
                param_index_to_delete.push(param_index);
                continue;
            }

            let user_id_to_delete: string[] = [];
            for (let _user_id in _tabs_subs_index) {
                let _tabs_subs_index_user_id = _tabs_subs_index[_user_id];

                if ((!_tabs_subs_index_user_id) || (!Object.keys(_tabs_subs_index_user_id).length)) {
                    user_id_to_delete.push(_user_id);
                    continue;
                }
            }

            for (let i in user_id_to_delete) {
                delete _tabs_subs_index[user_id_to_delete[i]];
            }

            if ((!_tabs_subs_index) || (!Object.keys(_tabs_subs_index).length)) {
                param_index_to_delete.push(param_index);
            }
        }
        for (let i in param_index_to_delete) {
            let param_index = param_index_to_delete[i];
            delete this._tabs_subs[param_index];

            // On supprime un nouvel index, on prévient le thread des vars immédiatement
            VarsClientsSubsCacheManager.remove_sub(param_index);
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsTabsSubsController:post unregister_sub:nb_subs:' + Object.keys(this._tabs_subs).length + ':');
        }
    }

    /**
     * Sera exécutée dans tous les cas sur le main thread (express). Objectif : notifier tous les sockets qui s'intéressent à ces vardatas
     * @param var_datas Tableau ou map (sur index) des vars datas
     * @param is_computing true indique au client de ne pas prendre en compte les valeurs envoyées uniquement le fait q'un calcul est en cours
     */
    public static async notify_vardatas_throttled(params: NotifVardatasParam[]): Promise<boolean> {

        if (!await ForkedTasksController.exec_self_on_main_process(VarsTabsSubsController.TASK_NAME_notify_vardatas, params)) {
            return false;
        }

        await this.clean_old_subs();

        let datas_by_socketid_for_notif: { [socketid: number]: VarDataValueResVO[] } = {};
        for (let parami in params) {
            let param = params[parami];

            for (let i in param.var_datas) {
                let var_data = param.var_datas[i];
                let users_tabs_subs = this._tabs_subs[var_data.index];
                // ConsoleHandler.log('REMOVETHIS:notify_vardatas.1:' + var_data.index + ':');

                for (let user_id in users_tabs_subs) {
                    let tabs_subs = users_tabs_subs[user_id];

                    /**
                     * On doit demander tous les sockets actifs pour une tab
                     */
                    for (let client_tab_id in tabs_subs) {
                        let sub = tabs_subs[client_tab_id];

                        if (!sub) {
                            continue;
                        }

                        // On envoie l'info que si elle est plus récente que la dernière notif pour ce client
                        if (sub.last_notif_value_ts >= var_data.value_ts) {
                            continue;
                        }

                        sub.last_notif_value_ts = var_data.value_ts;

                        let sockets: SocketWrapper[] = PushDataServerController.getInstance().getUserSockets(parseInt(user_id.toString()), client_tab_id);

                        for (let j in sockets) {
                            let socket: SocketWrapper = sockets[j];

                            if (!datas_by_socketid_for_notif[socket.socketId]) {
                                datas_by_socketid_for_notif[socket.socketId] = [];
                            }
                            datas_by_socketid_for_notif[socket.socketId].push(new VarDataValueResVO().set_from_vardata(var_data).set_is_computing(param.is_computing));
                        }
                    }
                }
            }
        }

        for (let socketid in datas_by_socketid_for_notif) {

            // datas_by_socketid_for_notif[socketid].forEach((vd) => ConsoleHandler.log('REMOVETHIS:notify_vardatas.2:' + vd.index + ':'));
            await PushDataServerController.getInstance().notifyVarsDatasBySocket(socketid, datas_by_socketid_for_notif[socketid]);
        }
        return true;
    }

    /**
     * Les client_tab_ids abonnés à chaque var_index
     * On stocke la date de la dernière demande pour pouvoir faire un nettoyage
     */
    private static _tabs_subs: { [var_index: string]: { [user_id: number]: { [client_tab_id: string]: { last_notif_value_ts: number, last_registration_ts: number } } } } = {};

    private static last_subs_clean: number = 0;

    // /**
    //  * Méthode qui permet de filtrer un tableau de vars et de récupérer les vars actuellement subscribed par des utilisateurs.
    //  *  On peut ainsi prioriser une mise en cache avec les variables actuellement consultées
    //  */
    // public static async filter_by_subs(var_datas_indexes: string[]): Promise<string[]> {

    //     let res: string[] = [];

    //     if ((!var_datas_indexes) || (!var_datas_indexes.length)) {
    //         return null;
    //     }

    //     let self = this;

    //     return new Promise(async (resolve, reject) => {

    //         if (!await ForkedTasksController.exec_self_on_main_process_and_return_value(
    //             reject, VarsTabsSubsController.TASK_NAME_filter_by_subs, resolve, var_datas_indexes)) {
    //             return;
    //         }

    //         if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //             ConsoleHandler.log('filter_by_subs:IN:' + var_datas_indexes.length + ':clean_old_subs:IN');
    //         }

    //         await self.clean_old_subs();

    //         if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //             ConsoleHandler.log('filter_by_subs:IN:' + var_datas_indexes.length + ':clean_old_subs:OUT');
    //         }

    //         for (let i in var_datas_indexes) {
    //             let var_datas_index = var_datas_indexes[i];

    //             if (self.has_registered_user(var_datas_index)) {
    //                 res.push(var_datas_index);
    //             }
    //         }

    //         if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //             ConsoleHandler.log('filter_by_subs:IN:' + var_datas_indexes.length + ':for has_registered_user:OUT:resolve:' + res.length + ':');
    //         }

    //         resolve(res);
    //     });
    // }

    // private static has_registered_user(index: string): boolean {

    //     if (!this._tabs_subs[index]) {
    //         return false;
    //     }

    //     for (let i in this._tabs_subs[index]) {
    //         let subs = this._tabs_subs[index][i];

    //         for (let j in subs) {

    //             if (subs[j]) {
    //                 return true;
    //             }
    //         }
    //     }
    //     return false;
    // }

    /**
     * On nettoie les subs qui sont trop anciens, mais on ne fait le checke qu'une fois toutes les X minutes max
     */
    private static async clean_old_subs() {

        let now = Dates.now();
        let SUBS_CLEAN_DELAY = await ModuleParams.getInstance().getParamValueAsInt(VarsTabsSubsController.PARAM_NAME_SUBS_CLEAN_DELAY, 600, 180000);
        let SUBS_CLEAN_THROTTLE = await ModuleParams.getInstance().getParamValueAsInt(VarsTabsSubsController.PARAM_NAME_SUBS_CLEAN_THROTTLE, 1800, 180000);

        if ((now - this.last_subs_clean) < SUBS_CLEAN_THROTTLE) {
            return;
        }
        this.last_subs_clean = now;

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsTabsSubsController:clean_old_subs:IN:nb_subs:' + Object.keys(this._tabs_subs).length + ':');
        }

        let indexs_to_delete = [];
        for (let index in this._tabs_subs) {
            let subs = this._tabs_subs[index];

            if (!Object.keys(subs).length) {
                indexs_to_delete.push(index);
                continue;
            }

            let user_ids_to_delete = [];
            for (let user_id in subs) {
                let subs_by_user = subs[user_id];

                if (!Object.keys(subs_by_user).length) {
                    user_ids_to_delete.push(user_id);
                    continue;
                }

                let client_tab_ids_to_delete = [];
                for (let client_tab_id in subs_by_user) {
                    let sub = subs_by_user[client_tab_id];

                    if ((now - sub.last_registration_ts) > SUBS_CLEAN_DELAY) {
                        client_tab_ids_to_delete.push(client_tab_id);
                    }
                }
                for (let i in client_tab_ids_to_delete) {
                    delete subs_by_user[client_tab_ids_to_delete[i]];
                }

                if (!Object.keys(subs_by_user).length) {
                    user_ids_to_delete.push(user_id);
                }
            }

            for (let i in user_ids_to_delete) {
                delete subs[user_ids_to_delete[i]];
            }

            if (!Object.keys(subs).length) {
                indexs_to_delete.push(index);
                continue;
            }
        }

        for (let i in indexs_to_delete) {
            delete this._tabs_subs[indexs_to_delete[i]];
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsTabsSubsController:clean_old_subs:OUT:nb_subs:' + Object.keys(this._tabs_subs).length + ':');
        }
    }
}