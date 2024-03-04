import VarDAGNode from '../../../server/modules/Var/vos/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarsServerController from './VarsServerController';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';

/**
 * On se fixe 3 stratégies de cache :
 *  A : décider si oui ou non on met un param en cache suite à un calcul
 *  B : décider si oui ou non on tente de charger un cache exact d'un noeud = donc un noeud qui n'est pas root et techniquement pas registered mais on
 *      a pas l'info ici
 *  C : décider si oui ou non on utilise un cache chargé au point B mais partiel
 */
export default class VarsCacheController {

    public static async get_deps_intersectors(intersector: VarDataBaseVO): Promise<{ [index: string]: VarDataBaseVO }> {
        let res: { [index: string]: VarDataBaseVO } = {};

        let node = VarsServerController.varcontrollers_dag.nodes[intersector.var_id];

        for (let j in node.incoming_deps) {
            let deps = node.incoming_deps[j];

            for (let i in deps) {
                let dep = deps[i];

                let controller = (dep.incoming_node as VarCtrlDAGNode).var_controller;

                let tmp = await controller.get_invalid_params_intersectors_from_dep_stats_wrapper(dep.dep_name, [intersector]);
                if (tmp && tmp.length) {
                    tmp.forEach((e) => res[e.index] = e);
                }
            }
        }

        return res;
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
        if (!!node.var_data.id) {
            return false;
        }

        let controller = VarsServerController.registered_vars_controller_by_var_id[node.var_data.var_id];

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