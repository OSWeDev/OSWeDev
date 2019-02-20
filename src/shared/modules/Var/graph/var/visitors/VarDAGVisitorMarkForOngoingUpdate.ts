import DAGNode from '../../dag/DAGNode';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';

export default class VarDAGVisitorMarkForOngoingUpdate extends DAGVisitorBase<VarDAG> {

    public constructor(dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {

        node.addMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, this.dag);
        node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.dag, true);
        return false;
    }
}