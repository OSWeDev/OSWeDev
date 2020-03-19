import DAGVisitorBase from "../../../../shared/modules/Var/graph/dag/DAGVisitorBase";
import VarDAG from "../../../../shared/modules/Var/graph/var/VarDAG";
import VarDAGNode from "../../../../shared/modules/Var/graph/var/VarDAGNode";


export default class FakeVarDAGVisitorSimpleMarker extends DAGVisitorBase<VarDAGNode, VarDAG> {


    public static MARKER_to_visit_node_marker: string = 'FakeVarDAGVisitorSimpleMarker_todo';
    public static MARKER_visited_node_marker: string = 'FakeVarDAGVisitorSimpleMarker_ok';

    public static MARKER_visit_node_marker: string = 'FakeVarDAGVisitorSimpleMarker_visited';

    public async visit(node: VarDAGNode, dag: VarDAG, nodes_path: VarDAGNode[]): Promise<boolean> {

        node.addMarker(FakeVarDAGVisitorSimpleMarker.MARKER_visit_node_marker, dag);

        return true;
    }
}