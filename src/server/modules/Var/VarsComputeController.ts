import { cloneDeep } from 'lodash';
import { performance } from 'perf_hooks';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VarPixelFieldConfVO from '../../../shared/modules/Var/vos/VarPixelFieldConfVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import NotifVardatasParam from './notifs/NotifVardatasParam';
import PixelVarDataController from './PixelVarDataController';
import SlowVarKiHandler from './SlowVarKi/SlowVarKiHandler';
import VarDagPerfsServerController from './VarDagPerfsServerController';
import VarsCacheController from './VarsCacheController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsImportsHandler from './VarsImportsHandler';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

export default class VarsComputeController {

    public static PARAM_NAME_estimated_tree_computation_time_target: string = 'VarsComputeController.estimated_tree_computation_time_target';
    public static PARAM_NAME_estimated_tree_computation_time_limit: string = 'VarsComputeController.estimated_tree_computation_time_limit';
    public static PARAM_NAME_var_selection_pack_size: string = 'VarsComputeController.var_selection_pack_size';

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsComputeController {
        if (!VarsComputeController.instance) {
            VarsComputeController.instance = new VarsComputeController();
        }
        return VarsComputeController.instance;
    }

    private static instance: VarsComputeController = null;

    private cached_estimated_tree_computation_time_target: number = null;
    private cached_estimated_tree_computation_time_limit: number = null;
    private last_update_estimated_tree_computation_time: number = null;
    private cached_var_selection_pack_size: number = null;

    protected constructor() {
    }

    /**
     * Si la conf de la var indique qu'on n'utilise pas cette composante, on indique qu'elle ne prendra pas de temps
     * @param var_dag_node
     * @returns l'estimation du temps de calcul de la variable sur cette composante
     */
    public get_estimated_ctree_ddeps_try_load_cache_complet(var_dag_node: VarDAGNode): number {

        let var_data: VarDataBaseVO = var_dag_node.var_data;
        let res = 0;

        switch (VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
                return 0;

            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
            default:
                res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
                    * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_try_load_cache_complet_1k_card;
        }

        return res;
    }

    /**
     * Si la conf de la var indique qu'on n'utilise pas cette composante, on indique qu'elle ne prendra pas de temps
     * @param var_dag_node
     * @returns l'estimation du temps de calcul de la variable sur cette composante
     */
    public get_estimated_ctree_ddeps_load_imports_and_split_nodes(var_dag_node: VarDAGNode): number {

        let var_data: VarDataBaseVO = var_dag_node.var_data;
        let res = 0;

        if (VarsServerController.getInstance().getVarControllerById(var_data.var_id).optimization__has_no_imports) {
            return 0;
        }

        switch (VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
            default:
                res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
                    * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card;
        }

        return res;
    }

    /**
     * Si la conf de la var indique qu'on n'utilise pas cette composante, on indique qu'elle ne prendra pas de temps
     * @param var_dag_node
     * @returns l'estimation du temps de calcul de la variable sur cette composante
     */
    public get_estimated_ctree_ddeps_try_load_cache_partiel(var_dag_node: VarDAGNode): number {
        let var_data: VarDataBaseVO = var_dag_node.var_data;

        switch (VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
            default:
                return 0;
        }
    }

    /**
     * Si la conf de la var indique qu'on n'utilise pas cette composante, on indique qu'elle ne prendra pas de temps
     * @param var_dag_node
     * @returns l'estimation du temps de calcul de la variable sur cette composante
     */
    public get_estimated_ctree_ddeps_get_node_deps(var_dag_node: VarDAGNode): number {
        let var_data: VarDataBaseVO = var_dag_node.var_data;

        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_get_node_deps_1k_card;
        return res;
    }

    /**
     * Si la conf de la var indique qu'on n'utilise pas cette composante, on indique qu'elle ne prendra pas de temps
     * @param var_dag_node
     * @returns l'estimation du temps de calcul de la variable sur cette composante
     */
    public get_estimated_ctree_ddeps_handle_pixellisation(var_dag_node: VarDAGNode): number {

        let var_data: VarDataBaseVO = var_dag_node.var_data;
        let res = 0;

        switch (VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
            default:
                return 0;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:
                res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
                    * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_handle_pixellisation_1k_card;
        }

        return res;
    }

    public get_estimated_load_node_datas(var_dag_node: VarDAGNode): number {

        // pas de datasources => 0
        let var_data: VarDataBaseVO = var_dag_node.var_data;

        let dss = VarsServerController.getInstance().getVarControllerById(var_data.var_id).getDataSourcesDependencies();
        let dss_predeps = VarsServerController.getInstance().getVarControllerById(var_data.var_id).getDataSourcesPredepsDependencies();

        if ((!dss) || (!dss_predeps) || (dss.length === 0) || (dss_predeps.length === 0)) {
            return 0;
        }

        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_load_node_datas_1k_card;
        return res;
    }

    public get_estimated_compute_node(var_dag_node: VarDAGNode): number {
        let var_data: VarDataBaseVO = var_dag_node.var_data;
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_compute_node_1k_card;
        return res;
    }

    /**
     * La fonction qui réalise les calculs sur un ensemble de var datas et qui met directement à jour la valeur et l'heure du calcul dans le var_data
     */
    public async compute(): Promise<void> {

        /**
         * L'invalidation des vars est faite en amont. On a que des vars à calculer ici, et on a donc "juste" à optimiser les calculs et donc les chargements de datas principalement puisque
         *  c'est le point le plus lourd potentiellement. Donc l'objectif ça serait d'avoir un cache très malin dans le DataSource qu'on puisse s'assurer de vider entre chaque appel au compute
         *  donc à la limite un cache externalisé, géré directement par le compute ça peut sembler beaucoup plus intéressant qu'un cache dans le datasource...
         */

        /**
         * Le cache des datas issues des datasources. Permet juste de s'assurer qu'on recharge pas 15 fois le cache pour un même index de donnée.
         *  L'index de donnée est défini par le datasource pour indiquer une clé unique de classement des datas dans le cache, et donc si on veut une clé déjà connue, on a pas besoin de redemander au
         *  datasource, on la récupère directement pour le donner à la var.
         */
        VarsdatasComputerBGThread.getInstance().current_batch_ds_cache = {};

        // ConsoleHandler.log('VarsdatasComputerBGThread compute - create_tree OLD OK (' + (perf_old_end - perf_old_start) + 'ms) ... ' + dag.nb_nodes + ' nodes, ' + Object.keys(dag.leafs).length + ' leafs, ' + Object.keys(dag.roots).length + ' roots');

        let var_dag: VarDAG = VarsdatasComputerBGThread.getInstance().current_batch_vardag;

        await this.create_tree_perf_wrapper(var_dag);

        ConsoleHandler.log('VarsdatasComputerBGThread compute - ' + var_dag.nb_nodes + ' nodes, ' + Object.keys(var_dag.leafs).length + ' leafs, ' + Object.keys(var_dag.roots).length + ' roots');

        if (!var_dag.nb_nodes) {
            var_dag.perfs.compute_node_wrapper.skip_and_update_parents_perfs();
            var_dag.perfs.load_nodes_datas.skip_and_update_parents_perfs();
            return;
        }

        /**
         * On a l'arbre. On charge les données qui restent à charger
         */
        await this.load_nodes_datas_perf_wrapper(var_dag);

        /**
         * Tous les noeuds dont le var_data !has_valid_value sont à calculer
         */
        await this.compute_perf_wrapper(var_dag);

        /**
         * Mise en cache, suivant stratégie pour chaque param
         */
        await this.cache_datas_perf_wrapper(var_dag);

        /**
         * On peut checker que l'arbre a bien été notifié
         */
        await this.check_tree_notification(var_dag);
    }


