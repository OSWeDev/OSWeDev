import VarsComputeController from '../../../../server/modules/Var/VarsComputeController';
import VarBatchNodePerfVO from '../vos/VarBatchNodePerfVO';
import VarDataBaseVO from '../vos/VarDataBaseVO';
import DAGNodeBase from './dagbase/DAGNodeBase';
import DAGNodeDep from './dagbase/DAGNodeDep';
import VarDAG from './VarDAG';

export default class VarDAGNode extends DAGNodeBase {

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     */
    public static getInstance(dag: VarDAG, var_data: VarDataBaseVO): VarDAGNode {
        if (!!dag.nodes[var_data.index]) {
            return dag.nodes[var_data.index];
        }

        return new VarDAGNode(dag, var_data/*, is_registered*/).linkToDAG();
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

    public successfully_deployed: boolean = false;

    public already_tried_loading_data_and_deploy: boolean = false;
    public already_tried_load_cache_complet: boolean = false;

    public already_sent_result_to_subs: boolean = false;

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public dag: VarDAG, public var_data: VarDataBaseVO) {
        super();
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

        if (!!this.dag.roots[dep.outgoing_node.var_data.index]) {
            delete this.dag.roots[dep.outgoing_node.var_data.index];
        }

        if (!!this.dag.leafs[this.var_data.index]) {
            delete this.dag.leafs[this.var_data.index];
        }
    }

    /**
     * Méthode appelée pour supprimer le noeud de l'arbre
     */
    public unlinkFromDAG(): VarDAGNode {

        if (!this.dag) {
            return;
        }
        let dag = this.dag;
        this.pop_node_perfs_from_dag();
        this.dag = null;

        delete dag.nodes[this.var_data.index];
        dag.nb_nodes++;

        for (let i in this.incoming_deps) {
            let incoming_dep = this.incoming_deps[i];
            delete incoming_dep.incoming_node.outgoing_deps[incoming_dep.dep_name];
        }

        for (let i in this.outgoing_deps) {
            let outgoing_dep = this.outgoing_deps[i];
            delete outgoing_dep.outgoing_node.incoming_deps[outgoing_dep.dep_name];
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
    public linkToDAG(): VarDAGNode {

        this.dag.nodes[this.var_data.index] = this;
        this.dag.nb_nodes++;

        this.dag.leafs[this.var_data.index] = this;
        this.dag.roots[this.var_data.index] = this;

        this.push_node_perfs_to_dag();

        return this;
    }

    private push_node_perfs_to_dag() {

        if (this.is_batch_var) {
            this.dag.perfs.nb_batch_vars++;
        }

        this.perfs.init_estimated_work_time_compute_node(VarsComputeController.getInstance().get_estimated_compute_node(this.var_data), this.dag);
        this.perfs.init_estimated_work_time_load_nodes_datas(VarsComputeController.getInstance().get_estimated_load_nodes_datas(this.var_data), this.dag);
        this.perfs.init_estimated_work_time_ctree_ddeps_get_node_deps(VarsComputeController.getInstance().get_estimated_ctree_ddeps_get_node_deps(this.var_data), this.dag);
        this.perfs.init_estimated_work_time_ctree_ddeps_load_imports_and_split_nodes(VarsComputeController.getInstance().get_estimated_ctree_ddeps_load_imports_and_split_nodes(this.var_data), this.dag);
        this.perfs.init_estimated_work_time_ctree_ddeps_try_load_cache_complet(VarsComputeController.getInstance().get_estimated_ctree_ddeps_try_load_cache_complet(this.var_data), this.dag);
        this.perfs.init_estimated_work_time_ctree_ddeps_try_load_cache_partiel(VarsComputeController.getInstance().get_estimated_ctree_ddeps_try_load_cache_partiel(this.var_data), this.dag);

        if (!!this.var_data.value_ts) {

            /**
             * Si on a déjà une valeur, on peut directement skip toutes les étapes
             */
            this.perfs.skip_compute_node(this.dag);
            this.perfs.skip_load_nodes_datas(this.dag);
            this.perfs.skip_ctree_ddeps_get_node_deps(this.dag);
            this.perfs.skip_ctree_ddeps_load_imports_and_split_nodes(this.dag);
            this.perfs.skip_ctree_ddeps_try_load_cache_complet(this.dag);
            this.perfs.skip_ctree_ddeps_try_load_cache_partiel(this.dag);
        }
    }

    private pop_node_perfs_from_dag() {

        if (this.is_batch_var) {
            this.dag.perfs.nb_batch_vars--;
        }

        this.perfs.update_estimated_work_time_compute_node(0, this.dag);
        this.perfs.update_estimated_work_time_load_nodes_datas(0, this.dag);
        this.perfs.update_estimated_work_time_ctree_ddeps_get_node_deps(0, this.dag);
        this.perfs.update_estimated_work_time_ctree_ddeps_load_imports_and_split_nodes(0, this.dag);
        this.perfs.update_estimated_work_time_ctree_ddeps_try_load_cache_complet(0, this.dag);
        this.perfs.update_estimated_work_time_ctree_ddeps_try_load_cache_partiel(0, this.dag);
    }
}
