

import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import SlowVarVO from '../../../shared/modules/Var/vos/SlowVarVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ForkedTasksController from '../Fork/ForkedTasksController';
import VarsCacheController from '../Var/VarsCacheController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import NotifVardatasParam from './notifs/NotifVardatasParam';
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

    public static PARAM_NAME_filter_var_datas_by_index_size_limit = 'VarsDatasProxy.filter_var_datas_by_index_size_limit';

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
    public async select_var_from_buffer(): Promise<VarDataProxyWrapperVO<VarDataBaseVO>> {

        if (!VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list) {
            await this.prepare_current_batch_ordered_pick_list();
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

    public async get_var_datas_or_ask_to_bgthread(params: VarDataBaseVO[], notifyable_vars: VarDataBaseVO[], needs_computation: VarDataBaseVO[], client_user_id: number, client_tab_id: string, is_server_request: boolean, reason: string): Promise<void> {
        let env = ConfigurationService.node_configuration;

        if ((!params) || (!params.length)) {
            return;
        }

        if (env.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("get_var_datas_or_ask_to_bgthread:IN:" + params.length);
        }
        let varsdata: VarDataBaseVO[] = await VarsDatasProxy.getInstance().get_exact_params_from_buffer_or_bdd(params);
        if (env.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("get_var_datas_or_ask_to_bgthread:get_exact_params_from_buffer_or_bdd:OUT:" + params.length + ":" + (varsdata ? varsdata.length : 'N/A'));
        }

        if (varsdata) {

            let vars_data_to_prepend: VarDataBaseVO[] = [];

            varsdata.forEach((vardata) => {
                if (VarsServerController.getInstance().has_valid_value(vardata)) {

                    if (env.DEBUG_VARS) {
                        ConsoleHandler.log(
                            'get_var_datas_or_ask_to_bgthread:notifyable_var' +
                            ':index| ' + vardata._bdd_only_index + " :value|" + vardata.value + ":value_ts|" + vardata.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[vardata.value_type] +
                            ':client_user_id|' + client_user_id + ':client_tab_id| ' + client_tab_id + " :is_server_request|" + is_server_request + ":value_ts|" + vardata.value_ts + ":reason|" + reason
                        );
                    }

                    notifyable_vars.push(vardata);
                } else {

                    if (env.DEBUG_VARS) {
                        ConsoleHandler.log(
                            'get_var_datas_or_ask_to_bgthread:unnotifyable_var' +
                            ':index| ' + vardata._bdd_only_index + " :value|" + vardata.value + ":value_ts|" + vardata.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[vardata.value_type] +
                            ':client_user_id|' + client_user_id + ':client_tab_id| ' + client_tab_id + " :is_server_request|" + is_server_request + ":value_ts|" + vardata.value_ts + ":reason|" + reason
                        );
                    }
                }

                let var_cache_conf = VarsServerController.getInstance().varcacheconf_by_var_ids[vardata.var_id];

                if (var_cache_conf.use_cache_read_ms_to_partial_clean) {
                    vars_data_to_prepend.push(vardata);
                }
            });

            if (vars_data_to_prepend.length > 0) {
                await VarsDatasProxy.getInstance().prepend_var_datas(vars_data_to_prepend, client_user_id, client_tab_id, is_server_request, reason, true);
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

                if (env.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("get_var_datas_or_ask_to_bgthread:needs_computation:" + params.length + ":" + param.index);
                }
            }

            // On push dans le buffer de mise à jour de la BDD
            await VarsDatasProxy.getInstance().prepend_var_datas(to_prepend, client_user_id, client_tab_id, is_server_request, reason, false);
        }
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser normalement la demande - FIFO
     *  Cas standard
     */
    public async append_var_datas(var_datas: VarDataBaseVO[], reason: string) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_append_var_datas, var_datas)) {
            return;
        }

        await this.filter_var_datas_by_indexes(var_datas, null, null, false, 'append_var_datas:' + reason, false, false);
    }

    /**
     * ATTENTION - Appeler uniquement sur le thread du VarsComputer
     * A utiliser pour prioriser la demande par rapport à toutes les autres - LIFO
     *  Principalement pour le cas d'une demande du navigateur client, on veut répondre ASAP
     *  et si on doit ajuster le calcul on renverra l'info plus tard
     */
    public async prepend_var_datas(var_datas: VarDataBaseVO[], client_user_id: number, client_tab_id: string, is_server_request: boolean, reason: string, does_not_need_insert_or_update: boolean) {
        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("prepend_var_datas:IN:" + var_datas.length + ":" + client_user_id + ":" + client_tab_id + ":" + is_server_request + ":" + reason);
        }

        if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_prepend_var_datas, var_datas, client_user_id, client_tab_id, is_server_request, reason, does_not_need_insert_or_update)) {
            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("prepend_var_datas:OUT not bgthread:" + var_datas.length + ":" + client_user_id + ":" + client_tab_id + ":" + is_server_request + ":" + reason);
            }
            return;
        }

        await this.filter_var_datas_by_indexes(var_datas, client_user_id, client_tab_id, is_server_request, 'prepend_var_datas:' + reason, false, does_not_need_insert_or_update);
        if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("prepend_var_datas:OUT:" + var_datas.length + ":" + client_user_id + ":" + client_tab_id + ":" + is_server_request + ":" + reason);
        }
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

        let env = ConfigurationService.node_configuration;

        let start_time = Dates.now();
        let real_start_time = start_time;

        while (this.semaphore_handle_buffer) {
            let actual_time = Dates.now();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.warn('VarsDatasProxy:handle_buffer:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            await ThreadHandler.sleep(9);
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

                    // Si on timeout (hors pixel) et qu'on a pas de read depuis le dernier insert, on supprime du cache
                    // Sinon on insert les nouvelles données de read
                    if (!wrapper.nb_reads_since_last_insert_or_update) {
                        if (Dates.now() > wrapper.timeout) {
                            do_delete_from_cache_indexes[index] = true;
                        }
                    } else {
                        if (Dates.now() > wrapper.timeout) {
                            do_insert = true;
                        }
                    }

                    // Bizarre ça : pour moi ça empeche de mettre en base les infos de read.
                    // if ((!do_delete_from_cache_indexes[index]) && (!do_insert) && (wrapper.nb_reads_since_last_check)) {
                    //     wrapper.nb_reads_since_last_check = 0;
                    //     wrapper.update_timeout();
                    // }
                }

                if (conf.pixel_activated) {
                    // Si c'est un pixel, on peut le supprimer du cache (en mémoire pas en base évidemment)
                    do_delete_from_cache_indexes[index] = true;
                }

                if (do_insert && VarsCacheController.getInstance().BDD_do_cache_param_data(handle_var, controller, (!!wrapper.is_server_request) || (!!wrapper.client_tab_id))) {

                    if (!to_insert_by_type[handle_var._type]) {
                        to_insert_by_type[handle_var._type] = [];
                    }
                    to_insert_by_type[handle_var._type].push(handle_var);

                    if (env.DEBUG_VARS) {
                        ConsoleHandler.log('handle_buffer:insertOrUpdateVO' +
                            ':index| ' + handle_var._bdd_only_index + " :value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type] +
                            ':client_user_id|' + wrapper.client_user_id + ':client_tab_id|' + wrapper.client_tab_id + ':is_server_request|' + wrapper.is_server_request + ':reason|' + wrapper.reason);
                    }
                }
            }

            if (ObjectHandler.getInstance().hasAtLeastOneAttribute(to_insert_by_type)) {

                let promises = [];
                let result = true;
                for (let api_type_id in to_insert_by_type) {
                    let to_insert = to_insert_by_type[api_type_id];

                    // on filtre les vars qui ont des indexs trops gros pour postgresql
                    let filtered_insert = await this.filter_var_datas_by_index_size_limit(to_insert);

                    if ((!filtered_insert) || (!filtered_insert.length)) {
                        continue;
                    }

                    promises.push((async () => {
                        if (!await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(filtered_insert)) {
                            result = false;
                        }

                        /**
                         * Par contre si ça marche il faut mettre à jour les ids dans le cache
                         */
                        let filtered_insert_by_index: { [index: string]: VarDataBaseVO } = {};
                        for (let i in filtered_insert) {
                            let var_data = filtered_insert[i];
                            filtered_insert_by_index[var_data.index] = var_data;
                        }
                        let inserted_vars: VarDataBaseVO[] = await query(api_type_id).filter_by_text_has('_bdd_only_index', to_insert.map((var_data: VarDataBaseVO) => var_data.index)).select_vos<VarDataBaseVO>();

                        for (let i in inserted_vars) {
                            let inserted_var = inserted_vars[i];

                            filtered_insert_by_index[inserted_var.index].id = inserted_var.id;
                        }
                    })());
                }
                await all_promises(promises);

                if (!result) {
                    ConsoleHandler.error('VarsDatasProxy:handle_buffer:insert_without_triggers_using_COPY:Erreur - on garde dans le cache pour une prochaine tentative');
                }

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
                    }
                }
            }

            for (let index in do_delete_from_cache_indexes) {
                delete self.vars_datas_buffer_wrapped_indexes[index];
            }

        } catch (error) {
            ConsoleHandler.error(error);
        } finally {
            this.semaphore_handle_buffer = false;
        }
    }

    /**
     * Check la taille des champs de type ranges au format texte pour parer au bug de postgresql 13 :
     *  'exceeds btree version 4 maximum 2704 for index'
     * @param vardatas
     * @returns
     */
    public async filter_var_datas_by_index_size_limit(vardatas: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {
        let res: VarDataBaseVO[] = [];
        let vars_by_type: { [type: string]: VarDataBaseVO[] } = {};

        // A priori la limite à pas à être de 2700, le champ est compressé par la suite, mais ça permet d'être sûr
        let limit = await ModuleParams.getInstance().getParamValueAsInt(VarsDatasProxy.PARAM_NAME_filter_var_datas_by_index_size_limit, 2700, 180000);

        for (let i in vardatas) {
            let var_data = vardatas[i];
            if (!vars_by_type[var_data._type]) {
                vars_by_type[var_data._type] = [];
            }
            vars_by_type[var_data._type].push(var_data);
        }

        for (let _type in vars_by_type) {
            let vars = vars_by_type[_type];

            let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(_type);

            for (let i in vars) {
                let vardata = vars[i];
                let refuse_var = false;

                for (let j in matroid_fields) {
                    let matroid_field = matroid_fields[j];

                    let matroid_field_value = vardata[matroid_field.field_id];
                    let matroid_field_value_index = RangeHandler.translate_to_bdd(matroid_field_value);
                    if (matroid_field_value_index && (matroid_field_value_index.length > limit)) {
                        ConsoleHandler.warn('VarsDatasProxy:filter_var_datas_by_index_size_limit:Le champ ' + matroid_field.field_id + ' de la matrice ' + _type + ' est trop long pour être indexé par postgresql, on le supprime de la requête:index:' + vardata.index);
                        refuse_var = true;
                        break;
                    }
                }

                if (!refuse_var) {
                    res.push(vardata);
                }
            }
        }
        return res;
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T, is_server_request: boolean, reason: string): Promise<T> {

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

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
            ConsoleHandler.log('get_exact_param_from_buffer_or_bdd:res:' + (res ? JSON.stringify(res) : null) + ':');
        }

        if (!!res) {
            let cached_res: T[] = await this.filter_var_datas_by_indexes([res], null, null, is_server_request, 'get_exact_param_from_buffer_or_bdd:' + reason, false, true) as T[];
            return cached_res[0];
        }
        return null;
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     * On optimise la recherche en base en faisant un seul appel
     */
    public async get_exact_params_from_buffer_or_bdd<T extends VarDataBaseVO>(var_datas: T[]): Promise<T[]> {

        let env = ConfigurationService.node_configuration;

        let res: T[] = [];
        let promises = [];

        for (let i in var_datas) {
            let var_data = var_datas[i];

            if ((!var_data) || (!var_data.check_param_is_valid)) {
                ConsoleHandler.error('Paramètre invalide dans get_exact_params_from_buffer_or_bdd:' + JSON.stringify(var_data));
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
                        ConsoleHandler.log(
                            'get_exact_params_from_buffer_or_bdd:vars_datas_buffer' +
                            ':index| ' + var_data._bdd_only_index + " :value|" + var_data.value + ":value_ts|" + var_data.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[var_data.value_type] +
                            ':client_user_id|' + wrapper.client_user_id + ':client_tab_id|' + wrapper.client_tab_id + ':is_server_request|' + wrapper.is_server_request + ':reason|' + wrapper.reason);
                    }
                }
            }

            if (e) {
                res.push(e);
            } else {

                if (!var_data.check_param_is_valid(var_data._type)) {
                    ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage:' + var_data.index);
                    continue;
                }

                promises.push((async () => {
                    let bdd_res: T = await ModuleVar.getInstance().get_var_data_by_index<T>(var_data._type, var_data.index);

                    if (!!bdd_res) {

                        if (env.DEBUG_VARS) {
                            let bdd_wrapper = this.vars_datas_buffer_wrapped_indexes[bdd_res.index];

                            ConsoleHandler.log(
                                'get_exact_params_from_buffer_or_bdd:bdd_res' +
                                ':index| ' + bdd_res._bdd_only_index + " :value|" + bdd_res.value + ":value_ts|" + bdd_res.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[bdd_res.value_type] +
                                ':client_user_id|' + (bdd_wrapper ? bdd_wrapper.client_user_id : 'N/A') +
                                ':client_tab_id|' + (bdd_wrapper ? bdd_wrapper.client_tab_id : 'N/A') +
                                ':is_server_request|' + (bdd_wrapper ? bdd_wrapper.is_server_request : 'N/A') + ':reason|' + (bdd_wrapper ? bdd_wrapper.reason : 'N/A'));
                        }

                        res.push(bdd_res);
                    }
                })());
            }
        }

        await Promise.all(promises);

        return res;
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
    public async update_existing_buffered_older_datas(var_datas: VarDataBaseVO[], reason: string) {

        if ((!var_datas) || (!var_datas.length)) {
            return;
        }

        if (!await ForkedTasksController.getInstance().exec_self_on_bgthread(VarsdatasComputerBGThread.getInstance().name, VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, var_datas)) {
            return;
        }

        for (let i in var_datas) {
            let var_data = var_datas[i];
            let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
            if (!wrapper) {
                continue;
            }

            wrapper.var_data = var_data;
            wrapper.reason = reason;
        }
    }

    /**
     * On ordonne toutes les demandes de calcul, et on met à jour au passage les registered si ya eu des désinscriptions entre temps :
     *  D'un côté si on a des vars registered sur main mais unregistered dans le cache (indiquées comme pas client)
     *      => on met un tab_id bidon mais qui forcera à considérer que c'est client => FIXME TODO faut en fait stocker le tab_id autant que possible lors du register même si déjà en cache
     *  De l'autre si on a des vars unregistered sur main mais registered dans le cache (indiquées comme client)
     *      => on supprime le client_tab_id dans le cache pour déprioriser le calcul
     */
    private async prepare_current_batch_ordered_pick_list() {
        VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];

        let vars_datas_buffer = Object.values(this.vars_datas_buffer_wrapped_indexes);
        let vars_datas_wrapper = vars_datas_buffer ? vars_datas_buffer.filter((v) => !VarsServerController.getInstance().has_valid_value(v.var_data)) : [];
        let vars_datas: VarDataBaseVO[] = vars_datas_wrapper.map((v) => v.var_data);

        if ((!vars_datas) || (!vars_datas.length)) {
            VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];
            // if (ConfigurationService.node_configuration.DEBUG_VARS) {
            ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filtered !has_valid_value:' + (vars_datas_buffer ? vars_datas_buffer.length : 0) + ' => 0');
            // }
            return;
        }
        let nb_vars_in_buffer = vars_datas.length;

        // if (ConfigurationService.node_configuration.DEBUG_VARS) {
        ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filtered !has_valid_value:' + vars_datas_buffer.length + ' => ' + nb_vars_in_buffer);
        // }

        // if (ConfigurationService.node_configuration.DEBUG_VARS) {
        ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filter_by_subs:START:' + nb_vars_in_buffer);
        // }
        let registered_var_datas_indexes: string[] = await VarsTabsSubsController.getInstance().filter_by_subs(vars_datas.map((v) => v.index));
        registered_var_datas_indexes = registered_var_datas_indexes ? registered_var_datas_indexes : [];
        // if (ConfigurationService.node_configuration.DEBUG_VARS) {
        ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filter_by_subs:END:' + nb_vars_in_buffer);
        // }

        let registered_var_datas_indexes_map: { [index: string]: boolean } = {};
        for (let i in registered_var_datas_indexes) {
            registered_var_datas_indexes_map[registered_var_datas_indexes[i]] = true;
        }

        let unregistered_var_datas_wrappers_map: { [index: string]: VarDataProxyWrapperVO<VarDataBaseVO> } = {};
        for (let i in vars_datas) {
            let index = vars_datas[i].index;

            if (!registered_var_datas_indexes_map[index]) {
                unregistered_var_datas_wrappers_map[index] = this.vars_datas_buffer_wrapped_indexes[index];
            }
        }

        /**
         * On clean le cache au passage, en retirant les vars inutiles à ce stade :
         * - les vars unregistered
         * - ni demandée par le serveur ni par un client
         * - qui n'ont pas besoin d'être mise en bdd
         */
        if (unregistered_var_datas_wrappers_map && ObjectHandler.getInstance().hasAtLeastOneAttribute(unregistered_var_datas_wrappers_map)) {

            let removed_vars: number = 0;
            for (let i in unregistered_var_datas_wrappers_map) {
                let unregistered_var_datas_wrapper = unregistered_var_datas_wrappers_map[i];

                if ((!!unregistered_var_datas_wrapper.client_tab_id) || (!!unregistered_var_datas_wrapper.client_user_id)) {
                    // En fait on a un client_tab_id mais sur une var unregistered donc on peut peut-être s'en débarrasser quand même ...
                    // continue;
                }

                if (unregistered_var_datas_wrapper.is_server_request) {
                    // est-ce qu'on est sensé arriver dans ce cas ?
                    continue;
                }

                if (unregistered_var_datas_wrapper.needs_insert_or_update) {
                    continue;
                }

                delete this.vars_datas_buffer_wrapped_indexes[unregistered_var_datas_wrapper.var_data._bdd_only_index];
                removed_vars++;
            }

            if (removed_vars > 0) {

                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log('VarsDatasProxy: removed ' + removed_vars + ' unregistered vars from cache');
                }

                vars_datas_wrapper = Object.values(this.vars_datas_buffer_wrapped_indexes);
                vars_datas = vars_datas_wrapper.map((v) => v.var_data);

                if ((!vars_datas) || (!vars_datas.length)) {
                    VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];
                    return;
                }
                nb_vars_in_buffer = vars_datas.length;
            }
        }

        let nb_registered_vars_in_buffer = registered_var_datas_indexes.length;

        ConsoleHandler.log('VarsDatasProxy.prepare_current_batch_ordered_pick_list:nb_vars_in_buffer|' + nb_vars_in_buffer + ':nb_registered_vars_in_buffer|' + nb_registered_vars_in_buffer);

        let registered_var_datas_by_index: { [index: string]: VarDataBaseVO } = {};
        for (let i in registered_var_datas_indexes) {
            let var_data_index = registered_var_datas_indexes[i];
            registered_var_datas_by_index[var_data_index] = this.vars_datas_buffer_wrapped_indexes[var_data_index].var_data;
        }
        for (let i in vars_datas_wrapper) {
            let var_data_wrapper = vars_datas_wrapper[i];

            let registered_var_data = registered_var_datas_by_index[var_data_wrapper.var_data.index];

            if ((!registered_var_data) && (var_data_wrapper.client_tab_id)) {
                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log('removing client tab:' + var_data_wrapper.var_data.index);
                }
                var_data_wrapper.client_tab_id = null;
                var_data_wrapper.client_user_id = null;
                continue;
            }

            if ((!!registered_var_data) && (!var_data_wrapper.client_tab_id)) {
                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.warn('FIXME: Should have updated the client_tab_id in the cache when registering the param');
                }
                var_data_wrapper.client_user_id = NaN;
                var_data_wrapper.client_tab_id = 'FIXME';
            }
        }

        let ordered_client_vars_datas_buffer = vars_datas_wrapper.filter((v) => v.client_tab_id && !VarsServerController.getInstance().has_valid_value(v.var_data));
        this.order_vars_datas_buffer(ordered_client_vars_datas_buffer);

        let ordered_non_client_vars_datas_buffer = vars_datas_wrapper.filter((v) => (!v.client_tab_id) && !VarsServerController.getInstance().has_valid_value(v.var_data));
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
    private async filter_var_datas_by_indexes(var_datas: VarDataBaseVO[], client_user_id: number, client_socket_id: string, is_server_request: boolean, reason: string, donot_insert_if_absent: boolean, just_been_loaded_from_db: boolean): Promise<VarDataBaseVO[]> {

        let res: VarDataBaseVO[] = [];

        if (!BGThreadServerController.getInstance().valid_bgthreads_names[VarsdatasComputerBGThread.getInstance().name]) {
            throw new Error('VarsDatasProxy.filter_var_datas_by_indexes: invalid bgthread name');
        }

        if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
            ConsoleHandler.log("filter_var_datas_by_indexes:IN:" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
        }

        for (let i in var_datas) {
            let var_data = var_datas[i];

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("filter_var_datas_by_indexes:var_data:" + var_data.index + ":" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
            }

            if (this.vars_datas_buffer_wrapped_indexes[var_data.index]) {

                if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                    ConsoleHandler.log("filter_var_datas_by_indexes:!!wrapper:" + var_data.index + ":" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
                }

                let wrapper = this.vars_datas_buffer_wrapped_indexes[var_data.index];
                res.push(wrapper.var_data);

                // Si on avait un id et que la nouvelle valeur n'en a pas, on concerve l'id précieusement
                if (var_data && wrapper.var_data && (!var_data.id) && (wrapper.var_data.id)) {
                    var_data.id = wrapper.var_data.id;
                }

                /**
                 * Si on demande avec un vardata quasi vide (sans valeur, sans value_ts) et que ça existe déjà dans le cache avec une valid value,
                 *  on demande de notifier directement la var_data du cache.
                 */
                if ((!VarsServerController.getInstance().has_valid_value(var_data)) &&
                    (VarsServerController.getInstance().has_valid_value(wrapper.var_data))) {

                    await VarsTabsSubsController.getInstance().notify_vardatas(
                        [new NotifVardatasParam([wrapper.var_data])]);
                    await VarsServerCallBackSubsController.getInstance().notify_vardatas([wrapper.var_data]);

                    continue;
                }

                /**
                 * Sinon, si on a dans le cache une version incomplète (sans valeur, sans value_ts) et que la demande est complète (avec valeur, avec value_ts),
                 * on met à jour la version du cache avec la demande
                 */
                if ((!VarsServerController.getInstance().has_valid_value(wrapper.var_data)) &&
                    (VarsServerController.getInstance().has_valid_value(var_data))) {

                    wrapper.var_data = var_data;
                }

                // Si on dit qu'on vient de la charger de la base, on peut stocker l'info de dernière mise à jour en bdd
                if (just_been_loaded_from_db) {
                    wrapper.last_insert_or_update = Dates.now();
                    wrapper.update_timeout();
                }

                this.add_read_stat(wrapper);

                // Si on met en cache une data à calculer on s'assure qu'on a bien un calcul qui vient rapidement
                if (!VarsServerController.getInstance().has_valid_value(wrapper.var_data)) {
                    VarsdatasComputerBGThread.getInstance().force_run_asap();
                }
                continue;
            }

            if (donot_insert_if_absent) {
                continue;
            }

            if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
                ConsoleHandler.log("filter_var_datas_by_indexes:!wrapper:" + var_data.index + ":" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
            }

            this.vars_datas_buffer_wrapped_indexes[var_data.index] = new VarDataProxyWrapperVO(
                var_data, client_user_id, client_socket_id, is_server_request, reason,
                !just_been_loaded_from_db, 0);
            this.add_read_stat(this.vars_datas_buffer_wrapped_indexes[var_data.index]);
            res.push(this.vars_datas_buffer_wrapped_indexes[var_data.index].var_data);

            // Si on met en cache une data à calculer on s'assure qu'on a bien un calcul qui vient rapidement
            if (!VarsServerController.getInstance().has_valid_value(var_data)) {
                VarsdatasComputerBGThread.getInstance().force_run_asap();
            }
        }

        return res;
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

    private order_vars_datas_buffer(vars_datas_buffer: Array<VarDataProxyWrapperVO<VarDataBaseVO>>) {

        let cardinaux: { [index: string]: number } = {};

        for (let i in vars_datas_buffer) {
            let var_wrapper = vars_datas_buffer[i];
            cardinaux[var_wrapper.var_data.index] = MatroidController.getInstance().get_cardinal(var_wrapper.var_data);
        }

        // Ensuite par hauteur dans l'arbre
        if (!VarsServerController.getInstance().varcontrollers_dag_depths) {
            VarsServerController.getInstance().init_varcontrollers_dag_depths();
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
            if (a.client_tab_id && !b.client_tab_id) {
                return -1;
            }

            if ((!a.client_tab_id) && b.client_tab_id) {
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
            ((var_data_buffer.var_data.value != handle_var.value) && ((!isNaN(var_data_buffer.var_data.value)) || (!isNaN(handle_var.value)))) ||
            (var_data_buffer.var_data.value_ts != handle_var.value_ts) ||
            (var_data_buffer.var_data.value_type != handle_var.value_type)) {
            ConsoleHandler.error(
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