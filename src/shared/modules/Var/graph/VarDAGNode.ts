import ConsoleHandler from '../../../tools/ConsoleHandler';
import EnvHandler from '../../../tools/EnvHandler';
import ObjectHandler from '../../../tools/ObjectHandler';
import SemaphoreHandler from '../../../tools/SemaphoreHandler';
import MatroidController from '../../Matroid/MatroidController';
import VarBatchNodePerfVO from '../vos/VarBatchNodePerfVO';
import VarDataBaseVO from '../vos/VarDataBaseVO';
import VarNodeParentPerfVO from '../vos/VarNodeParentPerfVO';
import VarNodePerfElementVO from '../vos/VarNodePerfElementVO';
import DAGNodeBase from './dagbase/DAGNodeBase';
import DAGNodeDep from './dagbase/DAGNodeDep';
import VarDAG from './VarDAG';

export default class VarDAGNode extends DAGNodeBase {

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     * @param is_batch_var par défaut false, il faut mettre true uniquement pour indiquer que c'est une var demandée par soit le serveur soit le client. et normalement
     *  c'est géré dans OSWedev
     * @returns {VarDAGNode}
     */
    public static async getInstance(var_dag: VarDAG, var_data: VarDataBaseVO, varsComputeController, is_batch_var: boolean, already_tried_load_cache_complet: boolean = is_batch_var): Promise<VarDAGNode> {

        return await SemaphoreHandler.semaphore("VarDAGNode.getInstance", async () => {

            if (!!var_dag.nodes[var_data.index]) {
                let res = var_dag.nodes[var_data.index];

                let old_already_tried_load_cache_complet = res.already_tried_load_cache_complet;

                // Le but est de savoir si on était un batch var ne serait-ce qu'une fois parmi les demandes de calcul de cette var
                if (is_batch_var && !res.is_batch_var) {

                    if (EnvHandler.DEBUG_VARS) {
                        ConsoleHandler.warn('Pour ma culture G: on demande un noeud dans l\'arbre qui existe déjà :' +
                            var_data.index + ': et qui n\'était pas un batch var, mais qui le devient');
                    }

                    // on a donc déjà checké en base de données si on pouvait trouver la var
                    res.already_tried_load_cache_complet = true;
                    res.is_batch_var = true;
                }

                // Si on a déjà enregistré les performances, on les conserve
                if (var_dag.has_perfs) {
                    if ((!old_already_tried_load_cache_complet) && already_tried_load_cache_complet && res.perfs &&
                        res.perfs.ctree_ddeps_try_load_cache_complet && (res.perfs.ctree_ddeps_try_load_cache_complet.end_time == null)) {

                        res.already_tried_load_cache_complet = true;
                        res.perfs.ctree_ddeps_try_load_cache_complet.skip_and_update_parents_perfs();
                    }
                }

                return res;
            }

            /**
             * Avant d'ajouter un noeud, on regarde si on time out sur la création de l'arbre
             * Si on time out, on note l'information :
             *  à ce stade on enlève les roots pas encore entamé de déployer (pas déployé et pas de outgoing dep)
             *  et on cleanera l'arbre en fin de déploiement de l'arbre actuel
             * 2 cas : soit on est en train d'initialiser les noeuds en cours de sélection :
             *      - on doit refuser le noeud dont on demande l'insertion à la base dans ce cas et on doit refuser tous les prochains noeuds
             *  soit on est en train de déployer l'arbre :
             *      - on doit accepter le noeud demandé car c'est très probablement un noeud qui a été demandé par un autre noeud et qui est attendu
             */
            if (!var_dag.timed_out) {

                if (await VarDAG.dag_is_in_timeout_with_elpased_time(var_dag)) {
                    if (EnvHandler.DEBUG_VARS) {
                        ConsoleHandler.error('BATCH estimated work time + elapsed > limit - STEP 1 Identifying roots to remove and mark as timed_out');
                    }
                    var_dag.timed_out = true;

                    for (let i in var_dag.roots) {
                        let node = var_dag.roots[i];
                        if (node instanceof VarDAGNode) {
                            if (node.has_started_deployment ||
                                (node.incoming_deps && ObjectHandler.getInstance().hasAtLeastOneAttribute(node.incoming_deps)) ||
                                (node.outgoing_deps && ObjectHandler.getInstance().hasAtLeastOneAttribute(node.outgoing_deps))) {
                                continue;
                            }

                            /**
                             * Si c'est le dernier noeud de l'arbre on doit pas le supprimer
                             */
                            if (var_dag.nb_nodes == 1) {
                                break;
                            }

                            node.unlinkFromDAG();

                            /***
                             * Si on est plus en timeout on arrête de faire du ménage
                             */
                            if (!await VarDAG.dag_is_in_timeout_with_elpased_time(var_dag)) {
                                break;
                            }
                        }
                    }
                }
            }
            if (is_batch_var && var_dag.timed_out) {
                return null;
            }

            /**
             * Si on time out sur la création de l'arbre on refuse d'ajouter de nouveaux éléments
             */
            // if (var_dag.timed_out) {
            //     return null;
            // }

            /**
             * On check qu'on essaie pas d'ajoute une var avec un maxrange quelque part qui casserait tout
             */
            if (!MatroidController.getInstance().check_bases_not_max_ranges(var_data)) {
                ConsoleHandler.error('VarDAGNode.getInstance:!check_bases_not_max_ranges:' + var_data.index);
                return null;
            }

            return (new VarDAGNode(var_dag, var_data/*, is_registered*/, is_batch_var)).linkToDAG(varsComputeController);
        });
    }

