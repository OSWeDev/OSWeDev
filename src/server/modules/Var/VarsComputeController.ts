
import { cloneDeep } from 'lodash';
import { performance } from 'perf_hooks';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarPixelFieldConfVO from '../../../shared/modules/Var/vos/VarPixelFieldConfVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import NotifVardatasParam from './notifs/NotifVardatasParam';
import VarsPerfsController from './perf/VarsPerfsController';
import VarsCacheController from './VarsCacheController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsImportsHandler from './VarsImportsHandler';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

export default class VarsComputeController {

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

    //TODO FIXME à packager propre
    private perf_uid: number = 0;

    protected constructor() {
    }

    public get_estimated_time(var_data: VarDataBaseVO): number {
        return (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].calculation_cost_for_1000_card;
    }

    /**
     * La fonction qui réalise les calculs sur un ensemble de var datas et qui met directement à jour la valeur et l'heure du calcul dans le var_data
     */
    public async compute(vars_datas: { [index: string]: VarDataBaseVO }): Promise<void> {

        // TODO PerfMonServerController monitor_async add infos
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__compute],
            async () => {

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
                let ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {};

                // let perf_old_start = performance.now();
                // let dag: DAG<VarDAGNode> = await this.create_tree_old(vars_datas, ds_cache);
                // let perf_old_end = performance.now();

                // ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - create_tree OLD OK (' + (perf_old_end - perf_old_start) + 'ms) ... ' + dag.nb_nodes + ' nodes, ' + Object.keys(dag.leafs).length + ' leafs, ' + Object.keys(dag.roots).length + ' roots');

                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree", true);
                let perf_new_start = performance.now();
                let dag: DAG<VarDAGNode> = await this.create_tree(vars_datas, ds_cache);
                let perf_new_end = performance.now();
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - create_tree NEW OK (' + (perf_new_end - perf_new_start) + 'ms) ... ' + dag.nb_nodes + ' nodes, ' + Object.keys(dag.leafs).length + ' leafs, ' + Object.keys(dag.roots).length + ' roots');

                /**
                 * On a l'arbre. On charge les données qui restent à charger
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.load_nodes_datas", true);
                await this.load_nodes_datas(dag, ds_cache);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.load_nodes_datas", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - load_nodes_datas OK...');

                /**
                 * Tous les noeuds dont le var_data !has_valid_value sont à calculer
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.visit_bottom_up_to_node", true);
                for (let i in vars_datas) {
                    let var_data = vars_datas[i];

                    let node = dag.nodes[var_data.index];
                    if (!VarsServerController.getInstance().has_valid_value(node.var_data)) {
                        await DAGController.getInstance().visit_bottom_up_to_node(
                            node,
                            async (visited_node: VarDAGNode) => await this.compute_node(visited_node, ds_cache),
                            (next_node: VarDAGNode) => !VarsServerController.getInstance().has_valid_value(next_node.var_data));
                    }
                }
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.visit_bottom_up_to_node", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - compute_node OK...');

                /**
                 * Mise en cache, suivant stratégie pour chaque param
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.cache_datas", true);
                await this.cache_datas(dag, vars_datas);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.cache_datas", false);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - cache_datas OK...');

                /**
                 * Mise à jour des indicateurs de performances
                 */
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.update_cards_in_perfs", true);
                this.update_cards_in_perfs(dag);
                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.update_cards_in_perfs", false);

                /**
                 * On peut checker que l'arbre a bien été notifié
                 */
                await this.check_tree_notification(dag);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - update_cards_in_perfs OK...');
            },
            this,
        );
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
        var_dag: DAG<VarDAGNode>,
        deployed_vars_datas: { [index: string]: boolean } = {},
        vars_datas: { [index: string]: VarDataBaseVO } = {},
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {},
        limit_to_aggregated_datas: boolean = false
    ) {

        // on récupère le noeud de l'arbre
        let node = VarDAGNode.getInstance(var_dag, var_to_deploy);

        // si le noeud est déjà chargé, on sort
        if (node.already_tried_loading_data_and_deploy) {
            return;
        }
        node.already_tried_loading_data_and_deploy = true;

        let DEBUG_VARS = ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS;
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__deploy_deps],
            async () => {

                if (deployed_vars_datas[node.var_data.index]) {
                    return;
                }
                deployed_vars_datas[node.var_data.index] = true;

                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", true);
                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
                let varconf = VarsController.getInstance().var_conf_by_id[node.var_data.var_id];

                /**
                 * Cache step B : cache complet - inutile si on est sur un noeud du vars_datas
                 */
                if ((!node.already_tried_load_cache_complet) && (!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                    (VarsCacheController.getInstance().B_use_cache(node))) {

                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
                    ], true);
                    await this.try_load_cache_complet(node);
                    node.has_try_load_cache_complet_perf = true;
                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
                    ], false);

                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
                        return;
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

                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
                    ], true);
                    await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);
                    node.has_load_imports_and_split_nodes_perf = true;
                    VarsPerfsController.addPerfs(performance.now(), [
                        "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
                        node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
                    ], false);

                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
                        return;
                    }
                }

                /**
                 * Cas de la pixellisation qu'on sort des autres types de cache
                 */
                if (varconf.pixel_activated) {

                    /**
                     * si on est sur un pixel, inutile de chercher on a déjà fait une recherche identique et on doit pas découper un pixel
                     * sinon, on fait la fameuse requête de count + aggrégat et suivant que le count correspond bien au produit des cardinaux des dimensions
                     *  pixellisées, on découpe en pixel, ou pas. (En chargeant du coup la liste des pixels)
                     */

                    let prod_cardinaux = 1;
                    let pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = {};
                    for (let i in varconf.pixel_fields) {
                        let pixel_field = varconf.pixel_fields[i];

                        pixellised_fields_by_id[pixel_field.pixel_param_field_id] = pixel_field;
                        let card = RangeHandler.getInstance().getCardinalFromArray(node.var_data[pixel_field.pixel_param_field_id]);
                        prod_cardinaux *= card;
                    }

                    if (prod_cardinaux == 1) {
                        // c'est un pixel, on ignore
                        if (DEBUG_VARS) {
                            ConsoleHandler.getInstance().log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':is pixel == ignore cached pixels');
                        }
                    } else {

                        let pixel_query = query(varconf.var_data_vo_type)
                            .field('value', 'counter', varconf.var_data_vo_type, VarConfVO.COUNT_AGGREGATOR)
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

                        if (pixel_cache.counter == prod_cardinaux) {


                            if (limit_to_aggregated_datas) {
                                // On aura pas de données aggregées à ce stade
                                return;
                            }

                            /**
                             * Cas simple, on a la réponse complète tout va bien
                             */
                            node.var_data.value_ts = Dates.now();
                            node.var_data.value = pixel_cache.aggregated_value;
                            node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

                            if (DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':FULL OK');
                            }

                            // On notifie puisqu'on a le résultat
                            await this.notify_var_data_post_deploy(node);
                        } else {

                            /**
                             * Si on a pas tout, on doit identifier les pixels qui sont déjà connus pour pas les refaire
                             *  et en déduire ceux qui manquent
                             */
                            let known_pixels_query = query(varconf.var_data_vo_type);
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
                                let dep_node = VarDAGNode.getInstance(node.dag, aggregated_data);

                                dep_node.already_tried_load_cache_complet = true;

                                if (VarsServerController.getInstance().has_valid_value(dep_node.var_data)) {
                                    await this.notify_var_data_post_deploy(dep_node);
                                }
                            }

                            let nb_known_pixels = known_pixels ? known_pixels.length : 0;
                            let nb_unknown_pixels = Object.values(aggregated_datas).length - (known_pixels ? known_pixels.length : 0);

                            node.is_aggregator = true;
                            node.aggregated_datas = aggregated_datas;

                            if (DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':PIXELED:known:' + nb_known_pixels + ':' + nb_unknown_pixels + ':');
                            }
                        }
                    }

                } else {

                    /**
                     * Cache step C : cache partiel : uniquement si on a pas splitt sur import
                     */
                    if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                        (!node.is_aggregator) &&
                        (VarsCacheController.getInstance().C_use_partial_cache(node))) {

                        VarsPerfsController.addPerfs(performance.now(), [
                            "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
                            node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
                        ], true);
                        await this.try_load_cache_partiel(node);
                        node.has_try_load_cache_partiel_perf = true;
                        VarsPerfsController.addPerfs(performance.now(), [
                            "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
                            node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
                        ], false);

                        if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
                            VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
                            return;
                        }
                    }
                }

                if (limit_to_aggregated_datas) {
                    // Si on a des données aggrégées elles sont déjà ok à renvoyer si on ne veut que savoir les données aggrégées
                    return;
                }

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.create_tree.ds_cache",
                    node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
                ], true);

                let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node, ds_cache);
                node.has_ds_cache_perf = true;

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.create_tree.ds_cache",
                    node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
                ], false);

                /**
                 * Si dans les deps on a un denied, on refuse le tout
                 */
                for (let i in deps) {
                    let dep = deps[i];

                    if (dep.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                        node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                        node.var_data.value = 0;
                        node.var_data.value_ts = Dates.now();
                        VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
                        return;
                    }

                    if (DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('deploy_deps:' + node.var_data.index + ':dep:' + dep.index + ':');
                    }
                }

                if (deps) {
                    await this.handle_deploy_deps(node, deps, deployed_vars_datas, vars_datas, ds_cache);
                }

                VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );















        // await PerfMonServerController.getInstance().monitor_async(
        //     PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__deploy_deps],
        //     async () => {

        //         /**
        //          * TODO fixme la perf de deploy_dep dépend beaucoup des deps en fait, et là on ne fait plus les deps ici...
        //          */
        //         VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", true);
        //         let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        //         /**
        //          * Cache step B : cache complet - inutile si on est sur un noeud du vars_datas
        //          */
        //         if ((!node.already_tried_load_cache_complet) &&
        //             (!VarsServerController.getInstance().has_valid_value(node.var_data)) &&
        //             (VarsCacheController.getInstance().B_use_cache(node))) {

        //             VarsPerfsController.addPerfs(performance.now(), [
        //                 "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
        //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
        //             ], true);
        //             await this.try_load_cache_complet(node);
        //             node.has_try_load_cache_complet_perf = true;
        //             VarsPerfsController.addPerfs(performance.now(), [
        //                 "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
        //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
        //             ], false);
        //         }

        //         /**
        //          * Imports
        //          */
        //         if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) &&
        //             (!controller || !controller.optimization__has_no_imports)) {

        //             /**
        //              * On doit essayer de récupérer des données parcellaires
        //              *  si on a des données parcellaires par définition on doit quand même déployer les deps
        //              */

        //             VarsPerfsController.addPerfs(performance.now(), [
        //                 "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
        //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
        //             ], true);
        //             await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);
        //             node.has_load_imports_and_split_nodes_perf = true;
        //             VarsPerfsController.addPerfs(performance.now(), [
        //                 "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
        //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
        //             ], false);
        //         }

        //         /**
        //          * Cache step C : cache partiel : uniquement si on a pas splitt sur import
        //          *  ATTENTION retrait d'une condition sur la présence du noeud dans le vars_datas par
        //          *      ce que j'en vois pas l'intéret mais à surveiller
        //          */
        //         if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) &&
        //             (!node.is_aggregator) &&
        //             (VarsCacheController.getInstance().C_use_partial_cache(node))) {

        //             VarsPerfsController.addPerfs(performance.now(), [
        //                 "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
        //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
        //             ], true);
        //             await this.try_load_cache_partiel(node);
        //             node.has_try_load_cache_partiel_perf = true;
        //             VarsPerfsController.addPerfs(performance.now(), [
        //                 "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
        //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
        //             ], false);
        //         }

        //         await this.notify_var_data_post_deploy(node);
        //         VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
        //     },
        //     this,
        //     null,
        //     VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        // );
    }

    // /**
    //  *  - On entame en vérifiant qu'on a testé le cas des imports parcellaires :
    //  *      - Si on a des imports, on split et on relance le déploiement sur les nouveaux noeuds restants à calculer
    //  *      - sinon, on continue en déployant normalement les deps de ce noeud
    //  *  - Pour chaque DEP :
    //  *      - Si la dep est déjà dans la liste des vars_datas, aucun impact, on continue normalement ce cas est géré au moment de créer les noeuds pour les params
    //  *      - Si le noeud existe dans l'arbre, on s'assure juste que la liaison existe vers le noeud qui a tenté de générer la dep et on fuit.
    //  *      - Si le noeud est nouveau on le crée, et on met le lien vers le noeud source de la dep :
    //  *          - si le var_data possède une data on valide directement le point suivant
    //  *          - si on a une data précompilée ou importée en cache ou en BDD, on récupère cette data et on la met dans le var_data actuel puis on arrête de propager
    //  *          - sinon
    //  *              - on essaie de charger une ou plusieurs donnée(s) intersectant ce param
    //  *              - si on en trouve, on sélectionne celles qu'on veut prioriser, et on découpe le noeud qu'on transforme en aggrégateur
    //  *              - sur chaque nouveau noeud sans valeur / y compris si on a pas trouvé d'intersecteurs on deploy_deps
    //  *                  (et donc pour lesquels on sait qu'on a de valeur ni en base ni en buffer ni dans l'arbre)
    //  * Pour les noeuds initiaux (les vars_datas en param), on sait qu'on ne peut pas vouloir donner un import complet en résultat, donc inutile de faire cette recherche
    //  *  par contre un import partiel oui
    //  *
    //  * Cas de la pixellisation :
    //  *  - On ignore la première recherche dans le cache, puisqu'on ne trouvera pas le noeud à l'identique. Il aura été pixellisé
    //  *  - On cherche les imports et on découpe si besoin
    //  *  - On déclenche ensuite la pixellisation et la recherche de datas pré-calcs :
    //  *      - on request count() et sum() [ou fonction d'aggrégat plus généralement] avec filtrage sur la var_id, le champ de segmentation en inclusif, et
    //  *          les autres champs en excatement égal.
    //  *      - Si le count est égal au cardinal de la dimension de pixellisation, on a le résultat, on met à jour la var et c'est terminé
    //  */
    // public async deploy_deps(
    //     node: VarDAGNode,
    //     deployed_vars_datas: { [index: string]: boolean },
    //     vars_datas: { [index: string]: VarDataBaseVO },
    //     ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

    //     let DEBUG_VARS = ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS;
    //     await PerfMonServerController.getInstance().monitor_async(
    //         PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__deploy_deps],
    //         async () => {

    //             if (deployed_vars_datas[node.var_data.index]) {
    //                 return;
    //             }
    //             deployed_vars_datas[node.var_data.index] = true;

    //             VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", true);
    //             let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
    //             let varconf = VarsController.getInstance().var_conf_by_id[node.var_data.var_id];

    //             /**
    //              * Cache step B : cache complet - inutile si on est sur un noeud du vars_datas
    //              */
    //             if ((!node.already_tried_load_cache_complet) && (!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
    //                 (VarsCacheController.getInstance().B_use_cache(node))) {

    //                 VarsPerfsController.addPerfs(performance.now(), [
    //                     "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
    //                     node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
    //                 ], true);
    //                 await this.try_load_cache_complet(node);
    //                 node.has_try_load_cache_complet_perf = true;
    //                 VarsPerfsController.addPerfs(performance.now(), [
    //                     "__computing_bg_thread.compute.create_tree.try_load_cache_complet",
    //                     node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_complet"
    //                 ], false);

    //                 if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
    //                     VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
    //                     return;
    //                 }
    //             }

    //             /**
    //              * Imports
    //              */
    //             if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!controller || !controller.optimization__has_no_imports)) {

    //                 /**
    //                  * On doit essayer de récupérer des données parcellaires
    //                  *  si on a des données parcellaires par définition on doit quand même déployer les deps
    //                  */

    //                 VarsPerfsController.addPerfs(performance.now(), [
    //                     "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
    //                     node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
    //                 ], true);
    //                 await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);
    //                 node.has_load_imports_and_split_nodes_perf = true;
    //                 VarsPerfsController.addPerfs(performance.now(), [
    //                     "__computing_bg_thread.compute.create_tree.load_imports_and_split_nodes",
    //                     node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.load_imports_and_split_nodes"
    //                 ], false);

    //                 if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
    //                     VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
    //                     return;
    //                 }
    //             }

    //             /**
    //              * Cas de la pixellisation qu'on sort des autres types de cache
    //              */
    //             if (varconf.pixel_activated) {

    //                 /**
    //                  * si on est sur un pixel, inutile de chercher on a déjà fait une recherche identique et on doit pas découper un pixel
    //                  * sinon, on fait la fameuse requête de count + aggrégat et suivant que le count correspond bien au produit des cardinaux des dimensions
    //                  *  pixellisées, on découpe en pixel, ou pas. (En chargeant du coup la liste des pixels)
    //                  */

    //                 let prod_cardinaux = 1;
    //                 let pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = {};
    //                 for (let i in varconf.pixel_fields) {
    //                     let pixel_field = varconf.pixel_fields[i];

    //                     pixellised_fields_by_id[pixel_field.pixel_param_field_id] = pixel_field;
    //                     let card = RangeHandler.getInstance().getCardinalFromArray(node.var_data[pixel_field.pixel_param_field_id]);
    //                     prod_cardinaux *= card;
    //                 }

    //                 if (prod_cardinaux == 1) {
    //                     // c'est un pixel, on ignore
    //                     if (DEBUG_VARS) {
    //                         ConsoleHandler.getInstance().log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':is pixel == ignore cached pixels');
    //                     }
    //                 } else {

    //                     let pixel_query = query(varconf.var_data_vo_type)
    //                         .field('value', 'counter', varconf.var_data_vo_type, VarConfVO.COUNT_AGGREGATOR)
    //                         .field('value', 'aggregated_value', varconf.var_data_vo_type, varconf.aggregator);

    //                     /**
    //                      * On ajoute les filtrages :
    //                      *      sur champs pixellisés : on veut les valeurs contenues,
    //                      *      sur les autres champs : on veut les valeurs exactes
    //                      */
    //                     let matroid_fields = MatroidController.getInstance().getMatroidFields(varconf.var_data_vo_type);
    //                     for (let i in matroid_fields) {
    //                         let matroid_field = matroid_fields[i];

    //                         let pixellised = pixellised_fields_by_id[matroid_field.field_id];

    //                         switch (matroid_field.field_type) {
    //                             case ModuleTableField.FIELD_TYPE_numrange_array:
    //                             case ModuleTableField.FIELD_TYPE_refrange_array:
    //                             case ModuleTableField.FIELD_TYPE_isoweekdays:
    //                                 if (pixellised) {
    //                                     pixel_query.filter_by_num_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                 } else {
    //                                     pixel_query.filter_by_num_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                 }
    //                             case ModuleTableField.FIELD_TYPE_tstzrange_array:
    //                                 if (pixellised) {
    //                                     pixel_query.filter_by_date_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                 } else {
    //                                     pixel_query.filter_by_date_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                 }
    //                             case ModuleTableField.FIELD_TYPE_hourrange_array:
    //                             default:
    //                                 throw new Error('Not implemented');
    //                         }
    //                     }

    //                     let pixel_cache: { counter: number, aggregated_value: number } = await pixel_query.select_one();

    //                     if (pixel_cache.counter == prod_cardinaux) {

    //                         /**
    //                          * Cas simple, on a la réponse complète tout va bien
    //                          */
    //                         node.var_data.value_ts = Dates.now();
    //                         node.var_data.value = pixel_cache.aggregated_value;
    //                         node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

    //                         if (DEBUG_VARS) {
    //                             ConsoleHandler.getInstance().log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':FULL OK');
    //                         }
    //                     } else {

    //                         /**
    //                          * Si on a pas tout, on doit identifier les pixels qui sont déjà connus pour pas les refaire
    //                          *  et en déduire ceux qui manquent
    //                          */
    //                         let known_pixels_query = query(varconf.var_data_vo_type);
    //                         // On pourrait vouloir récupérer que l'index et comparer à celui qu'on génère mais ça fourni pas toutes les infos propres
    //                         //      pour l'aggregated_datas .... .field('_bdd_only_index', 'index');
    //                         for (let i in matroid_fields) {
    //                             let matroid_field = matroid_fields[i];

    //                             let pixellised = pixellised_fields_by_id[matroid_field.field_id];

    //                             switch (matroid_field.field_type) {
    //                                 case ModuleTableField.FIELD_TYPE_numrange_array:
    //                                 case ModuleTableField.FIELD_TYPE_refrange_array:
    //                                 case ModuleTableField.FIELD_TYPE_isoweekdays:
    //                                     if (pixellised) {
    //                                         known_pixels_query.filter_by_num_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                     } else {
    //                                         known_pixels_query.filter_by_num_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                     }
    //                                 case ModuleTableField.FIELD_TYPE_tstzrange_array:
    //                                     if (pixellised) {
    //                                         known_pixels_query.filter_by_date_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                     } else {
    //                                         known_pixels_query.filter_by_date_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
    //                                     }
    //                                 case ModuleTableField.FIELD_TYPE_hourrange_array:
    //                                 default:
    //                                     throw new Error('Not implemented');
    //                             }
    //                         }

    //                         let known_pixels: VarDataBaseVO[] = await known_pixels_query.select_vos<VarDataBaseVO>();
    //                         let aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

    //                         for (let i in known_pixels) {
    //                             let known_pixel = known_pixels[i];

    //                             aggregated_datas[known_pixel.index] = known_pixel;
    //                         }

    //                         this.populate_missing_pixels(
    //                             aggregated_datas,
    //                             varconf,
    //                             node.var_data,
    //                             pixellised_fields_by_id,
    //                             cloneDeep(node.var_data)
    //                         );

    //                         let nb_known_pixels = known_pixels ? known_pixels.length : 0;
    //                         let nb_unknown_pixels = Object.values(aggregated_datas).length - (known_pixels ? known_pixels.length : 0);

    //                         node.is_aggregator = true;
    //                         node.aggregated_datas = aggregated_datas;

    //                         if (DEBUG_VARS) {
    //                             ConsoleHandler.getInstance().log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':PIXELED:known:' + nb_known_pixels + ':' + nb_unknown_pixels + ':');
    //                         }
    //                     }
    //                 }

    //             } else {

    //                 /**
    //                  * Cache step C : cache partiel : uniquement si on a pas splitt sur import
    //                  */
    //                 if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
    //                     (!node.is_aggregator) &&
    //                     (VarsCacheController.getInstance().C_use_partial_cache(node))) {

    //                     VarsPerfsController.addPerfs(performance.now(), [
    //                         "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
    //                         node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
    //                     ], true);
    //                     await this.try_load_cache_partiel(node);
    //                     node.has_try_load_cache_partiel_perf = true;
    //                     VarsPerfsController.addPerfs(performance.now(), [
    //                         "__computing_bg_thread.compute.create_tree.try_load_cache_partiel",
    //                         node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.try_load_cache_partiel"
    //                     ], false);

    //                     if (VarsServerController.getInstance().has_valid_value(node.var_data)) {
    //                         VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
    //                         return;
    //                     }
    //                 }
    //             }

    //             VarsPerfsController.addPerfs(performance.now(), [
    //                 "__computing_bg_thread.compute.create_tree.ds_cache",
    //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
    //             ], true);

    //             let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node, ds_cache);
    //             node.has_ds_cache_perf = true;

    //             VarsPerfsController.addPerfs(performance.now(), [
    //                 "__computing_bg_thread.compute.create_tree.ds_cache",
    //                 node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
    //             ], false);

    //             /**
    //              * Si dans les deps on a un denied, on refuse le tout
    //              */
    //             for (let i in deps) {
    //                 let dep = deps[i];

    //                 if (dep.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
    //                     node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
    //                     node.var_data.value = 0;
    //                     node.var_data.value_ts = Dates.now();
    //                     VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
    //                     return;
    //                 }

    //                 if (DEBUG_VARS) {
    //                     ConsoleHandler.getInstance().log('deploy_deps:' + node.var_data.index + ':dep:' + dep.index + ':');
    //                 }
    //             }

    //             if (deps) {
    //                 await this.handle_deploy_deps(node, deps, deployed_vars_datas, vars_datas, ds_cache);
    //             }

    //             VarsPerfsController.addPerf(performance.now(), "__computing_bg_thread.compute.create_tree.deploy_deps", false);
    //         },
    //         this,
    //         null,
    //         VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
    //     );
    // }

    private update_cards_in_perfs(dag: DAG<VarDAGNode>) {
        for (let i in dag.nodes) {
            let node = dag.nodes[i];

            VarsPerfsController.addCard(node);
        }
    }

    /**
     * Tous les noeuds du vars_datas sont par définition en cache, donc on se pose la question que pour les autres
     * @param dag
     * @param vars_datas
     */
    private async cache_datas(dag: DAG<VarDAGNode>, vars_datas: { [index: string]: VarDataBaseVO }) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__cache_datas],
            async () => {

                // Si on a dans le buffer une version plus ancienne on doit mettre à jour
                await VarsDatasProxy.getInstance().update_existing_buffered_older_datas(Object.values(dag.nodes).map((n) => n.var_data));

                for (let i in dag.nodes) {
                    let node = dag.nodes[i];

                    if (vars_datas[node.var_data.index]) {
                        continue;
                    }

                    if (VarsCacheController.getInstance().A_do_cache_param(node)) {
                        await VarsDatasProxy.getInstance().prepend_var_datas([node.var_data], false);
                    }
                }
            },
            this
        );
    }

    private async load_nodes_datas(dag: DAG<VarDAGNode>, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {
        let env = ConfigurationService.getInstance().getNodeConfiguration();
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__load_nodes_datas],
            async () => {

                let promises = [];
                let max = Math.max(1, Math.floor(ConfigurationService.getInstance().getNodeConfiguration().MAX_POOL / 2));

                for (let i in dag.nodes) {
                    let node = dag.nodes[i];

                    // Si le noeud a une valeur on se fout de load les datas
                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                        if (env.DEBUG_VARS) {
                            ConsoleHandler.getInstance().log('load_nodes_datas:has_valid_value:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type]);
                        }

                        continue;
                    }

                    let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

                    let dss: DataSourceControllerBase[] = controller.getDataSourcesDependencies();

                    if (promises.length >= max) {
                        await Promise.all(promises);
                        promises = [];
                    }

                    let perfmon = PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__DataSourcesController__load_node_datas];
                    // Si on est sur du perf monitoring on doit faire les appels séparément...
                    if (perfmon.is_active) {
                        await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);
                    } else {
                        promises.push((async () => {

                            VarsPerfsController.addPerfs(performance.now(), [
                                node.var_data.var_id + "__computing_bg_thread.compute.load_nodes_datas"
                            ], true);
                            await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);
                            node.has_load_nodes_datas_perf = true;
                            VarsPerfsController.addPerfs(performance.now(), [
                                node.var_data.var_id + "__computing_bg_thread.compute.load_nodes_datas"
                            ], false);
                        })());
                    }
                    if (env.DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('loaded_node_datas:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type]);
                    }
                }

                if (promises && promises.length) {
                    await Promise.all(promises);
                }
            },
            this
        );
    }

    /**
     * Pour calculer un noeud, il faut les datasources, et faire appel à la fonction de calcul du noeud
     * @param node
     */
    private async compute_node(node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__compute_node],
            async () => {

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node",
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node",
                    node.var_data.var_id + "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node"
                ], true);

                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
                await controller.computeValue(node);

                await this.notify_var_data_post_deploy(node);
                node.has_compute_node_perf = true;

                VarsPerfsController.addPerfs(performance.now(), [
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node",
                    "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node",
                    node.var_data.var_id + "__computing_bg_thread.compute.visit_bottom_up_to_node.compute_node.compute_node"
                ], false);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    private async handle_deploy_deps(
        node: VarDAGNode,
        deps: { [index: string]: VarDataBaseVO },
        deployed_vars_datas: { [index: string]: boolean },
        vars_datas: { [index: string]: VarDataBaseVO },
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {

        let DEBUG_VARS = ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS;
        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__handle_deploy_deps],
            async () => {

                let deps_as_array = Object.values(deps);
                let deps_ids_as_array = Object.keys(deps);
                let deps_i = 0;

                let deps_promises = [];
                let max = Math.max(1, Math.floor(ConfigurationService.getInstance().getNodeConfiguration().MAX_POOL / 2));

                let start_time = Dates.now();
                let real_start_time = start_time;

                while (deps_i < deps_as_array.length) {

                    let actual_time = Dates.now();

                    if (actual_time > (start_time + 60)) {
                        start_time = actual_time;
                        ConsoleHandler.getInstance().warn('VarsComputeController:handle_deploy_deps:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
                    }

                    /**
                     * On fait des packs de 10 promises...
                     */
                    if (deps_promises.length >= max) {
                        await Promise.all(deps_promises);
                        deps_promises = [];
                    }
                    let dep = deps_as_array[deps_i];
                    let dep_id = deps_ids_as_array[deps_i];

                    if (node.dag.nodes[dep.index]) {
                        node.addOutgoingDep(dep_id, node.dag.nodes[dep.index]);
                        deps_i++;
                        continue;
                    }

                    let dep_node = VarDAGNode.getInstance(node.dag, dep);
                    node.addOutgoingDep(dep_id, dep_node);

                    if (dep_node.already_tried_loading_data_and_deploy) {
                        deps_i++;
                        continue;
                    }

                    /**
                     *  - Si le noeud n'a pas de valeur :
                     *      - on tente de charger une valeur depuis le varsdatas proxy, et si on en trouve on init dans le noeud et plan A
                     *      - sinon plan B
                     *  - sinon plan A
                     * Plan A : on propage pas
                     * Plan B : on propage le deploy_dep au nouveau noeud
                     */
                    if ((!VarsServerController.getInstance().has_valid_value(dep_node.var_data)) && (!dep_node.already_tried_load_cache_complet)) {

                        // Premier essai, on tente de trouver des datas en base / cache en cours de mise à jour
                        let existing_var_data: VarDataBaseVO = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(dep_node.var_data);

                        // ça revient au même que le test de chargement du cache complet donc on indique qu'on a déjà testé
                        dep_node.already_tried_load_cache_complet = true;

                        // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
                        if (!!existing_var_data) {
                            dep_node.var_data.id = existing_var_data.id;
                            dep_node.var_data.value = existing_var_data.value;
                            dep_node.var_data.value_ts = existing_var_data.value_ts;
                            dep_node.var_data.value_type = existing_var_data.value_type;

                            await this.notify_var_data_post_deploy(dep_node);

                            if (DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('handle_deploy_deps:existing_var_data:' + existing_var_data.index + ':' + existing_var_data.id + ':' + existing_var_data.value + ':' + existing_var_data.value_ts + ':');
                            }
                        } else {
                            /**
                             * On indique qu'on a fait une recherche qui renvoie null. si la recherche était inutile, on pouvait l'éviter en mettant already_tried_load_cache_complet = true
                             */
                            ConsoleHandler.getInstance().log('handle_deploy_deps:existing_var_data:' + null + ': si on savait avant cet instant que la cache n\'existait pas on pouvait éviter la requête en forçant already_tried_load_cache_complet = true sur le var_node');
                        }
                    }

                    /**
                     * Si la valeur a été invalidée on s'assure qu'elle est bien indiquée undefined à ce stade => Probablement important pour les
                     *  chargements issus de la bdd et qu'on veut pouvoir invalider.
                     */
                    if ((!VarsServerController.getInstance().has_valid_value(dep_node.var_data)) && (typeof dep_node.var_data.value !== 'undefined')) {
                        delete dep_node.var_data.value;
                    }

                    if (!VarsServerController.getInstance().has_valid_value(dep_node.var_data)) {

                        await VarsTabsSubsController.getInstance().notify_vardatas([new NotifVardatasParam([dep_node.var_data], true)]);
                        deps_promises.push((async () => {
                            // await this.deploy_deps(dep_node, deployed_vars_datas, vars_datas, ds_cache);
                            await this.load_caches_and_imports_on_var_to_deploy(dep_node.var_data, dep_node.dag, deployed_vars_datas, vars_datas, ds_cache);
                        })());

                        // await this.deploy_deps(dep_node, deployed_vars_datas, vars_datas, ds_cache);
                    }

                    deps_i++;
                }

                if (deps_promises.length) {
                    await Promise.all(deps_promises);
                }
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    private async try_load_cache_complet(node: VarDAGNode) {

        let DEBUG_VARS = ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS;
        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__try_load_cache_complet],
            async () => {

                node.already_tried_load_cache_complet = true;
                let cache_complet = await VarsDatasProxy.getInstance().get_exact_param_from_buffer_or_bdd(node.var_data);

                if (!cache_complet) {
                    if (DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('try_load_cache_complet:' + node.var_data.index + ':aucun cache complet');
                    }

                    return;
                }

                // NOTE : On peut éditer directement la vardata ici puisque celle en cache a déjà été mise à jour par get_exact_param_from_buffer_or_bdd au besoin
                node.var_data.id = cache_complet.id;
                node.var_data.value = cache_complet.value;
                node.var_data.value_ts = cache_complet.value_ts;
                node.var_data.value_type = cache_complet.value_type;
                if (DEBUG_VARS) {
                    ConsoleHandler.getInstance().log('try_load_cache_complet:' + node.var_data.index + ':OK:' + cache_complet.value + ':' + cache_complet.value_ts + ':' + cache_complet.id);
                }
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    private async try_load_cache_partiel(node: VarDAGNode) {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__try_load_cache_partiel],
            async () => {

                let caches_partiels: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroids(node.var_data._type, [node.var_data], null);

                if ((!caches_partiels) || (!caches_partiels.length)) {
                    return;
                }

                let validated_caches_partiels: VarDataBaseVO[] = [];

                for (let i in caches_partiels) {
                    let cache_partiel = caches_partiels[i];

                    if (!VarsCacheController.getInstance().C_use_partial_cache_element(node, cache_partiel)) {
                        continue;
                    }

                    validated_caches_partiels.push(cache_partiel);
                }

                /**
                 * On utilise la même méthode ensuite que pour les imports, sinon qu'on sait pas ce qui est en cache donc on peut pas optimiser en caches atomiques
                 */
                await VarsImportsHandler.getInstance().split_nodes(node, validated_caches_partiels, false);

            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    /**
     *  - Pour identifier les deps :
     *      - Chargement des ds predeps du noeud
     *      - Chargement des deps
     */
    private async get_node_deps(
        node: VarDAGNode,
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<{ [dep_id: string]: VarDataBaseVO }> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__get_node_deps],
            async () => {

                if (node.is_aggregator) {
                    let aggregated_deps: { [dep_id: string]: VarDataBaseVO } = {};
                    let index = 0;

                    for (let i in node.aggregated_datas) {
                        let data = node.aggregated_datas[i];
                        aggregated_deps['AGG_' + (index++)] = data;

                        // on peut essayer de notifier les deps issues des aggréagations qui auraient déjà une valeur valide
                        let dep_node = VarDAGNode.getInstance(node.dag, data);
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
                    await DataSourcesController.getInstance().load_node_datas(predeps_dss, node, ds_cache);
                }

                /**
                 * On demande les deps
                 */
                return controller.getParamDependencies(node);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
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
    private async create_tree(vars_datas: { [index: string]: VarDataBaseVO }, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<DAG<VarDAGNode>> {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__create_tree],
            async () => {

                let var_dag: DAG<VarDAGNode> = new DAG();

                /**
                 * On insère les noeuds du vars_datas dans l'arbre en premier pour forcer le flag already_tried_load_cache_complet
                 *  puisque si on avait ce cache on demanderait pas un calcul à ce stade
                 */
                this.add_vars_datas_to_dag(var_dag, vars_datas, true);

                let vars_datas_to_deploy_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } } = await this.get_vars_datas_by_controller_height(var_dag);
                let step = 1;

                while (Object.keys(vars_datas_to_deploy_by_controller_height).length) {

                    // On sélectionne les vars à déployer
                    let vars_to_deploy: { [index: string]: VarDataBaseVO } = this.get_vars_to_deploy(vars_datas_to_deploy_by_controller_height);

                    ConsoleHandler.getInstance().log('create_tree:Step ' + step + ':Deploying ' + Object.keys(vars_to_deploy).length + ' vars');

                    // on notifie du calcul en cours
                    let vars_to_deploy_filtered_by_tab_subs = await VarsTabsSubsController.getInstance().filter_by_subs(Object.values(vars_to_deploy));
                    await VarsTabsSubsController.getInstance().notify_vardatas(
                        vars_to_deploy_filtered_by_tab_subs.map((vd) => new NotifVardatasParam([vd], true)));

                    // On charge les caches pour ces noeuds
                    //  et on récupère les nouveaux vars_datas à insérer dans l'arbre
                    await this.load_caches_and_imports_on_vars_to_deploy(vars_to_deploy, var_dag);

                    // On doit ensuite charger les ds pre deps
                    await this.deploy_deps_on_vars_to_deploy(vars_to_deploy, var_dag, ds_cache);

                    vars_datas_to_deploy_by_controller_height = await this.get_vars_datas_by_controller_height(var_dag);
                    step++;
                }

                return var_dag;
            },
            this
        );
    }

    // private pop_vars_to_deploy(vars_datas_to_deploy_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } }): { [index: string]: VarDataBaseVO } {
    //     let max_height = Math.max(...Object.keys(vars_datas_to_deploy_by_controller_height).map((h: string) => parseInt(h)));
    //     let res = vars_datas_to_deploy_by_controller_height[max_height];
    //     delete vars_datas_to_deploy_by_controller_height[max_height];
    //     return res;
    // }

    private get_vars_to_deploy(vars_datas_to_deploy_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } }): { [index: string]: VarDataBaseVO } {
        let max_height = Math.max(...Object.keys(vars_datas_to_deploy_by_controller_height).map((h: string) => parseInt(h)));
        return vars_datas_to_deploy_by_controller_height[max_height];
    }

    /**
     * Organiser les vars datas par profondeur du controller (en sachant que plus le controller est haut dans l'arbre, plus sa profondeur est élevée)
     *  on se base directement sur l'arbre, et on prend en compte que les éléments pas encore déployé, et sans valeur valide
     */
    private async get_vars_datas_by_controller_height(var_dag: DAG<VarDAGNode>): Promise<{ [height: number]: { [index: string]: VarDataBaseVO } }> {
        let vars_datas_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } } = {};

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
        var_dag: DAG<VarDAGNode>) {

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().getNodeConfiguration().MAX_POOL / 2));

        for (let i in vars_to_deploy) {

            let var_to_deploy: VarDataBaseVO = vars_to_deploy[i];

            if (promises.length >= max) {
                await Promise.all(promises);
                promises = [];
            }

            promises.push(this.load_caches_and_imports_on_var_to_deploy(var_to_deploy, var_dag));
        }

        if (promises && promises.length) {
            await Promise.all(promises);
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

    private add_vars_datas_to_dag(var_dag: DAG<VarDAGNode>, vars_datas: { [index: string]: VarDataBaseVO }, force_already_tried_load_cache_complet: boolean = false) {
        for (let i in vars_datas) {
            let var_data = vars_datas[i];

            let var_dag_node = VarDAGNode.getInstance(var_dag, var_data);
            if (force_already_tried_load_cache_complet) {
                var_dag_node.already_tried_load_cache_complet = true;
            }
        }
    }

    /**
     * On charge d'abord les datas pré deps
     * Ensuite on fait la liste des noeuds à déployer à nouveau (les deps)
     */
    private async deploy_deps_on_vars_to_deploy(
        vars_to_deploy: { [index: string]: VarDataBaseVO },
        var_dag: DAG<VarDAGNode>,
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }
    ) {

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().getNodeConfiguration().MAX_POOL / 2));

        for (let i in vars_to_deploy) {
            let var_to_deploy = vars_to_deploy[i];

            if (VarsServerController.getInstance().has_valid_value(var_to_deploy)) {
                continue;
            }

            if (promises.length >= max) {
                await Promise.all(promises);
                promises = [];
            }

            let var_dag_node = VarDAGNode.getInstance(var_dag, var_to_deploy);
            promises.push(this.deploy_deps_on_var_to_deploy(var_dag_node, var_dag, ds_cache));
        }

        if (promises && promises.length) {
            await Promise.all(promises);
        }
    }

    private async deploy_deps_on_var_to_deploy(
        var_dag_node: VarDAGNode,
        var_dag: DAG<VarDAGNode>,
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }
    ) {

        VarsPerfsController.addPerfs(performance.now(), [
            "__computing_bg_thread.compute.create_tree.ds_cache",
            var_dag_node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
        ], true);

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(var_dag_node, ds_cache);
        var_dag_node.has_ds_cache_perf = true;

        VarsPerfsController.addPerfs(performance.now(), [
            "__computing_bg_thread.compute.create_tree.ds_cache",
            var_dag_node.var_data.var_id + "__computing_bg_thread.compute.create_tree.deploy_deps.ds_cache"
        ], false);

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

            let dep_node = VarDAGNode.getInstance(var_dag, dep);
            var_dag_node.addOutgoingDep(dep_id, dep_node);
        }
    }

    private async check_tree_notification(dag: DAG<VarDAGNode>) {
        for (let i in dag.nodes) {
            let node = dag.nodes[i];

            if (!node.already_sent_result_to_subs) {

                /**
                 * On a pas notifié une var, qui est un import, et n'est pas la cible du calcul initial
                 *  => a priori c'est ok ? si j'ai besoin de cette var, je l'ai déjà téléchargée normalement
                 *  et on est pas en train de remettre en cause sa valeur
                 */
                if (node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
                    // ConsoleHandler.getInstance().log('Pas notifiée mais import:' + JSON.stringify(node.var_data));
                    continue;
                }

                ConsoleHandler.getInstance().error('Var pas notifiée:' + JSON.stringify(node.var_data));
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

            let field = VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_field_by_id(pixellised_field.pixel_param_field_id);
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
}