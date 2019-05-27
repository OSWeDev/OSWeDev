import DAGVisitorCheckCycle from './visitors/DAGVisitorCheckCycle';
import DAGNode from './DAGNode';
import DAGVisitorBase from './DAGVisitorBase';

/**
 * Issu de Ember.js : https://github.com/emberjs/ember.js/blob/62e52938f48278a6cb838016108f3e35c18c8b3f/packages/ember-application/lib/system/dag.js
 */
export default class DAG<TNode extends DAGNode> {

    public nodes_names: string[] = [];
    public nodes: { [name: string]: TNode } = {};

    public roots: { [name: string]: TNode } = {};
    public leafs: { [name: string]: TNode } = {};

    public marked_nodes_names: { [marker: string]: string[] } = {};

    public constructor(
        protected node_constructor: (name: string, dag: DAG<TNode>, ...params) => TNode,
        protected on_node_removal: (dagNode: TNode, ...params) => void = null) { }

    public add(name: string, ...params): TNode {
        if (!name) { return; }
        if (this.nodes.hasOwnProperty(name)) {
            return this.nodes[name];
        }
        var node: TNode = this.node_constructor.apply(this, [name, this].concat(params));
        node.initializeNode(this);

        this.nodes[name] = node;
        this.nodes_names.push(name);

        this.leafs[name] = node;
        this.roots[name] = node;

        return node;
    }

    public addEdge(fromName: string, toName: string) {
        if (!fromName || !toName || fromName === toName) {
            return;
        }

        if ((!this.nodes[fromName]) || (!this.nodes[toName])) {
            console.error('Lien entre noeuds inexistants');
            return;
        }

        let from: TNode = this.nodes[fromName];
        let to: TNode = this.nodes[toName];

        if (to.incoming.hasOwnProperty(fromName)) {
            return;
        }

        // // On part de la cible et on essaie de voir s'il existait un lien vers la source en top-down
        // let checkCycle: DAGVisitorCheckCycle<any> = new DAGVisitorCheckCycle(fromName, this);
        // to.visit(checkCycle);
        // if (checkCycle.has_cycle) {
        //     console.error('Incohérence dans l\'arbre des vars - cycle détecté');
        //     return;
        // }

        from.outgoing[toName] = to;
        from.outgoingNames.push(toName);

        to.incoming[fromName] = from;
        to.incomingNames.push(fromName);

        if (!!this.leafs[fromName]) {
            delete this.leafs[fromName];
        }
        if (!!this.roots[toName]) {
            delete this.roots[toName];
        }
    }

    /**
     * Supprime tous les noeuds portants un marker spécifique
     */
    public deleteMarkedNodes(marker: string) {
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
            let incoming: TNode = this.nodes[node_name].incoming[i] as TNode;

            incoming.removeNodeFromOutgoing(node_name);
        }

        // On supprime le noeud des incomings, et des outgoings
        for (let i in this.nodes[node_name].outgoing) {
            let outgoing: TNode = this.nodes[node_name].outgoing[i] as TNode;

            outgoing.removeNodeFromIncoming(node_name);
        }

        // FIXME TODO Qu'est-ce qu'il se passe quand un noeud n'a plus de outgoing alors qu'il en avait ?
        // Est-ce que c'est possible dans notre cas ? Est-ce que c'est possible dans d'autres cas ? Est-ce qu'il faut le gérer ?

        if (!!this.on_node_removal) {
            this.on_node_removal(this.nodes[node_name]);
        }
        this.nodes[node_name].prepare_for_deletion(this);
        delete this.nodes[node_name];

        if (!!this.leafs[node_name]) {
            delete this.leafs[node_name];
        }
        if (!!this.roots[node_name]) {
            delete this.roots[node_name];
        }

        let indexof = this.nodes_names.indexOf(node_name);
        if (indexof >= 0) {
            this.nodes_names.splice(indexof, 1);
        }
    }

    // /**
    //  * Pour visiter tout l'arbre très facilement en partant des extrémités
    //  */
    // public async visitAllFromRootsOrLeafs(visitor_factory: (dag: DAG<TNode>) => DAGVisitorBase<any>) {
    //     if (!visitor_factory) {
    //         return;
    //     }

    //     // Utilisé juste pour savoir dans quelle direction on doit visiter
    //     let testVisitor: DAGVisitorBase<any> = visitor_factory(this);
    //     if (!testVisitor.top_down) {
    //         for (let i in this.leafs) {
    //             let leaf: TNode = this.leafs[i];

    //             // La visite peut changer la liste de roots ou de leafs
    //             if (!!leaf) {
    //                 await leaf.visit(visitor_factory(this));
    //             }
    //         }
    //     } else {
    //         for (let i in this.roots) {
    //             let root: TNode = this.roots[i];

    //             // La visite peut changer la liste de roots ou de leafs
    //             if (!!root) {
    //                 await root.visit(visitor_factory(this));
    //             }
    //         }
    //     }
    // }

    // /**
    //  * Pour visiter tout l'arbre très facilement en utilisant un marker mis à jour par le visiteur
    //  * @param visit_all_marked_nodes si true on continue tant que des nodes marqué avec marker existent, sinon on continue tant qu des nodes ne sont pas marqués. Attention aux perfs dans le second cas...
    //  */
    // public async visitAllMarkedOrUnmarkedNodes(marker: string, visit_all_marked_nodes: boolean, visitor: DAGVisitorBase<any>) {
    //     if (!visitor) {
    //         return;
    //     }

    //     while ((visit_all_marked_nodes && this.marked_nodes_names[marker] && this.marked_nodes_names[marker].length) ||
    //         ((!visit_all_marked_nodes) && ((!this.marked_nodes_names[marker]) || (this.marked_nodes_names[marker].length != this.nodes_names.length)))) {

    //         let node_name: string;

    //         if (visit_all_marked_nodes) {
    //             node_name = this.marked_nodes_names[marker][0];
    //         } else {
    //             node_name = this.nodes_names.find((name: string) => !this.nodes[name].hasMarker(marker));
    //         }

    //         if (!node_name) {
    //             return;
    //         }

    //         await this.nodes[node_name].visit(visitor);
    //     }
    // }
}