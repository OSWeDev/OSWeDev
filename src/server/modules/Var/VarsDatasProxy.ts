

import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarsCacheController from '../Var/VarsCacheController';
import SlowVarVO from '../../../shared/modules/Var/vos/SlowVarVO';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import DAOQueryCacheController from '../DAO/DAOQueryCacheController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import SlowVarKiHandler from './SlowVarKi/SlowVarKiHandler';
import VarsComputeController from './VarsComputeController';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerController from './VarsServerController';

/**
 * L'objectif est de créer un proxy d'accès aux données des vars_datas en base pour qu'on puisse intercaler un buffer de mise à jour progressif en BDD
 *  De cette manière, on peut ne pas attendre de mettre à ajour en bdd avant de refaire un batch de calcul et pour autant profiter de ces valeurs calculées et pas en base
 *  On cherchera alors à dépiler ce buffer dès qu'on a moins de calculs en cours et donc moins besoin de ressources pour les calculs
 */
export default class VarsDatasProxy {

    public static TASK_NAME_prepend_var_datas = 'VarsDatasProxy.prepend_var_datas';
    public static TASK_NAME_append_var_datas = 'VarsDatasProxy.append_var_datas';
    public static TASK_NAME_update_existing_buffered_older_datas = 'VarsDatasProxy.update_existing_buffered_older_datas';
    public static TASK_NAME_has_cached_vars_waiting_for_compute = 'VarsDatasProxy.has_cached_vars_waiting_for_compute';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsDatasProxy {
        if (!VarsDatasProxy.instance) {
            VarsDatasProxy.instance = new VarsDatasProxy();
        }
        return VarsDatasProxy.instance;
    }

    private static instance: VarsDatasProxy = null;

    public denied_slowvars: { [index: string]: SlowVarVO } = {};

    /**
     * Version liste pour prioriser les demandes
     */
    public vars_datas_buffer: Array<VarDataProxyWrapperVO<VarDataBaseVO>> = [];
    public vars_datas_buffer_wrapped_indexes: { [index: string]: VarDataProxyWrapperVO<VarDataBaseVO> } = {};

    /**
     * Au boot on teste de dépiler des vars qui seraient en attente de test, sinon on suit le chemin classique
     */
    private can_load_vars_to_test: boolean = true;


