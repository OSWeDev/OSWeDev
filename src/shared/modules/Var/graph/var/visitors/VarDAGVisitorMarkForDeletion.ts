import DAGNode from '../../dag/DAGNode';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';

export default class VarDAGVisitorMarkForDeletion extends DAGVisitorBase<VarDAG> {

    // On check toujours en top => bottom, on part du principe que l'arbre est cohérent (les liens top / bottom sont isos bottom top)
    public constructor(protected marker_for_deletion: string, dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {

        if ((!!node.incomingNames) || (node.incomingNames.length > 0)) {

            let all_deleted: boolean = true;
            // Si les incomings sont marqués en suppression, on considère qu'ils existent déjà plus.
            for (let i in node.incoming) {

                let incoming: DAGNode = node.incoming[i];

                if (!incoming.hasMarker(this.marker_for_deletion)) {
                    all_deleted = false;
                    break;
                }
            }

            if (!all_deleted) {
                return false;
            }
        }


        //  On peut supprimer un noeud à condition qu'il soit :
        //      - Pas registered
        if (!node.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) {

            return false;
        }

        node.addMarker(this.marker_for_deletion, this.dag);
        return true;
    }

    public visitNode(node: DAGNode): boolean {

        if ((!!node.incomingNames) || (node.incomingNames.length > 0)) {

            let all_deleted: boolean = true;
            // Si les incomings sont marqués en suppression, on considère qu'ils existent déjà plus.
            for (let i in node.incoming) {

                let incoming: DAGNode = node.incoming[i];

                if (!incoming.hasMarker(this.marker_for_deletion)) {
                    all_deleted = false;
                    break;
                }
            }

            if (!all_deleted) {
                return false;
            }
        }


        //  On peut supprimer un noeud à condition qu'il soit :
        //      - Pas registered
        if (!node.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) {

            return false;
        }

        node.addMarker(this.marker_for_deletion, this.dag);
        return true;
    }
}