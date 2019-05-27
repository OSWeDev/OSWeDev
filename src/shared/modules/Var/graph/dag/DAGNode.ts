import DAGVisitorBase from './DAGVisitorBase';
import DAG from './DAG';
import ObjectHandler from '../../../../tools/ObjectHandler';

export default class DAGNode {

    public incoming: { [node_name: string]: DAGNode } = {};
    public incomingNames: string[] = [];

    public outgoing: { [node_name: string]: DAGNode } = {};
    public outgoingNames: string[] = [];

    public value = null;

    public markers: { [marker_id: string]: number } = {};

    public constructor(public name: string, dag: DAG<any>) { }

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
        if (!this.markers[marker]) {
            this.markers[marker] = 0;

            if (!dag.marked_nodes_names[marker]) {
                dag.marked_nodes_names[marker] = [];
            }
            dag.marked_nodes_names[marker].push(this.name);
        }
        this.markers[marker]++;
    }

    /**
     * Si un marker atteint 0 on le supprime
     */
    public removeMarker(marker: string, dag: DAG<any>, force_deletion: boolean = false) {
        if (!this.markers[marker]) {
            console.error('Incohérence de DAG :' + this.name + ':removeMarker:' + marker + ':inexistant');
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
     * TODO TESTUnit
     * Permet de savoir si le vertex a des deps
     */
    get hasOutgoing(): boolean {
        return !((!this.outgoingNames) || (!this.outgoingNames.length));
    }

    /**
     * TODO TESTUnit
     * Permet de savoir si quelqu'un dépend de ce vertex. Sinon on est sur un élément root (donc supprimable puisque personne ne dépend de lui)
     */
    get hasIncoming(): boolean {
        return !((!this.incomingNames) || (!this.incomingNames.length));
    }

    public removeNodeFromOutgoing(node_name: string) {

        if ((!!this.outgoing) && (!!this.outgoing[node_name])) {
            delete this.outgoing[node_name];

            let indexof = this.outgoingNames.indexOf(node_name);
            if (indexof >= 0) {
                this.outgoingNames.splice(indexof, 1);
            }
        }
    }

    public removeNodeFromIncoming(node_name: string) {

        if ((!!this.incoming) && (!!this.incoming[node_name])) {
            delete this.incoming[node_name];

            let indexof = this.incomingNames.indexOf(node_name);
            if (indexof >= 0) {
                this.incomingNames.splice(indexof, 1);
            }
        }
    }

    // /**
    //  * TODO TestUnit le but est de visiter d'un node vers le haut ou vers le bas suivant donc en suivant les deps de to vers from (incoming)
    //  */
    // public async visit(visitor: DAGVisitorBase<any>, visited?, path?: string[]) {
    //     let name = this.name;
    //     let vertices: { [name: string]: DAGNode } = visitor.top_down ? this.outgoing : this.incoming;

    //     if (!visited) {
    //         visited = {};
    //     }
    //     if (!path) {
    //         path = [];
    //     }
    //     if (visited.hasOwnProperty(name)) {
    //         return;
    //     }
    //     path.push(name);
    //     visited[name] = true;

    //     if (await visitor.visit(this, path)) {

    //         let names: string[] = visitor.top_down ? this.outgoingNames : this.incomingNames;
    //         let old_names: string[] = [];

    //         while ((!!names) && (names.length > 0)) {

    //             for (let i = 0; i < names.length; i++) {
    //                 await vertices[names[i]].visit(visitor, visited, path);
    //             }

    //             old_names = old_names.concat(names);
    //             names = (visitor.top_down ? this.outgoingNames : this.incomingNames).filter((nname: string) => old_names.indexOf(nname) < 0);
    //         }
    //     }
    //     path.pop();
    // }
}