    public perfs: VarBatchNodePerfVO = new VarBatchNodePerfVO();

    /**
     * Tous les noeuds sont déclarés / initialisés comme des noeuds de calcul. C'est uniquement en cas de split (sur un import ou précalcul partiel)
     *  qu'on va switcher sur un mode aggégateur et configurer des aggregated_nodes
     */
    public is_aggregator: boolean = false;

    /**
     * Savoir si le noeud fait partie des questions qu'on tente de résoudre
     */
    public is_batch_var: boolean = false;

    /**
     * CAS A : On a une noeud de calcul - qui utilise la fonction compute du VarController : Les dépendances descendantes :
     *  - undefined indique qu'on a pas chargé les deps ou que l'on est en cas B
     *  - toutes les deps doivent donc être chargées en même temps (c'est le cas dans le fonctionnement actuel des VarsControllers)
     */

    /**
     * CAS B : On a une noeud aggregateur - qui utilise la fonction aggregate du VarController : Les noeuds aggrégés
     */
    public aggregated_datas: { [var_data_index: string]: VarDataBaseVO } = {};

    /**
     * Toutes les données chargées pour ce noeud sont disponibles directement ici, classées par datasource
     */
    public datasources: { [ds_name: string]: any } = {};

    // /**
    //  * Indicateurs de performance
    //  */
    // public has_try_load_cache_complet_perf: boolean = false;
    // public has_load_imports_and_split_nodes_perf: boolean = false;
    // public has_try_load_cache_partiel_perf: boolean = false;
    // public has_is_aggregator_perf: boolean = false;
    // public has_ds_cache_perf: boolean = false;
    // public has_compute_node_perf: boolean = false;
    // public has_load_nodes_datas_perf: boolean = false;

    public has_started_deployment: boolean = false;
    public successfully_deployed: boolean = false;

    public already_tried_loading_data_and_deploy: boolean = false;
    public already_tried_load_cache_complet: boolean = false;