    private semaphore_handle_buffer: boolean = false;

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_prepend_var_datas, this.prepend_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_append_var_datas, this.append_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, this.update_existing_buffered_older_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_has_cached_vars_waiting_for_compute, this.has_cached_vars_waiting_for_compute.bind(this));
    }

    public has_cached_vars_waiting_for_compute(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                reject,
                VarsdatasComputerBGThread.getInstance().name,
                VarsDatasProxy.TASK_NAME_has_cached_vars_waiting_for_compute,
                resolve)) {
                return;
            }

            for (let i in this.vars_datas_buffer) {
                let var_data_wrapper = this.vars_datas_buffer[i];

                if (!VarsServerController.getInstance().has_valid_value(var_data_wrapper.var_data)) {
                    resolve(true);
                    return;
                }
            }
            resolve(false);
        });
    }

    public has_cached_index(index: string) {

        if (!BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
            return false;
        }

        return !!this.vars_datas_buffer_wrapped_indexes[index];
    }

    public async get_var_datas_or_ask_to_bgthread(params: VarDataBaseVO[], notifyable_vars: VarDataBaseVO[], needs_computation: VarDataBaseVO[]): Promise<void> {
        let env = ConfigurationService.getInstance().getNodeConfiguration();

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_var_datas_or_ask_to_bgthread],
            async () => {

                let varsdata: VarDataBaseVO[] = await VarsDatasProxy.getInstance().get_exact_params_from_buffer_or_bdd(params);

                if (varsdata) {

                    varsdata.forEach((vardata) => {
                        if (VarsServerController.getInstance().has_valid_value(vardata)) {

                            if (env.DEBUG_VARS) {
                                ConsoleHandler.getInstance().log(
                                    'get_var_datas_or_ask_to_bgthread:notifyable_var:index|' + vardata._bdd_only_index + ":value|" + vardata.value + ":value_ts|" + vardata.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[vardata.value_type]
                                );
                            }

                            notifyable_vars.push(vardata);
                        } else {

                            if (env.DEBUG_VARS) {
                                ConsoleHandler.getInstance().log(
                                    'get_var_datas_or_ask_to_bgthread:unnotifyable_var:index|' + vardata._bdd_only_index + ":value|" + vardata.value + ":value_ts|" + vardata.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[vardata.value_type]
                                );
                            }
                        }
                    });

                    // On insère quand même dans le cache par ce qu'on veut stocker l'info du read
                    await VarsDatasProxy.getInstance().prepend_var_datas(varsdata, true);
                }

                if ((!varsdata) || (varsdata.length != params.length)) {

                    /**
                     * On doit chercher les datas manquantes, et les prepend sur le proxy
                     */
                    let vars_datas_by_index: { [index: string]: VarDataBaseVO } = {};
                    if (varsdata) {
                        varsdata.forEach((vardata) => {
                            vars_datas_by_index[vardata.index] = vardata;
                        });
                    }

                    let to_prepend: VarDataBaseVO[] = [];
                    for (let i in params) {
                        let param = params[i];

                        let vardata = vars_datas_by_index[param.index];
                        if (vardata) {
                            continue;
                        }

                        // On a rien en base, on le crée et on attend le résultat
                        param.value_ts = null;
                        param.value = null;
                        param.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

                        to_prepend.push(param);
                        needs_computation.push(param);
                    }

                    // On push dans le buffer de mise à jour de la BDD
                    await VarsDatasProxy.getInstance().prepend_var_datas(to_prepend, false);
                }
            },
            this
        );
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser normalement la demande - FIFO
     *  Cas standard
     */
    public async append_var_datas(var_datas: VarDataBaseVO[]) {
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__append_var_datas],
            async () => {

                if ((!var_datas) || (!var_datas.length)) {
                    return;
                }

                if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_append_var_datas, var_datas)) {
                    return;
                }

                await this.filter_var_datas_by_indexes(var_datas, false, false, false);
            },
            this
        );
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser la demande par rapport à toutes les autres - LIFO
     *  Principalement pour le cas d'une demande du navigateur client, on veut répondre ASAP
     *  et si on doit ajuster le calcul on renverra l'info plus tard
     */
    public async prepend_var_datas(var_datas: VarDataBaseVO[], does_not_need_insert_or_update: boolean) {
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__prepend_var_datas],
            async () => {

                if ((!var_datas) || (!var_datas.length)) {
                    return;
                }

                if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_prepend_var_datas, var_datas)) {
                    return;
                }

                let filtered = await this.filter_var_datas_by_indexes(var_datas, true, false, does_not_need_insert_or_update);

                if ((!filtered) || (!filtered.length)) {
                    return;
                }
            },
            this
        );
    }

    /**
     * On indique en param le nombre de vars qu'on accepte de gérer dans le buffer
     *  Le dépilage se fait dans l'ordre de la déclaration, via une itération
     *  Si un jour l'ordre diffère dans JS, on passera sur une liste en FIFO, c'est le but dans tous les cas
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon
     */
    public async handle_buffer(): Promise<void> {

        if (!BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
            return;
        }

        let env = ConfigurationService.getInstance().getNodeConfiguration();

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__handle_buffer],
            async () => {

                let start_time = Dates.now();
                let real_start_time = start_time;

                while (this.semaphore_handle_buffer) {
                    let actual_time = Dates.now();

                    if (actual_time > (start_time + 60)) {
                        start_time = actual_time;
                        ConsoleHandler.getInstance().warn('VarsDatasProxy:handle_buffer:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                    }

                    await ThreadHandler.getInstance().sleep(9);
                }
                this.semaphore_handle_buffer = true;

                try {

                    let indexes = Object.keys(this.vars_datas_buffer_wrapped_indexes);
                    let self = this;
                    let promises = [];
                    let max = Math.max(1, Math.floor(ConfigurationService.getInstance().getNodeConfiguration().MAX_POOL / 2));

                    for (let i in indexes) {
                        let index = indexes[i];
                        let wrapper = this.vars_datas_buffer_wrapped_indexes[index];

                        if (!wrapper) {
                            continue;
                        }

                        let handle_var = wrapper.var_data;

                        // Si on a des vars à gérer (!has_valid_value) qui s'insèrent en début de buffer, on doit arrêter le dépilage => surtout pas sinon on tourne en boucle
                        if (!VarsServerController.getInstance().has_valid_value(handle_var)) {
                            // break;
                            continue;
                        }

                        /**
                         * Si on a besoin d'updater la bdd, on le fait, et on laisse dans le cache pour des reads éventuels
                         *
                         * Sinon :
                         *      - si on a       0  read depuis le dernier insert et TIMEOUT, on supprime du cache
                         *      - sinon si on a 0  read depuis le dernier insert et !TIMEOUT, on attend
                         *      - sinon si on a 1+ read depuis le dernier insert et TIMEOUT, on push en BDD
                         *      - sinon si on a 1+ read depuis le dernier insert et !TIMEOUT, on patiente
                         *
                         *      - si on a au moins 1 read depuis le dernier check on prolonge le timing
                         */

                        let do_insert = false;
                        let do_delete_from_cache = false;
                        let controller = VarsServerController.getInstance().getVarControllerById(handle_var.var_id);

                        if (wrapper.needs_insert_or_update) {
                            do_insert = true;
                        } else {

                            if (!wrapper.nb_reads_since_last_insert_or_update) {
                                if (Dates.now() > wrapper.timeout) {
                                    do_delete_from_cache = true;
                                }
                            } else {
                                if (Dates.now() > wrapper.timeout) {
                                    do_insert = true;
                                }
                            }

                            if ((!do_delete_from_cache) && (!do_insert) && (wrapper.nb_reads_since_last_check)) {
                                wrapper.nb_reads_since_last_check = 0;
                                wrapper.update_timeout();
                            }
                        }

                        if (do_insert && VarsCacheController.getInstance().BDD_do_cache_param_data(handle_var, controller, wrapper.is_requested)) {

                            /**
                             * On fait des packs de promises...
                             */
                            if (promises.length >= max) {
                                await Promise.all(promises);
                                promises = [];
                            }

                            promises.push((async (do_insert_: boolean, do_delete_from_cache_: boolean) => {

                                if (do_insert_) {

                                    if (env.DEBUG_VARS) {
                                        ConsoleHandler.getInstance().log('handle_buffer:insertOrUpdateVO:index|' + handle_var._bdd_only_index + ":value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type]);
                                    }
                                    let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                                    if ((!res) || (!res.id)) {

                                        // TODO FIXME TO DELETE
                                        // MDE A SUPPRIMER APRES MIGRATION MOMENTJS
                                        // On force la suppression du cache mais c'est sûrement gourmant...
                                        DAOQueryCacheController.getInstance().clear_cache(true);

                                        /**
                                         * Si l'insère/update échoue c'est très probablement par ce qu'on a déjà une data en base sur cet index,
                                         *  dans ce cas on résoud le conflit en forçant la nouvelle valeur sur l'ancien index
                                         */
                                        let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<VarDataBaseVO>(
                                            handle_var._type,
                                            null, null,
                                            '_bdd_only_index', [handle_var._bdd_only_index]);

                                        // DENIED ? si on arrive à le calculer même sur un glitch c'est au final une bonne info de le forcer en base non ?
                                        if (datas && datas.length && datas[0] && (datas[0].value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) &&
                                            ((!datas[0].value_ts) || (handle_var.value_ts && (datas[0].value_ts < handle_var.value_ts)))) {

                                            ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");

                                            handle_var.id = datas[0].id;
                                            res = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                                            if ((!res) || (!res.id)) {
                                                ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED SECOND update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                                            }
                                        } else {
                                            if ((!datas) || (!datas.length)) {
                                                /**
                                                 * Dans ce cas on doit être en présence d'une var qui n'a plus lieu d'exister, on la supprime du cache,
                                                 *  et on demande aux subscribers de recharger le navigateur pour éviter qu'ils la renvoie en boucle
                                                 * => risque de recharger en boucle le front si on a une génération de var foireuse sur le front...
                                                 */
                                                ConsoleHandler.getInstance().log('handle_buffer:insertOrUpdateVO:NO_datas:index|' + handle_var._bdd_only_index + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type]);

                                                // Retrait du rechargement pour le moment car le dashboard peut générer facilement des index trop grands pour être indéxées
                                                // await PushDataServerController.getInstance().notifyVarsTabsReload(handle_var.index);

                                                do_delete_from_cache_ = true;
                                            } else {
                                                ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED update vo 2:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                                            }
                                        }
                                    }
                                }

                                wrapper.nb_reads_since_last_insert_or_update = 0;
                                wrapper.nb_reads_since_last_check = 0;
                                wrapper.needs_insert_or_update_ = false;
                                wrapper.var_data_origin_value = wrapper.var_data.value;
                                wrapper.var_data_origin_type = wrapper.var_data.value_type;
                                wrapper.last_insert_or_update = Dates.now();
                                wrapper.update_timeout();

                                if (do_delete_from_cache_) {
                                    self.vars_datas_buffer = self.vars_datas_buffer.filter((v) => v.var_data.index != handle_var.index);
                                    delete self.vars_datas_buffer_wrapped_indexes[handle_var.index];
                                }
                            })(do_insert, do_delete_from_cache));
                        } else {
                            if (do_insert) {
                                // cas d'une demande d'insert sans droit à cache en BDD
                                // on simule juste la mise à jour du wrapper
                                wrapper.nb_reads_since_last_insert_or_update = 0;
                                wrapper.nb_reads_since_last_check = 0;
                                wrapper.needs_insert_or_update_ = false;
                                wrapper.var_data_origin_value = wrapper.var_data.value;
                                wrapper.var_data_origin_type = wrapper.var_data.value_type;
                                wrapper.last_insert_or_update = Dates.now();
                                wrapper.update_timeout();
                            }

                            if (do_delete_from_cache) {
                                self.vars_datas_buffer = self.vars_datas_buffer.filter((v) => v.var_data.index != handle_var.index);
                                delete self.vars_datas_buffer_wrapped_indexes[handle_var.index];
                            }
                        }




                        //     // Si on a pas de modif à gérer et que le dernier accès date, on nettoie
                        //     if ((!wrapper.needs_insert_or_update) && (!wrapper.nb_reads_since_last_insert_or_update) && (wrapper.last_insert_or_update && (wrapper.last_insert_or_update < Dates.add(Dates.now(), -15, TimeSegment.TYPE_SECOND)))) {
                        //         // if (env.DEBUG_VARS) {
                        //         //     ConsoleHandler.getInstance().log(
                        //         //         'handle_buffer:pas de modif à gérer et que le dernier accès date:index|' + handle_var._bdd_only_index + ":value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type] +
                        //         //         ":wrapper:needs_insert_or_update|" + wrapper.needs_insert_or_update + ":nb_reads_since_last_insert_or_update|" + wrapper.nb_reads_since_last_insert_or_update + ":last_insert_or_update|" + wrapper.last_insert_or_update
                        //         //     );
                        //         // }
                        //         this.vars_datas_buffer.splice(this.vars_datas_buffer.findIndex((e) => e.var_data.index == index), 1);
                        //         delete this.vars_datas_buffer_wrapped_indexes[index];
                        //         continue;
                        //     }

                        //     // Si on a pas de modif à gérer && (pas assez de read à mettre à jour en base ou pas assez anciens) on ignore
                        //     if (
                        //         (!wrapper.needs_insert_or_update) &&
                        //         (!(
                        //             (wrapper.nb_reads_since_last_insert_or_update >= 10) ||
                        //             (wrapper.nb_reads_since_last_insert_or_update && ((!wrapper.last_insert_or_update) || (wrapper.last_insert_or_update < Dates.add(Dates.now(), -5, TimeSegment.TYPE_SECOND))))))) {

                        //         // if (env.DEBUG_VARS) {
                        //         //     ConsoleHandler.getInstance().log(
                        //         //         'handle_buffer:pas de modif à gérer:index|' + handle_var._bdd_only_index + ":value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type] +
                        //         //         ":wrapper:needs_insert_or_update|" + wrapper.needs_insert_or_update + ":nb_reads_since_last_insert_or_update|" + wrapper.nb_reads_since_last_insert_or_update + ":last_insert_or_update|" + wrapper.last_insert_or_update
                        //         //     );
                        //         // }
                        //         continue;
                        //     }

                        //     /**
                        //      * On fait des packs de 10 promises...
                        //      */
                        //     if (promises.length >= 50) {
                        //         await Promise.all(promises);
                        //         promises = [];
                        //     }

                        //     promises.push((async () => {

                        //         if (env.DEBUG_VARS) {
                        //             ConsoleHandler.getInstance().log('handle_buffer:insertOrUpdateVO:index|' + handle_var._bdd_only_index + ":value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type]);
                        //         }
                        //         let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                        //         if ((!res) || (!res.id)) {

                        //             // TODO FIXME TO DELETE
                        //             // MDE A SUPPRIMER APRES MIGRATION MOMENTJS
                        //             // On force la suppression du cache mais c'est sûrement gourmant...
                        //             DAOQueryCacheController.getInstance().clear_cache(true);

                        //             /**
                        //              * Si l'insère/update échoue c'est très probablement par ce qu'on a déjà une data en base sur cet index,
                        //              *  dans ce cas on résoud le conflit en forçant la nouvelle valeur sur l'ancien index
                        //              */
                        //             let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<VarDataBaseVO>(
                        //                 handle_var._type,
                        //                 null, null,
                        //                 '_bdd_only_index', [handle_var._bdd_only_index]);

                        //             // DENIED ? si on arrive à le calculer même sur un glitch c'est au final une bonne info de le forcer en base non ?
                        //             if (datas && datas.length && datas[0] && (datas[0].value_type != VarDataBaseVO.VALUE_TYPE_IMPORT) &&
                        //                 ((!datas[0].value_ts) || (handle_var.value_ts && (datas[0].value_ts < handle_var.value_ts)))) {

                        //                 ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");

                        //                 handle_var.id = datas[0].id;
                        //                 res = await ModuleDAO.getInstance().insertOrUpdateVO(handle_var);
                        //                 if ((!res) || (!res.id)) {
                        //                     ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED SECOND update vo:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                        //                 }
                        //             } else {
                        //                 if ((!datas) || (!datas.length)) {
                        //                     /**
                        //                      * Dans ce cas on doit être en présence d'une var qui n'a plus lieu d'exister, on la supprime du cache,
                        //                      *  et on demande aux subscribers de recharger le navigateur pour éviter qu'ils la renvoie en boucle
                        //                      * => risque de recharger en boucle le front si on a une génération de var foireuse sur le front...
                        //                      */
                        //                     ConsoleHandler.getInstance().log('handle_buffer:insertOrUpdateVO:NO_datas:index|' + handle_var._bdd_only_index + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type]);

                        //                     // Retrait du rechargement pour le moment car le dashboard peut générer facilement des index trop grands pour être indéxées
                        //                     // await PushDataServerController.getInstance().notifyVarsTabsReload(handle_var.index);

                        //                     self.vars_datas_buffer.splice(self.vars_datas_buffer.findIndex((e) => e.var_data.index == index), 1);
                        //                     delete self.vars_datas_buffer_wrapped_indexes[index];
                        //                     return;
                        //                 } else {
                        //                     ConsoleHandler.getInstance().error("VarsDatasProxy:handle_buffer:FAILED update vo 2:index:" + handle_var.index + ":id:" + handle_var.id + ":");
                        //                 }
                        //             }
                        //         }

                        //         wrapper.nb_reads_since_last_insert_or_update = 0;
                        //         wrapper.needs_insert_or_update_ = false;
                        //         wrapper.var_data_origin_value = wrapper.var_data.value;
                        //         wrapper.var_data_origin_type = wrapper.var_data.value_type;
                        //         wrapper.last_insert_or_update = Dates.now();

                        //         // let index_to_delete: number = -1;
                        //         // for (let buffered_i in self.vars_datas_buffer) {

                        //         //     if (self.vars_datas_buffer[buffered_i].index == handle_var.index) {
                        //         //         index_to_delete = parseInt(buffered_i.toString());
                        //         //         break;
                        //         //     }
                        //         // }

                        //         // self.vars_datas_buffer.splice(index_to_delete, 1);
                        //         // delete self.vars_datas_buffer_wrapped_indexes[handle_var.index];
                        //     })());
                    }

                    if (promises.length) {
                        await Promise.all(promises);
                    }

                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                } finally {
                    this.semaphore_handle_buffer = false;
                }
            },
            this
        );
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T): Promise<T> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_exact_param_from_buffer_or_bdd],
            async () => {

                if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
                    if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                        // TODO On stocke l'info de l'accès
                        let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
                        this.add_read_stat(wrapper);
                        return wrapper.var_data as T;
                    }
                }

                if (var_data.id) {
                    let e = await ModuleDAO.getInstance().getVoById<T>(var_data._type, var_data.id, VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_segmented_field_raw_value_from_vo(var_data));

                    if (e) {
                        await this.filter_var_datas_by_indexes([e], false, false, true);
                        return e;
                    }
                }

                let res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(var_data._type, [var_data], null);

                if (res && res.length) {
                    await this.filter_var_datas_by_indexes([res[0]], false, false, true);
                    return res[0];
                }
                return null;
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_vardata(var_data)
        );
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     * On optimise la recherche en base en faisant un seul appel
     */
    public async get_exact_params_from_buffer_or_bdd<T extends VarDataBaseVO>(var_datas: T[]): Promise<T[]> {

        let env = ConfigurationService.getInstance().getNodeConfiguration();

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_exact_params_from_buffer_or_bdd],
            async () => {

                let res: T[] = [];
                let check_in_bdd_per_type: { [type: string]: T[] } = {};
                for (let i in var_datas) {
                    let var_data = var_datas[i];

                    if ((!var_data) || (!var_data.check_param_is_valid)) {
                        ConsoleHandler.getInstance().error('Paramètre invalide dans get_exact_params_from_buffer_or_bdd:' + JSON.stringify(var_data));
                        continue;
                    }

                    let e = null;
                    if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
                        if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                            // Stocker l'info de lecture
                            let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
                            this.add_read_stat(wrapper);
                            e = wrapper.var_data as T;

                            if (env.DEBUG_VARS) {
                                ConsoleHandler.getInstance().log(
                                    'get_exact_params_from_buffer_or_bdd:vars_datas_buffer:index|' + var_data._bdd_only_index + ":value|" + var_data.value + ":value_ts|" + var_data.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[var_data.value_type]
                                );
                            }
                        }
                    }

                    if (e) {
                        res.push(e);
                    } else {

                        if (!var_data.check_param_is_valid(var_data._type)) {
                            ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage:' + var_data.index);
                            continue;
                        }

                        if (!check_in_bdd_per_type[var_data._type]) {
                            check_in_bdd_per_type[var_data._type] = [];
                        }
                        check_in_bdd_per_type[var_data._type].push(var_data);
                    }
                }

                let promises = [];
                for (let _type in check_in_bdd_per_type) {
                    let check_in_bdd = check_in_bdd_per_type[_type];

                    promises.push((async () => {
                        let bdd_res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(_type, check_in_bdd, null);

                        if (bdd_res && bdd_res.length) {

                            if (env.DEBUG_VARS) {
                                ConsoleHandler.getInstance().log(
                                    'get_exact_params_from_buffer_or_bdd:bdd_res:index|' + bdd_res[0]._bdd_only_index + ":value|" + bdd_res[0].value + ":value_ts|" + bdd_res[0].value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[bdd_res[0].value_type]
                                );
                            }

                            res = (res && res.length) ? res.concat(bdd_res) : bdd_res;
                        }
                    })());
                }
                await Promise.all(promises);

                return res;
            },
            this
        );
    }

    /**
     * On force l'appel sur le thread du computer de vars
     */
    public async update_existing_buffered_older_datas(var_datas: VarDataBaseVO[]) {
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__update_existing_buffered_older_datas],
            async () => {

                if ((!var_datas) || (!var_datas.length)) {
                    return;
                }

                if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, var_datas)) {
                    return;
                }

                await this.filter_var_datas_by_indexes(var_datas, false, true, false);
            },
            this
        );
    }

    /**
     * On charge en priorité depuis le buffer, puisque si le client demande des calculs on va les mettre en priorité ici, avant de calculer puis les remettre en attente d'insertion en base
     *  (dont en fait elles partent juste jamais)
     * On utilise l'extimation de coût pour 1000 card pour se limiter au temps imposé (la dernière var prise dépasse du temps imposé)
     * @param client_request_estimated_ms_limit poids de calcul autorisé (en ms estimées) pour des demandes issues du client
     * @param bg_estimated_ms_limit poids de calcul autorisé (en ms estimées) pour des demandes issues d'une invalidation en bdd
     */
    public async get_vars_to_compute_from_buffer_or_bdd(
        client_request_estimated_ms_limit: number,
        client_request_min_nb_vars: number,
        bg_estimated_ms_limit: number,
        bg_min_nb_vars: number
    ): Promise<{ [index: string]: VarDataBaseVO }> {

        if (!BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
            return;
        }

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_vars_to_compute_from_buffer_or_bdd],
            async () => {

                let res: { [index: string]: VarDataBaseVO } = {};
                let estimated_ms: number = 0;
                let nb_vars: number = 0;

                /**
                 * Si c'est suite à un redémarrage on check si on a des vars en attente de test en BDD
                 *  Si c'est le cas on gère la première de ces vars, sinon on enlève le mode démarrage
                 */
                let vardata_to_test: VarDataBaseVO = VarsDatasProxy.getInstance().can_load_vars_to_test ? await SlowVarKiHandler.getInstance().handle_slow_var_ki_start() : null;
                if (vardata_to_test) {
                    res[vardata_to_test.index] = vardata_to_test;
                    return res;
                }
                VarsDatasProxy.getInstance().can_load_vars_to_test = false;

                /**
                 * On commence par collecter le max de datas depuis le buffer : Les conditions de sélection d'un var :
                 *  - est-ce que la data a une valeur undefined ? oui => sélectionnée
                 *  - est-ce que la data peut expirer et a expiré ? oui => sélectionnée
                 */

                /**
                 * On commence par ordonner les vars par cardinal pour commencer par les plus petites, et aussi par celles qui sont en bas de l'arbre
                 */
                if (this.vars_datas_buffer && this.vars_datas_buffer.length) {
                    await this.order_vars_datas_buffer();
                }

                for (let i in this.vars_datas_buffer) {

                    if (((estimated_ms >= client_request_estimated_ms_limit) && (nb_vars >= client_request_min_nb_vars)) ||
                        (estimated_ms >= client_request_estimated_ms_limit * 10000)) {
                        ConsoleHandler.getInstance().log('get_vars_to_compute:buffer:nb:' + nb_vars + ':estimated_ms:' + estimated_ms + ':');
                        return res;
                    }

                    let var_data_wrapper = this.vars_datas_buffer[i];

                    if (!VarsServerController.getInstance().has_valid_value(var_data_wrapper.var_data)) {

                        let estimated_ms_var = 0;

                        if (VarsServerController.getInstance().varcacheconf_by_var_ids[var_data_wrapper.var_data.var_id]) {
                            estimated_ms_var = var_data_wrapper.estimated_ms;
                        } else {
                            // debug
                            ConsoleHandler.getInstance().warn('get_vars_to_compute:DEBUG:not found in varcacheconf_by_var_ids:' + var_data_wrapper.var_data.index + ':');
                            try {
                                ConsoleHandler.getInstance().warn(JSON.stringify(VarsServerController.getInstance().varcacheconf_by_var_ids));
                            } catch (error) {
                                ConsoleHandler.getInstance().error(error);
                            }
                        }

                        // cas spécifique isolement d'une var trop gourmande : on ne l'ajoute pas si elle est délirante et qu'il y a déjà des vars en attente par ailleurs
                        if ((estimated_ms_var > (client_request_estimated_ms_limit * 10000)) && (nb_vars > 0)) {
                            continue;
                        }

                        nb_vars += res[var_data_wrapper.var_data.index] ? 0 : 1;
                        res[var_data_wrapper.var_data.index] = var_data_wrapper.var_data;
                        estimated_ms += estimated_ms_var;
                        var_data_wrapper.is_requested = true;

                        // cas spécifique isolement d'une var trop gourmande : si elle a été ajoutée mais seule, on skip la limite minimale de x vars pour la traiter seule
                        if ((estimated_ms_var > (client_request_estimated_ms_limit * 10000)) && (nb_vars == 1)) {
                            break;
                        }

                        continue;
                    }
                }

                /**
                 * Si on a des datas en attente dans le buffer on commence par ça
                 */
                if (ObjectHandler.getInstance().hasAtLeastOneAttribute(res)) {
                    ConsoleHandler.getInstance().log('get_vars_to_compute:buffer:nb:' + nb_vars + ':estimated_ms:' + estimated_ms + ':');
                    return res;
                }

                let params = {
                    bg_estimated_ms_limit: bg_estimated_ms_limit,
                    bg_min_nb_vars: bg_min_nb_vars,
                    bg_estimated_ms: 0,
                    bg_nb_vars: 0
                };
                let bdd_datas: { [index: string]: VarDataBaseVO } = await this.get_vars_to_compute_from_bdd(params);
                for (let i in bdd_datas) {
                    let bdd_data = bdd_datas[i];

                    /**
                     * Attention : à ce stade en base on va trouver des datas qui sont pas computed mais qu'on retrouve par exemple comme computed
                     *  et valide (donc pas sélectionnées) dans le buffer d'attente de mise à jour en bdd. Donc on doit ignorer tous les ids
                     *  des vars qui sont dans le buffer... (avantage ça concerne pas celles qui sont pas créées puisqu'il faut un id et la liste
                     *  des ids reste relativement dense)...
                     */
                    if (!!this.vars_datas_buffer_wrapped_indexes[bdd_data.index]) {
                        let buffered = this.vars_datas_buffer_wrapped_indexes[bdd_data.index];
                        if (VarsServerController.getInstance().has_valid_value(buffered.var_data)) {
                            continue;
                        }
                    }

                    res[bdd_data.index] = bdd_data;
                }

                /**
                 * Si on fait les calculs depuis la Bdd, on mets les vardats dans la pile de mise en cache
                 */
                if (bdd_datas && ObjectHandler.getInstance().hasAtLeastOneAttribute(bdd_datas)) {
                    await this.prepend_var_datas(Object.values(bdd_datas), true);
                }

                if (params.bg_nb_vars) {
                    ConsoleHandler.getInstance().log('get_vars_to_compute:bdd:nb:' + params.bg_nb_vars + ':estimated_ms:' + params.bg_estimated_ms + ':');
                }
                return res;
            },
            this
        );
    }

    /**
     * On récupère des packets max de 500 vars, et si besoin on en récupèrera d'autres pour remplir le temps limit
     * -- 02/21 Changement méthode on parcours l'arbre des var controller en commençant par le bas pour remonter depuis les DS vers les calculs
     */
    private async get_vars_to_compute_from_bdd(
        params: {
            bg_estimated_ms_limit: number,
            bg_min_nb_vars: number,
            bg_estimated_ms: number,
            bg_nb_vars: number
        }): Promise<{ [index: string]: VarDataBaseVO }> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_vars_to_compute_from_bdd],
            async () => {

                let vars_datas: { [index: string]: VarDataBaseVO } = {};
                let already_tested: { [var_id: number]: boolean } = {};

                for (let i in VarsServerController.getInstance().varcontrollers_dag.leafs) {
                    let leaf = VarsServerController.getInstance().varcontrollers_dag.leafs[i];

                    await DAGController.getInstance().visit_bottom_up_from_node(leaf, async (Ny: VarCtrlDAGNode) => {

                        if (already_tested[Ny.var_controller.varConf.id]) {
                            return;
                        }
                        already_tested[Ny.var_controller.varConf.id] = true;

                        let may_have_more_datas: boolean = true;
                        let limit: number = 500;
                        let offset: number = 0;

                        let start_time = Dates.now();
                        let real_start_time = start_time;

                        while (may_have_more_datas &&
                            (((params.bg_estimated_ms < params.bg_estimated_ms_limit) || (params.bg_nb_vars < params.bg_min_nb_vars)) &&
                                (params.bg_estimated_ms < params.bg_estimated_ms_limit * 10000))) {

                            let actual_time = Dates.now();

                            if (actual_time > (start_time + 60)) {
                                start_time = actual_time;
                                ConsoleHandler.getInstance().warn('VarsDatasProxy:get_vars_to_compute_from_bdd:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                            }

                            may_have_more_datas = false;

                            let condition = '';

                            let varcacheconf: VarCacheConfVO = Ny.var_controller.var_cache_conf;

                            if (!!varcacheconf.cache_timeout_secs) {
                                let timeout: number = Dates.add(Dates.now(), -varcacheconf.cache_timeout_secs);
                                condition += 'var_id = ' + varcacheconf.var_id + ' and (value_ts is null or value_ts < ' + timeout + ')';
                            } else {
                                condition += 'var_id = ' + varcacheconf.var_id + ' and value_ts is null';
                            }

                            condition += ' and value_type = ' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ' limit ' + limit + ' offset ' + offset + ';';
                            offset += limit;

                            // On doit aller chercher toutes les varsdatas connues pour être cachables (on se fout du var_id à ce stade on veut juste des api_type_ids des varsdatas compatibles)
                            //  Attention les données importées ne doivent pas être remises en question
                            let vars_datas_tmp: VarDataBaseVO[] = [];
                            vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(Ny.var_controller.varConf.var_data_vo_type, ' where ' + condition);
                            may_have_more_datas = (vars_datas_tmp && (vars_datas_tmp.length == limit));

                            for (let vars_datas_tmp_i in vars_datas_tmp) {
                                if (((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) ||
                                    (params.bg_estimated_ms > params.bg_estimated_ms_limit * 10000)) {
                                    return;
                                }

                                let var_data_tmp = vars_datas_tmp[vars_datas_tmp_i];

                                // Si la data est déjà dans le cache on doit surtout pas la prendre en compte à ce stade, car ça veut dire qu'on a peut-etre juste pas encore mis la bdd à jour
                                if (this.vars_datas_buffer_wrapped_indexes[var_data_tmp.index]) {
                                    continue;
                                }

                                let estimated_ms_var = 0;

                                if (VarsServerController.getInstance().varcacheconf_by_var_ids[var_data_tmp.var_id]) {
                                    estimated_ms_var = VarsComputeController.getInstance().get_estimated_time(var_data_tmp);
                                } else {
                                    // debug
                                    ConsoleHandler.getInstance().warn('get_vars_to_compute_from_bdd:DEBUG:not found in varcacheconf_by_var_ids:' + var_data_tmp.index + ':');
                                    try {
                                        ConsoleHandler.getInstance().warn(JSON.stringify(VarsServerController.getInstance().varcacheconf_by_var_ids));
                                    } catch (error) {
                                        ConsoleHandler.getInstance().error(error);
                                    }
                                    continue;
                                }

                                // cas spécifique isolement d'une var trop gourmande : on ne l'ajoute pas si elle est délirante et qu'il y a déjà des vars en attente par ailleurs
                                if ((estimated_ms_var > (params.bg_estimated_ms_limit * 10000)) && (params.bg_nb_vars > 0)) {
                                    continue;
                                }

                                params.bg_estimated_ms += estimated_ms_var;
                                params.bg_nb_vars += vars_datas[var_data_tmp.index] ? 0 : 1;
                                vars_datas[var_data_tmp.index] = var_data_tmp;

                                // cas spécifique isolement d'une var trop gourmande : si elle a été ajoutée mais seule, on skip la limite minimale de x vars pour la traiter seule
                                if ((estimated_ms_var > (params.bg_estimated_ms_limit * 10000)) && (params.bg_nb_vars == 1)) {
                                    return;
                                }
                            }
                        }
                        if (((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) ||
                            (params.bg_estimated_ms > params.bg_estimated_ms_limit * 10000)) {
                            return;
                        }
                        // if ((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) {
                        //     return;
                        // }
                    }, (node: VarDAGNode) => {
                        return ((params.bg_estimated_ms <= params.bg_estimated_ms_limit * 10000) && ((params.bg_estimated_ms < params.bg_estimated_ms_limit) || (params.bg_nb_vars < params.bg_min_nb_vars)));
                        // return ((params.bg_estimated_ms < params.bg_estimated_ms_limit) || (params.bg_nb_vars < params.bg_min_nb_vars));
                    });

                    if (((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) ||
                        (params.bg_estimated_ms > params.bg_estimated_ms_limit * 10000)) {
                        return vars_datas;
                    }
                    // if ((params.bg_estimated_ms >= params.bg_estimated_ms_limit) && (params.bg_nb_vars >= params.bg_min_nb_vars)) {
                    //     return;
                    // }
                }
                return vars_datas;
            },
            this
        );
    }

    /**
     * On filtre les demande de append ou prepend par les indexes déjà en attente par ce qu'on peut pas avoir 2 fois le même index dans la liste
     * Du coup si on demande quelque chose sur un index déjà listé, on ignore juste la demande pour le moment
     * On met à jour la map des indexs au passage
     * On doit s'assurer par contre de pas rentrer en conflit avec un handle du buffer
     * @param var_datas
     */
    private async filter_var_datas_by_indexes(var_datas: VarDataBaseVO[], prepend: boolean, donot_insert_if_absent: boolean, just_been_loaded_from_db: boolean): Promise<Array<VarDataProxyWrapperVO<VarDataBaseVO>>> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__filter_var_datas_by_indexes],
            async () => {

                // let start_time = Dates.now();
                // let real_start_time = start_time;

                // while (this.semaphore_handle_buffer) {
                //     let actual_time = Dates.now();

                //     if (actual_time > (start_time + 60)) {
                //         start_time = actual_time;
                //         ConsoleHandler.getInstance().warn('VarsDatasProxy:filter_var_datas_by_indexes:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                //     }

                //     await ThreadHandler.getInstance().sleep(9);
                // }
                // this.semaphore_handle_buffer = true;
                let res: Array<VarDataProxyWrapperVO<VarDataBaseVO>> = [];

                // try {

                for (let i in var_datas) {
                    let var_data = var_datas[i];

                    if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
                        if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                            let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];

                            /**
                             * Si ça existe déjà dans la liste d'attente on l'ajoute pas mais on met à jour pour intégrer les calculs faits le cas échéant
                             *  Si on vide le value_ts on prend la modif aussi ça veut dire qu'on invalide la valeur en cache
                             */
                            if ((!var_data.value_ts) || ((!!var_data.value_ts) && ((!wrapper.var_data.value_ts) ||
                                (var_data.value_ts && (wrapper.var_data.value_ts < var_data.value_ts))))) {

                                // Si on avait un id et que la nouvelle valeur n'en a pas, on concerve l'id précieusement
                                if ((!var_data.id) && (wrapper.var_data.id)) {
                                    var_data.id = wrapper.var_data.id;
                                }

                                // FIXME On devrait checker les champs pour voir si il y a une différence non ?
                                // wrapper.needs_insert_or_update = !just_been_loaded_from_db;

                                // Si on dit qu'on vient de la charger de la base, on peut stocker l'info de dernière mise à jour en bdd
                                if (just_been_loaded_from_db) {
                                    wrapper.last_insert_or_update = Dates.now();
                                    wrapper.update_timeout();
                                }
                                wrapper.var_data = var_data;
                                this.add_read_stat(wrapper);
                                this.vars_datas_buffer[this.vars_datas_buffer.findIndex((e) => e.var_data.index == var_data.index)] = wrapper;
                                // On push pas puisque c'était déjà en attente d'action

                                // Si on met en cache une data à calculer on s'assure qu'on a bien un calcul qui vient rapidement
                                if (!VarsServerController.getInstance().has_valid_value(var_data)) {
                                    VarsdatasComputerBGThread.getInstance().force_run_asap();
                                }
                            }
                            continue;
                        }
                    }

                    if (donot_insert_if_absent) {
                        continue;
                    }

                    // TODO FIXME le thread principal doit pouvoir mettre à jour la liste des reads sur une var en bdd de temps à autre
                    //  attention impact invalidation peut-etre sur thread des vars ...
                    // TODO FIXME pour moi ce test a pas de sens on devrait toujours être côté bgthread du computer, donc ...
                    if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
                        this.vars_datas_buffer_wrapped_indexes[var_data.index] = new VarDataProxyWrapperVO(var_data, prepend, !just_been_loaded_from_db, 0);
                        this.add_read_stat(this.vars_datas_buffer_wrapped_indexes[var_data.index]);
                        res.push(this.vars_datas_buffer_wrapped_indexes[var_data.index]);
                    }

                    // Si on met en cache une data à calculer on s'assure qu'on a bien un calcul qui vient rapidement
                    if (!VarsServerController.getInstance().has_valid_value(var_data)) {
                        VarsdatasComputerBGThread.getInstance().force_run_asap();
                    }
                }

                if ((!donot_insert_if_absent) && res && res.length) {

                    if (prepend) {
                        this.vars_datas_buffer.unshift(...res);
                    } else {
                        this.vars_datas_buffer = this.vars_datas_buffer.concat(res);
                    }
                }

                // } catch (error) {
                //     ConsoleHandler.getInstance().error(error);
                // } finally {
                //     this.semaphore_handle_buffer = false;
                // }

                return res;
            },
            this
        );
    }

    private add_read_stat(var_data_wrapper: VarDataProxyWrapperVO<VarDataBaseVO>) {
        var_data_wrapper.nb_reads_since_last_insert_or_update++;
        var_data_wrapper.nb_reads_since_last_check++;
        if (!var_data_wrapper.var_data.last_reads_ts) {
            var_data_wrapper.var_data.last_reads_ts = [];
        }
        var_data_wrapper.var_data.last_reads_ts.push(Dates.now());
        if (var_data_wrapper.var_data.last_reads_ts.length > 20) {
            var_data_wrapper.var_data.last_reads_ts.shift();
        }
    }

    private async order_vars_datas_buffer() {

        let cardinaux: { [index: string]: number } = {};

        for (let i in this.vars_datas_buffer) {
            let var_wrapper = this.vars_datas_buffer[i];
            cardinaux[var_wrapper.var_data.index] = MatroidController.getInstance().get_cardinal(var_wrapper.var_data);
        }

        // Ensuite par hauteur dans l'arbre
        if (!VarsServerController.getInstance().varcontrollers_dag_depths) {
            await VarsServerController.getInstance().init_varcontrollers_dag_depths();
        }

        this.vars_datas_buffer.sort((a: VarDataProxyWrapperVO<VarDataBaseVO>, b: VarDataProxyWrapperVO<VarDataBaseVO>): number => {

            // En priorité les demandes client
            if (a.is_client_var && !b.is_client_var) {
                return -1;
            }

            if ((!a.is_client_var) && b.is_client_var) {
                return 1;
            }

            // Ensuite par cardinal
            if (cardinaux[a.var_data.index] != cardinaux[b.var_data.index]) {
                return cardinaux[a.var_data.index] - cardinaux[b.var_data.index];
            }

            let depth_a = VarsServerController.getInstance().varcontrollers_dag_depths[a.var_data.var_id];
            let depth_b = VarsServerController.getInstance().varcontrollers_dag_depths[b.var_data.var_id];

            if (depth_a != depth_b) {
                return depth_a - depth_b;
            }

            // Enfin par index juste pour éviter des égalités
            return (a.var_data.index < b.var_data.index) ? -1 : 1;

            // // Ensuite par hauteur dans l'arbre
            // if (!VarsServerController.getInstance().varcontrollers_dag_depths) {
            //     VarsServerController.getInstance().init_varcontrollers_dag_depths();
            // }

            // let depth_a = VarsServerController.getInstance().varcontrollers_dag_depths[a.var_data.var_id];
            // let depth_b = VarsServerController.getInstance().varcontrollers_dag_depths[b.var_data.var_id];

            // if (depth_a != depth_b) {
            //     return depth_a - depth_b;
            // }

            // // Enfin par cardinal
            // return cardinaux[a.var_data.index] - cardinaux[b.var_data.index];
        });
    }

    // private order_vars_datas_buffer() {

    //     this.vars_datas_buffer.sort((a: VarDataProxyWrapperVO<VarDataBaseVO>, b: VarDataProxyWrapperVO<VarDataBaseVO>): number => {

    //         return a.estimated_ms - b.estimated_ms;
    //     });
    // }
}