import DAGNode from '../DAGNode';
import DAGVisitorBase from '../DAGVisitorBase';
import DAG from '../DAG';

export default class DAGVisitorSimpleUnmarker<TDag extends DAG<any>> extends DAGVisitorBase<TDag> {

    public constructor(
        dag: TDag,
        top_down: boolean,
        private marker: string,
        private unmark_until_not_marked_anymore: boolean = true) {
        super(top_down, dag);
    }

    public async visit(node: DAGNode, path: string[]): Promise<boolean> {

        if (this.unmark_until_not_marked_anymore) {
            while (node.hasMarker(this.marker)) {
                node.removeMarker(this.marker, this.dag);
            }
        } else {
            node.removeMarker(this.marker, this.dag);
        }

        return true;
    }
}