import { cloneDeep } from "lodash";
import VarDAGNode from '../../../server/modules/Var/vos/VarDAGNode';
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../../shared/modules/Stats/StatsController";
import VOsTypesManager from "../../../shared/modules/VOsTypesManager";
import VarsController from "../../../shared/modules/Var/VarsController";
import VarConfVO from "../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../shared/modules/Var/vos/VarDataBaseVO";
import VarPixelFieldConfVO from "../../../shared/modules/Var/vos/VarPixelFieldConfVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import MatroidIndexHandler from "../../../shared/tools/MatroidIndexHandler";
import { all_promises } from "../../../shared/tools/PromiseTools";
import RangeHandler from "../../../shared/tools/RangeHandler";
import ConfigurationService from "../../env/ConfigurationService";
import PixelVarDataController from "./PixelVarDataController";
import VarsImportsHandler from "./VarsImportsHandler";
import VarsServerController from "./VarsServerController";
import DataSourceControllerBase from "./datasource/DataSourceControllerBase";
import DataSourcesController from "./datasource/DataSourcesController";

export default class VarsDeployDepsHandler {

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
     *
     * ATTENTION FIXME : limit_to_aggregated_datas on doit faire très attention à ne pas créer des noeuds bizarres dans l'arbre du bgthread des vars
     *  juste pour afficher des deps dans la description... normalement les demandes clients arrivent pas sur ce thread, mais avec cette refonte
     *  il va falloir être vigilent sur l'impact sur cette option
     */
    public static async load_caches_and_imports_on_var_to_deploy(
        node: VarDAGNode,
        limit_to_aggregated_datas: boolean = false
    ) {

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'IN');

        // ?? pourquoi on change ça ici => en fait c'est l'équivalent du tag je pense donc surement à supp
        // node.already_tried_loading_data_and_deploy = true;

        let DEBUG_VARS = ConfigurationService.node_configuration.DEBUG_VARS;

        let controller = VarsServerController.getVarControllerById(node.var_data.var_id);
        let varconf = VarsController.var_conf_by_id[node.var_data.var_id];

        /**
         * Imports
         */
        if ((!VarsServerController.has_valid_value(node.var_data)) && (!controller || !controller.optimization__has_no_imports)) {

            /**
             * On doit essayer de récupérer des données parcellaires
             *  si on a des données parcellaires par définition on doit quand même déployer les deps
             */

            await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);

