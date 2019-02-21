import DAGNode from '../../dag/DAGNode';
import DAGVisitorBase from '../../dag/DAGVisitorBase';
import VarDAG from '../VarDAG';

export default class VarDAGVisitorMarkForNextUpdate extends DAGVisitorBase<VarDAG> {

    public constructor(dag: VarDAG) {
        super(true, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {

        node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.dag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.dag);

        return false;
    }
}