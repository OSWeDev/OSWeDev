import ObjectHandler from '../../../../tools/ObjectHandler';
import DAG from './DAG';

export default class DAGNode {

    public incoming: { [node_name: string]: DAGNode } = {};
    public incomingNames: string[] = [];

    public outgoing: { [node_name: string]: DAGNode } = {};
    public outgoingNames: string[] = [];

    public value = null;

    public markers: { [marker_id: string]: number } = {};

    public constructor(public name: string, public dag: DAG<any>) { }

    public initializeNode(dag: DAG<any>) {
    }
    public prepare_for_deletion(dag: DAG<any>) {

        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(this.markers)) {
            let marker = ObjectHandler.getInstance().getFirstAttributeName(this.markers);

            this.removeMarker(marker, dag, true);
        }
    }

    public hasMarker(marker: string): boolean {
        return (!!this.markers[marker]);
    }

    /**
     * Si un marker existe déjà, on l'incrémente
     */
    public addMarker(marker: string, dag: DAG<any>) {

        if (!dag) {
            return;
        }

        if (!this.markers[marker]) {
            this.markers[marker] = 0;

            if (!dag.marked_nodes_names[marker]) {
                dag.marked_nodes_names[marker] = [];
            }
            dag.marked_nodes_names[marker].push(this.name);
        }
        this.markers[marker]++;
    }

    public removeMarkers(dag: DAG<any>) {
        for (let i in this.markers) {
            this.removeMarker(i, this.dag, true);
        }
    }

    /**
     * Si un marker atteint 0 on le supprime
     */
    public removeMarker(marker: string, dag: DAG<any>, force_deletion: boolean = false) {
        if (!this.markers[marker]) {
            // console.error('Incohérence de DAG :' + this.name + ':removeMarker:' + marker + ':inexistant');
            return;
        }

        if (force_deletion) {

            this.markers[marker] = 0;
        } else {

            this.markers[marker]--;
        }

        if (this.markers[marker] <= 0) {
            delete this.markers[marker];

            let indexof = dag.marked_nodes_names[marker].indexOf(this.name);
            if (indexof >= 0) {
                dag.marked_nodes_names[marker].splice(indexof, 1);
            }
        }
    }

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
}