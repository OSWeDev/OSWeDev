import DAG from './DAG';
import DAGNode from './DAGNode';

export default class DAGNodeEdge {

    public incoming_node: DAGNode = null;
    public outgoing_node: DAGNode = null;

    // label qui permet d'identifier la liaison indépendemment des
    public edge_name: string = null;

    /**
     * Use this to postpone the deletion to a batch deletion
     */
    public marked_for_deletion: boolean = false;

    public value = null;

    /**
     * Use the factory
     */
    protected constructor(public name: string, public dag: DAG<DAGNodeOutgoing>) { }

    /**
     * Permet de savoir si le vertex a des deps
     */
    get hasOutgoing(): boolean {
        return !((!this.outgoingNames) || (!this.outgoingNames.length));
    }

    /**
     * Permet de savoir si quelqu'un dépend de ce vertex. Sinon on est sur un élément root (donc supprimable puisque personne ne dépend de lui)
     */
    get hasIncoming(): boolean {
        return !((!this.incomingNames) || (!this.incomingNames.length));
    }

    /**
     * @param node_name
     */
    public removeNodeFromOutgoing(node_name: string) {

        if ((!!this.outgoing) && (!!this.outgoing[node_name])) {
            delete this.outgoing[node_name];

            let indexof = this.outgoingNames.indexOf(node_name);
            if (indexof >= 0) {
                this.outgoingNames.splice(indexof, 1);
                this.outgoingDepIds.splice(indexof, 1);
            }
        }

        // Si on a plus d'outgoing, on devient une leaf
        if ((!this.outgoingNames) || (this.outgoingNames.length == 0)) {
            this.dag.leafs[this.name] = this;
        }
    }

    /**
     * Pas de suppression automatique àa ce niveau
     * @param node_name
     */
    public removeNodeFromIncoming(node_name: string) {

        if ((!!this.incoming) && (!!this.incoming[node_name])) {
            delete this.incoming[node_name];

            let indexof = this.incomingNames.indexOf(node_name);
            if (indexof >= 0) {
                this.incomingNames.splice(indexof, 1);
            }
        }

        // Si on a plus d'incoming, on devient une root
        if ((!this.incomingNames) || (this.incomingNames.length == 0)) {

            this.dag.roots[this.name] = this;
        }
    }

    protected connect_to_DAG(): DAGNodeOutgoing {
        this.dag.add(this);
        return this;
    }
}