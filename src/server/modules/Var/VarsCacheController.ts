import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import VarServerControllerBase from './VarServerControllerBase';
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

    /**
     * Update : Changement de méthode. On arrête de vouloir résoudre par niveau dans l'arbre des deps,
     *  et on résoud simplement intersecteur par intersecteur. Donc on commence par identifier les intersecteurs (ensemble E)
     *  déduis des vos, puis pour chacun (e) :
     *      - On invalide les vars en appliquant e,
     *      - On ajoute e dans F ensemble des intersecteurs résolus
     *      - On charge les intersecteurs (E') déduis par dépendance à cet intersecteur. Pour chacun (e') :
     *          - si e' dans E, on ignore
     *          - si e' dans F, on ignore
     *          - sinon on ajoute e' à E
     *      - On supprime e de E et on continue de dépiler
     * @param intersectors_by_index Ensemble E des intersecteurs en début de process, à dépiler
     */
    public static async invalidate_datas_and_parents(
        invalidator: VarDataInvalidatorVO,
        solved_invalidators_by_index: { [conf_id: string]: VarDataInvalidatorVO }
    ) {

        let intersectors_by_index: { [index: string]: VarDataBaseVO } = {
            [invalidator.var_data.index]: invalidator.var_data
        };

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        let max = Math.max(1, Math.floor(ConfigurationService.node_configuration.MAX_POOL / 2));

        while (ObjectHandler.hasAtLeastOneAttribute(intersectors_by_index)) {
            let promise_pipeline = new PromisePipeline(max, 'VarsDatasVoUpdateHandler.invalidate_datas_and_parents');

            for (let i in intersectors_by_index) {
                let intersector = intersectors_by_index[i];

                if (DEBUG_VARS) {
                    ConsoleHandler.log('invalidate_datas_and_parents:START SOLVING:' + intersector.index + ':');
                }
                let conf_id = VarsCacheController.get_validator_config_id(invalidator, true, intersector.index);
                if (solved_invalidators_by_index[conf_id]) {
                    delete intersectors_by_index[i];
                    continue;
                }
                solved_invalidators_by_index[conf_id] = new VarDataInvalidatorVO(
                    intersector, VarDataInvalidatorVO.INVALIDATOR_TYPE_INTERSECTED, false,
                    invalidator.invalidate_denied, invalidator.invalidate_imports);

                await promise_pipeline.push(async () => {

                    try {

                        let deps_intersectors = await VarsCacheController.get_deps_intersectors(intersector);

                        for (let j in deps_intersectors) {
                            let dep_intersector = deps_intersectors[j];

                            if (intersectors_by_index[dep_intersector.index]) {
                                continue;
                            }
                            let dep_intersector_conf_id = VarsCacheController.get_validator_config_id(invalidator, true, dep_intersector.index);
                            if (solved_invalidators_by_index[dep_intersector_conf_id]) {
                                continue;
                            }

                            if (DEBUG_VARS) {
                                ConsoleHandler.log('invalidate_datas_and_parents:' + intersector.index + '=>' + dep_intersector.index + ':');
                            }

                            intersectors_by_index[dep_intersector.index] = dep_intersector;
                        }

                        if (DEBUG_VARS) {
                            ConsoleHandler.log('invalidate_datas_and_parents:END SOLVING:' + intersector.index + ':');
                        }
                    } catch (error) {
                        ConsoleHandler.error('invalidate_datas_and_parents:FAILED:' + intersector.index + ':' + error);
                    }

                    delete intersectors_by_index[intersector.index];
                });
            }

            await promise_pipeline.end();
        }
    }

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

    public static get_validator_config_id(
        invalidator: VarDataInvalidatorVO,
        include_index: boolean = false,
        index: string = null): string {

        return (invalidator && !!invalidator.var_data) ?
            invalidator.var_data.var_id + '_' + (invalidator.invalidate_denied ? '1' : '0') + '_' + (invalidator.invalidate_imports ? '1' : '0')
            + (include_index ? '_' + (index ? index : invalidator.var_data.index) : '') :
            null;
    }

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */

    /**
     * Cas insert en base d'un cache de var calculée et registered
     */
    public static BDD_do_cache_param_data(var_data: VarDataBaseVO, controller: VarServerControllerBase<any>, is_requested_param: boolean): boolean {

        // Si ça vient de la bdd, on le met à jour évidemment
        if (!!var_data.id) {
            return true;
        }

        // Si on veut insérer que des caches demandés explicitement par server ou client et pas tous les noeuds de l'arbre, on check ici
        if (controller.var_cache_conf.cache_bdd_only_requested_params && !is_requested_param) {
            return false;
        }

        switch (controller.var_cache_conf.cache_startegy) {
            default:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
                return true;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
                return false;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:

                /**
                 * En stratégie pixel, on stocke tout en bdd maintenant. Les pixels sont identifiés par un flag is_pixel == true si card == 1
                 */
                if (!controller.varConf.pixel_activated) {
                    ConsoleHandler.error('Une var ne peut pas être en stratégie VALUE_CACHE_STRATEGY_PIXEL et ne pas avoir de pixellisation déclarée');
                    throw new Error('Not Implemented');
                }
                return true;
        }
    }
}