

import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import MatroidIndexHandler from '../../../shared/tools/MatroidIndexHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThrottlePipelineHelper from '../../../shared/tools/ThrottlePipeline/ThrottlePipelineHelper';
import ConfigurationService from '../../env/ConfigurationService';
import VarDAGNode from '../../modules/Var/vos/VarDAGNode';
import { RunsOnBgThread } from '../BGThread/annotations/RunsOnBGThread';
import CurrentVarDAGHolder from './CurrentVarDAGHolder';
import VarsBGThreadNameHolder from './VarsBGThreadNameHolder';
import VarsComputationHole from './bgthreads/processes/VarsComputationHole';

/**
 * L'objectif est de créer un proxy d'accès aux données des vars_datas en base pour qu'on puisse intercaler un buffer de mise à jour progressif en BDD
 *  De cette manière, on peut ne pas attendre de mettre à ajour en bdd avant de refaire un batch de calcul et pour autant profiter de ces valeurs calculées et pas en base
 *  On cherchera alors à dépiler ce buffer dès qu'on a moins de calculs en cours et donc moins besoin de ressources pour les calculs
 */
export default class VarsDatasProxy {

    // public static TASK_NAME_add_to_tree_and_return_datas_that_need_notification = 'VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification';

    public static PARAM_NAME_filter_var_datas_by_index_size_limit = 'VarsDatasProxy.filter_var_datas_by_index_size_limit';

