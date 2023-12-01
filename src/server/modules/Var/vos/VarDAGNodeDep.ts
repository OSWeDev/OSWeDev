import DAGNodeDep from '../../../../shared/modules/Var/graph/dagbase/DAGNodeDep';
import VarDAGNode from './VarDAGNode';

export default class VarDAGNodeDep extends DAGNodeDep<VarDAGNode> {

    /**
     * DON'T USE this method to add a dep to a node, use addOutgoingDep on the node directly
     * @param dep_name
     * @param outgoing_node
     */
    public constructor(dep_name: string, incoming_node: VarDAGNode, outgoing_node: VarDAGNode) {
        super(dep_name, incoming_node, outgoing_node);
    }
}