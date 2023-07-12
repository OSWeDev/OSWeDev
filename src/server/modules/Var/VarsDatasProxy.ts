

import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ConfigurationService from '../../env/ConfigurationService';
import ForkedTasksController from '../Fork/ForkedTasksController';
import CurrentVarDAGHolder from './CurrentVarDAGHolder';
import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';

/**
 * L'objectif est de créer un proxy d'accès aux données des vars_datas en base pour qu'on puisse intercaler un buffer de mise à jour progressif en BDD
 *  De cette manière, on peut ne pas attendre de mettre à ajour en bdd avant de refaire un batch de calcul et pour autant profiter de ces valeurs calculées et pas en base
 *  On cherchera alors à dépiler ce buffer dès qu'on a moins de calculs en cours et donc moins besoin de ressources pour les calculs
 */
export default class VarsDatasProxy {

    public static TASK_NAME_add_to_tree_if_necessary_and_return_datas_that_need_notification = 'VarsDatasProxy.add_to_tree_if_necessary_and_return_datas_that_need_notification';

    public static PARAM_NAME_filter_var_datas_by_index_size_limit = 'VarsDatasProxy.filter_var_datas_by_index_size_limit';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */

    public static init() {
        ForkedTasksController.register_task(VarsDatasProxy.TASK_NAME_add_to_tree_if_necessary_and_return_datas_that_need_notification, VarsDatasProxy.add_to_tree_if_necessary_and_return_datas_that_need_notification.bind(this));
    }

    /**
     * CALLABLE FROM ANY THREAD
     * 1 - On cherche dans la bdd => si ok on renvoie comme notifiables
     * 2 - On cherche dans l'arbre
     *      => on demande au bgthread des vars de trouver les vars_datas correspondantes
     *          ou de les insérer dans l'arbre au besoin.
     *      => si on trouve un vardata dans l'arbre et en statut notified_end, on renvoie comme notifiable car ne sera pas notifiée sans intervention externe à ce stade
     *      => dans tous les autres cas on renvoie pas la vardata
     * @param params
     * @returns les vars_datas valides notifiables (depuis la base ou depuis l'arbre, et notified_end - donc qui ne seront plus notifiées par défaut)
     */
    public static async get_var_datas_or_ask_to_bgthread<T extends VarDataBaseVO>(params: T[]): Promise<T[]> {

        if ((!params) || (!params.length)) {
            return null;
        }

        let found: { [index: string]: T } = {};
        let not_found: { [index: string]: T } = {};
        await VarsDatasProxy.get_exact_params_from_bdd(params, found, not_found);

        let not_found_indexs: string[] = Object.keys(not_found);
        let vars_to_notify: T[] = Object.values(found);

        if (not_found_indexs.length) {
            let vars_to_notify_from_tree: T[] = await VarsDatasProxy.add_to_tree_if_necessary_and_return_datas_that_need_notification(not_found_indexs);

            vars_to_notify.push(...vars_to_notify_from_tree);
        }

        return vars_to_notify;
    }

