import DAGVisitorBase from "../../../../shared/modules/Var/graph/dag/DAGVisitorBase";
import VarDAG from "../../../../shared/modules/Var/graph/var/VarDAG";
import VarDAGNode from "../../../../shared/modules/Var/graph/var/VarDAGNode";


export default class FakeVarDAGVisitorEmpty extends DAGVisitorBase<VarDAGNode, VarDAG> {

    public static MARKER_to_visit_node_marker: string = 'FakeVarDAGVisitorEmpty_todo';
    public static MARKER_visited_node_marker: string = 'FakeVarDAGVisitorEmpty_ok';

    public async visit(node: VarDAGNode, dag: VarDAG, nodes_path: VarDAGNode[]): Promise<boolean> {

        return true;
    }
}