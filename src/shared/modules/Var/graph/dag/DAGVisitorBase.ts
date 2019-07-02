import DAGNode from './DAGNode';
import DAG from './DAG';

export default class DAGVisitorBase<TNode extends DAGNode, TDAG extends DAG<TNode>> {

    public constructor() { }

    /**
     * Le visiteur doit renvoyer true si il doit continuer, false sinon
     */
    public async visit(node: TNode, dag: TDAG, nodes_path: TNode[]): Promise<boolean> {
        return false;
    }
}