    /**
     *  - On entame en vérifiant qu'on a testé le cas des imports parcellaires :
     *      - Si on a des imports, on split et on relance le déploiement sur les nouveaux noeuds restants à calculer
     *      - sinon, on continue en déployant normalement les deps de ce noeud
     *  - Pour chaque DEP :
     *      - Si la dep est déjà dans la liste des vars_datas, aucun impact, on continue normalement ce cas est géré au moment de créer les noeuds pour les params
     *      - Si le noeud existe dans l'arbre, on s'assure juste que la liaison existe vers le noeud qui a tenté de générer la dep et on fuit.
     *      - Si le noeud est nouveau on le crée, et on met le lien vers le noeud source de la dep :
     *          - si le var_data possède une data on valide directement le point suivant
     *          - si on a une data précompilée ou importée en cache ou en BDD, on récupère cette data et on la met dans le var_data actuel puis on arrête de propager
     *          - sinon
     *              - on essaie de charger une ou plusieurs donnée(s) intersectant ce param
     *              - si on en trouve, on sélectionne celles qu'on veut prioriser, et on découpe le noeud qu'on transforme en aggrégateur
     *              - sur chaque nouveau noeud sans valeur / y compris si on a pas trouvé d'intersecteurs on deploy_deps
     *                  (et donc pour lesquels on sait qu'on a de valeur ni en base ni en buffer ni dans l'arbre)
     * Pour les noeuds initiaux (les vars_datas en param), on sait qu'on ne peut pas vouloir donner un import complet en résultat, donc inutile de faire cette recherche
     *  par contre un import partiel oui
     *
     * Cas de la pixellisation :
     *  - On ignore la première recherche dans le cache, puisqu'on ne trouvera pas le noeud à l'identique. Il aura été pixellisé
     *  - On cherche les imports et on découpe si besoin
     *  - On déclenche ensuite la pixellisation et la recherche de datas pré-calcs :
     *      - on request count() et sum() [ou fonction d'aggrégat plus généralement] avec filtrage sur la var_id, le champ de segmentation en inclusif, et
     *          les autres champs en excatement égal.
     *      - Si le count est égal au cardinal de la dimension de pixellisation, on a le résultat, on met à jour la var et c'est terminé
     */
    public async load_caches_and_imports_on_var_to_deploy(
        var_to_deploy: VarDataBaseVO,
        var_dag: VarDAG,
        deployed_vars_datas: { [index: string]: boolean } = {},
        vars_datas: { [index: string]: VarDataBaseVO } = {},
        limit_to_aggregated_datas: boolean = false
    ) {

        // on récupère le noeud de l'arbre
        let node = VarDAGNode.getInstance(var_dag, var_to_deploy, VarsComputeController, false);

        if (!node) {
            return null;
        }

        // si le noeud est déjà chargé, on sort
        if ((VarsServerController.getInstance().has_valid_value(node.var_data)) || (node.already_tried_loading_data_and_deploy)) {
            node.successfully_deployed = true;

            if (node.perfs && node.perfs.ctree_ddeps_try_load_cache_complet) {
                node.perfs.ctree_ddeps_try_load_cache_complet.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_load_imports_and_split_nodes.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
                node.perfs.ctree_deploy_deps.skip_and_update_parents_perfs();
            }
            await this.notify_var_data_post_deploy(node);

            return;
        }
        node.already_tried_loading_data_and_deploy = true;

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;

        if (deployed_vars_datas[node.var_data.index]) {
            if (!node.successfully_deployed) {
                node.successfully_deployed = true;
            }
            if (node.perfs && node.perfs.ctree_ddeps_try_load_cache_complet) {
                node.perfs.ctree_ddeps_try_load_cache_complet.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_load_imports_and_split_nodes.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs();
                node.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
                node.perfs.ctree_deploy_deps.skip_and_update_parents_perfs();
            }
            await this.notify_var_data_post_deploy(node);

            return;
        }
        deployed_vars_datas[node.var_data.index] = true;

        let estimated_tree_computation_time_limit = await this.get_estimated_tree_computation_time_limit();

        let batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
        let current_computation_wrapper_total_elapsed_time = var_dag.perfs ? performance.now() - var_dag.perfs.computation_wrapper.start_time : 0;

        if ((batchperf_computation_wrapper_total_estimated_remaining_time) && (current_computation_wrapper_total_elapsed_time) && ((batchperf_computation_wrapper_total_estimated_remaining_time + current_computation_wrapper_total_elapsed_time) > estimated_tree_computation_time_limit)) {
            if (DEBUG_VARS) {
                ConsoleHandler.error('BATCH estimated work time + elapsed (' +
                    batchperf_computation_wrapper_total_estimated_remaining_time + current_computation_wrapper_total_elapsed_time +
                    ') > limit (' + estimated_tree_computation_time_limit + ')');

                var_dag.timed_out = true;

                /**
                 * Tous les noeuds qui ne sont pas successfully_deployed doivent être retirés de l'arbre à ce stade et on part en calcul
                 *  pour éviter les blocages on en garde au moins 1
                 */
                let nodes_to_remove: VarDAGNode[] = [];
                for (let i in var_dag.nodes) {
                    let unsuccessfully_deployed_node = var_dag.nodes[i];

                    if (!!unsuccessfully_deployed_node.successfully_deployed) {
                        continue;
                    }

                    ConsoleHandler.error('BATCH removing node ' + unsuccessfully_deployed_node.var_data.index + ' from tree');
                    nodes_to_remove.push(unsuccessfully_deployed_node);
                }

                if (nodes_to_remove.length == var_dag.nb_nodes) {
                    let shifted = nodes_to_remove.shift();
                    ConsoleHandler.error('BATCH cancel removing node ' + shifted.var_data.index + ' from tree to keep at least one');
                    // Mais dans ce cas il faut forcer son déploiement
                    node = shifted;
                } else {
                    node = null;
                }

                for (let i in nodes_to_remove) {
                    let node_to_remove = nodes_to_remove[i];
                    node_to_remove.unlinkFromDAG();
                }

                if (!node) {
                    return;
                }
            }
        }

        this.start_node_deploiement(node);

        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
        let varconf = VarsController.getInstance().var_conf_by_id[node.var_data.var_id];

        /**
         * Cache complet - inutile si on est sur un noeud du vars_datas ou si on a déjà fait le chargement
         *  on teste toujours de retrouver un calcul existant
         */
        if ((!node.already_tried_load_cache_complet) && (!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index])) {

            await this.try_load_cache_complet_perf_wrapper(node);

            if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                if (node.perfs && node.perfs.ctree_ddeps_load_imports_and_split_nodes) {
                    node.perfs.ctree_ddeps_load_imports_and_split_nodes.skip_and_update_parents_perfs();
                    node.perfs.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs();
                    node.perfs.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs();
                    node.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
                }
                this.end_node_deploiement(node);
                await this.notify_var_data_post_deploy(node);
                return;
            }
        } else {
            if (node.perfs && node.perfs.ctree_ddeps_try_load_cache_complet) {
                node.perfs.ctree_ddeps_try_load_cache_complet.skip_and_update_parents_perfs();
            }
        }

        /**
         * Imports
         */
        if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!controller || !controller.optimization__has_no_imports)) {

            /**
             * On doit essayer de récupérer des données parcellaires
             *  si on a des données parcellaires par définition on doit quand même déployer les deps
             */

            await this.load_imports_and_split_nodes_perf_wrapper(node);

            if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                if (node.perfs && node.perfs.ctree_ddeps_handle_pixellisation) {
                    node.perfs.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs();
                    node.perfs.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs();
                    node.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
                }
                this.end_node_deploiement(node);
                await this.notify_var_data_post_deploy(node);
                return;
            }
        } else {
            if (node.perfs && node.perfs.ctree_ddeps_load_imports_and_split_nodes) {
                node.perfs.ctree_ddeps_load_imports_and_split_nodes.skip_and_update_parents_perfs();
            }
        }

        /**
         * Cas de la pixellisation qu'on sort des autres types de cache
         */
        if (varconf.pixel_activated) {

            await this.handle_pixellisation_perf_wrapper(node, varconf, var_dag, limit_to_aggregated_datas, DEBUG_VARS);

            if (node.successfully_deployed) {
                return;
            }
        } else {

            if (node.perfs && node.perfs.ctree_ddeps_handle_pixellisation) {
                node.perfs.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs();
            }

            /**
             * Cache step C : cache partiel : uniquement si on a pas splitt sur import
             */
            if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                (!node.is_aggregator) &&
                (VarsCacheController.getInstance().use_partial_cache(node))) {

                VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.ctree_ddeps_try_load_cache_partiel);
                await this.try_load_cache_partiel(node);
                VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.ctree_ddeps_try_load_cache_partiel);

                if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                    if (node.perfs && node.perfs.ctree_ddeps_get_node_deps) {
                        node.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
                    }
                    this.end_node_deploiement(node);
                    await this.notify_var_data_post_deploy(node);
                    return;
                }
            } else {
                if (node.perfs && node.perfs.ctree_ddeps_try_load_cache_partiel) {
                    node.perfs.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs();
                }
            }
        }

        if (limit_to_aggregated_datas) {

            // Si on a des données aggrégées elles sont déjà ok à renvoyer si on ne veut que savoir les données aggrégées
            if (node.perfs && node.perfs.ctree_ddeps_get_node_deps) {
                node.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
            }
            this.end_node_deploiement(node);
            await this.notify_var_data_post_deploy(node);
            return;
        }

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps_perf_wrapper(node);

        /**
         * Si dans les deps on a un denied, on refuse le tout
         */
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':IN:' + (deps ? Object.keys(deps).length : 0));
        }
        for (let i in deps) {
            let dep = deps[i];

            if (dep.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                node.var_data.value = 0;
                node.var_data.value_ts = Dates.now();

                this.end_node_deploiement(node);
                await this.notify_var_data_post_deploy(node);
                return;
            }

            if (DEBUG_VARS) {
                ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':dep:' + dep.index + ':');
            }
        }
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':OUT:');
        }

        /**
         * On notifie d'un calcul en cours que si on a pas la valeur directement dans le cache ou en base de données, ou en import, ou en pixel, ou on a limité à une question sur les aggregated_datas, ou c'est denied
         */
        await VarsTabsSubsController.getInstance().notify_vardatas([new NotifVardatasParam([node.var_data], true)]);
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':notify_vardatas:OUT:');
        }

        if (deps) {
            await this.handle_deploy_deps(node, deps, deployed_vars_datas, vars_datas);
        }
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':handle_deploy_deps:OUT:');
        }

        this.end_node_deploiement(node);
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':end_node_deploiement:OUT:');
        }

        await this.notify_var_data_post_deploy(node);
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':notify_var_data_post_deploy:OUT:');
        }
    }

    /**
     * Tous les noeuds du vars_datas sont par définition en cache, donc on se pose la question que pour les autres
     * @param dag
     * @param vars_datas
     */
    private async cache_datas(dag: VarDAG) {

        // Si on a dans le buffer une version plus ancienne on doit mettre à jour
        await VarsDatasProxy.getInstance().update_existing_buffered_older_datas(Object.values(dag.nodes).map((n) => n.var_data), 'cache_datas');

        for (let i in dag.nodes) {
            let node = dag.nodes[i];

            if (node.is_batch_var) {
                continue;
            }

            if (VarsCacheController.getInstance().BDD_do_cache_param_data(node.var_data, VarsServerController.getInstance().getVarControllerById(node.var_data.var_id), node.is_batch_var)) {
                await VarsDatasProxy.getInstance().append_var_datas([node.var_data], 'cache_datas');
            }
        }
    }

    private async load_nodes_datas(var_dag: VarDAG) {
        let env = ConfigurationService.getInstance().node_configuration;

        let promises = [];
        let load_node_data_db_connect_coef_sum: number = 0;
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));

        for (let i in var_dag.nodes) {
            let node = var_dag.nodes[i];
            let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[node.var_data.index];

            // Si le noeud a une valeur on se fout de load les datas
            if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                if (env.DEBUG_VARS) {
                    ConsoleHandler.log('load_nodes_datas:has_valid_value:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type] +
                        ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
                }

                continue;
            }

            let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

            let dss: DataSourceControllerBase[] = controller.getDataSourcesDependencies();

            if ((!dss) || (!dss.length)) {
                continue;
            }

            if (load_node_data_db_connect_coef_sum >= max) {
                await Promise.all(promises);
                load_node_data_db_connect_coef_sum = 0;
                promises = [];
            }

            for (let dssi in dss) {
                let ds = dss[dssi];
                load_node_data_db_connect_coef_sum += ds.load_node_data_db_connect_coef;
            }

            promises.push((async () => {

                VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.load_node_datas);

                await DataSourcesController.getInstance().load_node_datas(dss, node);

                VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.load_node_datas);
            })());

            if (env.DEBUG_VARS) {
                ConsoleHandler.log('loaded_node_datas:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type] +
                    ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
            }
        }

        if (promises && promises.length) {
            await Promise.all(promises);
        }
    }

    /**
     * Pour calculer un noeud, il faut les datasources, et faire appel à la fonction de calcul du noeud
     * @param node
     */
    private async compute_node(node: VarDAGNode) {

        VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.compute_node);

        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
        await controller.computeValue(node);

        VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.compute_node);

        await this.notify_var_data_post_deploy(node);
    }

    private async handle_deploy_deps(
        node: VarDAGNode,
        deps: { [index: string]: VarDataBaseVO },
        deployed_vars_datas: { [index: string]: boolean },
        vars_datas: { [index: string]: VarDataBaseVO }) {

        let deps_as_array = Object.values(deps);
        let deps_ids_as_array = Object.keys(deps);

        let deps_promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));

        let start_time = Dates.now();
        let real_start_time = start_time;

        for (let deps_i in deps_as_array) {

            if ((!node.var_dag) || (!node.var_dag.nodes[node.var_data.index])) {
                return;
            }

            let actual_time = Dates.now();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.warn('VarsComputeController:handle_deploy_deps:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            /**
             * On fait des packs de promises...
             */
            if (deps_promises.length >= max) {
                await Promise.all(deps_promises);
                deps_promises = [];
            }
            let dep = deps_as_array[deps_i];
            let dep_id = deps_ids_as_array[deps_i];

            if (node.var_dag.nodes[dep.index]) {
                node.addOutgoingDep(dep_id, node.var_dag.nodes[dep.index]);
                continue;
            }

            let dep_node = VarDAGNode.getInstance(node.var_dag, dep, VarsComputeController, false);
            if (!dep_node) {
                return;
            }

            node.addOutgoingDep(dep_id, dep_node);

            deps_promises.push((async () => {
                await this.load_caches_and_imports_on_var_to_deploy(dep_node.var_data, dep_node.var_dag, deployed_vars_datas, vars_datas);
            })());
        }

        if (deps_promises.length) {
            await Promise.all(deps_promises);
        }
    }

    private async try_load_cache_complet(node: VarDAGNode) {

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;

        node.already_tried_load_cache_complet = true;
        let cache_complet = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(node.var_data, false, 'try_load_cache_complet');
        let wrapper = VarsDatasProxy.getInstance().vars_datas_buffer_wrapped_indexes[node.var_data.index];

        if (!cache_complet) {
            if (DEBUG_VARS) {
                ConsoleHandler.log('try_load_cache_complet:' + node.var_data.index + ':aucun cache complet' +
                    ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
            }

            return;
        }

        // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
        node.var_data.id = cache_complet.id;
        node.var_data.value = cache_complet.value;
        node.var_data.value_ts = cache_complet.value_ts;
        node.var_data.value_type = cache_complet.value_type;
        if (DEBUG_VARS) {
            ConsoleHandler.log('try_load_cache_complet:' + node.var_data.index + ':OK:' + cache_complet.value + ':' + cache_complet.value_ts + ':' + cache_complet.id +
                ':client_user_id:' + (wrapper ? wrapper.client_user_id : 'N/A') + ':client_tab_id:' + (wrapper ? wrapper.client_tab_id : 'N/A') + ':is_server_request:' + (wrapper ? wrapper.is_server_request : 'N/A') + ':reason:' + (wrapper ? wrapper.reason : 'N/A'));
        }
    }

    private async try_load_cache_partiel(node: VarDAGNode) {

        let caches_partiels: VarDataBaseVO[] = await query(node.var_data._type)
            .filter_by_matroids_inclusion([node.var_data])
            .select_vos<VarDataBaseVO>();

        if ((!caches_partiels) || (!caches_partiels.length)) {
            return;
        }

        let validated_caches_partiels: VarDataBaseVO[] = [];

        for (let i in caches_partiels) {
            let cache_partiel = caches_partiels[i];

            if (!VarsCacheController.getInstance().use_partial_cache_element(node, cache_partiel)) {
                continue;
            }

            validated_caches_partiels.push(cache_partiel);
        }

        /**
         * On utilise la même méthode ensuite que pour les imports, sinon qu'on sait pas ce qui est en cache donc on peut pas optimiser en caches atomiques
         */
        await VarsImportsHandler.getInstance().split_nodes(node, validated_caches_partiels, false);
    }

    /**
     *  - Pour identifier les deps :
     *      - Chargement des ds predeps du noeud
     *      - Chargement des deps
     */
    private async get_node_deps(node: VarDAGNode): Promise<{ [dep_id: string]: VarDataBaseVO }> {

        if (node.is_aggregator) {
            let aggregated_deps: { [dep_id: string]: VarDataBaseVO } = {};
            let index = 0;

            for (let i in node.aggregated_datas) {
                let data = node.aggregated_datas[i];
                aggregated_deps['AGG_' + (index++)] = data;

                // on peut essayer de notifier les deps issues des aggréagations qui auraient déjà une valeur valide
                let dep_node = VarDAGNode.getInstance(node.var_dag, data, VarsComputeController, false);
                if (!dep_node) {
                    return null;
                }

                await this.notify_var_data_post_deploy(dep_node);
            }
            return aggregated_deps;
        }

        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        /**
         * On charge toutes les datas predeps
         */
        let predeps_dss: DataSourceControllerBase[] = controller.getDataSourcesPredepsDependencies();
        if (predeps_dss && predeps_dss.length) {

            // VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.load_node_datas_predep);

            await DataSourcesController.getInstance().load_node_datas(predeps_dss, node);

            // VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.load_node_datas_predeps);
        }

        /**
         * On demande les deps
         */
        return controller.getParamDependencies(node);
    }


    /**
     * Première étape, on identifie les noeuds à déployer
     *  pour ça on se base sur l'arbre des controllers, pour déployer l'arbre du haut vers le bas
     * Ensuite on charge le cache de ces noeuds
     * En fonction on adapte les noeuds puis on fait le déploiement des noeuds (non récursif juste on prépare la couche suivante)
     * Quand on a plus de noeuds à déployer c'est qu'on a terminé
     *
     * En termes de notifications de vars :
     *  On veut notifier les calculs à venir sur les vars qui ont été demandées en front (donc filtrer par tabssubs)
     *  On veut notifier les résultats dans tous les cas (compliqué de savoir si c'est déjà transmis ou non - hors batch) pour
     *      tous les abonnements, que ce soit front ou serveur
     *      le plus tôt possible, mais sans bloquer les calculs non plus pour ça
     *      donc si possible à la fin des déploiements on fait le tours des valid values et on envoie + on flag comme transmis
     *      à la fin de chaque calcul on envoie et on flag comme envoyé
     *      à la fin du process on peut checker que l'arbre complet a bien été envoyé (on devrait avoir tout envoyé déjà)
     */
    private async create_tree(): Promise<VarDAG> {

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;

        let var_dag: VarDAG = VarsdatasComputerBGThread.getInstance().current_batch_vardag;

        let estimated_tree_computation_time_target = await this.get_estimated_tree_computation_time_target();
        let var_selection_pack_size = await this.get_var_selection_pack_size();

        let all_selected_var_datas = [];

        /**
         * Tant que le temps estimé restant global + le temps déjà écoulé reste < à la limite principale (3 secondes par défaut) on continue de rajouter à l'arbre
         */
        let batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
        let current_total_elapsed_time = var_dag.perfs ? performance.now() - var_dag.perfs.computation_wrapper.start_time : 0;
        while ((!batchperf_computation_wrapper_total_estimated_remaining_time) || (!current_total_elapsed_time) || ((batchperf_computation_wrapper_total_estimated_remaining_time + current_total_elapsed_time) < estimated_tree_computation_time_target)) {

            /**
             * On commence par sélectionner la prochaine var, soit depuis les slow vars (si on est en position de le faire), soit depuis le cache
             */
            let selected_slow_var: VarDataBaseVO = await this.get_slow_var();
            let selected_var_datas: VarDataBaseVO[] = selected_slow_var ? [selected_slow_var] : [];

            if (!!selected_slow_var) {
                ConsoleHandler.error('SELECTED SLOW VAR :' + selected_slow_var.index);
            }

            /**
             * Piocher une var, l'ajouter à l'arbre, déployer ses deps :
             *  - Pendant le déploiement si on dépasse les 30 secondes estimées on coupe tout et on supprime les noeuds incomplets
             *      (qui n'avaient pas fini de déployer leurs deps)
             *  - A la fin du déploiement, si on est sous les 3 secondes estimées, on dépile à nouveau une var registered et on déploie
             *  - Si on a plus rien à dépiler ou si on est au dessus des 3 secondes (ou des 30 après avoir nettoyé l'arbre) on valide l'arbre pour calcul
             *
             * Pour booster un peu tout ça et limiter le risque de calculer les vars une à une quand les estimations sont très élevée, on fait des paquets de x vars
             *  à ajouter à l'arbre
             */
            if ((!selected_var_datas) || (!selected_var_datas.length)) {
                let wrapped_select_var: VarDataProxyWrapperVO<VarDataBaseVO> = await VarsDatasProxy.getInstance().select_var_from_buffer();
                let i = 0;
                while ((wrapped_select_var) && (i < var_selection_pack_size)) {

                    if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log('SELECTED WRAPPED VAR :' + wrapped_select_var.var_data.index +
                            ':client_user_id:' + wrapped_select_var.client_user_id +
                            ':client_socket_id:' + wrapped_select_var.client_tab_id +
                            ':is_server_request:' + wrapped_select_var.is_server_request +
                            ':reason:' + wrapped_select_var.reason +
                            ':creation_date:' + Dates.format(wrapped_select_var.creation_date, 'DD/MM/YYYY HH:mm:ss') +
                            ':var_data_origin_value:' + wrapped_select_var.var_data_origin_value +
                            ':var_data_origin_type:' + wrapped_select_var.var_data_origin_type +
                            ':last_insert_or_update:' + Dates.format(wrapped_select_var.last_insert_or_update, 'DD/MM/YYYY HH:mm:ss') +
                            ':'
                        );
                    }
                    selected_var_datas.push(wrapped_select_var.var_data);
                    i++;
                    wrapped_select_var = await VarsDatasProxy.getInstance().select_var_from_buffer();
                }
            }

            if ((!selected_var_datas) || (!selected_var_datas.length)) {

                // On a tout dépilé a priori

                // Si on a des slow vars ici, on continue la boucle, on devrait pouvoir dépiler immédiatement la première
                if (await this.check_tree_for_slow_vars(var_dag, all_selected_var_datas)) {
                    all_selected_var_datas = [];
                    batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
                    current_total_elapsed_time = var_dag.perfs ? performance.now() - var_dag.perfs.computation_wrapper.start_time : 0;
                    continue;
                }
                return var_dag;
            }

            selected_var_datas = await this.filter_disabled_var(selected_var_datas);

            for (let i in selected_var_datas) {
                let selected_var_data = selected_var_datas[i];

                batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
                current_total_elapsed_time = var_dag.perfs ? performance.now() - var_dag.perfs.computation_wrapper.start_time : 0;

                /**
                 * Si on time out sur la création de l'arbre on refuse d'ajouter de nouveaux éléments
                 */
                if (batchperf_computation_wrapper_total_estimated_remaining_time && current_total_elapsed_time &&
                    ((batchperf_computation_wrapper_total_estimated_remaining_time + current_total_elapsed_time) > estimated_tree_computation_time_target)) {
                    break;
                }

                all_selected_var_datas.push(selected_var_data);
                batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;

                let batchperf_create_tree_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.create_tree)) : 0;
                let batchperf_load_nodes_datas_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.load_nodes_datas)) : 0;
                let batchperf_compute_node_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.compute_node_wrapper)) : 0;
                ConsoleHandler.log('SELECTED VAR:' + selected_var_data.index + ':Total computation estimated time before adding this node:[' +
                    (var_dag.perfs && Math.round(var_dag.perfs.computation_wrapper.updated_estimated_work_time) ? var_dag.perfs.computation_wrapper.updated_estimated_work_time : 0) +
                    ']:' +
                    '{' +
                    'create_tree:[' + (var_dag.perfs && Math.round(var_dag.perfs.create_tree.updated_estimated_work_time) ? var_dag.perfs.create_tree.updated_estimated_work_time : 0) + '],' +
                    'load_nodes_datas:[' + (var_dag.perfs && Math.round(var_dag.perfs.load_nodes_datas.updated_estimated_work_time) ? var_dag.perfs.load_nodes_datas.updated_estimated_work_time : 0) + '],' +
                    'compute_node_wrapper:[' + (var_dag.perfs && Math.round(var_dag.perfs.compute_node_wrapper.updated_estimated_work_time) ? var_dag.perfs.compute_node_wrapper.updated_estimated_work_time : 0) +
                    ']}' +
                    ':Remaining:[' + batchperf_computation_wrapper_total_estimated_remaining_time + ']:' +
                    '{' +
                    'create_tree:[' + batchperf_create_tree_total_estimated_remaining_time + '],' +
                    'load_nodes_datas:[' + batchperf_load_nodes_datas_total_estimated_remaining_time + '],' +
                    'compute_node_wrapper:[' + batchperf_compute_node_wrapper_total_estimated_remaining_time +
                    ']}');

                /**
                 * On insère le noeud dans l'arbre en premier pour forcer le flag already_tried_load_cache_complet
                 *  puisque si on avait ce cache on demanderait pas un calcul à ce stade
                 */
                let var_dag_node = VarDAGNode.getInstance(var_dag, selected_var_data, VarsComputeController, true);
                if (!var_dag_node) {

                    ConsoleHandler.log('UNSELECTED VAR:' + selected_var_data.index);

                    // Si on a des slow vars ici, on continue la boucle, on devrait pouvoir dépiler immédiatement la première
                    if (await this.check_tree_for_slow_vars(var_dag, all_selected_var_datas)) {
                        all_selected_var_datas = [];
                        continue;
                    }
                    return var_dag;
                }

                if (DEBUG_VARS && !!var_dag.perfs) {
                    batchperf_computation_wrapper_total_estimated_remaining_time = VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper);

                    batchperf_create_tree_total_estimated_remaining_time = Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.create_tree));
                    batchperf_load_nodes_datas_total_estimated_remaining_time = Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.load_nodes_datas));
                    batchperf_compute_node_wrapper_total_estimated_remaining_time = Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.compute_node_wrapper));
                    ConsoleHandler.log('POST SELECT :' + selected_var_data.index + ':Total computation estimated time after adding this node:[' +
                        Math.round(var_dag.perfs.computation_wrapper.updated_estimated_work_time ? var_dag.perfs.computation_wrapper.updated_estimated_work_time : 0) +
                        ']:' +
                        '{' +
                        'create_tree:[' + Math.round(var_dag.perfs.create_tree.updated_estimated_work_time ? var_dag.perfs.create_tree.updated_estimated_work_time : 0) + '],' +
                        'load_nodes_datas:[' + Math.round(var_dag.perfs.load_nodes_datas.updated_estimated_work_time ? var_dag.perfs.load_nodes_datas.updated_estimated_work_time : 0) + '],' +
                        'compute_node_wrapper:[' + Math.round(var_dag.perfs.compute_node_wrapper.updated_estimated_work_time ? var_dag.perfs.compute_node_wrapper.updated_estimated_work_time : 0) +
                        ']}' +
                        ':Remaining:[' + batchperf_computation_wrapper_total_estimated_remaining_time + ']:' +
                        '{' +
                        'create_tree:[' + batchperf_create_tree_total_estimated_remaining_time + '],' +
                        'load_nodes_datas:[' + batchperf_load_nodes_datas_total_estimated_remaining_time + '],' +
                        'compute_node_wrapper:[' + batchperf_compute_node_wrapper_total_estimated_remaining_time +
                        ']}');
                }

                var_dag_node.already_tried_load_cache_complet = true;
            }

            let vars_datas_to_deploy_by_controller_height = await this.get_vars_datas_by_controller_height(var_dag);
            let step = 1;
            while (Object.keys(vars_datas_to_deploy_by_controller_height).length && ((!var_dag.timed_out) || (!var_dag.nb_nodes))) {

                // On sélectionne les vars à déployer
                let vars_to_deploy: { [index: string]: VarDataBaseVO } = this.get_vars_to_deploy(vars_datas_to_deploy_by_controller_height);
                let vars_to_deploy_indexs: string[] = vars_to_deploy ? Object.keys(vars_to_deploy) : [];

                if (DEBUG_VARS) {
                    ConsoleHandler.log('create_tree:Step ' + step + ':Deploying ' + vars_to_deploy_indexs.length + ' vars');
                }

                // on notifie du calcul en cours
                // pas utile de demander le filtrage par sub, on notifie juste pas si personne est en attente, et par ailleurs
                //  la notification est en throttle donc on perd pas de temps alors que le filtrage par sub attend le res du main thread
                // let vars_to_deploy_filtered_by_tab_subs_indexes = await VarsTabsSubsController.getInstance().filter_by_subs(vars_to_deploy_indexs);
                if (vars_to_deploy_indexs && vars_to_deploy_indexs.length) {
                    await VarsTabsSubsController.getInstance().notify_vardatas(
                        vars_to_deploy_indexs.map((index: string) => new NotifVardatasParam([vars_to_deploy[index]], true)));
                }

                if (DEBUG_VARS) {
                    ConsoleHandler.log('create_tree:Step ' + step + ':Notified ' + (vars_to_deploy_indexs ? vars_to_deploy_indexs.length : 0) + ' vars');
                }

                // On charge les caches pour ces noeuds
                //  et on récupère les nouveaux vars_datas à insérer dans l'arbre
                await this.load_caches_and_imports_on_vars_to_deploy(vars_to_deploy, var_dag);

                if (DEBUG_VARS) {
                    ConsoleHandler.log('create_tree:Step ' + step + ':load_caches_and_imports_on_vars_to_deploy: OUT');
                }

                // On doit ensuite charger les ds pre deps
                await this.deploy_deps_on_vars_to_deploy(vars_to_deploy, var_dag);

                if (DEBUG_VARS) {
                    ConsoleHandler.log('create_tree:Step ' + step + ':deploy_deps_on_vars_to_deploy: OUT');
                }

                vars_datas_to_deploy_by_controller_height = await this.get_vars_datas_by_controller_height(var_dag);
                step++;
            }

            batchperf_computation_wrapper_total_estimated_remaining_time = var_dag.perfs ? Math.round(VarDagPerfsServerController.getInstance().get_nodeperfelement_estimated_remaining_work_time(var_dag.perfs.computation_wrapper)) : 0;
            current_total_elapsed_time = var_dag.perfs ? (performance.now() - var_dag.perfs.computation_wrapper.start_time) : 0;
        }

        // Si on a des slow vars ici, on reviendra par un nouveau batch
        await this.check_tree_for_slow_vars(var_dag, all_selected_var_datas);
        return var_dag;
    }

    /**
     * On doit mettre en slow vars si plus de noeuds dans l'arbre
     * @param var_dag
     * @returns true if it pushed a slow var, false otherwise
     */
    private async check_tree_for_slow_vars(var_dag: VarDAG, all_selected_var_datas: VarDataBaseVO[]): Promise<boolean> {
        if (var_dag.nb_nodes > 0) {
            return false;
        }

        if ((!all_selected_var_datas) || !all_selected_var_datas.length) {
            return false;
        }

        // On a un risque de blocage sur un arbre impossible à construire par ce que le temps de construction est supérieur a priori au temps max
        //  on les passe en slowvars et du coup ça devrait dépiler 1 à 1 au prochain passage
        ConsoleHandler.error('Potentiel blocage - arbre vide alors qu\'on a sélectionné des params, on passe les vars sélectionnées en slowvars pour les traiter une à une, sauf si elle était déjà seule dans ce cas on classe en incalculable');

        ConsoleHandler.error('Modif on force le calcul de la var dans tous les cas on insère jamais en slow var juste on les fera une à une au pire');

        return false;
        // await SlowVarKiHandler.getInstance().insertSlowVarsBatchInBDD(all_selected_var_datas);
        // VarsDatasProxy.getInstance().can_load_vars_to_test = true;

        // // Les slow vars rencontrées n'indiquent pas la fin du dépilage des vars en attente.
        // // On doit donc tester asap de dépiler les vars potentiellement en attente
        // VarsdatasComputerBGThread.getInstance().force_run_asap();

        // return true;
    }

    /**
     * @param selected_var_datas
     * @returns un nouveau tableau avec les vars qui ne sont pas disabled
     */
    private async filter_disabled_var(selected_var_datas: VarDataBaseVO[]): Promise<VarDataBaseVO[]> {
        let res: VarDataBaseVO[] = [];
        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;

        for (let i in selected_var_datas) {
            let selected_var_data = selected_var_datas[i];
            let var_conf = VarsController.getInstance().var_conf_by_id[selected_var_data.var_id];
            if (var_conf.disable_var) {

                if (selected_var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                    continue;
                }

                selected_var_data.value = 0;
                selected_var_data.value_ts = Dates.now();
                selected_var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;

                if (DEBUG_VARS) {
                    ConsoleHandler.warn('Found disabled_var:' + selected_var_data.var_id + ':' + var_conf.name + ':' + selected_var_data.index + ':DENY in DB and continue');
                }
                await ModuleDAO.getInstance().insertOrUpdateVO(selected_var_data);

                continue;
            }

            res.push(selected_var_data);
        }

        return res;
    }

    /**
     * Si c'est suite à un redémarrage on check si on a des vars en attente de test en BDD
     *  Si c'est le cas on gère la première de ces vars, sinon on enlève le mode démarrage
     */
    private async get_slow_var(): Promise<VarDataBaseVO> {
        let vardata_to_test: VarDataBaseVO = VarsDatasProxy.getInstance().can_load_vars_to_test ? await SlowVarKiHandler.getInstance().handle_slow_var_ki_start() : null;
        if (vardata_to_test) {
            ConsoleHandler.log('get_vars_to_compute:1 SLOWVAR:' + vardata_to_test.index);
            return vardata_to_test;
        }
        VarsDatasProxy.getInstance().can_load_vars_to_test = false;
        return null;
    }

    // private pop_vars_to_deploy(vars_datas_to_deploy_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } }): { [index: string]: VarDataBaseVO } {
    //     let max_height = Math.max(...Object.keys(vars_datas_to_deploy_by_controller_height).map((h: string) => parseInt(h)));
    //     let res = vars_datas_to_deploy_by_controller_height[max_height];
    //     delete vars_datas_to_deploy_by_controller_height[max_height];
    //     return res;
    // }

    private get_vars_to_deploy(vars_datas_to_deploy_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } }): { [index: string]: VarDataBaseVO } {
        let max_height = Math.min(...Object.keys(vars_datas_to_deploy_by_controller_height).map((h: string) => parseInt(h)));
        return vars_datas_to_deploy_by_controller_height[max_height];
    }

    /**
     * Organiser les vars datas par profondeur du controller (en sachant que plus le controller est haut dans l'arbre, plus sa profondeur est élevée)
     *  on se base directement sur l'arbre, et on prend en compte que les éléments pas encore déployé, et sans valeur valide
     */
    private async get_vars_datas_by_controller_height(var_dag: VarDAG): Promise<{ [height: number]: { [index: string]: VarDataBaseVO } }> {
        let vars_datas_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } } = {};

        // if (var_dag.timed_out) {
        //     return vars_datas_by_controller_height;
        // }

        // Ensuite par hauteur dans l'arbre
        if (!VarsServerController.getInstance().varcontrollers_dag_depths) {
            await VarsServerController.getInstance().init_varcontrollers_dag_depths();
        }

        for (let i in var_dag.nodes) {
            let node = var_dag.nodes[i];
            let var_data = node.var_data;

            if (node.already_tried_loading_data_and_deploy || VarsServerController.getInstance().has_valid_value(var_data)) {
                continue;
            }

            let var_height = VarsServerController.getInstance().varcontrollers_dag_depths[var_data.var_id];

            if (!vars_datas_by_controller_height[var_height]) {
                vars_datas_by_controller_height[var_height] = {};
            }
            vars_datas_by_controller_height[var_height][var_data.index] = var_data;
        }
        return vars_datas_by_controller_height;
    }

    // private get_vars_datas_by_controller_height(vars_datas: { [index: string]: VarDataBaseVO }): { [height: number]: { [index: string]: VarDataBaseVO } } {
    //     let vars_datas_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } } = {};

    //     for (let i in vars_datas) {
    //         let var_data = vars_datas[i];
    //         let var_height = VarsServerController.getInstance().varcontrollers_dag_depths[var_data.var_id];

    //         if (!vars_datas_by_controller_height[var_height]) {
    //             vars_datas_by_controller_height[var_height] = {};
    //         }
    //         vars_datas_by_controller_height[var_height][var_data.index] = var_data;
    //     }
    //     return vars_datas_by_controller_height;
    // }

    // private pop_var_to_deploy(vars_datas_to_deploy: { [index: string]: VarDataBaseVO }) {
    //     let index = ObjectHandler.getInstance().getFirstAttributeName(vars_datas_to_deploy);

    //     if (!index) {
    //         return null;
    //     }

    //     let res = vars_datas_to_deploy[index];
    //     delete vars_datas_to_deploy[index];
    //     return res;
    // }

    /**
     * On renvoie les nouveaux noeuds à déployer si on en trouve à cette étape
     */
    private async load_caches_and_imports_on_vars_to_deploy(
        vars_to_deploy: { [index: string]: VarDataBaseVO },
        var_dag: VarDAG) {

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));

        for (let i in vars_to_deploy) {

            let var_to_deploy: VarDataBaseVO = vars_to_deploy[i];

            if (promises.length >= max) {
                await all_promises(promises);
                if (var_dag.timed_out && !!var_dag.nb_nodes) {
                    return;
                }

                promises = [];
            }

            promises.push(this.load_caches_and_imports_on_var_to_deploy(var_to_deploy, var_dag));
        }

        if (promises && promises.length) {
            await all_promises(promises);
        }
    }

    private async notify_var_data_post_deploy(var_dag_node: VarDAGNode) {
        /**
         * On fait la notif post déploiement si ça a du sens
         */
        if ((!var_dag_node.already_sent_result_to_subs) &&
            VarsServerController.getInstance().has_valid_value(var_dag_node.var_data)) {

            var_dag_node.already_sent_result_to_subs = true;
            await VarsTabsSubsController.getInstance().notify_vardatas(
                [new NotifVardatasParam([var_dag_node.var_data])]);
            await VarsServerCallBackSubsController.getInstance().notify_vardatas([var_dag_node.var_data]);
        }

    }

    /**
     * On charge d'abord les datas pré deps
     * Ensuite on fait la liste des noeuds à déployer à nouveau (les deps)
     */
    private async deploy_deps_on_vars_to_deploy(
        vars_to_deploy: { [index: string]: VarDataBaseVO },
        var_dag: VarDAG
    ) {

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));

        for (let i in vars_to_deploy) {
            let var_to_deploy = vars_to_deploy[i];

            if (VarsServerController.getInstance().has_valid_value(var_to_deploy)) {
                continue;
            }

            if (promises.length >= max) {
                await all_promises(promises);
                promises = [];
            }

            let var_dag_node = VarDAGNode.getInstance(var_dag, var_to_deploy, VarsComputeController, false);
            if (!var_dag_node) {
                await all_promises(promises);
                return;
            }

            promises.push(this.deploy_deps_on_var_to_deploy(var_dag_node, var_dag));
        }

        if (promises && promises.length) {
            await all_promises(promises);
        }
    }

    private async deploy_deps_on_var_to_deploy(
        var_dag_node: VarDAGNode,
        var_dag: VarDAG
    ) {

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps_perf_wrapper(var_dag_node);

        /**
         * Si dans les deps on a un denied, on refuse le tout
         */
        for (let i in deps) {
            let dep = deps[i];

            if (dep.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                var_dag_node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                var_dag_node.var_data.value = 0;
                var_dag_node.var_data.value_ts = Dates.now();
                return;
            }
        }

        for (let dep_id in deps) {
            let dep = deps[dep_id];

            if (var_dag.nodes[dep.index]) {
                var_dag_node.addOutgoingDep(dep_id, var_dag.nodes[dep.index]);
                continue;
            }

            let dep_node = VarDAGNode.getInstance(var_dag, dep, VarsComputeController, false);
            if (!dep_node) {
                return;
            }
            var_dag_node.addOutgoingDep(dep_id, dep_node);
        }
    }

    private async check_tree_notification(dag: VarDAG) {
        for (let i in dag.nodes) {
            let node = dag.nodes[i];

            if (!node.already_sent_result_to_subs) {

                /**
                 * On a pas notifié une var, qui est un import, et n'est pas la cible du calcul initial
                 *  => a priori c'est ok ? si j'ai besoin de cette var, je l'ai déjà téléchargée normalement
                 *  et on est pas en train de remettre en cause sa valeur
                 */
                if (node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
                    // ConsoleHandler.log('Pas notifiée mais import:' + JSON.stringify(node.var_data));
                    continue;
                }

                ConsoleHandler.error('Var pas notifiée:' + JSON.stringify(node.var_data));
            }
        }
    }

    /**
     * On génère tous les pixels nécessaires, et à chaque fois, si on le trouve dans la liste des pixels connus, on ne crée pas le noeuds
     *  puisque le résultat est déjà connu/inclut dans le aggregated_value
     * On part en récursif, et à chaque fois on cherche un champs à pixellisé.
     *      Si on en trouve plus (après le dernier champ pixellisé), on ajoute le pixel dans le aggregated_datas
     *      Si on en trouve => on déploie cette dimension, et pour chaque valeur, si on la trouve dans le aggregated, on ignore,
     *          sinon on recurse en clonant le var_data et en settant le field déployé
     */
    private populate_missing_pixels(
        aggregated_datas: { [index: string]: VarDataBaseVO },
        var_conf: VarConfVO,
        var_data: VarDataBaseVO,
        pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO },
        cloned_var_data: VarDataBaseVO,
        current_pixellised_field_id: string = null) {

        let can_check_field = !current_pixellised_field_id;
        for (let i in pixellised_fields_by_id) {
            let pixellised_field = pixellised_fields_by_id[i];

            if (!can_check_field) {
                if (i == current_pixellised_field_id) {
                    can_check_field = true;
                    continue;
                }
            }

            let field = VOsTypesManager.moduleTables_by_voType[var_data._type].get_field_by_id(pixellised_field.pixel_param_field_id);
            let segment_type = (var_conf.segment_types && var_conf.segment_types[field.field_id]) ? var_conf.segment_types[field.field_id] : RangeHandler.getInstance().get_smallest_segment_type_for_range_type(RangeHandler.getInstance().getRangeType(field));

            RangeHandler.getInstance().foreach_ranges_sync(var_data[pixellised_field.pixel_param_field_id], (pixel_value: number) => {

                let new_var_data = VarDataBaseVO.cloneFromVarId(cloned_var_data, cloned_var_data.var_id, true);
                new_var_data[pixellised_field.pixel_param_field_id] = [RangeHandler.getInstance().createNew(
                    RangeHandler.getInstance().getRangeType(field),
                    pixel_value,
                    pixel_value,
                    true,
                    true,
                    segment_type
                )];
                if (!aggregated_datas[new_var_data.index]) {
                    this.populate_missing_pixels(
                        aggregated_datas,
                        var_conf,
                        var_data,
                        pixellised_fields_by_id,
                        new_var_data,
                        i
                    );
                }
            }, segment_type);
            return;
        }

        if (aggregated_datas[cloned_var_data.index]) {
            return;
        }
        aggregated_datas[cloned_var_data.index] = cloned_var_data;
    }

    /**
     * On demande de recharge le estimated_tree_computation_time_limit toutes les minutes au max
     */
    private async get_estimated_tree_computation_time_target(): Promise<number> {
        await this.check_computation_params();
        return this.cached_estimated_tree_computation_time_target;
    }

    private async get_estimated_tree_computation_time_limit(): Promise<number> {
        await this.check_computation_params();
        return this.cached_estimated_tree_computation_time_limit;
    }

    private async get_var_selection_pack_size(): Promise<number> {
        await this.check_computation_params();
        return this.cached_var_selection_pack_size;
    }

    private async check_computation_params(): Promise<void> {
        if ((!this.last_update_estimated_tree_computation_time) || (this.last_update_estimated_tree_computation_time < (Dates.now() - 60))) {

            let promises = [];
            let self = this;


            promises.push((async () => {
                self.cached_var_selection_pack_size = await ModuleParams.getInstance().getParamValueAsInt(VarsComputeController.PARAM_NAME_var_selection_pack_size, 50);
            })());
            promises.push((async () => {
                self.cached_estimated_tree_computation_time_limit = await ModuleParams.getInstance().getParamValueAsInt(VarsComputeController.PARAM_NAME_estimated_tree_computation_time_limit, 300000);
            })());
            promises.push((async () => {
                self.cached_estimated_tree_computation_time_target = await ModuleParams.getInstance().getParamValueAsInt(VarsComputeController.PARAM_NAME_estimated_tree_computation_time_target, 3000);
            })());
            this.last_update_estimated_tree_computation_time = Dates.now();

            await all_promises(promises);
        }
    }

    private async create_tree_perf_wrapper(var_dag: VarDAG) {
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.create_tree, 'create_tree');
        }
        await this.create_tree();
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.create_tree, 'create_tree');
        }
    }

    private async load_nodes_datas_perf_wrapper(var_dag: VarDAG) {
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.load_nodes_datas, 'load_nodes_datas');
        }
        await this.load_nodes_datas(var_dag);
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.load_nodes_datas, 'load_nodes_datas');
        }
    }

    private async compute_perf_wrapper(var_dag: VarDAG) {
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.compute_node_wrapper, 'compute_node_wrapper');
        }
        for (let i in var_dag.nodes) {
            let node = var_dag.nodes[i];

            if (!VarsServerController.getInstance().has_valid_value(node.var_data)) {
                await DAGController.getInstance().visit_bottom_up_to_node(
                    node,
                    async (visited_node: VarDAGNode) => await this.compute_node(visited_node),
                    (next_node: VarDAGNode) => !VarsServerController.getInstance().has_valid_value(next_node.var_data));
            }
        }
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.compute_node_wrapper, 'compute_node_wrapper');
        }
    }

    private async cache_datas_perf_wrapper(var_dag: VarDAG) {
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().start_nodeperfelement(var_dag.perfs.cache_datas, 'cache_datas');
        }
        await this.cache_datas(var_dag);
        if (var_dag.perfs) {
            VarDagPerfsServerController.getInstance().end_nodeperfelement(var_dag.perfs.cache_datas, 'cache_datas');
        }
    }

    private start_node_deploiement(node: VarDAGNode) {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.ctree_deploy_deps);
    }

    private end_node_deploiement(node: VarDAGNode) {
        VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.ctree_deploy_deps);

        node.successfully_deployed = true;
    }

    private async load_imports_and_split_nodes_perf_wrapper(node: VarDAGNode) {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.ctree_ddeps_load_imports_and_split_nodes);

        await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);

        VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.ctree_ddeps_load_imports_and_split_nodes);
    }

    private async try_load_cache_complet_perf_wrapper(node: VarDAGNode) {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.ctree_ddeps_try_load_cache_complet);

        await this.try_load_cache_complet(node);

        VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.ctree_ddeps_try_load_cache_complet);
    }

    private async get_node_deps_perf_wrapper(node: VarDAGNode): Promise<{ [index: string]: VarDataBaseVO }> {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.ctree_ddeps_get_node_deps);

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node);

        VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.ctree_ddeps_get_node_deps);

        return deps;
    }

    private async handle_pixellisation_perf_wrapper(node: VarDAGNode, varconf: VarConfVO, var_dag: VarDAG, limit_to_aggregated_datas: boolean, DEBUG_VARS: boolean) {
        VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.ctree_ddeps_handle_pixellisation);

        await this.handle_pixellisation(node, varconf, var_dag, limit_to_aggregated_datas, DEBUG_VARS);

        VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.ctree_ddeps_handle_pixellisation);
    }

    /**
     * si on est sur un pixel, inutile de chercher on a déjà fait une recherche identique et on doit pas découper un pixel
     * sinon, on fait la fameuse requête de count + aggrégat et suivant que le count correspond bien au produit des cardinaux des dimensions
     *  pixellisées, on découpe en pixel, ou pas. (En chargeant du coup la liste des pixels)
     */
    private async handle_pixellisation(node: VarDAGNode, varconf: VarConfVO, var_dag: VarDAG, limit_to_aggregated_datas: boolean, DEBUG_VARS: boolean) {

        let prod_cardinaux = PixelVarDataController.getInstance().get_pixel_card(node.var_data);

        if (prod_cardinaux == 1) {
            // c'est un pixel, on ignore
            if (DEBUG_VARS) {
                ConsoleHandler.log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':is pixel but with no exact cache (already tried)');
            }
        } else {

            let pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = {};
            for (let i in varconf.pixel_fields) {
                let pixel_field = varconf.pixel_fields[i];

                pixellised_fields_by_id[pixel_field.pixel_param_field_id] = pixel_field;
            }

            let pixel_query = query(varconf.var_data_vo_type)
                .filter_by_num_eq('var_id', varconf.id)
                .field('id', 'counter', varconf.var_data_vo_type, VarConfVO.COUNT_AGGREGATOR)
                .field('value', 'aggregated_value', varconf.var_data_vo_type, varconf.aggregator);

            /**
             * On ajoute les filtrages :
             *      sur champs pixellisés : on veut les valeurs contenues,
             *      sur les autres champs : on veut les valeurs exactes
             */
            let matroid_fields = MatroidController.getInstance().getMatroidFields(varconf.var_data_vo_type);
            for (let i in matroid_fields) {
                let matroid_field = matroid_fields[i];

                let pixellised = pixellised_fields_by_id[matroid_field.field_id];

                switch (matroid_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                        if (pixellised) {
                            pixel_query.filter_by_num_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                        } else {
                            pixel_query.filter_by_num_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                        }
                        break;
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        if (pixellised) {
                            pixel_query.filter_by_date_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                        } else {
                            pixel_query.filter_by_date_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                        }
                        break;
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                    default:
                        throw new Error('Not implemented');
                }
            }

            let pixel_cache: { counter: number, aggregated_value: number } = await pixel_query.select_one();

            if (!pixel_cache) {
                pixel_cache = {
                    counter: 0,
                    aggregated_value: 0
                };
            }

            if (pixel_cache && (pixel_cache.counter == prod_cardinaux)) {


                if (limit_to_aggregated_datas) {
                    // On aura pas de données aggregées à ce stade
                    this.end_node_deploiement(node);
                    return;
                }

                /**
                 * Cas simple, on a la réponse complète tout va bien
                 */
                node.var_data.value_ts = Dates.now();
                node.var_data.value = pixel_cache.aggregated_value;
                node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

                if (DEBUG_VARS) {
                    ConsoleHandler.log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':FULL OK');
                }

                // On notifie puisqu'on a le résultat
                this.end_node_deploiement(node);
                await this.notify_var_data_post_deploy(node);
            } else {

                /**
                 * Si on a pas tout, on doit identifier les pixels qui sont déjà connus pour pas les refaire
                 *  et en déduire ceux qui manquent
                 */
                let known_pixels_query = query(varconf.var_data_vo_type);

                known_pixels_query.filter_by_num_eq('var_id', varconf.id);

                // On pourrait vouloir récupérer que l'index et comparer à celui qu'on génère mais ça fourni pas toutes les infos propres
                //      pour l'aggregated_datas .... .field('_bdd_only_index', 'index');
                for (let i in matroid_fields) {
                    let matroid_field = matroid_fields[i];

                    let pixellised = pixellised_fields_by_id[matroid_field.field_id];

                    switch (matroid_field.field_type) {
                        case ModuleTableField.FIELD_TYPE_numrange_array:
                        case ModuleTableField.FIELD_TYPE_refrange_array:
                        case ModuleTableField.FIELD_TYPE_isoweekdays:
                            if (pixellised) {
                                known_pixels_query.filter_by_num_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                            } else {
                                known_pixels_query.filter_by_num_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                            }
                            break;
                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            if (pixellised) {
                                known_pixels_query.filter_by_date_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                            } else {
                                known_pixels_query.filter_by_date_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
                            }
                            break;
                        case ModuleTableField.FIELD_TYPE_hourrange_array:
                        default:
                            throw new Error('Not implemented');
                    }
                }

                let known_pixels: VarDataBaseVO[] = await known_pixels_query.select_vos<VarDataBaseVO>();
                let aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

                for (let i in known_pixels) {
                    let known_pixel = known_pixels[i];

                    aggregated_datas[known_pixel.index] = known_pixel;
                }

                this.populate_missing_pixels(
                    aggregated_datas,
                    varconf,
                    node.var_data,
                    pixellised_fields_by_id,
                    cloneDeep(node.var_data)
                );

                /**
                 * On indique qu'on a déjà fait un chargement du cache complet pour les pixels
                 */
                for (let depi in aggregated_datas) {
                    let aggregated_data = aggregated_datas[depi];
                    let dep_node = VarDAGNode.getInstance(node.var_dag, aggregated_data, VarsComputeController, false, true);

                    if (!dep_node) {
                        return;
                    }

                    if (VarsServerController.getInstance().has_valid_value(dep_node.var_data)) {
                        this.end_node_deploiement(dep_node);
                        await this.notify_var_data_post_deploy(dep_node);
                    }
                }

                let nb_known_pixels = known_pixels ? known_pixels.length : 0;
                let nb_unknown_pixels = Object.values(aggregated_datas).length - (known_pixels ? known_pixels.length : 0);

                node.is_aggregator = true;
                node.aggregated_datas = aggregated_datas;

                if (DEBUG_VARS) {
                    ConsoleHandler.log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':PIXELED:known:' + nb_known_pixels + ':' + nb_unknown_pixels + ':');
                }
            }
        }
    }
}