            if (VarsServerController.has_valid_value(node.var_data)) {

                // Si le chargement a réussi, on indique qu'on a pas besoin de data_load/compute, mais il faut notifier et supprimer le noeud
                node.add_tag(VarDAGNode.TAG_3_DATA_LOADED);
                node.add_tag(VarDAGNode.TAG_4_COMPUTED);

                // Si on a un id, ça vient directement de la base donc on a pas à le réinsérer non plus
                if (!!node.var_data.id) {
                    node.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
                }
                StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'OUT_has_valid_value');
                StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'OUT_has_valid_value', Dates.now_ms() - time_in);
                return;
            }
        }

        /**
         * Cas de la pixellisation qu'on sort des autres types de cache
         */
        if (varconf.pixel_activated) {

            if (await VarsDeployDepsHandler.handle_pixellisation(node, varconf, limit_to_aggregated_datas, DEBUG_VARS)) {
                StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'OUT_handle_pixellisation');
                StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'OUT_handle_pixellisation', Dates.now_ms() - time_in);
                return;
            }
        }

        if (limit_to_aggregated_datas) {

            // Si on a des données aggrégées elles sont déjà ok à renvoyer si on ne veut que savoir les données aggrégées
            return;
        }

        let deps: { [index: string]: VarDataBaseVO } = await VarsDeployDepsHandler.get_node_deps(node);

        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':handle_deploy_deps:IN:');
        }
        if (deps) {
            await VarsDeployDepsHandler.handle_deploy_deps(node, deps);
        }
        if (DEBUG_VARS) {
            ConsoleHandler.log('deploy_deps:' + node.var_data.index + ':handle_deploy_deps:OUT:');
        }

        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'OUT');
        StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'load_caches_and_imports_on_var_to_deploy', 'OUT', Dates.now_ms() - time_in);
    }

    /**
     * si on est sur un pixel, inutile de chercher on a déjà fait une recherche identique et on doit pas découper un pixel
     * sinon, on fait la fameuse requête de count + aggrégat et suivant que le count correspond bien au produit des cardinaux des dimensions
     *  pixellisées, on découpe en pixel, ou pas. (En chargeant du coup la liste des pixels)
     */
    private static async handle_pixellisation(node: VarDAGNode, varconf: VarConfVO, limit_to_aggregated_datas: boolean, DEBUG_VARS: boolean): Promise<boolean> {

        let prod_cardinaux = PixelVarDataController.getInstance().get_pixel_card(node.var_data);

        if (prod_cardinaux == 1) {
            // c'est un pixel, on ignore
            if (DEBUG_VARS) {
                ConsoleHandler.log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':is pixel but with no exact cache (already tried)');
            }
            return false;
        }

        // On ne doit surtout pas DATA_LOAD un param de type pixel qui n'en n'est pas un (puisque le card > 1)
        node.add_tag(VarDAGNode.TAG_3_DATA_LOADED);

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'handle_pixellisation', 'IN');

        let pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = {};
        for (let i in varconf.pixel_fields) {
            let pixel_field = varconf.pixel_fields[i];

            pixellised_fields_by_id[pixel_field.pixel_param_field_id] = pixel_field;
        }

        let pixel_query = query(varconf.var_data_vo_type)
            // .filter_by_num_eq('var_id', varconf.id)
            //     .filter_is_true('_bdd_only_is_pixel')
            .field('id', 'counter', varconf.var_data_vo_type, VarConfVO.COUNT_AGGREGATOR)
            .field('value', 'aggregated_value', varconf.var_data_vo_type, varconf.aggregator);

        /**
         * Optimisation : on ne teste que les indexs directement, c'est beaucoup plus performant. à voir si c'est tenable avec beauocup d'indexs ...
         */
        let pixel_query_indexes = MatroidIndexHandler.get_normalized_vardata_pixels(node.var_data);

        if (!pixel_query_indexes) {
            ConsoleHandler.error('No pixel_query_indexes for node:' + node.var_data.index);
            throw new Error('No pixel_query_indexes for node:' + node.var_data.index);
        }

        pixel_query.filter_by_text_has('_bdd_only_index', pixel_query_indexes);

        // /**
        //  * On ajoute les filtrages :
        //  *      sur champs pixellisés : on veut les valeurs contenues,
        //  *      sur les autres champs : on veut les valeurs exactes
        //  */
        // let matroid_fields = MatroidController.getMatroidFields(varconf.var_data_vo_type);
        // for (let i in matroid_fields) {
        //     let matroid_field = matroid_fields[i];

        //     let pixellised = pixellised_fields_by_id[matroid_field.field_id];

        //     switch (matroid_field.field_type) {
        //         case ModuleTableField.FIELD_TYPE_numrange_array:
        //         case ModuleTableField.FIELD_TYPE_refrange_array:
        //         case ModuleTableField.FIELD_TYPE_isoweekdays:
        //             if (pixellised) {
        //                 pixel_query.filter_by_num_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             } else {
        //                 pixel_query.filter_by_num_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             }
        //             break;
        //         case ModuleTableField.FIELD_TYPE_tstzrange_array:
        //             if (pixellised) {
        //                 pixel_query.filter_by_date_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             } else {
        //                 pixel_query.filter_by_date_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             }
        //             break;
        //         case ModuleTableField.FIELD_TYPE_hourrange_array:
        //         default:
        //             throw new Error('Not implemented');
        //     }
        // }

        let pixel_cache: { counter: number, aggregated_value: number } = await pixel_query.select_one();

        if (!pixel_cache) {
            pixel_cache = {
                counter: 0,
                aggregated_value: 0
            };
        }

        if (pixel_cache && (pixel_cache.counter == prod_cardinaux)) {


            if (limit_to_aggregated_datas) {
                // On n'aura pas de données aggregées à ce stade
                return true;
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

            // On laisse que la notification puisqu'on a déjà tout, et l'insère en base puisqu'on ne l'avait pas
            node.add_tag(VarDAGNode.TAG_4_COMPUTED);

            StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'handle_pixellisation', 'OUT_FULL_OK');
            StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'handle_pixellisation', 'OUT_FULL_OK', Dates.now_ms() - time_in);

            return true;
        }

        /**
         * Si on a pas tout,
         * Suivant le type d'aggrégat :
         *  - soit on peut utiliser les pixels connus, soit non, et dans ce cas on redemande tous les pixels et on fait l'aggrégat gloabl ensuite
         *  - soit on doit identifier les pixels qui sont déjà connus pour pas les refaire et en déduire ceux qui manquent
         */
        let can_not_use_known_pixels = (varconf.aggregator == VarConfVO.AVG_AGGREGATOR);

        if (can_not_use_known_pixels) {
            await this.do_not_use_known_pixels(node, varconf, pixellised_fields_by_id, pixel_cache, prod_cardinaux, DEBUG_VARS);
        } else {
            await this.use_known_pixels(node, varconf, pixellised_fields_by_id, pixel_cache, prod_cardinaux, DEBUG_VARS);
        }

        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'handle_pixellisation', 'OUT_PIXELED');
        StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'handle_pixellisation', 'OUT_PIXELED', Dates.now_ms() - time_in);
    }

    private static async do_not_use_known_pixels(
        node: VarDAGNode,
        varconf: VarConfVO,
        pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO },
        pixel_cache: { counter: number, aggregated_value: number },
        prod_cardinaux: number,
        DEBUG_VARS: boolean
    ) {

        let aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

        VarsDeployDepsHandler.populate_missing_pixels(
            aggregated_datas,
            varconf,
            node.var_data,
            pixellised_fields_by_id,
            cloneDeep(node.var_data)
        );

        /**
         * On n'a pas tenté de charger les pixels
         */
        for (let depi in aggregated_datas) {
            let aggregated_data = aggregated_datas[depi];
            await VarDAGNode.getInstance(node.var_dag, aggregated_data, false);
        }

        node.is_aggregator = true;
        node.aggregated_datas = aggregated_datas;

        if (DEBUG_VARS) {
            ConsoleHandler.log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':PIXELED:can_not_use_known_pixels');
        }
    }

    private static async use_known_pixels(
        node: VarDAGNode,
        varconf: VarConfVO,
        pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO },
        pixel_cache: { counter: number, aggregated_value: number },
        prod_cardinaux: number,
        DEBUG_VARS: boolean
    ) {

        let known_pixels_query = query(varconf.var_data_vo_type);

        /**
         * Optimisation : on ne teste que les indexs directement, c'est beaucoup plus performant. à voir si c'est tenable avec beauocup d'indexs ...
         */
        let known_pixels_query_indexes = MatroidIndexHandler.get_normalized_vardata_pixels(node.var_data);

        if (!known_pixels_query_indexes) {
            ConsoleHandler.error('No iknown_pixels_query_indexes for node:' + node.var_data.index);
            throw new Error('No known_pixels_query_indexes for node:' + node.var_data.index);
        }
        known_pixels_query.filter_by_text_has('_bdd_only_index', known_pixels_query_indexes);

        // known_pixels_query.filter_by_num_eq('var_id', varconf.id);
        // known_pixels_query.filter_is_true('_bdd_only_is_pixel');

        // // On pourrait vouloir récupérer que l'index et comparer à celui qu'on génère mais ça fourni pas toutes les infos propres
        // //      pour l'aggregated_datas .... .field('_bdd_only_index', 'index');
        // for (let i in matroid_fields) {
        //     let matroid_field = matroid_fields[i];

        //     let pixellised = pixellised_fields_by_id[matroid_field.field_id];

        //     switch (matroid_field.field_type) {
        //         case ModuleTableField.FIELD_TYPE_numrange_array:
        //         case ModuleTableField.FIELD_TYPE_refrange_array:
        //         case ModuleTableField.FIELD_TYPE_isoweekdays:
        //             if (pixellised) {
        //                 known_pixels_query.filter_by_num_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             } else {
        //                 known_pixels_query.filter_by_num_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             }
        //             break;
        //         case ModuleTableField.FIELD_TYPE_tstzrange_array:
        //             if (pixellised) {
        //                 known_pixels_query.filter_by_date_is_in_ranges(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             } else {
        //                 known_pixels_query.filter_by_date_eq(matroid_field.field_id, node.var_data[matroid_field.field_id]);
        //             }
        //             break;
        //         case ModuleTableField.FIELD_TYPE_hourrange_array:
        //         default:
        //             throw new Error('Not implemented');
        //     }
        // }

        let known_pixels: VarDataBaseVO[] = await known_pixels_query.select_vos<VarDataBaseVO>();
        let aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

        for (let i in known_pixels) {
            let known_pixel = known_pixels[i];

            aggregated_datas[known_pixel.index] = known_pixel;
        }

        VarsDeployDepsHandler.populate_missing_pixels(
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
            let agg_node = await VarDAGNode.getInstance(node.var_dag, aggregated_data, true);
            // agg_node.is_client_sub_dep = node.is_client_sub || node.is_client_sub_dep;
            // agg_node.is_server_sub_dep = node.is_server_sub || node.is_server_sub_dep;
        }

        let nb_known_pixels = known_pixels ? known_pixels.length : 0;
        let nb_unknown_pixels = Object.values(aggregated_datas).length - (known_pixels ? known_pixels.length : 0);

        node.is_aggregator = true;
        node.aggregated_datas = aggregated_datas;

        if (DEBUG_VARS) {
            ConsoleHandler.log('PIXEL Var:' + node.var_data.index + ':' + prod_cardinaux + ':pixel_cache.counter:' + pixel_cache.counter + ':' + pixel_cache.aggregated_value + ':PIXELED:known:' + nb_known_pixels + ':' + nb_unknown_pixels + ':');
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
    private static populate_missing_pixels(
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
            let segment_type = (var_conf.segment_types && var_conf.segment_types[field.field_id]) ? var_conf.segment_types[field.field_id] : RangeHandler.get_smallest_segment_type_for_range_type(RangeHandler.getRangeType(field));

            RangeHandler.foreach_ranges_sync(var_data[pixellised_field.pixel_param_field_id], (pixel_value: number) => {

                let new_var_data = VarDataBaseVO.cloneFromVarId(cloned_var_data, cloned_var_data.var_id, true);
                new_var_data[pixellised_field.pixel_param_field_id] = [RangeHandler.createNew(
                    RangeHandler.getRangeType(field),
                    pixel_value,
                    pixel_value,
                    true,
                    true,
                    segment_type
                )];
                if (!aggregated_datas[new_var_data.index]) {
                    VarsDeployDepsHandler.populate_missing_pixels(
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
     *  - Pour identifier les deps :
     *      - Chargement des ds predeps du noeud
     *      - Chargement des deps
     */
    private static async get_node_deps(node: VarDAGNode): Promise<{ [dep_id: string]: VarDataBaseVO }> {

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'get_node_deps', 'IN');

        if (node.is_aggregator) {
            let aggregated_deps: { [dep_id: string]: VarDataBaseVO } = {};
            let index = 0;

            let promises = [];
            for (let i in node.aggregated_datas) {
                let data = node.aggregated_datas[i];
                aggregated_deps['AGG_' + (index++)] = data;

                promises.push(VarDAGNode.getInstance(node.var_dag, data, true));
            }
            await all_promises(promises);

            StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'get_node_deps', 'OUT_is_aggregator');
            StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'get_node_deps', 'OUT_is_aggregator', Dates.now_ms() - time_in);

            return aggregated_deps;
        }

        let controller = VarsServerController.getVarControllerById(node.var_data.var_id);

        /**
         * On charge toutes les datas predeps
         */
        let predeps_dss: DataSourceControllerBase[] = controller.getDataSourcesPredepsDependencies();
        if (predeps_dss && predeps_dss.length) {

            // VarDagPerfsServerController.getInstance().start_nodeperfelement(node.perfs.load_node_datas_predep);

            await DataSourcesController.load_node_datas(predeps_dss, node);

            // VarDagPerfsServerController.getInstance().end_nodeperfelement(node.perfs.load_node_datas_predeps);
        }

        /**
         * On demande les deps
         */
        let res = controller.getParamDependencies(node);

        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'get_node_deps', 'OUT');
        StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'get_node_deps', 'OUT', Dates.now_ms() - time_in);

        return res;
    }

    private static async handle_deploy_deps(
        node: VarDAGNode,
        deps: { [index: string]: VarDataBaseVO }) {

        let time_in = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('VarsDeployDepsHandler', 'handle_deploy_deps', 'IN');
        let deps_as_array = Object.values(deps);
        StatsController.register_stat_QUANTITE('VarsDeployDepsHandler', 'handle_deploy_deps', 'deps', deps_as_array ? deps_as_array.length : 0);
        let deps_ids_as_array = Object.keys(deps);

        let start_time = Dates.now();
        let real_start_time = start_time;

        let promises = [];
        for (let deps_i in deps_as_array) {

            if ((!node.var_dag) || (!node.var_dag.nodes[node.var_data.index])) {
                return;
            }

            let actual_time = Dates.now();

            if (actual_time > (start_time + 60)) {
                start_time = actual_time;
                ConsoleHandler.warn('handle_deploy_deps:Risque de boucle infinie:' + real_start_time + ':' + actual_time);
            }

            let dep = deps_as_array[deps_i];
            let dep_id = deps_ids_as_array[deps_i];

            if (node.var_dag.nodes[dep.index]) {

                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log('handle_deploy_deps:dep:' + dep.index + ':already in tree, adding link from:' + node.var_data.index + ':to:' + dep.index + ':');
                }

                node.addOutgoingDep(dep_id, node.var_dag.nodes[dep.index]);
                continue;
            }

            promises.push((async () => {

                let dep_node = await VarDAGNode.getInstance(node.var_dag, dep, false);
                if (!dep_node) {
                    return;
                }

                // dep_node.is_client_sub_dep = dep_node.is_client_sub_dep || node.is_client_sub || node.is_client_sub_dep;
                // dep_node.is_server_sub_dep = dep_node.is_server_sub_dep || node.is_server_sub || node.is_server_sub_dep;

                if (ConfigurationService.node_configuration.DEBUG_VARS) {
                    ConsoleHandler.log('handle_deploy_deps:dep:' + dep.index + ':new node, adding link from:' + node.var_data.index + ':to:' + dep.index + ':');
                }

                node.addOutgoingDep(dep_id, dep_node);
            })());
        }

        await all_promises(promises);

        StatsController.register_stat_DUREE('VarsDeployDepsHandler', 'handle_deploy_deps', 'OUT', Dates.now_ms() - time_in);
    }
}