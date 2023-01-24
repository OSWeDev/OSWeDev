import VarServerControllerBase from '../VarServerControllerBase';
import DAG from '../../../../shared/modules/Var/graph/dagbase/DAG';
import DAGNodeBase from '../../../../shared/modules/Var/graph/dagbase/DAGNodeBase';
import DAGNodeDep from '../../../../shared/modules/Var/graph/dagbase/DAGNodeDep';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';

export default class VarCtrlDAGNode extends DAGNodeBase {

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     *  La value du noeud est celle du var_data passé en param, et donc si undefined le noeud est non calculé
     *  Le nom du noeud est l'index du var_data
     */
    public static getInstance(dag: DAG<VarCtrlDAGNode>, var_controller: VarServerControllerBase<VarDataBaseVO>): VarCtrlDAGNode {
        if (!!dag.nodes[var_controller.varConf.id]) {
            return dag.nodes[var_controller.varConf.id];
        }

        return new VarCtrlDAGNode(dag, var_controller/*, is_registered*/).linkToDAG();
    }

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public dag: DAG<VarCtrlDAGNode>, public var_controller: VarServerControllerBase<any>) {
        super();
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep VarCtrlDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: VarCtrlDAGNode) {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return;
        }

        let dep: DAGNodeDep<VarCtrlDAGNode> = new DAGNodeDep(dep_name, outgoing_node);

        dep.incoming_node = this;

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }
        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep.outgoing_node.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        dep.outgoing_node.incoming_deps[dep.dep_name] = dep;

        if (!!this.dag.roots[dep.outgoing_node.var_controller.varConf.id]) {
            delete this.dag.roots[dep.outgoing_node.var_controller.varConf.id];
        }

        if (!!this.dag.leafs[this.var_controller.varConf.id]) {
            delete this.dag.leafs[this.var_controller.varConf.id];
        }
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    private linkToDAG(): VarCtrlDAGNode {

        this.dag.nodes[this.var_controller.varConf.id] = this;
        this.dag.nb_nodes++;

        this.dag.leafs[this.var_controller.varConf.id] = this;
        this.dag.roots[this.var_controller.varConf.id] = this;

        return this;
    }
}
