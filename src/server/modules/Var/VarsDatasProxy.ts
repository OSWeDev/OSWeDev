

import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarsController from '../../../shared/modules/Var/VarsController';
import SlowVarVO from '../../../shared/modules/Var/vos/SlowVarVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
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
        let env = ConfigurationService.getInstance().node_configuration;

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
                    for (let i in varsdata) {
                        let vardata = varsdata[i];
                        let var_cache_conf = VarsServerController.getInstance().varcacheconf_by_var_ids[vardata.var_id];

                        if (var_cache_conf.use_cache_read_ms_to_partial_clean) {
                            await VarsDatasProxy.getInstance().prepend_var_datas(varsdata, true);
                        }
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

            let to_insert: VarDataBaseVO[] = [];

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

                    to_insert.push(handle_var);

                    if (env.DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('handle_buffer:insertOrUpdateVO:index|' + handle_var._bdd_only_index + ":value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type]);
                    }
                }
            }

            if (!!to_insert.length) {
                await ModuleDAOServer.getInstance().insertOrUpdateVOs_without_triggers(to_insert);

                // TODO FIXME TO DELETE
                // MDE A SUPPRIMER APRES MIGRATION MOMENTJS
                // On force la suppression du cache mais c'est sûrement gourmant...
                DAOQueryCacheController.getInstance().clear_cache(true);

                for (let i in to_insert) {
                    let index: string = to_insert[i].index;
                    let wrapper = this.vars_datas_buffer_wrapped_indexes[index];

                    /**
                     * On s'assure qu'on a bien la même info dans le cache (cf https://trello.com/c/XkGripbS/1668-pb-de-redondance-de-calcul-sur-els-vars-on-fait-2-fois-le-calcul-ici-pkoi)
                     */
                    this.check_or_update_var_buffer(to_insert[i]);

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
                        self.vars_datas_buffer = self.vars_datas_buffer.filter((v) => v.var_data.index != index);
                        delete self.vars_datas_buffer_wrapped_indexes[index];
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

                if (var_data.id) {
                    let e = await ModuleDAO.getInstance().getVoById<T>(var_data._type, var_data.id, VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_segmented_field_raw_value_from_vo(var_data));

                    if (DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('get_exact_param_from_buffer_or_bdd:e:' + (e ? JSON.stringify(e) : null) + ':');
                    }

                    if (e) {
                        await this.filter_var_datas_by_indexes([e], false, false, true);
                        return e;
                    }
                }

                let res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(var_data._type, [var_data], null);

                if (DEBUG_VARS) {
                    ConsoleHandler.getInstance().log('get_exact_param_from_buffer_or_bdd:res:' + (res ? JSON.stringify(res) : null) + ':');
                }

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

        let env = ConfigurationService.getInstance().node_configuration;

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
     * @returns true if there's at least one vardata waiting to be computed (having no valid value)
     */
    public has_vardata_waiting_for_computation(): boolean {
        let vars_datas_buffer = this.vars_datas_buffer.filter((v) => !VarsServerController.getInstance().has_valid_value(v.var_data));
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

    // Changement de logique, on construit l'arbre et petit à petit on dépile des vars en attente de calcul jusqu'à avoir épuisé le temps restant estimé acceptable
    // /**
    //  * On charge en priorité depuis le buffer, puisque si le client demande des calculs on va les mettre en priorité ici, avant de calculer puis les remettre en attente d'insertion en base
    //  *  (dont en fait elles partent juste jamais)
    //  * On utilise l'extimation de coût pour 1000 card pour se limiter au temps imposé (la dernière var prise dépasse du temps imposé)
    //  * @param client_request_estimated_ms_limit poids de calcul autorisé (en ms estimées) pour des demandes issues du client
    //  * @param bg_estimated_ms_limit poids de calcul autorisé (en ms estimées) pour des demandes issues d'une invalidation en bdd
    //  */
    // public async get_vars_to_compute_from_buffer_or_bdd(
    //     client_request_estimated_ms_limit: number,
    //     client_request_min_nb_vars: number,
    //     bg_estimated_ms_limit: number,
    //     bg_min_nb_vars: number
    // ): Promise<{ [index: string]: VarDataBaseVO }> {

    //     if (!BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
    //         return;
    //     }

    //     return await PerfMonServerController.getInstance().monitor_async(
    //         PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsDatasProxy__get_vars_to_compute_from_buffer_or_bdd],
    //         async () => {

    //             let res: { [index: string]: VarDataBaseVO } = {};
    //             let estimated_ms: number = 0;
    //             let nb_vars: number = 0;

    //             /**
    //              * Si c'est suite à un redémarrage on check si on a des vars en attente de test en BDD
    //              *  Si c'est le cas on gère la première de ces vars, sinon on enlève le mode démarrage
    //              */
    //             let vardata_to_test: VarDataBaseVO = VarsDatasProxy.getInstance().can_load_vars_to_test ? await SlowVarKiHandler.getInstance().handle_slow_var_ki_start() : null;
    //             if (vardata_to_test) {
    //                 res[vardata_to_test.index] = vardata_to_test;
    //                 ConsoleHandler.getInstance().log('get_vars_to_compute:1 SLOWVAR:' + vardata_to_test.index);
    //                 return res;
    //             }
    //             VarsDatasProxy.getInstance().can_load_vars_to_test = false;

    //             /**
    //              * On commence par collecter le max de datas depuis le buffer : Les conditions de sélection d'un var :
    //              *  - est-ce que la data a une valeur undefined ? oui => sélectionnée
    //              *  - est-ce que la data peut expirer et a expiré ? oui => sélectionnée
    //              */

    //             /**
    //              * On va présélectionner les vars_datas qui ont pas une valeur valide et qui sont issues du clients, puis celles sans valeur valide et issues d'ailleurs
    //              */

    //             estimated_ms = this.select_vars_from_buffer(
    //                 (v) => v.is_client_var && !VarsServerController.getInstance().has_valid_value(v.var_data),
    //                 estimated_ms,
    //                 client_request_estimated_ms_limit,
    //                 nb_vars,
    //                 client_request_min_nb_vars,
    //                 res
    //             );
    //             if (estimated_ms >= client_request_min_nb_vars) {
    //                 ConsoleHandler.getInstance().log('get_vars_to_compute:buffer:nb:' + Object.keys(res).length + ':estimated_ms:' + estimated_ms + ':');
    //                 return res;
    //             }

    //             estimated_ms = this.select_vars_from_buffer(
    //                 (v) => (!v.is_client_var) && !VarsServerController.getInstance().has_valid_value(v.var_data),
    //                 estimated_ms,
    //                 client_request_estimated_ms_limit,
    //                 nb_vars,
    //                 client_request_min_nb_vars,
    //                 res
    //             );

    //             ConsoleHandler.getInstance().log(
    //                 'get_vars_to_compute:buffer:nb:' + ((estimated_ms != null) ? Object.keys(res).length : 0) + ':estimated_ms:' + estimated_ms + ':');
    //             return res;
    //         },
    //         this
    //     );
    // }

    // /**
    //  * @param condition
    //  * @param estimated_ms
    //  * @param client_request_estimated_ms_limit
    //  * @param nb_vars
    //  * @param client_request_min_nb_vars
    //  * @param res
    //  * @returns estimated_ms mis à jour si on a sélectionné des éléments, sinon null
    //  */
    // private select_vars_from_buffer(
    //     condition: (v: VarDataProxyWrapperVO<VarDataBaseVO>) => boolean,
    //     estimated_ms: number,
    //     client_request_estimated_ms_limit: number,
    //     nb_vars: number,
    //     client_request_min_nb_vars: number,
    //     res: { [index: string]: VarDataBaseVO }
    // ): number {

    //     let ordered_vars_datas_buffer = this.vars_datas_buffer.filter(condition);
    //     this.order_vars_datas_buffer(ordered_vars_datas_buffer);

    //     for (let i in ordered_vars_datas_buffer) {

    //         if (((estimated_ms >= client_request_estimated_ms_limit) && (nb_vars >= client_request_min_nb_vars)) ||
    //             (estimated_ms >= client_request_estimated_ms_limit * 10000)) {
    //             ConsoleHandler.getInstance().log('get_vars_to_compute:buffer:nb:' + nb_vars + ':estimated_ms:' + estimated_ms + ':');
    //             return estimated_ms;
    //         }

    //         let var_data_wrapper = ordered_vars_datas_buffer[i];
    //         if (!condition(var_data_wrapper)) {
    //             continue;
    //         }

    //         let estimated_ms_var = var_data_wrapper.estimated_ms;

    //         // cas spécifique isolement d'une var trop gourmande : on ne l'ajoute pas si elle est délirante et qu'il y a déjà des vars en attente par ailleurs
    //         if ((estimated_ms_var > (client_request_estimated_ms_limit * 10000)) && (nb_vars > 0)) {
    //             continue;
    //         }

    //         nb_vars += res[var_data_wrapper.var_data.index] ? 0 : 1;
    //         res[var_data_wrapper.var_data.index] = var_data_wrapper.var_data;
    //         estimated_ms += estimated_ms_var;
    //         var_data_wrapper.is_requested = true;

    //         // cas spécifique isolement d'une var trop gourmande : si elle a été ajoutée mais seule, on skip la limite minimale de x vars pour la traiter seule
    //         if ((estimated_ms_var > (client_request_estimated_ms_limit * 10000)) && (nb_vars == 1)) {
    //             return estimated_ms;
    //         }
    //     }

    //     return estimated_ms;
    // }

    private prepare_current_batch_ordered_pick_list() {
        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];

        let ordered_client_vars_datas_buffer = this.vars_datas_buffer.filter((v) => v.is_client_var && !VarsServerController.getInstance().has_valid_value(v.var_data));
        this.order_vars_datas_buffer(ordered_client_vars_datas_buffer);

        let ordered_non_client_vars_datas_buffer = this.vars_datas_buffer.filter((v) => (!v.is_client_var) && !VarsServerController.getInstance().has_valid_value(v.var_data));
        this.order_vars_datas_buffer(ordered_non_client_vars_datas_buffer);

        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = ordered_client_vars_datas_buffer.concat(ordered_non_client_vars_datas_buffer);
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

    // private order_vars_datas_buffer() {

    //     this.vars_datas_buffer.sort((a: VarDataProxyWrapperVO<VarDataBaseVO>, b: VarDataProxyWrapperVO<VarDataBaseVO>): number => {

    //         return a.estimated_ms - b.estimated_ms;
    //     });
    // }

    private check_or_update_var_buffer(handle_var: VarDataBaseVO) {

        for (let i in this.vars_datas_buffer) {
            let var_data_buffer = this.vars_datas_buffer[i];

            if (var_data_buffer.var_data.index != handle_var.index) {
                continue;
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
            }
        }
    }
}