
import { cloneDeep } from 'lodash';
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
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataProxyWrapperVO from '../../../shared/modules/Var/vos/VarDataProxyWrapperVO';
import VarPixelFieldConfVO from '../../../shared/modules/Var/vos/VarPixelFieldConfVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import DataSourcesController from './datasource/DataSourcesController';
import NotifVardatasParam from './notifs/NotifVardatasParam';
import SlowVarKiHandler from './SlowVarKi/SlowVarKiHandler';
import VarsCacheController from './VarsCacheController';
import VarsDatasProxy from './VarsDatasProxy';
import VarsImportsHandler from './VarsImportsHandler';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import VarsServerCallBackSubsController from './VarsServerCallBackSubsController';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

export default class VarsComputeController {

    public static PARAM_NAME_estimated_tree_computation_time_target: string = 'VarsComputeController.estimated_tree_computation_time_target';
    public static PARAM_NAME_estimated_tree_computation_time_limit: string = 'VarsComputeController.estimated_tree_computation_time_limit';

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

    protected constructor() {
    }

    public get_estimated_ctree_ddeps_try_load_cache_complet(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_try_load_cache_complet_1k_card;
        return res;
    }
    public get_estimated_ctree_ddeps_load_imports_and_split_nodes(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_load_imports_and_split_nodes_1k_card;
        return res;
    }
    public get_estimated_ctree_ddeps_try_load_cache_partiel(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_try_load_cache_partiel_1k_card;
        return res;
    }
    public get_estimated_ctree_ddeps_get_node_deps(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_get_node_deps_1k_card;
        return res;
    }
    public get_estimated_ctree_ddeps_handle_pixellisation(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_ctree_ddeps_handle_pixellisation_1k_card;
        return res;
    }

    public get_estimated_load_nodes_datas(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_load_nodes_datas_1k_card;
        return res;
    }
    public get_estimated_compute_node(var_data: VarDataBaseVO): number {
        let res = (MatroidController.getInstance().get_cardinal(var_data) / 1000)
            * VarsServerController.getInstance().varcacheconf_by_var_ids[var_data.var_id].estimated_compute_node_1k_card;
        return res;
    }