    private static get_var_data_or_ask_to_bgthread: <T extends VarDataBaseVO>(throttle_index: string, param_index: string) => Promise<T> = ThrottlePipelineHelper.declare_throttled_pipeline(
        'VarsDatasProxy.get_var_data_or_ask_to_bgthread',
        this._get_var_datas_or_ask_to_bgthread.bind(this), 10, 500, 20
    );

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        // ForkedTasksController.register_task(VarsDatasProxy.TASK_NAME_add_to_tree_and_return_datas_that_need_notification, VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification.bind(this));
    }

    public static async get_exact_params_from_bdd<T extends VarDataBaseVO>(
        var_datas_indexes_by_type: { [api_type_id: string]: string[] },
        found: { [index: string]: VarDataBaseVO },
        not_found_indexes: string[]) {

        const res: T[] = [];
        const promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2, 'VarsDatasProxy.get_exact_params_from_bdd');

        for (const api_type_id in var_datas_indexes_by_type) {
            const var_data_indexes = var_datas_indexes_by_type[api_type_id];

            await promises_pipeline.push((async () => {

                const this_not_found_indexes: { [index: string]: boolean } = {};
                for (const i in var_data_indexes) {
                    this_not_found_indexes[var_data_indexes[i]] = true;
                }

                const bdd_res: T[] = await query(api_type_id).filter_by_text_has(field_names<VarDataBaseVO>()._bdd_only_index, var_data_indexes).exec_as_server().select_vos<T>(); // depuis quand c'est logique de faire ça et pas directement un select qu'on passerait au throttled ?

                for (const i in bdd_res) {
                    const var_data = bdd_res[i];

                    found[var_data.index] = var_data;
                    delete this_not_found_indexes[var_data.index];
                }

                for (const i in this_not_found_indexes) {
                    not_found_indexes.push(i);
                }
            }));
        }

        await promises_pipeline.end();

        return res;
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
    public static async get_var_datas_or_ask_to_bgthread<T extends VarDataBaseVO>(params_indexes: string[]): Promise<T[]> {

        if ((!params_indexes) || (!params_indexes.length)) {
            return null;
        }

        const result = [];
        const promises = [];
        for (const i in params_indexes) {
            const params_index = params_indexes[i];

            promises.push((async () => {

                try {

                    const var_data = await this.get_var_data_or_ask_to_bgthread<T>(params_index, params_index);

                    if (var_data) {
                        result.push(var_data);
                    }
                } catch (error) {

                    // Dans le cas d'un timeout, on retente automatiquement
                    let msg = error.message ? error.message : error;
                    msg = msg.toLowerCase();
                    if ((msg.indexOf('timeout') > -1) || (msg.indexOf('timedout') > -1)) {
                        let retries = 3;
                        ConsoleHandler.warn('VarsDatasProxy.get_var_datas_or_ask_to_bgthread: timeout for index: ' + params_index + ' error: ' + error + ' retries: ' + retries);

                        while (retries) {
                            retries--;

                            try {
                                const var_data = await this.get_var_data_or_ask_to_bgthread<T>(params_index, params_index);

                                if (var_data) {
                                    result.push(var_data);
                                    return;
                                }
                            } catch (error_) {
                                ConsoleHandler.warn('VarsDatasProxy.get_var_datas_or_ask_to_bgthread: timeout for index: ' + params_index + ' error: ' + error_ + ' retries: ' + retries);
                            }
                        }

                        ConsoleHandler.error('VarsDatasProxy.get_var_datas_or_ask_to_bgthread: timeout for index: ' + params_index + ' error: ' + error + ' no more retries');
                    } else {
                        ConsoleHandler.error('VarsDatasProxy.get_var_datas_or_ask_to_bgthread: error for index: ' + params_index + ' error: ' + error);
                    }
                }
            })());
        }

        await all_promises(promises);

        return result;
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
    private static async _get_var_datas_or_ask_to_bgthread<T extends VarDataBaseVO>(params_indexes: { [index: string]: string }): Promise<{ [index: string]: T }> {

        if (!params_indexes) {
            return null;
        }

        const params_indexes_by_api_type_id: { [api_type_id: string]: string[] } = {};
        const found: { [index: string]: T } = {};

        for (const i in params_indexes) {
            const params_index = params_indexes[i];

            // Petit contrôle de cohérence suite pb en prod
            if ((!params_index) || (params_index.indexOf('null') >= 0)) {

                if (!params_index) {
                    ConsoleHandler.error('VarsDatasProxy._get_var_datas_or_ask_to_bgthread: params_index null: ' + params_index + ' - là on peut rien faire à part tenter d\'ignorer la demande ...');
                    continue;
                }

                ConsoleHandler.error('VarsDatasProxy._get_var_datas_or_ask_to_bgthread: params_index contains null: ' + params_index + ' - On crée une fausse notif pour éviter de bloquer le système');
                found[params_index] = VarDataBaseVO.from_index(params_index) as T;
                found[params_index].value_ts = Dates.now();
                found[params_index].value = 0;
                found[params_index].value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                continue;
            }

            const var_conf = VarsController.var_conf_by_id[MatroidIndexHandler.get_var_id_from_normalized_vardata(params_index)];

            if (!params_indexes_by_api_type_id[var_conf.var_data_vo_type]) {
                params_indexes_by_api_type_id[var_conf.var_data_vo_type] = [];
            }

            params_indexes_by_api_type_id[var_conf.var_data_vo_type].push(params_index);
        }

        const not_found_indexes: string[] = [];
        await VarsDatasProxy.get_exact_params_from_bdd(params_indexes_by_api_type_id, found, not_found_indexes);
        const vars_to_notify: { [index: string]: T } = found;

        if (not_found_indexes.length) {
            const vars_to_notify_from_tree: T[] = await VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification(not_found_indexes);

            for (const i in vars_to_notify_from_tree) {
                const var_data = vars_to_notify_from_tree[i];

                vars_to_notify[var_data.index] = var_data;
            }
        }

        return vars_to_notify;
    }

    /**
     * On ajoute le noeud à l'arbre et on note bien qu'il a déjà été testé en amont
     * @param indexs
     * @returns
     */
    @RunsOnBgThread(VarsBGThreadNameHolder.bgthread_name, null) // static
    private static async add_to_tree_and_return_datas_that_need_notification<T extends VarDataBaseVO>(indexs: string[]): Promise<T[]> {

        // Pourquoi on pourrait pas ajouter librement des noeuds dans l'arbre ?
        // if (VarsComputationHole.waiting_for_computation_hole) {

        //     if (ConfigurationService.node_configuration.debug_vars) {
        //         ConsoleHandler.log('VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification: waiting_for_computation_hole is active, not adding new elements to tree and waiting for next VarsComputationHole.waiting_for_computation_hole_RELEASED_EVENT_NAME event');
        //     }

        //     await EventsController.await_next_event(VarsComputationHole.waiting_for_computation_hole_RELEASED_EVENT_NAME);
        //     // await EventsController.await_next_event_semaphored(VarsComputationHole.waiting_for_computation_hole_RELEASED_EVENT_NAME, "add_to_tree_and_return_datas_that_need_notification"); // Pourquoi semaphored ??? on doit tout ajouter à l'arbre dès qu'on release....
        // }

        const max = Math.max(1, Math.floor(ConfigurationService.node_configuration.max_pool / 2));
        const promise_pipeline = PromisePipeline.get_semaphore_pipeline('VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification', max);

        // On stocke les promises de cette itération pour les attendre toutes avant de résoudre la promise de l'appel
        const this_call_instance_promises = [];

        try {

            const vars_to_notify: T[] = [];
            for (const i in indexs) {
                const index = indexs[i];

                // On //ise et on indique qu'on doit refaire un check en base, pour être sûr de ne pas avoir de données en base qui ne sont pas dans l'arbre
                //  En fait ya un vrai point de conf ici / perf : est-ce qu'on impose de toujours rechecker en base ou pas ? si non on risque de refaire des calculs parfois en double, qui sont couteux
                //  si oui on charge la base pour rien souvent
                this_call_instance_promises.push((await promise_pipeline.push(async () => {
                    const node: VarDAGNode = await VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(index), false);

                    if ((!node) || (!node.var_data)) {
                        ConsoleHandler.error('VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification: node ou node.var_data null pour index: ' + index);
                        return;
                    }

                    // on unlock le node pour qu'il puisse faire sa vie
                    node.unlock();

                    // Si le noeud est déjà en cours de notif ou déjà notifié, on doit notifier manuellement à cette étape
                    // Car le noeud pourrait ne pas être notifié sinon
                    // Si le noeud est déjà notifiable, on peut le notifier aussi pour gagner du temps
                    // Or tous les noeuds node.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_5_NOTIFYING_END] sont is_notifiable
                    if (node.is_notifiable) {
                        vars_to_notify.push(node.var_data as T);
                    }
                }))());
            }

            await all_promises(this_call_instance_promises);
            return vars_to_notify;
        } catch (error) {

            ConsoleHandler.error('VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification: error: ' + error);
            throw error;
        }
    }
}