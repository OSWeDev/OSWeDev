

import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarDAGNode from '../../../server/modules/Var/vos/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import MatroidIndexHandler from '../../../shared/tools/MatroidIndexHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThrottlePipelineHelper from '../../../shared/tools/ThrottlePipelineHelper';
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

    public static TASK_NAME_add_to_tree_and_return_datas_that_need_notification = 'VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification';

    public static PARAM_NAME_filter_var_datas_by_index_size_limit = 'VarsDatasProxy.filter_var_datas_by_index_size_limit';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */

    public static init() {
        // istanbul ignore next: nothing to test : register_task
        ForkedTasksController.register_task(VarsDatasProxy.TASK_NAME_add_to_tree_and_return_datas_that_need_notification, VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification.bind(this));
    }

    public static async get_exact_params_from_bdd<T extends VarDataBaseVO>(
        var_datas_indexes_by_type: { [api_type_id: string]: string[] },
        found: { [index: string]: VarDataBaseVO },
        not_found_indexes: string[]) {

        let res: T[] = [];
        let promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'VarsDatasProxy.get_exact_params_from_bdd');

        for (let api_type_id in var_datas_indexes_by_type) {
            let var_data_indexes = var_datas_indexes_by_type[api_type_id];

            await promises_pipeline.push((async () => {

                let this_not_found_indexes: { [index: string]: boolean } = {};
                for (let i in var_data_indexes) {
                    this_not_found_indexes[var_data_indexes[i]] = true;
                }

                let bdd_res: T[] = await query(api_type_id).filter_by_text_has(field_names<VarDataBaseVO>()._bdd_only_index, var_data_indexes).select_vos<T>();

                for (let i in bdd_res) {
                    let var_data = bdd_res[i];

                    found[var_data.index] = var_data;
                    delete this_not_found_indexes[var_data.index];
                }

                for (let i in this_not_found_indexes) {
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

        let result = [];
        let promises = [];
        for (let i in params_indexes) {
            let params_index = params_indexes[i];

            promises.push((async () => {
                let var_data = await this.get_var_data_or_ask_to_bgthread<T>(params_index, params_index);

                if (var_data) {
                    result.push(var_data);
                }
            })());
        }

        await all_promises(promises);

        return result;
    }

    private static get_var_data_or_ask_to_bgthread: <T extends VarDataBaseVO>(throttle_index: string, param_index: string) => Promise<T> = ThrottlePipelineHelper.declare_throttled_pipeline(
        'VarsDatasProxy.get_var_data_or_ask_to_bgthread',
        this._get_var_datas_or_ask_to_bgthread.bind(this), 10, 500, 20
    );

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

        let params_indexes_by_api_type_id: { [api_type_id: string]: string[] } = {};

        for (let i in params_indexes) {
            let params_index = params_indexes[i];

            let var_conf = VarsController.var_conf_by_id[MatroidIndexHandler.get_var_id_from_normalized_vardata(params_index)];

            if (!params_indexes_by_api_type_id[var_conf.var_data_vo_type]) {
                params_indexes_by_api_type_id[var_conf.var_data_vo_type] = [];
            }

            params_indexes_by_api_type_id[var_conf.var_data_vo_type].push(params_index);
        }

        let found: { [index: string]: T } = {};
        let not_found_indexes: string[] = [];
        await VarsDatasProxy.get_exact_params_from_bdd(params_indexes_by_api_type_id, found, not_found_indexes);

        let vars_to_notify: { [index: string]: T } = found;
        if (not_found_indexes.length) {
            let vars_to_notify_from_tree: T[] = await VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification(not_found_indexes);

            for (let i in vars_to_notify_from_tree) {
                let var_data = vars_to_notify_from_tree[i];

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
    private static async add_to_tree_and_return_datas_that_need_notification<T extends VarDataBaseVO>(indexs: string[]): Promise<T[]> {
        let vars_to_notify: T[] = [];

        return new Promise(async (resolve, reject) => {

            if (!await ForkedTasksController.exec_self_on_bgthread_and_return_value(
                reject,
                VarsBGThreadNameHolder.bgthread_name,
                VarsDatasProxy.TASK_NAME_add_to_tree_and_return_datas_that_need_notification,
                resolve,
                indexs)) {

                return null;
            }

            let promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification');
            for (let i in indexs) {
                let index = indexs[i];

                // On //ise et on indique qu'on doit refaire un check en base, pour être sûr de ne pas avoir de données en base qui ne sont pas dans l'arbre
                //  En fait ya un vrai point de conf ici / perf : est-ce qu'on impose de toujours rechecker en base ou pas ? si non on risque de refaire des calculs parfois en double, qui sont couteux
                //  si oui on charge la base pour rien souvent
                await promise_pipeline.push((async () => {
                    let node: VarDAGNode = await VarDAGNode.getInstance(CurrentVarDAGHolder.current_vardag, VarDataBaseVO.from_index(index), false);

                    if ((!node) || (!node.var_data)) {
                        ConsoleHandler.error('VarsDatasProxy.add_to_tree_and_return_datas_that_need_notification: node ou node.var_data null pour index: ' + index);
                        return;
                    }

                    // Si le noeud est déjà en cours de notif ou déjà notifié, on doit notifier manuellement à cette étape
                    // Car le noeud pourrait ne pas être notifié sinon
                    // Si le noeud est déjà notifiable, on peut le notifier aussi pour gagner du temps
                    // Or tous les noeuds node.current_step >= VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_5_NOTIFYING_END] sont is_notifiable
                    if (node.is_notifiable) {
                        vars_to_notify.push(node.var_data as T);
                    }
                }));
            }

            await promise_pipeline.end();
            resolve(vars_to_notify);
        });
    }
}