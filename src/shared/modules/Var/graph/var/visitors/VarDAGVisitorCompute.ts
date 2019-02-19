import VarsController from '../../../VarsController';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';

/**
 * Visiteur qui effectue les calculs de vars
 */
export default class VarDAGVisitorCompute extends DAGVisitorBase<VarDAG> {


    public constructor(dag: VarDAG) {
        super(false, dag);
    }

    public async visit(node: VarDAGNode, path: string[]): Promise<boolean> {

        // Si tous les outgoing ne sont pas marqués, on ne continue pas
        for (let i in node.outgoing) {
            let outgoing: VarDAGNode = node.outgoing[i];

            if (!outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED)) {
                return false;
            }
        }

        if (!node.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED)) {

            await VarsController.getInstance().getVarControllerById(node.param.var_id).updateData(
                // VarsController.getInstance().BATCH_UIDs_by_var_id[node.param.var_id],
                node,
                this.dag);
            node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.dag);
        }

        return true;
    }
}