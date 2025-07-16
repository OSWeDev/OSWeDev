import DAG from "../../../Var/graph/dagbase/DAG";
import DAGNodeBase from "../../../Var/graph/dagbase/DAGNodeBase";
import DAGNodeDep from "../../../Var/graph/dagbase/DAGNodeDep";
import DashboardPageWidgetVO from "../../vos/DashboardPageWidgetVO";

export default class WidgetFilterDependancyDAGNode extends DAGNodeBase {

    /**
     * L'usage du constructeur est prohibé, il faut utiliser la factory
     */
    private constructor(public dag: DAG<WidgetFilterDependancyDAGNode>, public page_widget: DashboardPageWidgetVO) {
        super(page_widget.id.toString());
    }

    /**
     * Factory de noeuds en fonction du nom. Permet d'assurer l'unicité des params dans l'arbre
     */
    public static getInstance(dag: DAG<WidgetFilterDependancyDAGNode>, page_widget: DashboardPageWidgetVO): WidgetFilterDependancyDAGNode {
        if (dag.nodes[page_widget.id]) {
            return dag.nodes[page_widget.id];
        }

        return new WidgetFilterDependancyDAGNode(dag, page_widget).linkToDAG();
    }

    /**
     * Ajouter une dépendance descendante sur un noeud, et cabler complètement la dep dans les 2 sens
     * @param dep WidgetFilterDependancyDAGNodeDep dont les outgoings et le name sont défini, le reste n'est pas utile à ce stade
     */
    public addOutgoingDep(dep_name: string, outgoing_node: WidgetFilterDependancyDAGNode) {

        /**
         * si la dep est déjà identifiée, ignore
         */
        if (this.outgoing_deps && this.outgoing_deps[dep_name]) {
            return;
        }

        const dep: DAGNodeDep<WidgetFilterDependancyDAGNode> = new DAGNodeDep(dep_name, this, outgoing_node);

        if (!this.outgoing_deps) {
            this.outgoing_deps = {};
        }

        this.outgoing_deps[dep.dep_name] = dep;

        if (!dep?.outgoing_node?.incoming_deps) {
            dep.outgoing_node.incoming_deps = {};
        }
        if (!dep.outgoing_node.incoming_deps[dep.dep_name]) {
            dep.outgoing_node.incoming_deps[dep.dep_name] = [];
        }
        dep.outgoing_node.incoming_deps[dep.dep_name].push(dep);

        if (this.dag.roots[dep.outgoing_node.page_widget.id]) {
            delete this.dag.roots[dep.outgoing_node.page_widget.id];
        }

        if (this.dag.leafs[this.page_widget.id]) {
            delete this.dag.leafs[this.page_widget.id];
        }
    }

    /**
     * Méthode appelée par le constructeur pour lier le noeud à l'arbre
     */
    private linkToDAG(): WidgetFilterDependancyDAGNode {

        this.dag.nodes[this.page_widget.id] = this;
        this.dag.nb_nodes++;

        this.dag.leafs[this.page_widget.id] = this;
        this.dag.roots[this.page_widget.id] = this;

        return this;
    }
}
