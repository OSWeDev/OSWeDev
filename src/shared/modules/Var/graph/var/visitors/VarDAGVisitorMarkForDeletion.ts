import DAGNode from '../../dag/DAGNode';
import DAGVisitorBase from '../../dag/DAGVisitorBase';

export default class VarDAGVisitorMarkForDeletion extends DAGVisitorBase {

    // On check toujours en top => bottom, on part du principe que l'arbre est cohérent (les liens top / bottom sont isos bottom top)
    public constructor(protected marker_for_deletion: string) {
        super(true);
    }

    public visit(node: DAGNode, path: string[]): boolean {

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

        node.addMarker(this.marker_for_deletion);
        return true;
    }
}