    /**
     * La fonction qui réalise les calculs sur un ensemble de var datas et qui met directement à jour la valeur et l'heure du calcul dans le var_data
     */
    public async compute(): Promise<void> {

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

                // ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - create_tree OLD OK (' + (perf_old_end - perf_old_start) + 'ms) ... ' + dag.nb_nodes + ' nodes, ' + Object.keys(dag.leafs).length + ' leafs, ' + Object.keys(dag.roots).length + ' roots');

                let var_dag: VarDAG = VarsdatasComputerBGThread.getInstance().current_batch_vardag;

                await this.create_tree_perf_wrapper(var_dag, ds_cache);

                ConsoleHandler.getInstance().log('VarsdatasComputerBGThread compute - ' + var_dag.nb_nodes + ' nodes, ' + Object.keys(var_dag.leafs).length + ' leafs, ' + Object.keys(var_dag.roots).length + ' roots');

                /**
                 * On a l'arbre. On charge les données qui restent à charger
                 */
                await this.load_nodes_datas_perf_wrapper(var_dag, ds_cache);

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
        var_dag: VarDAG,
        deployed_vars_datas: { [index: string]: boolean } = {},
        vars_datas: { [index: string]: VarDataBaseVO } = {},
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {},
        limit_to_aggregated_datas: boolean = false
    ) {

        // on récupère le noeud de l'arbre
        let node = VarDAGNode.getInstance(var_dag, var_to_deploy);

        // si le noeud est déjà chargé, on sort
        if (node.already_tried_loading_data_and_deploy) {
            if (!node.successfully_deployed) {
                node.successfully_deployed = true;
            }
            return;
        }
        node.already_tried_loading_data_and_deploy = true;

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;
        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__deploy_deps],
            async () => {

                if (deployed_vars_datas[node.var_data.index]) {
                    if (!node.successfully_deployed) {
                        node.successfully_deployed = true;
                    }
                    return;
                }
                deployed_vars_datas[node.var_data.index] = true;

                let estimated_tree_computation_time_limit = await this.get_estimated_tree_computation_time_limit();
                if (var_dag.total_estimated_time > estimated_tree_computation_time_limit) {
                    if (DEBUG_VARS) {
                        ConsoleHandler.getInstance().error('BATCH remaining time estimation (' + var_dag.perfs.current_estimated_remaining_time + ') + elapsed time => [' + var_dag.total_estimated_time + '] > limit (' + estimated_tree_computation_time_limit + ')');

                        /**
                         * Tous les noeuds qui ne sont pas successfully_deployed doivent être retirés de l'arbre à ce stade et on part en calcul
                         */
                        for (let i in var_dag.nodes) {
                            let unsuccessfully_deployed_node = var_dag.nodes[i];

                            if (!!unsuccessfully_deployed_node.successfully_deployed) {
                                continue;
                            }

                            unsuccessfully_deployed_node.unlinkFromDAG();
                        }

                        return;
                    }
                }

                this.start_node_deploiement(node, var_dag);

                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
                let varconf = VarsController.getInstance().var_conf_by_id[node.var_data.var_id];

                /**
                 * Cache complet - inutile si on est sur un noeud du vars_datas ou si on a déjà fait le chargement
                 *  on teste toujours de retrouver un calcul existant
                 */
                if ((!node.already_tried_load_cache_complet) && (!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index])) {

                    await this.try_load_cache_complet_perf_wrapper(var_dag, node);

                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                        this.end_node_deploiement(node, var_dag);
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

                    await this.load_imports_and_split_nodes_perf_wrapper(var_dag, node);

                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                        this.end_node_deploiement(node, var_dag);
                        return;
                    }
                }

                /**
                 * Cas de la pixellisation qu'on sort des autres types de cache
                 */
                if (varconf.pixel_activated) {

                    await this.handle_pixellisation_perf_wrapper(node, varconf, var_dag, limit_to_aggregated_datas, DEBUG_VARS);
                } else {

                    /**
                     * Cache step C : cache partiel : uniquement si on a pas splitt sur import
                     */
                    if ((!VarsServerController.getInstance().has_valid_value(node.var_data)) && (!vars_datas[node.var_data.index]) &&
                        (!node.is_aggregator) &&
                        (VarsCacheController.getInstance().use_partial_cache(node))) {

                        var_dag.perfs.ctree_ddeps_try_load_cache_partiel.start();
                        node.perfs.ctree_ddeps_try_load_cache_partiel.start();

                        await this.try_load_cache_partiel(node);

                        var_dag.perfs.ctree_ddeps_try_load_cache_partiel.end();
                        node.perfs.ctree_ddeps_try_load_cache_partiel.end();

                        if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                            this.end_node_deploiement(node, var_dag);
                            return;
                        }
                    }
                }

                if (limit_to_aggregated_datas) {

                    // Si on a des données aggrégées elles sont déjà ok à renvoyer si on ne veut que savoir les données aggrégées
                    this.end_node_deploiement(node, var_dag);
                    return;
                }

                let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps_perf_wrapper(var_dag, node, ds_cache);

                /**
                 * Si dans les deps on a un denied, on refuse le tout
                 */
                for (let i in deps) {
                    let dep = deps[i];

                    if (dep.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                        node.var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;
                        node.var_data.value = 0;
                        node.var_data.value_ts = Dates.now();

                        this.end_node_deploiement(node, var_dag);
                        return;
                    }

                    if (DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('deploy_deps:' + node.var_data.index + ':dep:' + dep.index + ':');
                    }
                }

                if (deps) {
                    await this.handle_deploy_deps(node, deps, deployed_vars_datas, vars_datas, ds_cache);
                }

                this.end_node_deploiement(node, var_dag);
            },
            this,
            null,
            VarsPerfMonServerController.getInstance().generate_pmlinfos_from_node(node)
        );
    }

    /**
     * Tous les noeuds du vars_datas sont par définition en cache, donc on se pose la question que pour les autres
     * @param dag
     * @param vars_datas
     */
    private async cache_datas(dag: VarDAG) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__cache_datas],
            async () => {

                // Si on a dans le buffer une version plus ancienne on doit mettre à jour
                await VarsDatasProxy.getInstance().update_existing_buffered_older_datas(Object.values(dag.nodes).map((n) => n.var_data));

                for (let i in dag.nodes) {
                    let node = dag.nodes[i];

                    if (node.is_batch_var) {
                        continue;
                    }

                    if (VarsCacheController.getInstance().BDD_do_cache_param_data(node.var_data, VarsServerController.getInstance().getVarControllerById(node.var_data.var_id), node.is_batch_var)) {
                        await VarsDatasProxy.getInstance().prepend_var_datas([node.var_data], false);
                    }
                }
            },
            this
        );
    }

    private async load_nodes_datas(var_dag: VarDAG, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {
        let env = ConfigurationService.getInstance().node_configuration;

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__load_nodes_datas],
            async () => {

                let promises = [];
                let load_node_data_db_connect_coef_sum: number = 0;
                let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));

                for (let i in var_dag.nodes) {
                    let node = var_dag.nodes[i];

                    // Si le noeud a une valeur on se fout de load les datas
                    if (VarsServerController.getInstance().has_valid_value(node.var_data)) {

                        if (env.DEBUG_VARS) {
                            ConsoleHandler.getInstance().log('load_nodes_datas:has_valid_value:index:' + node.var_data.index + ":value:" + node.var_data.value + ":value_ts:" + node.var_data.value_ts + ":type:" + VarDataBaseVO.VALUE_TYPE_LABELS[node.var_data.value_type]);
                        }

                        continue;
                    }

                    let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

                    let dss: DataSourceControllerBase[] = controller.getDataSourcesDependencies();

                    if (load_node_data_db_connect_coef_sum >= max) {
                        await Promise.all(promises);
                        load_node_data_db_connect_coef_sum = 0;
                        promises = [];
                    }

                    let perfmon = PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__DataSourcesController__load_node_datas];
                    // Si on est sur du perf monitoring on doit faire les appels séparément...
                    if (perfmon.is_active) {
                        await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);
                    } else {

                        for (let dssi in dss) {
                            let ds = dss[dssi];
                            load_node_data_db_connect_coef_sum += ds.load_node_data_db_connect_coef;
                        }

                        promises.push((async () => {

                            var_dag.perfs.load_nodes_datas.start();
                            node.perfs.load_nodes_datas.start();

                            await DataSourcesController.getInstance().load_node_datas(dss, node, ds_cache);

                            var_dag.perfs.load_nodes_datas.end();
                            node.perfs.load_nodes_datas.end();
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
    private async compute_node(node: VarDAGNode) {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__compute_node],
            async () => {

                node.dag.perfs.compute_node.start();
                node.perfs.compute_node.start();

                let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);
                await controller.computeValue(node);

                node.dag.perfs.compute_node.end();
                node.perfs.compute_node.end();

                await this.notify_var_data_post_deploy(node);
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

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;
        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__handle_deploy_deps],
            async () => {

                let deps_as_array = Object.values(deps);
                let deps_ids_as_array = Object.keys(deps);
                let deps_i = 0;

                let deps_promises = [];
                let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 3));

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

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;
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

                    if (!VarsCacheController.getInstance().use_partial_cache_element(node, cache_partiel)) {
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
    private async create_tree(ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<VarDAG> {

        let DEBUG_VARS = ConfigurationService.getInstance().node_configuration.DEBUG_VARS;

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsComputeController__create_tree],
            async () => {

                let var_dag: VarDAG = VarsdatasComputerBGThread.getInstance().current_batch_vardag;

                let estimated_tree_computation_time_limit = await this.get_estimated_tree_computation_time_target();

                /**
                 * Tant que le temps estimé global reste < à la limite principale (3 secondes par défaut) on continue de rajouter à l'arbre
                 */
                while (var_dag.total_estimated_time < estimated_tree_computation_time_limit) {

                    /**
                     * On commence par sélectionner la prochaine var, soit depuis les slow vars (si on est en position de le faire), soit depuis le cache
                     */
                    let selected_var_data: VarDataBaseVO = await this.get_slow_var();

                    /**
                     * Piocher une var, l'ajouter à l'arbre, déployer ses deps :
                     *  - Pendant le déploiement si on dépasse les 30 secondes estimées on coupe tout et on supprime les noeuds incomplets
                     *      (qui n'avaient pas fini de déployer leurs deps)
                     *  - A la fin du déploiement, si on est sous les 3 secondes estimées, on dépile à nouveau une var registered et on déploie
                     *  - Si on a plus rien à dépiler ou si on est au dessus des 3 secondes (ou des 30 après avoir nettoyé l'arbre) on valide l'arbre pour calcul
                     */
                    let wrapped_select_var: VarDataProxyWrapperVO<VarDataBaseVO> = null;
                    if (!selected_var_data) {
                        wrapped_select_var = VarsDatasProxy.getInstance().select_var_from_buffer();
                        selected_var_data = wrapped_select_var.var_data;
                    }

                    if (!selected_var_data) {
                        // On a tout dépilé a priori
                        return var_dag;
                    }

                    let var_conf = VarsController.getInstance().var_conf_by_id[selected_var_data.var_id];
                    if (var_conf.disable_var) {

                        if (selected_var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED) {
                            continue;
                        }

                        selected_var_data.value = 0;
                        selected_var_data.value_ts = Dates.now();
                        selected_var_data.value_type = VarDataBaseVO.VALUE_TYPE_DENIED;

                        if (DEBUG_VARS) {
                            ConsoleHandler.getInstance().warn('Found disabled_var:' + selected_var_data.var_id + ':' + var_conf.name + ':' + selected_var_data.index + ':DENY in DB and continue');
                        }
                        await ModuleDAO.getInstance().insertOrUpdateVO(selected_var_data);

                        continue;
                    }

                    ConsoleHandler.getInstance().log('SELECTED VAR:' + selected_var_data.index + ':TotalEstimatedTime:' + var_dag.total_estimated_time + ':Remaining:' + var_dag.perfs.current_estimated_remaining_time + ':');

                    /**
                     * On insère le noeud dans l'arbre en premier pour forcer le flag already_tried_load_cache_complet
                     *  puisque si on avait ce cache on demanderait pas un calcul à ce stade
                     */
                    let var_dag_node = VarDAGNode.getInstance(var_dag, selected_var_data);
                    var_dag_node.already_tried_load_cache_complet = true;
                    var_dag_node.is_batch_var = true;

                    let vars_datas_to_deploy_by_controller_height: { [height: number]: { [index: string]: VarDataBaseVO } } = {
                        [0]: { [selected_var_data.index]: selected_var_data }
                    };
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
                }

                return var_dag;
            },
            this
        );
    }

    /**
     * Si c'est suite à un redémarrage on check si on a des vars en attente de test en BDD
     *  Si c'est le cas on gère la première de ces vars, sinon on enlève le mode démarrage
     */
    private async get_slow_var(): Promise<VarDataBaseVO> {
        let vardata_to_test: VarDataBaseVO = VarsDatasProxy.getInstance().can_load_vars_to_test ? await SlowVarKiHandler.getInstance().handle_slow_var_ki_start() : null;
        if (vardata_to_test) {
            ConsoleHandler.getInstance().log('get_vars_to_compute:1 SLOWVAR:' + vardata_to_test.index);
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
        let max_height = Math.max(...Object.keys(vars_datas_to_deploy_by_controller_height).map((h: string) => parseInt(h)));
        return vars_datas_to_deploy_by_controller_height[max_height];
    }

    /**
     * Organiser les vars datas par profondeur du controller (en sachant que plus le controller est haut dans l'arbre, plus sa profondeur est élevée)
     *  on se base directement sur l'arbre, et on prend en compte que les éléments pas encore déployé, et sans valeur valide
     */
    private async get_vars_datas_by_controller_height(var_dag: VarDAG): Promise<{ [height: number]: { [index: string]: VarDataBaseVO } }> {
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
        var_dag: VarDAG) {

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 3));

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

    private add_vars_datas_to_dag(var_dag: VarDAG, vars_datas: { [index: string]: VarDataBaseVO }, force_already_tried_load_cache_complet: boolean = false) {
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
        var_dag: VarDAG,
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }
    ) {

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 3));

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
        var_dag: VarDAG,
        ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }
    ) {

        var_dag.perfs.ctree_ddeps_get_node_deps.start();
        var_dag_node.perfs.ctree_ddeps_get_node_deps.start();

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(var_dag_node, ds_cache);

        var_dag.perfs.ctree_ddeps_get_node_deps.end();
        var_dag_node.perfs.ctree_ddeps_get_node_deps.end();

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

    /**
     * On demande de recharge le estimated_tree_computation_time_limit toutes les minutes au max
     */
    private async get_estimated_tree_computation_time_target(): Promise<number> {
        await this.check_cached_estimated_tree_computation_time();
        return this.cached_estimated_tree_computation_time_target;
    }

    private async get_estimated_tree_computation_time_limit(): Promise<number> {
        await this.check_cached_estimated_tree_computation_time();
        return this.cached_estimated_tree_computation_time_limit;
    }

    private async check_cached_estimated_tree_computation_time(): Promise<void> {
        if ((!this.last_update_estimated_tree_computation_time) || (this.last_update_estimated_tree_computation_time < (Dates.now() - 60))) {

            let promises = [];
            let self = this;

            promises.push((async () => {
                self.cached_estimated_tree_computation_time_limit = await ModuleParams.getInstance().getParamValueAsInt(VarsComputeController.PARAM_NAME_estimated_tree_computation_time_limit, 30);
            })());
            promises.push((async () => {
                self.cached_estimated_tree_computation_time_target = await ModuleParams.getInstance().getParamValueAsInt(VarsComputeController.PARAM_NAME_estimated_tree_computation_time_target, 3);
            })());
            this.last_update_estimated_tree_computation_time = Dates.now();
        }
    }

    private async create_tree_perf_wrapper(var_dag: VarDAG, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {
        var_dag.perfs.create_tree.start('create_tree');
        await this.create_tree(ds_cache);
        var_dag.perfs.create_tree.end('create_tree');
    }

    private async load_nodes_datas_perf_wrapper(var_dag: VarDAG, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }) {
        var_dag.perfs.load_nodes_datas.start('load_nodes_datas');
        await this.load_nodes_datas(var_dag, ds_cache);
        var_dag.perfs.load_nodes_datas.end('load_nodes_datas');
    }

    private async compute_perf_wrapper(var_dag: VarDAG) {
        var_dag.perfs.computation_wrapper.start('computation_wrapper');
        for (let i in var_dag.nodes) {
            let node = var_dag.nodes[i];

            if (!VarsServerController.getInstance().has_valid_value(node.var_data)) {
                await DAGController.getInstance().visit_bottom_up_to_node(
                    node,
                    async (visited_node: VarDAGNode) => await this.compute_node(visited_node),
                    (next_node: VarDAGNode) => !VarsServerController.getInstance().has_valid_value(next_node.var_data));
            }
        }
        var_dag.perfs.computation_wrapper.end('computation_wrapper');
    }

    private async cache_datas_perf_wrapper(var_dag: VarDAG) {
        var_dag.perfs.cache_datas.start('cache_datas');
        await this.cache_datas(var_dag);
        var_dag.perfs.cache_datas.end('cache_datas');
    }

    private start_node_deploiement(node: VarDAGNode, var_dag: VarDAG) {
        var_dag.perfs.ctree_deploy_deps.start();
        node.perfs.ctree_deploy_deps.start();
    }

    private end_node_deploiement(node: VarDAGNode, var_dag: VarDAG) {
        var_dag.perfs.ctree_deploy_deps.end();
        node.perfs.ctree_deploy_deps.end();

        if (!node.successfully_deployed) {
            node.successfully_deployed = true;
        }
    }

    private async load_imports_and_split_nodes_perf_wrapper(var_dag: VarDAG, node: VarDAGNode) {
        var_dag.perfs.ctree_ddeps_load_imports_and_split_nodes.start();
        node.perfs.ctree_ddeps_load_imports_and_split_nodes.start();

        await VarsImportsHandler.getInstance().load_imports_and_split_nodes(node);

        var_dag.perfs.ctree_ddeps_load_imports_and_split_nodes.end();
        node.perfs.ctree_ddeps_load_imports_and_split_nodes.end();
    }

    private async try_load_cache_complet_perf_wrapper(var_dag: VarDAG, node: VarDAGNode) {
        var_dag.perfs.ctree_ddeps_try_load_cache_complet.start();
        node.perfs.ctree_ddeps_try_load_cache_complet.start();

        await this.try_load_cache_complet(node);

        var_dag.perfs.ctree_ddeps_try_load_cache_complet.end();
        node.perfs.ctree_ddeps_try_load_cache_complet.end();
    }

    private async get_node_deps_perf_wrapper(var_dag: VarDAG, node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<{ [index: string]: VarDataBaseVO }> {
        var_dag.perfs.ctree_ddeps_get_node_deps.start();
        node.perfs.ctree_ddeps_get_node_deps.start();

        let deps: { [index: string]: VarDataBaseVO } = await this.get_node_deps(node, ds_cache);

        var_dag.perfs.ctree_ddeps_get_node_deps.end();
        node.perfs.ctree_ddeps_get_node_deps.end();

        return deps;
    }

    private async handle_pixellisation_perf_wrapper(node: VarDAGNode, varconf: VarConfVO, var_dag: VarDAG, limit_to_aggregated_datas: boolean, DEBUG_VARS: boolean) {
        var_dag.perfs.ctree_ddeps_handle_pixellisation.start();
        node.perfs.ctree_ddeps_handle_pixellisation.start();

        await this.handle_pixellisation(node, varconf, var_dag, limit_to_aggregated_datas, DEBUG_VARS);

        var_dag.perfs.ctree_ddeps_handle_pixellisation.end();
        node.perfs.ctree_ddeps_handle_pixellisation.end();
    }

    /**
     * si on est sur un pixel, inutile de chercher on a déjà fait une recherche identique et on doit pas découper un pixel
     * sinon, on fait la fameuse requête de count + aggrégat et suivant que le count correspond bien au produit des cardinaux des dimensions
     *  pixellisées, on découpe en pixel, ou pas. (En chargeant du coup la liste des pixels)
     */
    private async handle_pixellisation(node: VarDAGNode, varconf: VarConfVO, var_dag: VarDAG, limit_to_aggregated_datas: boolean, DEBUG_VARS: boolean) {

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
                .filter_by_num_eq('var_id', varconf.id)
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

            if (!pixel_cache) {
                pixel_cache = {
                    counter: 0,
                    aggregated_value: 0
                };
            }

            if (pixel_cache && (pixel_cache.counter == prod_cardinaux)) {


                if (limit_to_aggregated_datas) {
                    // On aura pas de données aggregées à ce stade
                    this.end_node_deploiement(node, var_dag);
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
    }
}