    private static async add_to_tree_if_necessary_and_return_datas_that_need_notification<T extends VarDataBaseVO>(indexs: string[]): Promise<T[]> {
        let vars_to_notify: T[] = [];

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsDatasProxy.TASK_NAME_add_to_tree_if_necessary_and_return_datas_that_need_notification,
                resolve,
                indexs)) {

                return null;
            }

            for (let i in indexs) {
                let index = indexs[i];

                let node: VarDAGNode = await VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(index));

                if ((!node) || (!node.var_data)) {
                    ConsoleHandler.error('VarsDatasProxy.add_to_tree_if_necessary_and_return_datas_that_need_notification: node ou node.var_data null pour index: ' + index);
                    continue;
                }

                if (node.tags[VarDAGNode.TAG_5_NOTIFIED_END]) {
                    vars_to_notify.push(node.var_data as T);
                }
            }

            resolve(vars_to_notify);
        });
    }

    // /**
    //  * ATTENTION - Appeler uniquement sur le thread du VarsComputer
    //  * A utiliser pour prioriser normalement la demande - FIFO
    //  *  Cas standard
    //  */
    // public static async append_var_datas(var_datas: VarDataBaseVO[], reason: string) {
    //     if ((!var_datas) || (!var_datas.length)) {
    //         return;
    //     }

    //     if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsDatasProxy.TASK_NAME_append_var_datas, var_datas)) {
    //         return;
    //     }

    //     await VarsDatasProxy.filter_var_datas_by_indexes(var_datas, null, null, false, 'append_var_datas:' + reason, false, false);
    // }

    // /**
    //  * ATTENTION - Appeler uniquement sur le thread du VarsComputer
    //  * A utiliser pour prioriser la demande par rapport à toutes les autres - LIFO
    //  *  Principalement pour le cas d'une demande du navigateur client, on veut répondre ASAP
    //  *  et si on doit ajuster le calcul on renverra l'info plus tard
    //  */
    // public static async prepend_var_datas(var_datas: VarDataBaseVO[], client_user_id: number, client_tab_id: string, is_server_request: boolean, reason: string, does_not_need_insert_or_update: boolean) {
    //     if ((!var_datas) || (!var_datas.length)) {
    //         return;
    //     }

    //     if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //         ConsoleHandler.log("prepend_var_datas:IN:" + var_datas.length + ":" + client_user_id + ":" + client_tab_id + ":" + is_server_request + ":" + reason);
    //     }

    //     if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsDatasProxy.TASK_NAME_prepend_var_datas, var_datas, client_user_id, client_tab_id, is_server_request, reason, does_not_need_insert_or_update)) {
    //         if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //             ConsoleHandler.log("prepend_var_datas:OUT not bgthread:" + var_datas.length + ":" + client_user_id + ":" + client_tab_id + ":" + is_server_request + ":" + reason);
    //         }
    //         return;
    //     }

    //     await VarsDatasProxy.filter_var_datas_by_indexes(var_datas, client_user_id, client_tab_id, is_server_request, 'prepend_var_datas:' + reason, false, does_not_need_insert_or_update);
    //     if (ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //         ConsoleHandler.log("prepend_var_datas:OUT:" + var_datas.length + ":" + client_user_id + ":" + client_tab_id + ":" + is_server_request + ":" + reason);
    //     }
    // }

    // /**
    //  * On indique en param le nombre de vars qu'on accepte de gérer dans le buffer
    //  *  Le dépilage se fait dans l'ordre de la déclaration, via une itération
    //  *  Si un jour l'ordre diffère dans JS, on passera sur une liste en FIFO, c'est le but dans tous les cas
    //  * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon
    //  */
    // public static async handle_buffer(): Promise<void> {

    //     if (!BGThreadServerController.getInstance().valid_bgthreads_names[VarsBGThreadNameHolder.bgthread_name]) {
    //         return;
    //     }

    //     let env = ConfigurationService.node_configuration;

    //     let start_time = Dates.now();
    //     let real_start_time = start_time;

    //     while (VarsDatasProxy.semaphore_handle_buffer) {
    //         let actual_time = Dates.now();

    //         if (actual_time > (start_time + 60)) {
    //             start_time = actual_time;
    //             ConsoleHandler.warn('VarsDatasProxy:handle_buffer:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
    //         }

    //         await ThreadHandler.sleep(9, 'VarsDatasProxy.handle_buffer');
    //     }
    //     VarsDatasProxy.semaphore_handle_buffer = true;

    //     try {

    //         let indexes = Object.keys(VarsDatasProxy.vars_datas_buffer_wrapped_indexes);
    //         let do_delete_from_cache_indexes: { [index: string]: boolean } = {};
    //         let self = this;

    //         let to_insert_by_type: { [api_type_id: string]: VarDataBaseVO[] } = {};

    //         for (let i in indexes) {
    //             let index = indexes[i];
    //             let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[index];

    //             if (!wrapper) {
    //                 continue;
    //             }

    //             let handle_var = wrapper.var_data;

    //             // Si on a des vars à gérer (!has_valid_value) qui s'insèrent en début de buffer, on doit arrêter le dépilage => surtout pas sinon on tourne en boucle
    //             if (!VarsServerController.has_valid_value(handle_var)) {
    //                 continue;
    //             }

    //             /**
    //              * Si on a besoin d'updater la bdd, on le fait, et on laisse dans le cache pour des reads éventuels
    //              *
    //              * Sinon :
    //              *      - si on a       0  read depuis le dernier insert et TIMEOUT, on supprime du cache
    //              *      - sinon si on a 0  read depuis le dernier insert et !TIMEOUT, on attend
    //              *      - sinon si on a 1+ read depuis le dernier insert et TIMEOUT, on push en BDD
    //              *      - sinon si on a 1+ read depuis le dernier insert et !TIMEOUT, on patiente
    //              *
    //              *      - si on a au moins 1 read depuis le dernier check on prolonge le timing
    //              */

    //             let do_insert = false;
    //             let controller = VarsServerController.getVarControllerById(handle_var.var_id);
    //             let conf = VarsController.var_conf_by_id[handle_var.var_id];

    //             /**
    //              * Cas des pixels : on insere initialement, mais jamais ensuite. les infos de lecture on s'en fiche puisque le cache ne doit jamais être invalidé
    //              */

    //             if (wrapper.needs_insert_or_update) {
    //                 do_insert = true;
    //             } else if ((!conf.pixel_activated) || (!conf.pixel_never_delete)) {

    //                 // Si on timeout (hors pixel) et qu'on a pas de read depuis le dernier insert, on supprime du cache
    //                 // Sinon on insert les nouvelles données de read
    //                 if (!wrapper.nb_reads_since_last_insert_or_update) {
    //                     if (Dates.now() > wrapper.timeout) {
    //                         do_delete_from_cache_indexes[index] = true;
    //                     }
    //                 } else {
    //                     if (Dates.now() > wrapper.timeout) {
    //                         do_insert = true;
    //                     }
    //                 }

    //                 // Bizarre ça : pour moi ça empeche de mettre en base les infos de read.
    //                 // if ((!do_delete_from_cache_indexes[index]) && (!do_insert) && (wrapper.nb_reads_since_last_check)) {
    //                 //     wrapper.nb_reads_since_last_check = 0;
    //                 //     wrapper.update_timeout();
    //                 // }
    //             }

    //             /**
    //              * Cas particulier des pixels qui ne sont pas des pixels : on les supprime du cache et on ne les insert pas en bdd !
    //              */
    //             if (conf.pixel_activated) {

    //                 // Si c'est un pixel, on peut le supprimer du cache (en mémoire pas en base évidemment)
    //                 do_delete_from_cache_indexes[index] = true;

    //                 // c'est géré en aval par la stratégie de cache en théorie => c'est le cas, mais si incohérence de param entre la strétégie de cache et
    //                 // le varconf, cela permet de s'assurer qu'on n'insère pas en bdd un non pixel qui sera traité comme tel
    //                 if (PixelVarDataController.getInstance().get_pixel_card(handle_var) != 1) {
    //                     // Si la var est pixellisée mais que le param n'est pas un pixel, on ne l'insert pas en bdd
    //                     do_insert = false;
    //                 }
    //             }

    //             if (do_insert && VarsCacheController.getInstance().BDD_do_cache_param_data(handle_var, controller, (!!wrapper.is_server_request) || (!!wrapper.client_tab_id))) {

    //                 if (!to_insert_by_type[handle_var._type]) {
    //                     to_insert_by_type[handle_var._type] = [];
    //                 }
    //                 to_insert_by_type[handle_var._type].push(handle_var);

    //                 if (env.DEBUG_VARS) {
    //                     ConsoleHandler.log('handle_buffer:insertOrUpdateVO' +
    //                         ':index| ' + handle_var._bdd_only_index + " :value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type] +
    //                         ':client_user_id|' + wrapper.client_user_id + ':client_tab_id|' + wrapper.client_tab_id + ':is_server_request|' + wrapper.is_server_request + ':reason|' + wrapper.reason);
    //                 }
    //             }
    //         }

    //         if (ObjectHandler.hasAtLeastOneAttribute(to_insert_by_type)) {

    //             let promises = [];
    //             let result = true;
    //             for (let api_type_id in to_insert_by_type) {
    //                 let to_insert = to_insert_by_type[api_type_id];

    //                 // on filtre les vars qui ont des indexs trops gros pour postgresql
    //                 let filtered_insert = await VarsDatasProxy.filter_var_datas_by_index_size_limit(to_insert);

    //                 if ((!filtered_insert) || (!filtered_insert.length)) {
    //                     continue;
    //                 }

    //                 promises.push((async () => {
    //                     if (!await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(filtered_insert, null, true)) {
    //                         result = false;
    //                     }

    //                     /**
    //                      * Par contre si ça marche il faut mettre à jour les ids dans le cache
    //                      */
    //                     let filtered_insert_by_index: { [index: string]: VarDataBaseVO } = {};
    //                     for (let i in filtered_insert) {
    //                         let var_data = filtered_insert[i];
    //                         filtered_insert_by_index[var_data.index] = var_data;
    //                     }
    //                     let inserted_vars: Array<{ id: string, _bdd_only_index: string }> = await query(api_type_id)
    //                         .field('id')
    //                         .field('_bdd_only_index')
    //                         .filter_by_text_has('_bdd_only_index', to_insert.map((var_data: VarDataBaseVO) => var_data.index)).exec_as_server().select_all();

    //                     for (let i in inserted_vars) {
    //                         let inserted_var = inserted_vars[i];

    //                         filtered_insert_by_index[inserted_var._bdd_only_index].id = parseInt(inserted_var.id);
    //                     }
    //                 })());
    //             }
    //             await all_promises(promises);

    //             if (!result) {
    //                 ConsoleHandler.error('VarsDatasProxy:handle_buffer:insert_without_triggers_using_COPY:Erreur - on garde dans le cache pour une prochaine tentative');
    //             }

    //             for (let i in to_insert_by_type) {
    //                 let to_insert = to_insert_by_type[i];

    //                 for (let j in to_insert) {
    //                     let inserted_var_data = to_insert[j];
    //                     let index: string = inserted_var_data.index;
    //                     let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[index];

    //                     /**
    //                      * On s'assure qu'on a bien la même info dans le cache (cf https://trello.com/c/XkGripbS/1668-pb-de-redondance-de-calcul-sur-els-vars-on-fait-2-fois-le-calcul-ici-pkoi)
    //                      */
    //                     let to_notify: boolean = VarsDatasProxy.check_or_update_var_buffer(inserted_var_data);

    //                     if (to_notify) {
    //                         await VarsTabsSubsController.notify_vardatas(
    //                             [new NotifVardatasParam([inserted_var_data])]);
    //                         await VarsServerCallBackSubsController.notify_vardatas([inserted_var_data]);
    //                     }

    //                     if (!wrapper) {
    //                         continue;
    //                     }

    //                     wrapper.nb_reads_since_last_insert_or_update = 0;
    //                     wrapper.nb_reads_since_last_check = 0;
    //                     wrapper.needs_insert_or_update_ = false;
    //                     wrapper.var_data_origin_value = wrapper.var_data.value;
    //                     wrapper.var_data_origin_type = wrapper.var_data.value_type;
    //                     wrapper.last_insert_or_update = Dates.now();
    //                     wrapper.update_timeout();
    //                 }
    //             }
    //         }

    //         for (let index in do_delete_from_cache_indexes) {
    //             delete self.vars_datas_buffer_wrapped_indexes[index];
    //         }

    //     } catch (error) {
    //         ConsoleHandler.error(error);
    //     } finally {
    //         VarsDatasProxy.semaphore_handle_buffer = false;
    //     }
    // }

    // /**
    //  * Check la taille des champs de type ranges au format texte pour parer au bug de postgresql 13 :
    //  *  'exceeds btree version 4 maximum 2704 for index'
    //  * @param vardatas
    //  * @returns
    //  */
    // public static async filter_var_datas_by_index_size_limit(vardatas: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {
    //     let res: VarDataBaseVO[] = [];
    //     let vars_by_type: { [type: string]: VarDataBaseVO[] } = {};

    //     // A priori la limite à pas à être de 2700, le champ est compressé par la suite, mais ça permet d'être sûr
    //     let limit = await ModuleParams.getInstance().getParamValueAsInt(VarsDatasProxy.PARAM_NAME_filter_var_datas_by_index_size_limit, 2700, 180000);

    //     for (let i in vardatas) {
    //         let var_data = vardatas[i];
    //         if (!vars_by_type[var_data._type]) {
    //             vars_by_type[var_data._type] = [];
    //         }
    //         vars_by_type[var_data._type].push(var_data);
    //     }

    //     for (let _type in vars_by_type) {
    //         let vars = vars_by_type[_type];

    //         let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getMatroidFields(_type);

    //         for (let i in vars) {
    //             let vardata = vars[i];
    //             let refuse_var = false;

    //             for (let j in matroid_fields) {
    //                 let matroid_field = matroid_fields[j];

    //                 let matroid_field_value = vardata[matroid_field.field_id];
    //                 let matroid_field_value_index = RangeHandler.translate_to_bdd(matroid_field_value);
    //                 if (matroid_field_value_index && (matroid_field_value_index.length > limit)) {
    //                     ConsoleHandler.warn('VarsDatasProxy:filter_var_datas_by_index_size_limit:Le champ ' + matroid_field.field_id + ' de la matrice ' + _type + ' est trop long pour être indexé par postgresql, on le supprime de la requête:index:' + vardata.index);
    //                     refuse_var = true;
    //                     break;
    //                 }
    //             }

    //             if (!refuse_var) {
    //                 res.push(vardata);
    //             }
    //         }
    //     }
    //     return res;
    // }

    // /**
    //  * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
    //  */
    // public static async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T, is_server_request: boolean, reason: string): Promise<T> {

    //     let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

    //     if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsBGThreadNameHolder.bgthread_name]) {
    //         if (VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index]) {

    //             // TODO On stocke l'info de l'accès
    //             let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index];
    //             VarsDatasProxy.add_read_stat(wrapper);
    //             return wrapper.var_data as T;
    //         }
    //     }

    //     let res: T = await ModuleVar.getInstance().get_var_data_by_index<T>(var_data._type, var_data.index);

    //     if (DEBUG_VARS) {
    //         ConsoleHandler.log('get_exact_param_from_buffer_or_bdd:res:' + (res ? JSON.stringify(res) : null) + ':');
    //     }

    //     if (!!res) {
    //         let cached_res: T[] = await VarsDatasProxy.filter_var_datas_by_indexes([res], null, null, is_server_request, 'get_exact_param_from_buffer_or_bdd:' + reason, false, true) as T[];
    //         return cached_res[0];
    //     }
    //     return null;
    // }

    private static async get_exact_params_from_bdd<T extends VarDataBaseVO>(var_datas: T[], found: { [index: string]: VarDataBaseVO }, not_found: { [index: string]: VarDataBaseVO }) {

        let res: T[] = [];
        let promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2);

        for (let i in var_datas) {
            let var_data = var_datas[i];

            if (!var_data.check_param_is_valid(var_data._type)) {
                ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage:' + var_data.index);
                continue;
            }

            await promises_pipeline.push((async () => {
                let bdd_res: T = await query(var_data._type).filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, var_data.index).select_vo<T>();

                if (!!bdd_res) {
                    found[var_data.index] = bdd_res;
                } else {
                    not_found[var_data.index] = var_data;
                }
            }));
        }

        await promises_pipeline.end();

        return res;
    }

    // /**
    //  * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
    //  * On optimise la recherche en base en faisant un seul appel
    //  */
    // public static async get_exact_params_from_buffer_or_bdd<T extends VarDataBaseVO>(var_datas: T[]): Promise<T[]> {

    //     let env = ConfigurationService.node_configuration;

    //     let res: T[] = [];
    //     let promises = [];

    //     for (let i in var_datas) {
    //         let var_data = var_datas[i];

    //         if ((!var_data) || (!var_data.check_param_is_valid)) {
    //             ConsoleHandler.error('Paramètre invalide dans get_exact_params_from_buffer_or_bdd:' + JSON.stringify(var_data));
    //             continue;
    //         }

    //         let e = null;
    //         if (BGThreadServerController.getInstance().valid_bgthreads_names[VarsBGThreadNameHolder.bgthread_name]) {
    //             if (VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index]) {

    //                 // Stocker l'info de lecture
    //                 let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index];
    //                 VarsDatasProxy.add_read_stat(wrapper);
    //                 e = wrapper.var_data as T;

    //                 if (env.DEBUG_VARS) {
    //                     ConsoleHandler.log(
    //                         'get_exact_params_from_buffer_or_bdd:vars_datas_buffer' +
    //                         ':index| ' + var_data._bdd_only_index + " :value|" + var_data.value + ":value_ts|" + var_data.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[var_data.value_type] +
    //                         ':client_user_id|' + wrapper.client_user_id + ':client_tab_id|' + wrapper.client_tab_id + ':is_server_request|' + wrapper.is_server_request + ':reason|' + wrapper.reason);
    //                 }
    //             }
    //         }

    //         if (e) {
    //             res.push(e);
    //         } else {

    //             if (!var_data.check_param_is_valid(var_data._type)) {
    //                 ConsoleHandler.error('Les champs du matroid ne correspondent pas à son typage:' + var_data.index);
    //                 continue;
    //             }

    //             promises.push((async () => {
    //                 let bdd_res: T = await ModuleVar.getInstance().get_var_data_by_index<T>(var_data._type, var_data.index);

    //                 if (!!bdd_res) {

    //                     if (env.DEBUG_VARS) {
    //                         let bdd_wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[bdd_res.index];

    //                         ConsoleHandler.log(
    //                             'get_exact_params_from_buffer_or_bdd:bdd_res' +
    //                             ':index| ' + bdd_res._bdd_only_index + " :value|" + bdd_res.value + ":value_ts|" + bdd_res.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[bdd_res.value_type] +
    //                             ':client_user_id|' + (bdd_wrapper ? bdd_wrapper.client_user_id : 'N/A') +
    //                             ':client_tab_id|' + (bdd_wrapper ? bdd_wrapper.client_tab_id : 'N/A') +
    //                             ':is_server_request|' + (bdd_wrapper ? bdd_wrapper.is_server_request : 'N/A') + ':reason|' + (bdd_wrapper ? bdd_wrapper.reason : 'N/A'));
    //                     }

    //                     res.push(bdd_res);
    //                 }
    //             })());
    //         }
    //     }

    //     await Promise.all(promises);

    //     return res;
    // }

    // /**
    //  * @returns true if there's at least one vardata waiting to be computed (having no valid value)
    //  */
    // public static has_vardata_waiting_for_computation(): boolean {
    //     let vars_datas_buffer = Object.values(VarsDatasProxy.vars_datas_buffer_wrapped_indexes).filter((v) => !VarsServerController.has_valid_value(v.var_data));
    //     return (!!vars_datas_buffer) && (vars_datas_buffer.length > 0);
    // }

    // /**
    //  * On force l'appel sur le thread du computer de vars
    //  */
    // public static async update_existing_buffered_older_datas(var_datas: VarDataBaseVO[], reason: string) {

    //     if ((!var_datas) || (!var_datas.length)) {
    //         return;
    //     }

    //     if (!await ForkedTasksController.exec_self_on_bgthread(VarsBGThreadNameHolder.bgthread_name, VarsDatasProxy.TASK_NAME_update_existing_buffered_older_datas, var_datas)) {
    //         return;
    //     }

    //     for (let i in var_datas) {
    //         let var_data = var_datas[i];
    //         let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index];
    //         if (!wrapper) {
    //             continue;
    //         }

    //         wrapper.var_data = var_data;
    //         wrapper.reason = reason;
    //     }
    // }

    // /**
    //  * On ordonne toutes les demandes de calcul, et on met à jour au passage les registered si ya eu des désinscriptions entre temps :
    //  *  D'un côté si on a des vars registered sur main mais unregistered dans le cache (indiquées comme pas client)
    //  *      => on met un tab_id bidon mais qui forcera à considérer que c'est client => FIXME TODO faut en fait stocker le tab_id autant que possible lors du register même si déjà en cache
    //  *  De l'autre si on a des vars unregistered sur main mais registered dans le cache (indiquées comme client)
    //  *      => on supprime le client_tab_id dans le cache pour déprioriser le calcul
    //  */
    // private static async prepare_current_batch_ordered_pick_list() {
    //     VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];

    //     let vars_datas_buffer = Object.values(VarsDatasProxy.vars_datas_buffer_wrapped_indexes);
    //     let vars_datas_wrapper = vars_datas_buffer ? vars_datas_buffer.filter((v) => !VarsServerController.has_valid_value(v.var_data)) : [];
    //     let vars_datas: VarDataBaseVO[] = vars_datas_wrapper.map((v) => v.var_data);

    //     if ((!vars_datas) || (!vars_datas.length)) {
    //         VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];
    //         // if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //         ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filtered !has_valid_value:' + (vars_datas_buffer ? vars_datas_buffer.length : 0) + ' => 0');
    //         // }
    //         return;
    //     }
    //     let nb_vars_in_buffer = vars_datas.length;

    //     // if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //     ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filtered !has_valid_value:' + vars_datas_buffer.length + ' => ' + nb_vars_in_buffer);
    //     // }

    //     // if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //     ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filter_by_subs:START:nb_vars_in_buffer:' + nb_vars_in_buffer);
    //     // }
    //     let registered_var_datas_indexes: string[] = await VarsTabsSubsController.filter_by_subs(vars_datas.map((v) => v.index));
    //     registered_var_datas_indexes = registered_var_datas_indexes ? registered_var_datas_indexes : [];
    //     // if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //     ConsoleHandler.log('VarsDatasProxy:prepare_current_batch_ordered_pick_list:filter_by_subs:END:nb_vars_in_buffer:' + nb_vars_in_buffer + ':registered_var_datas_indexes:' + registered_var_datas_indexes.length);
    //     // }

    //     let registered_var_datas_indexes_map: { [index: string]: boolean } = {};
    //     for (let i in registered_var_datas_indexes) {
    //         registered_var_datas_indexes_map[registered_var_datas_indexes[i]] = true;
    //     }

    //     let unregistered_var_datas_wrappers_map: { [index: string]: VarDataProxyWrapperVO<VarDataBaseVO> } = {};
    //     for (let i in vars_datas) {
    //         let index = vars_datas[i].index;

    //         if (!registered_var_datas_indexes_map[index]) {
    //             unregistered_var_datas_wrappers_map[index] = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[index];
    //         }
    //     }

    //     /**
    //      * On clean le cache au passage, en retirant les vars inutiles à ce stade :
    //      * - les vars unregistered
    //      * - ni demandée par le serveur ni par un client
    //      * - qui n'ont pas besoin d'être mise en bdd
    //      */
    //     if (unregistered_var_datas_wrappers_map && ObjectHandler.hasAtLeastOneAttribute(unregistered_var_datas_wrappers_map)) {

    //         let removed_vars: number = 0;
    //         for (let i in unregistered_var_datas_wrappers_map) {
    //             let unregistered_var_datas_wrapper = unregistered_var_datas_wrappers_map[i];

    //             if ((!!unregistered_var_datas_wrapper.client_tab_id) || (!!unregistered_var_datas_wrapper.client_user_id)) {
    //                 // En fait on a un client_tab_id mais sur une var unregistered donc on peut peut-être s'en débarrasser quand même ...
    //                 // continue;
    //             }

    //             if (unregistered_var_datas_wrapper.is_server_request) {
    //                 // est-ce qu'on est sensé arriver dans ce cas ?
    //                 continue;
    //             }

    //             if (unregistered_var_datas_wrapper.needs_insert_or_update) {
    //                 continue;
    //             }

    //             delete VarsDatasProxy.vars_datas_buffer_wrapped_indexes[unregistered_var_datas_wrapper.var_data._bdd_only_index];
    //             removed_vars++;
    //         }

    //         if (removed_vars > 0) {

    //             if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //                 ConsoleHandler.log('VarsDatasProxy: removed ' + removed_vars + ' unregistered vars from cache');
    //             }

    //             vars_datas_wrapper = Object.values(VarsDatasProxy.vars_datas_buffer_wrapped_indexes);
    //             vars_datas = vars_datas_wrapper.map((v) => v.var_data);

    //             if ((!vars_datas) || (!vars_datas.length)) {
    //                 VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = [];
    //                 return;
    //             }
    //             nb_vars_in_buffer = vars_datas.length;
    //         }
    //     }

    //     let nb_registered_vars_in_buffer = registered_var_datas_indexes.length;

    //     ConsoleHandler.log('VarsDatasProxy.prepare_current_batch_ordered_pick_list:nb_vars_in_buffer|' + nb_vars_in_buffer + ':nb_registered_vars_in_buffer|' + nb_registered_vars_in_buffer);

    //     let registered_var_datas_by_index: { [index: string]: VarDataBaseVO } = {};
    //     for (let i in registered_var_datas_indexes) {
    //         let var_data_index = registered_var_datas_indexes[i];
    //         registered_var_datas_by_index[var_data_index] = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data_index].var_data;
    //     }
    //     for (let i in vars_datas_wrapper) {
    //         let var_data_wrapper = vars_datas_wrapper[i];

    //         let registered_var_data = registered_var_datas_by_index[var_data_wrapper.var_data.index];

    //         if ((!registered_var_data) && (var_data_wrapper.client_tab_id)) {
    //             if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //                 ConsoleHandler.log('removing client tab:' + var_data_wrapper.var_data.index);
    //             }
    //             var_data_wrapper.client_tab_id = null;
    //             var_data_wrapper.client_user_id = null;
    //             continue;
    //         }

    //         if ((!!registered_var_data) && (!var_data_wrapper.client_tab_id)) {
    //             if (ConfigurationService.node_configuration.DEBUG_VARS) {
    //                 ConsoleHandler.warn('FIXME: Should have updated the client_tab_id in the cache when registering the param');
    //             }
    //             var_data_wrapper.client_user_id = NaN;
    //             var_data_wrapper.client_tab_id = 'FIXME';
    //         }
    //     }

    //     // JNE : TEST et à revoir : Intéressant de faire un ordre mais ça part en vrille sur les très grosses listes
    //     let ordered_client_vars_datas_buffer = vars_datas_wrapper.filter((v) => v.client_tab_id && !VarsServerController.has_valid_value(v.var_data));
    //     // if (ordered_client_vars_datas_buffer && ordered_client_vars_datas_buffer.length && (ordered_client_vars_datas_buffer.length < 500)) {
    //     //     VarsDatasProxy.order_vars_datas_buffer(ordered_client_vars_datas_buffer);
    //     // }

    //     let ordered_non_client_vars_datas_buffer = vars_datas_wrapper.filter((v) => (!v.client_tab_id) && !VarsServerController.has_valid_value(v.var_data));
    //     // if (ordered_non_client_vars_datas_buffer && ordered_non_client_vars_datas_buffer.length && (ordered_non_client_vars_datas_buffer.length < 500)) {
    //     //     VarsDatasProxy.order_vars_datas_buffer(ordered_non_client_vars_datas_buffer);
    //     // }

    //     VarsdatasComputerBGThread.getInstance().current_batch_ordered_pick_list = ordered_client_vars_datas_buffer.concat(ordered_non_client_vars_datas_buffer);
    // }

    // /**
    //  * On filtre les demande de append ou prepend par les indexes déjà en attente par ce qu'on peut pas avoir 2 fois le même index dans la liste
    //  * Du coup si on demande quelque chose sur un index déjà listé, on ignore juste la demande pour le moment
    //  * On met à jour la map des indexs au passage
    //  * On doit s'assurer par contre de pas rentrer en conflit avec un handle du buffer
    //  * @param var_datas
    //  * @returns list of var_datas, as found (or added) in the cache. if not on primary thread, might return less elements than the input list
    //  */
    // private static async filter_var_datas_by_indexes(var_datas: VarDataBaseVO[], client_user_id: number, client_socket_id: string, is_server_request: boolean, reason: string, donot_insert_if_absent: boolean, just_been_loaded_from_db: boolean): Promise<VarDataBaseVO[]> {

    //     let res: VarDataBaseVO[] = [];

    //     if ((!BGThreadServerController.getInstance().valid_bgthreads_names[VarsBGThreadNameHolder.bgthread_name]) &&
    //         (reason != 'test filter_var_datas_by_indexes')) { // cas des tests unitaires
    //         throw new Error('VarsDatasProxy.filter_var_datas_by_indexes: invalid bgthread name');
    //     }

    //     if (ConfigurationService.node_configuration && ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //         ConsoleHandler.log("filter_var_datas_by_indexes:IN:" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
    //     }

    //     for (let i in var_datas) {
    //         let var_data = var_datas[i];

    //         if (ConfigurationService.node_configuration && ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //             ConsoleHandler.log("filter_var_datas_by_indexes:var_data:" + var_data.index + ":" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
    //         }

    //         if (VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index]) {

    //             if (ConfigurationService.node_configuration && ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //                 ConsoleHandler.log("filter_var_datas_by_indexes:!!wrapper:" + var_data.index + ":" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
    //             }

    //             let wrapper = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index];
    //             res.push(wrapper.var_data);

    //             // Si on avait un id et que la nouvelle valeur n'en a pas, on concerve l'id précieusement
    //             if (var_data && wrapper.var_data && (!var_data.id) && (wrapper.var_data.id)) {
    //                 var_data.id = wrapper.var_data.id;
    //             }

    //             /**
    //              * Si on demande avec un vardata quasi vide (sans valeur, sans value_ts) et que ça existe déjà dans le cache avec une valid value,
    //              *  on demande de notifier directement la var_data du cache.
    //              */
    //             if ((!VarsServerController.has_valid_value(var_data)) &&
    //                 (VarsServerController.has_valid_value(wrapper.var_data))) {

    //                 await VarsTabsSubsController.notify_vardatas(
    //                     [new NotifVardatasParam([wrapper.var_data])]);
    //                 await VarsServerCallBackSubsController.notify_vardatas([wrapper.var_data]);

    //                 continue;
    //             }

    //             /**
    //              * Sinon, si on a dans le cache une version incomplète (sans valeur, sans value_ts) et que la demande est complète (avec valeur, avec value_ts),
    //              * on met à jour la version du cache avec la demande
    //              */
    //             if ((!VarsServerController.has_valid_value(wrapper.var_data)) &&
    //                 (VarsServerController.has_valid_value(var_data))) {

    //                 wrapper.var_data = var_data;
    //             }

    //             // Si on dit qu'on vient de la charger de la base, on peut stocker l'info de dernière mise à jour en bdd
    //             if (just_been_loaded_from_db) {
    //                 wrapper.last_insert_or_update = Dates.now();
    //                 wrapper.update_timeout();
    //             }

    //             VarsDatasProxy.add_read_stat(wrapper);

    //             continue;
    //         }

    //         if (donot_insert_if_absent) {
    //             continue;
    //         }

    //         if (ConfigurationService.node_configuration && ConfigurationService.node_configuration.DEBUG_VARS_SERVER_SUBS_CBS) {
    //             ConsoleHandler.log("filter_var_datas_by_indexes:!wrapper:" + var_data.index + ":" + var_datas.length + ":" + client_user_id + ":" + client_socket_id + ":" + is_server_request + ":" + reason);
    //         }

    //         VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index] = new VarDataProxyWrapperVO(
    //             var_data, client_user_id, client_socket_id, is_server_request, reason,
    //             !just_been_loaded_from_db, 0);
    //         VarsDatasProxy.add_read_stat(VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index]);
    //         res.push(VarsDatasProxy.vars_datas_buffer_wrapped_indexes[var_data.index].var_data);

    //         // Si on met en cache une data à calculer on s'assure qu'on a bien un calcul qui vient rapidement
    //         if (!VarsServerController.has_valid_value(var_data)) {
    //             VarsdatasComputerBGThread.getInstance().force_run_asap();
    //         }
    //     }

    //     return res;
    // }

    // private static order_vars_datas_buffer(vars_datas_buffer: Array<VarDataProxyWrapperVO<VarDataBaseVO>>) {

    //     let cardinaux: { [index: string]: number } = {};

    //     for (let i in vars_datas_buffer) {
    //         let var_wrapper = vars_datas_buffer[i];
    //         cardinaux[var_wrapper.var_data.index] = MatroidController.get_cardinal(var_wrapper.var_data);
    //     }

    //     // Ensuite par hauteur dans l'arbre
    //     if (!VarsServerController.varcontrollers_dag_depths) {
    //         VarsServerController.init_varcontrollers_dag_depths();
    //     }

    //     vars_datas_buffer.sort((a: VarDataProxyWrapperVO<VarDataBaseVO>, b: VarDataProxyWrapperVO<VarDataBaseVO>): number => {

    //         // On filtre en amont
    //         // // En tout premier les params qui nécessitent un calcul
    //         // let valida = VarsServerController.has_valid_value(a.var_data);
    //         // let validb = VarsServerController.has_valid_value(b.var_data);
    //         // if (valida && !validb) {
    //         //     return -1;
    //         // }
    //         // if (validb && !valida) {
    //         //     return 1;
    //         // }

    //         // En priorité les demandes client
    //         if (a.client_tab_id && !b.client_tab_id) {
    //             return -1;
    //         }

    //         if ((!a.client_tab_id) && b.client_tab_id) {
    //             return 1;
    //         }

    //         // Ensuite par cardinal
    //         if (cardinaux[a.var_data.index] != cardinaux[b.var_data.index]) {
    //             return cardinaux[a.var_data.index] - cardinaux[b.var_data.index];
    //         }

    //         /**
    //          * Par hauteur dans l'arbre
    //          */
    //         let depth_a = VarsServerController.varcontrollers_dag_depths[a.var_data.var_id];
    //         let depth_b = VarsServerController.varcontrollers_dag_depths[b.var_data.var_id];

    //         if (depth_a != depth_b) {
    //             return depth_a - depth_b;
    //         }

    //         // Enfin par index juste pour éviter des égalités
    //         return (a.var_data.index < b.var_data.index) ? -1 : 1;

    //         // // Ensuite par hauteur dans l'arbre
    //         // if (!VarsServerController.varcontrollers_dag_depths) {
    //         //     VarsServerController.init_varcontrollers_dag_depths();
    //         // }

    //         // let depth_a = VarsServerController.varcontrollers_dag_depths[a.var_data.var_id];
    //         // let depth_b = VarsServerController.varcontrollers_dag_depths[b.var_data.var_id];

    //         // if (depth_a != depth_b) {
    //         //     return depth_a - depth_b;
    //         // }

    //         // // Enfin par cardinal
    //         // return cardinaux[a.var_data.index] - cardinaux[b.var_data.index];
    //     });
    // }

    // private static check_or_update_var_buffer(handle_var: VarDataBaseVO): boolean {
    //     let var_data_buffer = VarsDatasProxy.vars_datas_buffer_wrapped_indexes[handle_var.index];

    //     if (!var_data_buffer) {
    //         return false;
    //     }
    //     if (
    //         ((var_data_buffer.var_data.value != handle_var.value) && ((!isNaN(var_data_buffer.var_data.value)) || (!isNaN(handle_var.value)))) ||
    //         (var_data_buffer.var_data.value_ts != handle_var.value_ts) ||
    //         (var_data_buffer.var_data.value_type != handle_var.value_type)) {
    //         ConsoleHandler.error(
    //             'check_or_update_var_buffer:incoherence - correction auto:' + var_data_buffer.var_data.index +
    //             ':var_data_buffer:' + var_data_buffer.var_data.value + ':' + var_data_buffer.var_data.value_ts + ':' + var_data_buffer.var_data.value_type + ':' +
    //             ':handle_var:' + handle_var.value + ':' + handle_var.value_ts + ':' + handle_var.value_type + ':'
    //         );

    //         var_data_buffer.var_data.value = handle_var.value;
    //         var_data_buffer.var_data.value_ts = handle_var.value_ts;
    //         var_data_buffer.var_data.value_type = handle_var.value_type;

    //         /**
    //          * Dans le doute d'une notif qui serait pas encore partie (a priori c'est régulier dans ce contexte)
    //          *  pour indiquer un calcul terminé, on check le statut de la var et si c'est utile (has valid value)
    //          *  on envoie les notifs. Aucun moyen de savoir si c'est déjà fait à ce niveau l'arbre n'existe plus, et
    //          *  au pire on envoie une deuxième notif à un watcher permanent. Cela dit la nouvelle notif viendra en plus
    //          *  probablement corriger une mauvaise valeur affichée à la base.
    //          * A creuser pourquoi on arrive là
    //          */

    //         return true;
    //     }

    //     return false;
    // }
}