    public already_sent_result_to_subs: boolean = false;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public var_dag: VarDAG, public var_data: VarDataBaseVO, is_batch_var: boolean) {
        super();

        this.is_batch_var = is_batch_var;
        if (is_batch_var) {
            // on a donc déjà checké en base de données si on pouvait trouver la var
            this.already_tried_load_cache_complet = true;
        }

        if (var_dag.has_perfs) {
            this.perfs = new VarBatchNodePerfVO();

            this.perfs.ctree_deploy_deps = new VarNodePerfElementVO(this, 'ctree_deploy_deps', VarNodeParentPerfVO.create_new(null, 'create_tree'));
            this.perfs.ctree_ddeps_try_load_cache_complet = new VarNodePerfElementVO(this, 'ctree_ddeps_try_load_cache_complet', VarNodeParentPerfVO.create_new(this, 'ctree_deploy_deps'));
            this.perfs.ctree_ddeps_load_imports_and_split_nodes = new VarNodePerfElementVO(this, 'ctree_ddeps_load_imports_and_split_nodes', VarNodeParentPerfVO.create_new(this, 'ctree_deploy_deps'));
            this.perfs.ctree_ddeps_try_load_cache_partiel = new VarNodePerfElementVO(this, 'ctree_ddeps_try_load_cache_partiel', VarNodeParentPerfVO.create_new(this, 'ctree_deploy_deps'));
            this.perfs.ctree_ddeps_get_node_deps = new VarNodePerfElementVO(this, 'ctree_ddeps_get_node_deps', VarNodeParentPerfVO.create_new(this, 'ctree_deploy_deps'));
            this.perfs.ctree_ddeps_handle_pixellisation = new VarNodePerfElementVO(this, 'ctree_ddeps_handle_pixellisation', VarNodeParentPerfVO.create_new(this, 'ctree_deploy_deps'));

            this.perfs.load_node_datas = new VarNodePerfElementVO(this, 'load_node_datas', VarNodeParentPerfVO.create_new(null, 'load_nodes_datas'));

            this.perfs.compute_node = new VarNodePerfElementVO(this, 'compute_node', VarNodeParentPerfVO.create_new(null, 'compute_node_wrapper'));
        }
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep DAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarDAGNode) {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return;
        }

        let dep: DAGNodeDep<VarDAGNode> = new DAGNodeDep(dep_name, outgoing_node);

        dep.incoming_node = this;

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }
        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        dep.outgoing_node.incoming_deps[dep.dep_name] = dep;

        if (!!this.var_dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.var_dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.var_dag.leafs[this.var_data.index]) {
            delete this.var_dag.leafs[this.var_data.index];
        }
    }

    /**
     * Méthode appelée pour supprimer le noeud de l'arbre
     */
    public unlinkFromDAG(): VarDAGNode {

        if (!this.var_dag) {
            return;
        }
        let dag = this.var_dag;

        if (this.var_dag.has_perfs) {
            this.pop_node_perfs_from_dag();
        }
        // this.var_dag = null;

        delete dag.nodes[this.var_data.index];
        dag.nb_nodes--;

        for (let i in this.incoming_deps) {
            let incoming_dep = this.incoming_deps[i];
            delete incoming_dep.incoming_node.outgoing_deps[incoming_dep.dep_name];

            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(incoming_dep.incoming_node.outgoing_deps)) {
                dag.leafs[(incoming_dep.incoming_node as VarDAGNode).var_data.index] = incoming_dep.incoming_node as VarDAGNode;
            }
        }

        for (let i in this.outgoing_deps) {
            let outgoing_dep = this.outgoing_deps[i];
            delete outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];

            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(outgoing_dep.outgoing_node.outgoing_deps)) {
                dag.roots[(outgoing_dep.outgoing_node as VarDAGNode).var_data.index] = outgoing_dep.outgoing_node as VarDAGNode;
            }
        }

        if (!!dag.leafs[this.var_data.index]) {
            delete dag.leafs[this.var_data.index];
        }
        if (!!dag.roots[this.var_data.index]) {
            delete dag.roots[this.var_data.index];
        }

        return this;
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    public linkToDAG(varsComputeController): VarDAGNode {

        this.var_dag.nodes[this.var_data.index] = this;
        this.var_dag.nb_nodes++;

        this.var_dag.leafs[this.var_data.index] = this;
        this.var_dag.roots[this.var_data.index] = this;

        if (this.var_dag.has_perfs) {
            this.push_node_perfs_to_dag(varsComputeController);
        }

        return this;
    }

    private push_node_perfs_to_dag(varsComputeController) {

        if (this.is_batch_var) {
            this.var_dag.perfs.nb_batch_vars++;
        }

        this.perfs.compute_node.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_compute_node(this);
        this.perfs.load_node_datas.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_load_node_datas(this);
        this.perfs.ctree_ddeps_get_node_deps.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_ctree_ddeps_get_node_deps(this);
        this.perfs.ctree_ddeps_load_imports_and_split_nodes.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_ctree_ddeps_load_imports_and_split_nodes(this);
        this.perfs.ctree_ddeps_try_load_cache_complet.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_ctree_ddeps_try_load_cache_complet(this);
        this.perfs.ctree_ddeps_try_load_cache_partiel.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_ctree_ddeps_try_load_cache_partiel(this);
        this.perfs.ctree_ddeps_handle_pixellisation.initial_estimated_work_time = varsComputeController.getInstance().get_estimated_ctree_ddeps_handle_pixellisation(this);

        if (!!this.var_data.value_ts) {

            /**
             * Si on a déjà une valeur, on peut directement skip toutes les étapes
             */
            this.perfs.compute_node.skip_and_update_parents_perfs();
            this.perfs.load_node_datas.skip_and_update_parents_perfs();
            this.perfs.ctree_ddeps_get_node_deps.skip_and_update_parents_perfs();
            this.perfs.ctree_ddeps_handle_pixellisation.skip_and_update_parents_perfs();
            this.perfs.ctree_ddeps_load_imports_and_split_nodes.skip_and_update_parents_perfs();
            this.perfs.ctree_ddeps_try_load_cache_complet.skip_and_update_parents_perfs();
            this.perfs.ctree_ddeps_try_load_cache_partiel.skip_and_update_parents_perfs();
        }
    }

    private pop_node_perfs_from_dag() {

        if (this.is_batch_var) {
            this.var_dag.perfs.nb_batch_vars--;
        }

        this.perfs.compute_node.delete_this_perf();
        this.perfs.load_node_datas.delete_this_perf();
        this.perfs.ctree_ddeps_get_node_deps.delete_this_perf();
        this.perfs.ctree_ddeps_handle_pixellisation.delete_this_perf();
        this.perfs.ctree_ddeps_load_imports_and_split_nodes.delete_this_perf();
        this.perfs.ctree_ddeps_try_load_cache_complet.delete_this_perf();
        this.perfs.ctree_ddeps_try_load_cache_partiel.delete_this_perf();
    }
}
