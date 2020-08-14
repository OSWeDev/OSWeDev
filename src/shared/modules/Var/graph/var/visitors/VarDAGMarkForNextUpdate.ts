import DAGNode from '../../dag/DAGNode';
import VarDAG from '../VarDAG';
import VarDAGNode from '../VarDAGNode';

export default class VarDAGMarkForNextUpdate {

    public constructor(private dag: VarDAG) {
    }

    public visitNode(node: VarDAGNode): boolean {

        node.marked_for_next_update = false;
        node.marked_for_update = true;

        return false;
    }
}