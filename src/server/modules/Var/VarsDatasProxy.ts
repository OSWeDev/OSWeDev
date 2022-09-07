

import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import SlowVarVO from '../../../shared/modules/Var/vos/SlowVarVO';
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
import VarsCacheController from '../Var/VarsCacheController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import NotifVardatasParam from './notifs/NotifVardatasParam';
import SlowVarKiHandler from './SlowVarKi/SlowVarKiHandler';
import VarsComputeController from './VarsComputeController';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

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
    public vars_datas_buffer_wrapped_indexes: { [index: string]: VarDataProxyWrapperVO<VarDataBaseVO> } = {};

    /**
     * Au boot on teste de dépiler des vars qui seraient en attente de test, sinon on suit le chemin classique
     */
    public can_load_vars_to_test: boolean = true;


    private semaphore_handle_buffer: boolean = false;

    protected constructor() {
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_prepend_var_datas, this.prepend_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_append_var_datas, this.append_var_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, this.update_existing_buffered_older_datas.bind(this));
        ForkedTasksController.getInstance().register_task(VarsDatasProxy.TASK_NAME_has_cached_vars_waiting_for_compute, this.has_cached_vars_waiting_for_compute.bind(this));
    }

    /**
     * @returns the next var to process
     */
    public select_var_from_buffer(): VarDataProxyWrapperVO<VarDataBaseVO> {

        if (!VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list) {
            this.prepare_current_batch_ordered_pick_list();
        }
        if (!VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list) {
            return null;
        }
        return VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list.shift();
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

            for (let i in this.vars_datas_buffer_wrapped_indexes) {
                let var_data_wrapper = this.vars_datas_buffer_wrapped_indexes[i];

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
        let env = ConfigurationService.getInstance().node_configuration;

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_var_datas_or_ask_to_bgthread],
            async () => {

                let varsdata: VarDataBaseVO[] = await VarsDatasProxy.getInstance().get_exact_params_from_buffer_or_bdd(params);

                if (varsdata) {

                    let vars_data_to_prepend: VarDataBaseVO[] = [];

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

                        let var_cache_conf = VarsServerController.getInstance().varcacheconf_by_var_ids[vardata.var_id];

                        if (var_cache_conf.use_cache_read_ms_to_partial_clean) {
                            vars_data_to_prepend.push(vardata);
                        }
                    });

                    if (vars_data_to_prepend.length > 0) {
                        await VarsDatasProxy.getInstance().prepend_var_datas(vars_data_to_prepend, true);
                    }
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

                if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_prepend_var_datas, var_datas, does_not_need_insert_or_update)) {
                    return;
                }

                await this.filter_var_datas_by_indexes(var_datas, true, false, does_not_need_insert_or_update);
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

        let env = ConfigurationService.getInstance().node_configuration;

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
            let do_delete_from_cache_indexes: { [index: string]: boolean } = {};
            let self = this;

            let to_insert_by_type: { [api_type_id: string]: VarDataBaseVO[] } = {};

            for (let i in indexes) {
                let index = indexes[i];
                let wrapper = this.vars_datas_buffer_wrapped_indexes[index];

                if (!wrapper) {
                    continue;
                }

                let handle_var = wrapper.var_data;

                // Si on a des vars à gérer (!has_valid_value) qui s'insèrent en début de buffer, on doit arrêter le dépilage => surtout pas sinon on tourne en boucle
                if (!VarsServerController.getInstance().has_valid_value(handle_var)) {
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
                let controller = VarsServerController.getInstance().getVarControllerById(handle_var.var_id);
                let conf = VarsController.getInstance().var_conf_by_id[handle_var.var_id];

                /**
                 * Cas des pixels : on insere initialement, mais jamais ensuite. les infos de lecture on s'en fiche puisque le cache ne doit jamais être invalidé
                 */

                if (wrapper.needs_insert_or_update) {
                    do_insert = true;
                } else if ((!conf.pixel_activated) || (!conf.pixel_never_delete)) {

                    if (!wrapper.nb_reads_since_last_insert_or_update) {
                        if (Dates.now() > wrapper.timeout) {
                            do_delete_from_cache_indexes[index] = true;
                        }
                    } else {
                        if (Dates.now() > wrapper.timeout) {
                            do_insert = true;
                        }
                    }

                    if ((!do_delete_from_cache_indexes[index]) && (!do_insert) && (wrapper.nb_reads_since_last_check)) {
                        wrapper.nb_reads_since_last_check = 0;
                        wrapper.update_timeout();
                    }
                }

                if (do_insert && VarsCacheController.getInstance().BDD_do_cache_param_data(handle_var, controller, wrapper.is_requested)) {

                    if (!to_insert_by_type[handle_var._type]) {
                        to_insert_by_type[handle_var._type] = [];
                    }
                    to_insert_by_type[handle_var._type].push(handle_var);

                    if (env.DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('handle_buffer:insertOrUpdateVO:index|' + handle_var._bdd_only_index + ":value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type]);
                    }
                }
            }

            if (ObjectHandler.getInstance().hasAtLeastOneAttribute(to_insert_by_type)) {

                let promises = [];
                let result = true;
                for (let i in to_insert_by_type) {
                    let to_insert = to_insert_by_type[i];

                    promises.push((async () => {
                        if (!await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(to_insert)) {
                            result = false;
                        }
                    })());
                }
                await Promise.all(promises);

                if (!result) {
                    throw new Error('VarsDatasProxy:handle_buffer:insert_without_triggers_using_COPY:Erreur - on garde dans le cache pour une prochaine tentative');
                }

                // TODO FIXME TO DELETE
                // MDE A SUPPRIMER APRES MIGRATION MOMENTJS
                // On force la suppression du cache mais c'est sûrement gourmant...
                DAOQueryCacheController.getInstance().clear_cache(true);

                for (let i in to_insert_by_type) {
                    let to_insert = to_insert_by_type[i];

                    for (let j in to_insert) {
                        let inserted_var_data = to_insert[j];
                        let index: string = inserted_var_data.index;
                        let wrapper = this.vars_datas_buffer_wrapped_indexes[index];

                        /**
                         * On s'assure qu'on a bien la même info dans le cache (cf https://trello.com/c/XkGripbS/1668-pb-de-redondance-de-calcul-sur-els-vars-on-fait-2-fois-le-calcul-ici-pkoi)
                         */
                        let to_notify: boolean = this.check_or_update_var_buffer(inserted_var_data);

                        if (to_notify) {
                            await VarsTabsSubsController.getInstance().notify_vardatas(
                                [new NotifVardatasParam([inserted_var_data])]);
                            await VarsServerCallBackSubsController.getInstance().notify_vardatas([inserted_var_data]);
                        }

                        if (!wrapper) {
                            continue;
                        }

                        wrapper.nb_reads_since_last_insert_or_update = 0;
                        wrapper.nb_reads_since_last_check = 0;
                        wrapper.needs_insert_or_update_ = false;
                        wrapper.var_data_origin_value = wrapper.var_data.value;
                        wrapper.var_data_origin_type = wrapper.var_data.value_type;
                        wrapper.last_insert_or_update = Dates.now();
                        wrapper.update_timeout();

                        if (do_delete_from_cache_indexes[index]) {
                            delete self.vars_datas_buffer_wrapped_indexes[index];
                        }
                    }
                }
            }

        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        } finally {
            this.semaphore_handle_buffer = false;
        }
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T): Promise<T> {

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;
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

                let res: T = await ModuleVar.getInstance().get_var_data_by_index<T>(var_data._type, var_data.index);

                if (DEBUG_VARS) {
                    ConsoleHandler.getInstance().log('get_exact_param_from_buffer_or_bdd:res:' + (res ? JSON.stringify(res) : null) + ':');
                }

                if (!!res) {
                    let cached_res = await this.filter_var_datas_by_indexes([res], false, false, true);
                    return cached_res[0];
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

        let env = ConfigurationService.getInstance().node_configuration;

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_exact_params_from_buffer_or_bdd],
            async () => {

                let res: T[] = [];
                let promises = [];

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

                        promises.push((async () => {
                            let bdd_res: T = await ModuleVar.getInstance().get_var_data_by_index<T>(var_data._type, var_data.index);

                            if (!!bdd_res) {

                                if (env.DEBUG_VARS) {
                                    ConsoleHandler.getInstance().log(
                                        'get_exact_params_from_buffer_or_bdd:bdd_res:index|' + bdd_res._bdd_only_index + ":value|" + bdd_res.value + ":value_ts|" + bdd_res.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[bdd_res.value_type]
                                    );
                                }

                                res.push(bdd_res);
                            }
                        })());
                    }
                }

                await Promise.all(promises);

                return res;
            },
            this
        );
    }

    /**
     * @returns true if there's at least one vardata waiting to be computed (having no valid value)
     */
    public has_vardata_waiting_for_computation(): boolean {
        let vars_datas_buffer = Object.values(this.vars_datas_buffer_wrapped_indexes).filter((v) => !VarsServerController.getInstance().has_valid_value(v.var_data));
        return (!!vars_datas_buffer) && (vars_datas_buffer.length > 0);
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

    private prepare_current_batch_ordered_pick_list() {
        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];

        let vars_datas_buffer = Object.values(this.vars_datas_buffer_wrapped_indexes);
        let ordered_client_vars_datas_buffer = vars_datas_buffer.filter((v) => v.is_client_var && !VarsServerController.getInstance().has_valid_value(v.var_data));
        this.order_vars_datas_buffer(ordered_client_vars_datas_buffer);

        let ordered_non_client_vars_datas_buffer = vars_datas_buffer.filter((v) => (!v.is_client_var) && !VarsServerController.getInstance().has_valid_value(v.var_data));
        this.order_vars_datas_buffer(ordered_non_client_vars_datas_buffer);

        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = ordered_client_vars_datas_buffer.concat(ordered_non_client_vars_datas_buffer);
    }

    /**
     * On filtre les demande de append ou prepend par les indexes déjà en attente par ce qu'on peut pas avoir 2 fois le même index dans la liste
     * Du coup si on demande quelque chose sur un index déjà listé, on ignore juste la demande pour le moment
     * On met à jour la map des indexs au passage
     * On doit s'assurer par contre de pas rentrer en conflit avec un handle du buffer
     * @param var_datas
     * @returns list of var_datas, as found (or added) in the cache. if not on primary thread, might return less elements than the input list
     */
    private async filter_var_datas_by_indexes(var_datas: VarDataBaseVO[], prepend: boolean, donot_insert_if_absent: boolean, just_been_loaded_from_db: boolean): Promise<VarDataBaseVO[]> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__filter_var_datas_by_indexes],
            async () => {

                let res: VarDataBaseVO[] = [];

                for (let i in var_datas) {
                    let var_data = var_datas[i];

                    if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
                        if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                            let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
                            res.push(wrapper.var_data);

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
                        res.push(this.vars_datas_buffer_wrapped_indexes[var_data.index].var_data);
                    }

                    // Si on met en cache une data à calculer on s'assure qu'on a bien un calcul qui vient rapidement
                    if (!VarsServerController.getInstance().has_valid_value(var_data)) {
                        VarsdatasComputerBGThread.getInstance().force_run_asap();
                    }
                }

                return res;
            },
            this
        );
    }

    private add_read_stat(var_data_wrapper: VarDataProxyWrapperVO<VarDataBaseVO>) {

        let var_cache_conf = VarsServerController.getInstance().varcacheconf_by_var_ids[var_data_wrapper.var_data.var_id];
        if (!var_cache_conf.use_cache_read_ms_to_partial_clean) {
            return;
        }

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

    private async order_vars_datas_buffer(vars_datas_buffer: Array<VarDataProxyWrapperVO<VarDataBaseVO>>) {

        let cardinaux: { [index: string]: number } = {};

        for (let i in vars_datas_buffer) {
            let var_wrapper = vars_datas_buffer[i];
            cardinaux[var_wrapper.var_data.index] = MatroidController.getInstance().get_cardinal(var_wrapper.var_data);
        }

        // Ensuite par hauteur dans l'arbre
        if (!VarsServerController.getInstance().varcontrollers_dag_depths) {
            await VarsServerController.getInstance().init_varcontrollers_dag_depths();
        }

        vars_datas_buffer.sort((a: VarDataProxyWrapperVO<VarDataBaseVO>, b: VarDataProxyWrapperVO<VarDataBaseVO>): number => {

            // On filtre en amont
            // // En tout premier les params qui nécessitent un calcul
            // let valida = VarsServerController.getInstance().has_valid_value(a.var_data);
            // let validb = VarsServerController.getInstance().has_valid_value(b.var_data);
            // if (valida && !validb) {
            //     return -1;
            // }
            // if (validb && !valida) {
            //     return 1;
            // }

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

            /**
             * Par hauteur dans l'arbre
             */
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

    private check_or_update_var_buffer(handle_var: VarDataBaseVO): boolean {
        let var_data_buffer = this.vars_datas_buffer_wrapped_indexes[handle_var.index];

        if (!var_data_buffer) {
            return false;
        }
        if (
            (var_data_buffer.var_data.value != handle_var.value) ||
            (var_data_buffer.var_data.value_ts != handle_var.value_ts) ||
            (var_data_buffer.var_data.value_type != handle_var.value_type)) {
            ConsoleHandler.getInstance().error(
                'check_or_update_var_buffer:incoherence - correction auto:' + var_data_buffer.var_data.index +
                ':var_data_buffer:' + var_data_buffer.var_data.value + ':' + var_data_buffer.var_data.value_ts + ':' + var_data_buffer.var_data.value_type + ':' +
                ':handle_var:' + handle_var.value + ':' + handle_var.value_ts + ':' + handle_var.value_type + ':'
            );

            var_data_buffer.var_data.value = handle_var.value;
            var_data_buffer.var_data.value_ts = handle_var.value_ts;
            var_data_buffer.var_data.value_type = handle_var.value_type;

            /**
             * Dans le doute d'une notif qui serait pas encore partie (a priori c'est régulier dans ce contexte)
             *  pour indiquer un calcul terminé, on check le statut de la var et si c'est utile (has valid value)
             *  on envoie les notifs. Aucun moyen de savoir si c'est déjà fait à ce niveau l'arbre n'existe plus, et
             *  au pire on envoie une deuxième notif à un watcher permanent. Cela dit la nouvelle notif viendra en plus
             *  probablement corriger une mauvaise valeur affichée à la base.
             * A creuser pourquoi on arrive là
             */

            return true;
        }

        return false;
    }
}