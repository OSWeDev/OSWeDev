import DAGVisitorBase from './DAGVisitorBase';

export default class DAGNode {

    public name: string;

    public incoming = {};
    public incomingNames: string[] = [];

    public outgoing = {};
    public outgoingNames: string[] = [];

    public value = null;

    public markers: { [marker_id: string]: number } = {};


    public hasMarker(marker: string): boolean {
        return (!!this.markers[marker]);
    }

    /**
     * Si un marker existe déjà, on l'incrémente
     */
    public addMarker(marker: string) {
        if (!this.markers[marker]) {
            this.markers[marker] = 0;
        }
        this.markers[marker]++;
    }

    /**
     * Si un marker atteint 0 on le supprime
     */
    public removeMarker(marker: string) {
        if (!this.markers[marker]) {
            console.error('Incohérence de DAG :' + this.name + ':removeMarker:' + marker + ':inexistant');
            return;
        }
        this.markers[marker]--;
        if (this.markers[marker] <= 0) {
            delete this.markers[marker];
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

    /**
     * TODO TestUnit le but est de visiter d'un vertex vers le haut donc en suivant les deps de to vers from (incoming)
     */
    public visit(visitor: DAGVisitorBase, visited?, path?: string[]) {
        let name = this.name;
        let vertices: { [name: string]: DAGNode } = visitor.top_down ? this.outgoing : this.incoming;
        let names: string[] = visitor.top_down ? this.outgoingNames : this.incomingNames;
        let len = names.length;

        if (!visited) {
            visited = {};
        }
        if (!path) {
            path = [];
        }
        if (visited.hasOwnProperty(name)) {
            return;
        }
        path.push(name);
        visited[name] = true;

        if (visitor.visit(this, path)) {

            for (let i = 0; i < len; i++) {
                vertices[names[i]].visit(visitor, visited, path);
            }
        }
        path.pop();
    }
}