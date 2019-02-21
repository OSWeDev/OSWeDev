import DAGNode from '../../dag/DAGNode';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';

export default class VarDAGVisitorUnmarkComputed extends DAGVisitorBase<VarDAG> {

    public constructor(dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {

        node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE, this.dag);
        node.removeMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.dag, true);
        return false;
    }
}