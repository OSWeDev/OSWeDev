import DAG from '../dag/DAG';
import DAGNode from '../dag/DAGNode';
import VarDAGVisitorMarkForDeletion from './visitors/VarDAGVisitorMarkForDeletion';

export default class VarDAG extends DAG {

    public static VARDAG_MARKER_REGISTERED: string = 'REGISTERED';
    public static VARDAG_MARKER_MARKED_FOR_DELETION: string = 'MARKED_FOR_DELETION';

    public registerIndexes(indexes: string[]) {
        for (let i in indexes) {
            let index: string = indexes[i];
            let node: DAGNode = this.nodes[index];

            if (!!node) {
                node.addMarker(VarDAG.VARDAG_MARKER_REGISTERED);
            } else {
                // on ajoute le noeud à l'arbre
                this.add(index);
            }
        }
    }

    public unregisterIndexes(indexes: string[]) {
        for (let i in indexes) {
            let index: string = indexes[i];
            let node: DAGNode = this.nodes[index];

            if (!!node) {
                node.removeMarker(VarDAG.VARDAG_MARKER_REGISTERED);

                // Si on est plus marqué et qu'on est un top élément (root), on supprime le noeud et on lance le visiteur pour supprimer tous les suivants
                if (!node.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) {

                    // Suppression en 2 étapes, on marque pour suppression et on demande la suppression des noeuds marqués
                    node.visit(new VarDAGVisitorMarkForDeletion(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION));
                    this.deletedMarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION);
                }
            }
        }
    }
}
