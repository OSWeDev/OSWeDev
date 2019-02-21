import DAGNode from '../DAGNode';
import DAGVisitorBase from '../DAGVisitorBase';
import DAG from '../DAG';

export default class DAGVisitorSimpleMarker<TDag extends DAG<any>> extends DAGVisitorBase<TDag> {

    public constructor(
        dag: TDag,
        top_down: boolean,
        private marker: string,
        private mark_even_if_already_marked: boolean = true,
        private first_node_name: string = null,
        private stop_if_other_node_marked: boolean = false,
        private ignore_and_stop_if_has_this_marker: string = null) {
        super(top_down, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {

        if (!!this.ignore_and_stop_if_has_this_marker) {
            if (node.hasMarker(this.ignore_and_stop_if_has_this_marker)) {
                return false;
            }
        }

        if (this.mark_even_if_already_marked) {
            let res: boolean = true;
            if (this.stop_if_other_node_marked && node.hasMarker(this.marker)) {
                res = false;
            }
            node.addMarker(this.marker, this.dag);
            return res;
        }

        if ((this.first_node_name != node.name) && this.stop_if_other_node_marked && node.hasMarker(this.marker)) {
            return false;
        }

        if (node.hasMarker(this.marker)) {
            return true;
        }
        node.addMarker(this.marker, this.dag);
        return true;
    }
}