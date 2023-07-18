

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
        // istanbul ignore next: nothing to test : register_task
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
}