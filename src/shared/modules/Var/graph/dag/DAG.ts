import DAGNode from './DAGNode';
import DAGVisitorCheckCycle from './visitors/DAGVisitorCheckCycle';

/**
 * Issu de Ember.js : https://github.com/emberjs/ember.js/blob/62e52938f48278a6cb838016108f3e35c18c8b3f/packages/ember-application/lib/system/dag.js
 */
export default class DAG {

    public nodes_names: string[] = [];
    public nodes: { [name: string]: DAGNode } = {};

    public roots: { [name: string]: DAGNode } = {};
    public leafs: { [name: string]: DAGNode } = {};


    public add(name: string): DAGNode {
        if (!name) { return; }
        if (this.nodes.hasOwnProperty(name)) {
            return this.nodes[name];
        }
        var vertex: DAGNode = new DAGNode();
        vertex.name = name;
        this.nodes[name] = vertex;
        this.nodes_names.push(name);
        return vertex;
    }

    public map(name: string, value: any) {
        this.add(name).value = value;
    }

    public addEdge(fromName: string, toName: string) {
        if (!fromName || !toName || fromName === toName) {
            return;
        }

        let from: DAGNode = this.add(fromName);
        let to: DAGNode = this.add(toName);

        if (to.incoming.hasOwnProperty(fromName)) {
            return;
        }

        // On part de la cible et on essaie de voir s'il existait un lien vers la source en top-down
        let checkCycle: DAGVisitorCheckCycle = new DAGVisitorCheckCycle(fromName);
        to.visit(checkCycle);
        if (checkCycle.has_cycle) {
            console.error('Incohérence dans l\'arbre des vars - cycle détecté');
            return;
        }

        from.outgoing[toName] = to;
        from.outgoingNames.push(toName);

        to.incoming[fromName] = from;
        to.incomingNames.push(fromName);
    }

    /**
     * Supprime tous les noeuds portants un marker spécifique
     */
    public deletedMarkedNodes(marker: string) {
        let nodes_names: string[] = this.nodes_names.slice();
        for (let i in nodes_names) {
            let node_name: string = nodes_names[i];

            if (this.nodes[node_name].hasMarker(marker)) {

                this.deletedNode(node_name);
            }
        }
    }

    /**
     * Supprime un noeud et ses refs dans les incoming et outgoing
     */
    public deletedNode(node_name: string) {
        if (!this.nodes[node_name]) {
            return;
        }

        // On supprime le noeud des incomings, et des outgoings
        for (let i in this.nodes[node_name].incoming) {
            let incoming: DAGNode = this.nodes[node_name].incoming[i];

            incoming.removeNodeFromOutgoing(node_name);
        }

        // On supprime le noeud des incomings, et des outgoings
        for (let i in this.nodes[node_name].outgoing) {
            let outgoing: DAGNode = this.nodes[node_name].outgoing[i];

            outgoing.removeNodeFromIncoming(node_name);
        }

        // FIXME TODO Qu'est-ce qu'il se passe quand un noeud n'a plus de outgoing alors qu'il en avait ?
        // Est-ce que c'est possible dans notre cas ? Est-ce que c'est possible dans d'autres cas ? Est-ce qu'il faut le gérer ?

        delete this.nodes[node_name];
        let indexof = this.nodes_names.indexOf(node_name);
        if (indexof >= 0) {
            this.nodes_names.splice(indexof, 1);
        }
    }
}