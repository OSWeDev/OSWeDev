import DAGNode from '../../dag/DAGNode';
import VarDAG from '../VarDAG';

export default class VarDAGMarkForNextUpdate {

    public constructor(private dag: VarDAG) {
    }

    public visitNode(node: DAGNode): boolean {

        node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.dag, true);
        node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.dag);

        return false;
    }
}