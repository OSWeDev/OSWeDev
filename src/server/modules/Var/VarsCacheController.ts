import VarDAGNode from '../../modules/Var/vos/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarsServerController from './VarsServerController';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../shared/tools/PromiseTools';
import StatsController from '../../../shared/modules/Stats/StatsController';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';

/**
 * On se fixe 3 stratégies de cache :
 *  A : décider si oui ou non on met un param en cache suite à un calcul
 *  B : décider si oui ou non on tente de charger un cache exact d'un noeud = donc un noeud qui n'est pas root et techniquement pas registered mais on
 *      a pas l'info ici
 *  C : décider si oui ou non on utilise un cache chargé au point B mais partiel
 */
export default class VarsCacheController {

    // public static async get_deps_intersectors(intersector: VarDataBaseVO, promise_pipeline: PromisePipeline): Promise<{ [index: string]: VarDataBaseVO }> {
    //     const res: { [index: string]: VarDataBaseVO } = {};

    //     const node = VarsServerController.varcontrollers_dag.nodes[intersector.var_id];
    //     const this_call_promises = [];
    //     for (const j in node.incoming_deps) {
    //         const deps = node.incoming_deps[j];

    //         for (const i in deps) {
    //             const dep = deps[i];

    //             const controller = (dep.incoming_node as VarCtrlDAGNode).var_controller;

    //             this_call_promises.push((await promise_pipeline.push(async () => {
    //                 const tmp = StatsController.ACTIVATED ?
    //                     await controller.get_invalid_params_intersectors_from_dep_stats_wrapper(dep.dep_name, [intersector]) :
    //                     await controller.get_invalid_params_intersectors_from_dep(dep.dep_name, [intersector]);
    //                 if (tmp && tmp.length) {
    //                     tmp.forEach((e) => res[e.index] = e);
    //                 }
    //             }))());
    //         }
    //     }
    //     await all_promises(this_call_promises);

    //     return res;
    // }

    /**
     * ATTENTION : tous les invalidateurs doivent être de même conf (même var_id, propage_to_parents, invalidate_denied, invalidate_imports, ...)
     * @param var_id
     * @param invalidators_by_index
     * @param promise_pipeline
     * @returns
     */
    public static async get_deps_invalidators(
        invalidators: VarDataInvalidatorVO[],
        promise_pipeline: PromisePipeline,
    ): Promise<VarDataInvalidatorVO[]> {
        const intersectors_res_by_var_id: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
        const exemple_conf_invalidateur = invalidators[0];

        const node = VarsServerController.varcontrollers_dag.nodes[exemple_conf_invalidateur.var_data.var_id];
        const this_call_promises = [];
        const intersectors = Object.values(invalidators).map((e) => e.var_data);
        for (const j in node.incoming_deps) {
            const deps = node.incoming_deps[j];

            for (const i in deps) {
                const dep = deps[i];

                const controller = (dep.incoming_node as VarCtrlDAGNode).var_controller;

                this_call_promises.push((await promise_pipeline.push(async () => {
                    const tmp = StatsController.ACTIVATED ?
                        await controller.get_invalid_params_intersectors_from_dep_stats_wrapper(dep.dep_name, intersectors) :
                        await controller.get_invalid_params_intersectors_from_dep(dep.dep_name, intersectors);
                    if (tmp && tmp.length) {

                        if (!intersectors_res_by_var_id[controller.varConf.id]) {
                            intersectors_res_by_var_id[controller.varConf.id] = {};
                        }
                        tmp.forEach((e) => intersectors_res_by_var_id[controller.varConf.id][e.index] = e);
                    }
                }))());
            }
        }
        await all_promises(this_call_promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici

        const res_invalidators: VarDataInvalidatorVO[] = [];
        for (const var_id in intersectors_res_by_var_id) {
            const intersectors_res = intersectors_res_by_var_id[var_id];

            // Tous la même conf, donc on peut union les intersecteurs à ce stade et renvoyer les invalidateurs
            const union_matroids = MatroidController.union(Object.values(intersectors_res));

            for (const i in union_matroids) {
                const intersector = union_matroids[i];
                const invalidator = VarDataInvalidatorVO.create_new(
                    intersector,
                    exemple_conf_invalidateur.invalidator_type,
                    exemple_conf_invalidateur.propagate_to_parents,
                    exemple_conf_invalidateur.invalidate_denied,
                    exemple_conf_invalidateur.invalidate_imports,
                );
                res_invalidators.push(invalidator);
            }
        }

        return res_invalidators;
    }

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */

    /**
     * Cas insert en base d'un cache de var calculée et registered
     */
    public static BDD_do_cache_param_data(node: VarDAGNode): boolean {

        if ((!node) || !node.var_data) {
            throw new Error('Pas de node ou de var_data');
        }

        /**
         * On update en base aucune data issue de la BDD, puisque si on a chargé la donnée, soit c'est un import qu'on a donc interdiction de toucher, soit c'est
         *  un cache de var_data pas invalidé, et puisque pas invalidé, on y touche pas
         */
        if (node.var_data.id) {
            return false;
        }

        const controller = VarsServerController.registered_vars_controller_by_var_id[node.var_data.var_id];

        if (!controller) {
            throw new Error('Pas de controller pour la var_id ' + node.var_data.var_id);
        }

        // Si c'est un pixel, on save tout le temps, on a déjà passé le is_pixel_of_card_supp_1 avant
        if (controller.varConf.pixel_activated) {
            return true;
        }

        // Si on veut insérer que des caches demandés explicitement par le client ou le server
        if (controller.varConf.cache_only_exact_sub &&
            ((!node.is_client_sub) && (!node.is_server_sub))) {
            return false;
        }

        return true;
    }
}